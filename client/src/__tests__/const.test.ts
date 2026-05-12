import { describe, expect, it } from "vitest";
import { getAuthorizationUrl, getLoginUrl } from "../const";

describe("auth URL helpers", () => {
  it("links to the React login page with a safe return path", () => {
    expect(getLoginUrl("/estimator")).toBe("/login?returnTo=%2Festimator");
  });

  it("links to Google authorization only from the auth action", () => {
    expect(getAuthorizationUrl("/dashboard")).toBe(
      "/api/auth/google?returnTo=%2Fdashboard"
    );
  });

  it("rejects unsafe return paths", () => {
    expect(getLoginUrl("//evil.example")).toBe("/login");
    expect(getAuthorizationUrl("/login")).toBe("/api/auth/google");
  });
});
