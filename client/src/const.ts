// client/src/const.ts
const GOOGLE_LOGIN_PATH = "/api/auth/google";

function isSafeReturnPath(value: string) {
  return (
    value.length > 0 &&
    value.length <= 512 &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  );
}

export const getLoginUrl = (returnTo?: string) => {
  const url = new URL(GOOGLE_LOGIN_PATH, "http://localhost");

  let nextPath = returnTo;
  if (!nextPath && typeof window !== "undefined") {
    nextPath = `${window.location.pathname}${window.location.search}`;
  }

  if (nextPath && nextPath !== "/" && isSafeReturnPath(nextPath)) {
    url.searchParams.set("returnTo", nextPath);
  }

  return `${url.pathname}${url.search}`;
};
