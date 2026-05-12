import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiBaseUrl, getApiUrl, getLoginUrl } from "../const";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth URL helpers", () => {
  it("links to the React login page with a safe return path", () => {
    expect(getLoginUrl("/estimator")).toBe("/login?returnTo=%2Festimator");
  });

  it("rejects unsafe return paths", () => {
    expect(getLoginUrl("//evil.example")).toBe("/login");
    expect(getLoginUrl("/login")).toBe("/login");
  });

  it("uses the configured HTTPS API base for native builds", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://app.example.com/");

    expect(getApiBaseUrl()).toBe("https://app.example.com");
    expect(getApiUrl("/api/trpc")).toBe("https://app.example.com/api/trpc");
    expect(getLoginUrl("/dashboard")).toBe("/login?returnTo=%2Fdashboard");
  });

  it("ignores unsafe API base URLs", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://evil.example");

    expect(getApiBaseUrl()).toBe("");
    expect(getApiUrl("/api/trpc")).toBe("/api/trpc");
  });
});
