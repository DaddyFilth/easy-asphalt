import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../shared/const";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn().mockResolvedValue({}),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  hasAdminUser: vi.fn(),
  createUser: vi.fn(),
  updateUserById: vi.fn(),
}));

const sdkMock = vi.hoisted(() => ({
  createSessionToken: vi.fn().mockResolvedValue("session-token"),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/sdk", () => ({
  sdk: sdkMock,
}));

import { hashPassword, verifyPassword } from "./_core/passwordAuth";
import { appRouter } from "./routers";

function createContext() {
  const cookies: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  return {
    cookies,
    ctx: {
      user: null,
      req: {
        protocol: "https",
        headers: {},
        ip: "127.0.0.1",
      } as any,
      res: {
        cookie: (
          name: string,
          value: string,
          options: Record<string, unknown>
        ) => {
          cookies.push({ name, value, options });
        },
        clearCookie: vi.fn(),
      } as any,
    },
  };
}

describe("credential auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue({});
    sdkMock.createSessionToken.mockResolvedValue("session-token");
  });

  it("bootstraps a device workspace and sets a session cookie", async () => {
    const deviceUser = {
      id: 11,
      openId: "local:device-user",
      name: "Device Workspace",
      email: null,
      loginMethod: "device",
      passwordHash: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    dbMock.createUser.mockResolvedValue(deviceUser);

    const { ctx, cookies } = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.bootstrap();

    expect(result).toEqual(deviceUser);
    expect(dbMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Device Workspace",
        loginMethod: "device",
        role: "user",
      })
    );
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(cookies[0]?.value).toBe("session-token");
  });

  it("registers a new user, hashes the password, and sets a session cookie", async () => {
    const createdUser = {
      id: 1,
      openId: "local:test-user",
      name: "Owner User",
      email: "owner@example.com",
      loginMethod: "password",
      passwordHash: "stored-hash",
      failedLoginAttempts: 0,
      lockedUntil: null,
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    dbMock.getUserByEmail.mockResolvedValue(undefined);
    dbMock.hasAdminUser.mockResolvedValue(false);
    dbMock.createUser.mockResolvedValue(createdUser);

    const { ctx, cookies } = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.register({
      name: "Owner User",
      email: "owner@example.com",
      password: "StrongPassword123",
    });

    expect(result).toEqual(createdUser);
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(cookies[0]?.value).toBe("session-token");

    const createInput = dbMock.createUser.mock.calls[0]?.[0];
    expect(createInput.role).toBe("admin");
    expect(createInput.email).toBe("owner@example.com");
    expect(createInput.passwordHash).toMatch(/^scrypt\$/);
    await expect(
      verifyPassword("StrongPassword123", createInput.passwordHash)
    ).resolves.toBe(true);
  });

  it("logs in an existing credential user and refreshes the session cookie", async () => {
    const passwordHash = await hashPassword("StrongPassword123");
    const existingUser = {
      id: 7,
      openId: "local:existing-user",
      name: "Existing User",
      email: "user@example.com",
      loginMethod: "password",
      passwordHash,
      failedLoginAttempts: 2,
      lockedUntil: null,
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    dbMock.getUserByEmail.mockResolvedValue(existingUser);
    dbMock.getUserById.mockResolvedValue({
      ...existingUser,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const { ctx, cookies } = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.login({
      email: "USER@example.com",
      password: "StrongPassword123",
    });

    expect(dbMock.getUserByEmail).toHaveBeenCalledWith("user@example.com");
    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      existingUser.id,
      expect.objectContaining({
        failedLoginAttempts: 0,
        lockedUntil: null,
        loginMethod: "password",
      })
    );
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(result.email).toBe(existingUser.email);
  });

  it("rejects invalid passwords without issuing a session", async () => {
    const passwordHash = await hashPassword("StrongPassword123");
    const existingUser = {
      id: 8,
      openId: "local:bad-password-user",
      name: "Existing User",
      email: "user@example.com",
      loginMethod: "password",
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    dbMock.getUserByEmail.mockResolvedValue(existingUser);

    const { ctx, cookies } = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "user@example.com",
        password: "WrongPassword123",
      })
    ).rejects.toMatchObject({
      message: "Invalid email or password",
    });

    expect(cookies).toHaveLength(0);
    expect(dbMock.updateUserById).toHaveBeenCalledWith(
      existingUser.id,
      expect.objectContaining({
        failedLoginAttempts: 1,
      })
    );
  });
});
