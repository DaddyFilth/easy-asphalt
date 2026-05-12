// client/src/const.ts
const GOOGLE_LOGIN_PATH = "/api/auth/google";
const LOGIN_PATH = "/login";
const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1"]);

function getConfiguredApiBaseUrl() {
  const rawValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!rawValue) return "";

  try {
    const url = new URL(rawValue);
    const isHttps = url.protocol === "https:";
    const isLocalHttp =
      url.protocol === "http:" && LOCAL_HTTP_HOSTS.has(url.hostname);

    if (!isHttps && !isLocalHttp) return "";

    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function getApiBaseUrl() {
  return getConfiguredApiBaseUrl();
}

export function getApiUrl(path: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return path;

  return new URL(path, `${apiBaseUrl}/`).toString();
}

function isSafeReturnPath(value: string) {
  return (
    value.length > 0 &&
    value.length <= 512 &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  );
}

function getSafeReturnPath(returnTo?: string) {
  let nextPath = returnTo;
  if (!nextPath && typeof window !== "undefined") {
    nextPath = `${window.location.pathname}${window.location.search}`;
  }

  if (
    nextPath &&
    nextPath !== "/" &&
    !nextPath.startsWith("/login") &&
    isSafeReturnPath(nextPath)
  ) {
    return nextPath;
  }

  return undefined;
}

function withReturnTo(path: string, returnTo?: string, absolute = false) {
  const apiBaseUrl = absolute ? getApiBaseUrl() : "";
  const url = new URL(path, apiBaseUrl || "http://localhost");
  const nextPath = getSafeReturnPath(returnTo);

  if (nextPath) {
    url.searchParams.set("returnTo", nextPath);
  }

  return apiBaseUrl ? url.toString() : `${url.pathname}${url.search}`;
}

export const getLoginUrl = (returnTo?: string) =>
  withReturnTo(LOGIN_PATH, returnTo);

export const getAuthorizationUrl = (returnTo?: string) =>
  withReturnTo(GOOGLE_LOGIN_PATH, returnTo, true);
