// client/src/const.ts
const GOOGLE_LOGIN_PATH = "/api/auth/google";
const LOGIN_PATH = "/login";

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

function withReturnTo(path: string, returnTo?: string) {
  const url = new URL(path, "http://localhost");
  const nextPath = getSafeReturnPath(returnTo);

  if (nextPath) {
    url.searchParams.set("returnTo", nextPath);
  }

  return `${url.pathname}${url.search}`;
}

export const getLoginUrl = (returnTo?: string) =>
  withReturnTo(LOGIN_PATH, returnTo);

export const getAuthorizationUrl = (returnTo?: string) =>
  withReturnTo(GOOGLE_LOGIN_PATH, returnTo);
