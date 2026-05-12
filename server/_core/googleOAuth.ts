import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { parse as parseCookieHeader } from "cookie";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");
const GOOGLE_SCOPES = "openid email profile";
const GOOGLE_OAUTH_MAX_AGE_MS = 10 * 60 * 1000;
const GOOGLE_STATE_COOKIE = "ea_google_oauth_state";
const GOOGLE_VERIFIER_COOKIE = "ea_google_oauth_verifier";
const GOOGLE_NONCE_COOKIE = "ea_google_oauth_nonce";
const GOOGLE_RETURN_TO_COOKIE = "ea_google_oauth_return_to";
const GOOGLE_PROVIDER = "google";
const MAX_OPEN_ID_LENGTH = 64;

const googleJwks = createRemoteJWKSet(GOOGLE_JWKS_URL);

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleIdentity = {
  openId: string;
  name: string | null;
  email: string | null;
};

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomToken(bytes = 32) {
  return base64Url(randomBytes(bytes));
}

function sha256Base64Url(value: string) {
  return base64Url(createHash("sha256").update(value).digest());
}

function constantTimeEqual(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getRequestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost?.split(",")[0] || req.headers.host;
  const scheme = (proto || req.protocol || "http").trim();

  if (!host) {
    throw new Error("Cannot build Google redirect URI without a request host");
  }

  return `${scheme}://${host.trim()}`;
}

function getGoogleRedirectUri(req: Request) {
  return `${getRequestOrigin(req)}/api/auth/google/callback`;
}

function getCookie(req: Request, name: string) {
  const parsed = parseCookieHeader(req.headers.cookie ?? "");
  return parsed[name];
}

function setOAuthCookie(req: Request, res: Response, name: string, value: string) {
  res.cookie(name, value, {
    ...getSessionCookieOptions(req),
    maxAge: GOOGLE_OAUTH_MAX_AGE_MS,
  });
}

function clearOAuthCookie(req: Request, res: Response, name: string) {
  res.clearCookie(name, getSessionCookieOptions(req));
}

function clearGoogleOAuthCookies(req: Request, res: Response) {
  [
    GOOGLE_STATE_COOKIE,
    GOOGLE_VERIFIER_COOKIE,
    GOOGLE_NONCE_COOKIE,
    GOOGLE_RETURN_TO_COOKIE,
  ].forEach(name => clearOAuthCookie(req, res, name));
}

function getMissingGoogleConfig() {
  return [
    ["GOOGLE_CLIENT_ID", ENV.googleClientId],
    ["GOOGLE_CLIENT_SECRET", ENV.googleClientSecret],
    ["JWT_SECRET", ENV.cookieSecret],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function createProviderOpenId(provider: string, subject: string) {
  const candidate = `${provider}:${subject}`;
  if (candidate.length <= MAX_OPEN_ID_LENGTH) return candidate;

  return `${provider}:${sha256Base64Url(subject)}`;
}

export function getSafeReturnTo(value: unknown) {
  if (typeof value !== "string") return "/";
  if (value.length === 0 || value.length > 512) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return "/";

  return value;
}

export function buildGoogleAuthorizationUrl(options: {
  clientId: string;
  codeChallenge: string;
  nonce: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES);
  url.searchParams.set("state", options.state);
  url.searchParams.set("nonce", options.nonce);
  url.searchParams.set("code_challenge", options.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

function getGoogleOAuthError(data: GoogleTokenResponse) {
  const error = data.error || "unknown_error";
  const description = data.error_description
    ? `: ${data.error_description.slice(0, 180)}`
    : "";

  return `${error}${description}`;
}

async function exchangeGoogleCode(options: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    code: options.code,
    code_verifier: options.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: options.redirectUri,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await response.json().catch(() => ({}))) as GoogleTokenResponse;

  if (!response.ok) {
    throw new Error(
      `Google token exchange failed (${response.status}): ${getGoogleOAuthError(data)}`
    );
  }
  if (!data.id_token) {
    throw new Error("Google token response did not include an id_token");
  }

  return data;
}

function readGoogleIdentity(payload: JWTPayload): GoogleIdentity {
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Google identity token is missing a subject");
  }

  const name = typeof payload.name === "string" ? payload.name : null;
  const email =
    typeof payload.email === "string" && payload.email_verified === true
      ? payload.email
      : null;

  return {
    openId: createProviderOpenId(GOOGLE_PROVIDER, payload.sub),
    name,
    email,
  };
}

async function verifyGoogleIdentity(idToken: string, expectedNonce: string) {
  const { payload } = await jwtVerify(idToken, googleJwks, {
    audience: ENV.googleClientId,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });

  if (
    typeof payload.nonce !== "string" ||
    !constantTimeEqual(payload.nonce, expectedNonce)
  ) {
    throw new Error("Google identity token nonce mismatch");
  }

  return readGoogleIdentity(payload);
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const missingConfig = getMissingGoogleConfig();
    if (missingConfig.length > 0) {
      res.status(503).json({
        error: "Google OAuth is not configured",
        missing: missingConfig,
      });
      return;
    }

    const state = randomToken();
    const codeVerifier = randomToken(64);
    const nonce = randomToken();
    const redirectUri = getGoogleRedirectUri(req);
    const returnTo = getSafeReturnTo(getQueryParam(req, "returnTo"));
    const authUrl = buildGoogleAuthorizationUrl({
      clientId: ENV.googleClientId,
      codeChallenge: sha256Base64Url(codeVerifier),
      nonce,
      redirectUri,
      state,
    });

    setOAuthCookie(req, res, GOOGLE_STATE_COOKIE, state);
    setOAuthCookie(req, res, GOOGLE_VERIFIER_COOKIE, codeVerifier);
    setOAuthCookie(req, res, GOOGLE_NONCE_COOKIE, nonce);
    setOAuthCookie(req, res, GOOGLE_RETURN_TO_COOKIE, returnTo);

    res.redirect(302, authUrl);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const error = getQueryParam(req, "error");
    if (error) {
      clearGoogleOAuthCookies(req, res);
      res.status(400).json({ error: "Google authorization was cancelled" });
      return;
    }

    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const expectedState = getCookie(req, GOOGLE_STATE_COOKIE);
    const codeVerifier = getCookie(req, GOOGLE_VERIFIER_COOKIE);
    const expectedNonce = getCookie(req, GOOGLE_NONCE_COOKIE);
    const returnTo = getSafeReturnTo(getCookie(req, GOOGLE_RETURN_TO_COOKIE));

    clearGoogleOAuthCookies(req, res);

    if (
      !code ||
      !state ||
      !codeVerifier ||
      !expectedNonce ||
      !constantTimeEqual(state, expectedState)
    ) {
      res.status(400).json({ error: "Invalid Google OAuth callback state" });
      return;
    }

    try {
      const tokenResponse = await exchangeGoogleCode({
        code,
        codeVerifier,
        redirectUri: getGoogleRedirectUri(req),
      });
      const idToken = tokenResponse.id_token;
      if (!idToken) {
        throw new Error("Google token response did not include an id_token");
      }

      const identity = await verifyGoogleIdentity(idToken, expectedNonce);

      await db.upsertUser({
        openId: identity.openId,
        name: identity.name,
        email: identity.email,
        loginMethod: GOOGLE_PROVIDER,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(identity.openId, {
        name: identity.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.redirect(302, returnTo);
    } catch (callbackError) {
      console.error("[Google OAuth] Callback failed", callbackError);
      res.status(500).json({ error: "Google OAuth callback failed" });
    }
  });
}
