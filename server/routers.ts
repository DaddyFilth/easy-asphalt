import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import {
  clearLoginThrottle,
  createLocalOpenId,
  getLoginThrottleUntil,
  hashPassword,
  LOGIN_LOCK_WINDOW_MS,
  MAX_LOGIN_FAILURES,
  normalizeEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  recordLoginFailure,
  verifyPassword,
} from "./_core/passwordAuth";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { projectsRouter } from "./routers/projects";

const emailSchema = z
  .string()
  .trim()
  .max(320)
  .email()
  .transform(normalizeEmail);

const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

const registerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
    .refine(value => /[a-z]/.test(value), {
      message: "Password must include a lowercase letter",
    })
    .refine(value => /[A-Z]/.test(value), {
      message: "Password must include an uppercase letter",
    })
    .refine(value => /[0-9]/.test(value), {
      message: "Password must include a number",
    }),
});

function getRequestAddress(req: {
  headers: Record<string, unknown>;
  ip?: string;
}) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const fromHeader = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]
      : undefined;

  return (fromHeader || req.ip || "unknown").trim().slice(0, 128);
}

function getThrottleKey(
  req: { headers: Record<string, unknown>; ip?: string },
  email: string
) {
  return `${getRequestAddress(req)}:${email}`;
}

function getLockMessage() {
  const minutes = Math.ceil(LOGIN_LOCK_WINDOW_MS / 60_000);
  return `Too many login attempts. Try again in ${minutes} minutes.`;
}

function isDuplicateEntryError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}

async function requireAuthDatabase() {
  const database = await db.getDb();
  if (!database) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Authentication database is unavailable",
    });
  }
}

async function createSessionForUser(
  ctx: {
    req: Parameters<typeof getSessionCookieOptions>[0];
    res: {
      cookie: (
        name: string,
        value: string,
        options: Record<string, unknown>
      ) => void;
    };
  },
  user: { openId: string; name: string | null }
) {
  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name ?? "",
  });

  ctx.res.cookie(COOKIE_NAME, sessionToken, {
    ...getSessionCookieOptions(ctx.req),
    maxAge: ONE_YEAR_MS,
  });
}

async function createDeviceSession(ctx: {
  req: Parameters<typeof getSessionCookieOptions>[0];
  res: {
    cookie: (
      name: string,
      value: string,
      options: Record<string, unknown>
    ) => void;
  };
}) {
  await requireAuthDatabase();

  const createdUser = await db.createUser({
    openId: createLocalOpenId(),
    name: "Device Workspace",
    email: null,
    loginMethod: "device",
    passwordHash: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    role: "user",
    lastSignedIn: new Date(),
  });

  await createSessionForUser(ctx, createdUser);
  return createdUser;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    bootstrap: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user) {
        return ctx.user;
      }

      return createDeviceSession(ctx);
    }),
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(async ({ ctx, input }) => {
        await requireAuthDatabase();

        const throttleKey = getThrottleKey(ctx.req, input.email);
        const throttledUntil = getLoginThrottleUntil(throttleKey);
        if (throttledUntil) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: getLockMessage(),
          });
        }

        const user = await db.getUserByEmail(input.email);
        const now = new Date();

        if (user?.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
          recordLoginFailure(throttleKey);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: getLockMessage(),
          });
        }

        const passwordMatches = await verifyPassword(
          input.password,
          user?.passwordHash
        );

        if (!user || !passwordMatches) {
          const lockedUntil = recordLoginFailure(throttleKey);

          if (user) {
            const failedLoginAttempts = user.failedLoginAttempts + 1;
            await db.updateUserById(user.id, {
              failedLoginAttempts,
              lockedUntil:
                failedLoginAttempts >= MAX_LOGIN_FAILURES
                  ? new Date(Date.now() + LOGIN_LOCK_WINDOW_MS)
                  : null,
            });
          }

          throw new TRPCError({
            code: lockedUntil ? "TOO_MANY_REQUESTS" : "UNAUTHORIZED",
            message: lockedUntil
              ? getLockMessage()
              : "Invalid email or password",
          });
        }

        clearLoginThrottle(throttleKey);
        await db.updateUserById(user.id, {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastSignedIn: now,
          loginMethod: "password",
        });

        const authenticatedUser =
          (await db.getUserById(user.id)) ??
          ({
            ...user,
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastSignedIn: now,
            loginMethod: "password",
          } as typeof user);

        await createSessionForUser(ctx, authenticatedUser);
        return authenticatedUser;
      }),
    register: publicProcedure
      .input(registerInputSchema)
      .mutation(async ({ ctx, input }) => {
        await requireAuthDatabase();

        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists",
          });
        }

        const ownerEmail = ENV.ownerEmail ? normalizeEmail(ENV.ownerEmail) : "";
        const hasAdminUser = await db.hasAdminUser();
        const now = new Date();
        const role =
          (ownerEmail && input.email === ownerEmail) || !hasAdminUser
            ? "admin"
            : "user";

        try {
          const createdUser = await db.createUser({
            openId: createLocalOpenId(),
            name: input.name.trim(),
            email: input.email,
            loginMethod: "password",
            passwordHash: await hashPassword(input.password),
            failedLoginAttempts: 0,
            lockedUntil: null,
            role,
            lastSignedIn: now,
          });

          await createSessionForUser(ctx, createdUser);
          return createdUser;
        } catch (error) {
          if (isDuplicateEntryError(error)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "An account with this email already exists",
            });
          }

          throw error;
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
