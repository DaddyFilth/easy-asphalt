// client/src/const.ts
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!oauthPortalUrl || !appId) {
    console.error(
      "[getLoginUrl] Missing VITE_OAUTH_PORTAL_URL or VITE_APP_ID – check env config."
    );
    // Fallback: keep user on current page or send them to a safe local route
    return "/";
  }

  if (typeof window === "undefined") {
    // Shouldn’t happen in your current setup, but defensive.
    return "/";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const base = oauthPortalUrl.replace(/\/$/, "");
  const url = new URL(`${base}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
