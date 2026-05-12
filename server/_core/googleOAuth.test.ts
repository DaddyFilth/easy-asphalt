import { describe, expect, it } from "vitest";
import {
  buildGoogleAuthorizationUrl,
  createProviderOpenId,
  getSafeReturnTo,
} from "./googleOAuth";

describe("Google OAuth helpers", () => {
  it("builds a Google authorization URL with PKCE and nonce parameters", () => {
    const url = new URL(
      buildGoogleAuthorizationUrl({
        clientId: "client-id",
        codeChallenge: "challenge",
        nonce: "nonce",
        redirectUri: "https://app.example.test/api/auth/google/callback",
        state: "state",
      })
    );

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.pathname).toBe("/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("code_challenge")).toBe("challenge");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("nonce")).toBe("nonce");
    expect(url.searchParams.get("scope")).toContain("openid");
    expect(url.searchParams.get("state")).toBe("state");
  });

  it("rejects unsafe return targets", () => {
    expect(getSafeReturnTo("/dashboard?tab=projects")).toBe(
      "/dashboard?tab=projects"
    );
    expect(getSafeReturnTo("https://evil.example")).toBe("/");
    expect(getSafeReturnTo("//evil.example")).toBe("/");
    expect(getSafeReturnTo("/\\evil")).toBe("/");
  });

  it("keeps provider user ids within the users.openId column length", () => {
    const openId = createProviderOpenId("google", "x".repeat(256));

    expect(openId.startsWith("google:")).toBe(true);
    expect(openId.length).toBeLessThanOrEqual(64);
  });
});
