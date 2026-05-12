import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearLoginThrottle,
  createLocalOpenId,
  getLoginThrottleUntil,
  hashPassword,
  LOGIN_LOCK_WINDOW_MS,
  MAX_LOGIN_FAILURES,
  normalizeEmail,
  recordLoginFailure,
  verifyPassword,
} from "./passwordAuth";

afterEach(() => {
  vi.useRealTimers();
});

describe("passwordAuth", () => {
  it("normalizes emails for consistent lookups", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("hashes and verifies passwords securely", async () => {
    const passwordHash = await hashPassword("StrongPassword123");

    expect(passwordHash).toMatch(/^scrypt\$/);
    expect(passwordHash).not.toContain("StrongPassword123");
    await expect(
      verifyPassword("StrongPassword123", passwordHash)
    ).resolves.toBe(true);
    await expect(
      verifyPassword("WrongPassword123", passwordHash)
    ).resolves.toBe(false);
  });

  it("creates local open ids that fit the database column", () => {
    expect(createLocalOpenId().length).toBeLessThanOrEqual(64);
  });

  it("throttles repeated failed logins", () => {
    vi.useFakeTimers();

    const key = "127.0.0.1:user@example.com";
    clearLoginThrottle(key);

    for (let index = 0; index < MAX_LOGIN_FAILURES; index += 1) {
      recordLoginFailure(key);
    }

    expect(getLoginThrottleUntil(key)).not.toBeNull();

    vi.advanceTimersByTime(LOGIN_LOCK_WINDOW_MS + 1);

    expect(getLoginThrottleUntil(key)).toBeNull();
    clearLoginThrottle(key);
  });
});
