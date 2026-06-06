import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { projectsRouter } from "./routers/projects";
import { subscriptionRouter } from "./routers/subscription";
import { hashPassword, verifyPassword, validatePasswordStrength, validateEmail } from "./_core/password";
import { z } from "zod";

function createLocalOpenId() {
  return `local:${randomUUID()}`;
}

// Not needed — db.ts falls back to in-memory storage when MySQL is unavailable.

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
  const createdUser = await db.createUser({
    openId: createLocalOpenId(),
    name: "Device Workspace",
    email: null,
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
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate email format
        if (!validateEmail(input.email)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid email format",
          });
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(input.password);
        if (!passwordValidation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: passwordValidation.errors.join(", "),
          });
        }

        // Check if user already exists
        const existingUsers = await db.findUser({ email: input.email });
        if (existingUsers) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A user with this email already exists",
          });
        }

        // Hash password
        const hashedPassword = await hashPassword(input.password);

        // Create user with email/password
        const createdUser = await db.createUser({
          openId: `email:${randomUUID()}`,
          email: input.email,
          password: hashedPassword,
          name: input.name || input.email.split("@")[0],
          role: "user",
          lastSignedIn: new Date(),
        });

        // Create session
        await createSessionForUser(ctx, createdUser);
        
        return createdUser;
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate email format
        if (!validateEmail(input.email)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid email format",
          });
        }

        // Find user by email
        const user = await db.findUser({ email: input.email });
        if (!user || !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Verify password
        const isValidPassword = await verifyPassword(input.password, user.password);
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Update last signed in
        await db.updateUser(user.id, { lastSignedIn: new Date() });

        // Create session
        await createSessionForUser(ctx, user);

        return user;
      }),
  }),
  projects: projectsRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
