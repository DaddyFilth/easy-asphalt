import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { projectsRouter } from "./routers/projects";
import { subscriptionRouter } from "./routers/subscription";
import { hashPassword, verifyPassword, validatePasswordStrength, validateEmail } from "./_core/password";
import {
  setupTOTP,
  verifyTOTP,
  verifyBackupCode,
  removeBackupCode,
  encryptData,
  decryptData,
} from "./services/mfa";
import { validateTurnstileToken } from "./services/turnstile";
import { ENV } from "./_core/env";
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
        turnstileToken: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate Turnstile token if provided
        if (input.turnstileToken) {
          const clientIp = ctx.req.headers['x-forwarded-for'] as string || 
                           ctx.req.headers['x-real-ip'] as string || 
                           ctx.req.socket.remoteAddress;
          const turnstileResult = await validateTurnstileToken(input.turnstileToken, clientIp);
          
          if (!turnstileResult.success) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `CAPTCHA validation failed: ${turnstileResult.error}`,
            });
          }
        } else if (process.env.TURNSTILE_SECRET_KEY) {
          // If Turnstile is configured but no token provided
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CAPTCHA validation required",
          });
        }
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
        turnstileToken: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate Turnstile token if provided
        if (input.turnstileToken) {
          const clientIp = ctx.req.headers['x-forwarded-for'] as string || 
                           ctx.req.headers['x-real-ip'] as string || 
                           ctx.req.socket.remoteAddress;
          const turnstileResult = await validateTurnstileToken(input.turnstileToken, clientIp);
          
          if (!turnstileResult.success) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `CAPTCHA validation failed: ${turnstileResult.error}`,
            });
          }
        } else if (process.env.TURNSTILE_SECRET_KEY) {
          // If Turnstile is configured but no token provided
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CAPTCHA validation required",
          });
        }
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
    // MFA procedures
    setupMFA: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      const MFA_ENCRYPTION_KEY = ENV.cookieSecret;

      // Check if MFA is already enabled
      if (user.mfaEnabled === 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "MFA is already enabled for this account",
        });
      }

      const userEmail = user.email || user.name;
      const setupResult = setupTOTP(userEmail);

      // Encrypt the secret before storing
      const encryptedSecret = encryptData(setupResult.secret, MFA_ENCRYPTION_KEY);
      const encryptedBackupCodes = encryptData(
        JSON.stringify(setupResult.backupCodes),
        MFA_ENCRYPTION_KEY
      );

      // Update user with MFA setup data (but don't enable yet)
      await db.updateUser(user.id, {
        totpSecret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        mfaEnabled: 0, // Not enabled until verified
      });

      return {
        qrCodeUrl: setupResult.qrCodeUrl,
        backupCodes: setupResult.backupCodes, // Show these only during setup
      };
    }),

    verifyAndEnableMFA: protectedProcedure
      .input(
        z.object({
          token: z.string().length(6),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const MFA_ENCRYPTION_KEY = ENV.cookieSecret;

        if (!user.totpSecret) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MFA setup not initiated. Please start MFA setup first.",
          });
        }

        if (user.mfaEnabled === 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MFA is already enabled for this account",
          });
        }

        // Decrypt the secret
        const decryptedSecret = decryptData(user.totpSecret, MFA_ENCRYPTION_KEY);

        // Verify the token
        const isValid = verifyTOTP(decryptedSecret, input.token);

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid verification code",
          });
        }

        // Enable MFA
        await db.updateUser(user.id, {
          mfaEnabled: 1,
          mfaVerifiedAt: new Date(),
        });

        return {
          success: true,
          message: "MFA has been enabled successfully",
        };
      }),

    disableMFA: protectedProcedure
      .input(
        z.object({
          token: z.string().length(6),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const MFA_ENCRYPTION_KEY = ENV.cookieSecret;

        if (user.mfaEnabled !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MFA is not enabled for this account",
          });
        }

        if (!user.totpSecret) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MFA data not found",
          });
        }

        // Decrypt the secret
        const decryptedSecret = decryptData(user.totpSecret, MFA_ENCRYPTION_KEY);

        // Verify the token before disabling
        const isValid = verifyTOTP(decryptedSecret, input.token);

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid verification code",
          });
        }

        // Disable MFA
        await db.updateUser(user.id, {
          mfaEnabled: 0,
          totpSecret: null,
          backupCodes: null,
          mfaVerifiedAt: null,
        });

        return {
          success: true,
          message: "MFA has been disabled successfully",
        };
      }),

    verifyMFA: protectedProcedure
      .input(
        z.object({
          token: z.string().length(6),
          isBackupCode: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const MFA_ENCRYPTION_KEY = ENV.cookieSecret;

        if (user.mfaEnabled !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MFA is not enabled for this account",
          });
        }

        if (!user.totpSecret || !user.backupCodes) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MFA data not found",
          });
        }

        if (input.isBackupCode) {
          // Verify backup code
          const decryptedBackupCodes = JSON.parse(
            decryptData(user.backupCodes, MFA_ENCRYPTION_KEY)
          );
          const verification = verifyBackupCode(decryptedBackupCodes, input.token);

          if (!verification.valid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid backup code",
            });
          }

          // Remove used backup code
          const remainingCodes = removeBackupCode(
            decryptedBackupCodes,
            verification.usedCode!
          );

          await db.updateUser(user.id, {
            backupCodes: encryptData(
              JSON.stringify(remainingCodes),
              MFA_ENCRYPTION_KEY
            ),
            mfaVerifiedAt: new Date(),
          });

          return {
            success: true,
            backupCodeUsed: true,
            remainingBackupCodes: remainingCodes.length,
          };
        } else {
          // Verify TOTP token
          const decryptedSecret = decryptData(user.totpSecret, MFA_ENCRYPTION_KEY);
          const isValid = verifyTOTP(decryptedSecret, input.token);

          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid verification code",
            });
          }

          await db.updateUser(user.id, {
            mfaVerifiedAt: new Date(),
          });

          return {
            success: true,
            backupCodeUsed: false,
          };
        }
      }),

    getMFAStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;

      return {
        enabled: user.mfaEnabled === 1,
        hasBackupCodes: !!user.backupCodes,
      };
    }),

    regenerateBackupCodes: protectedProcedure
      .input(
        z.object({
          token: z.string().length(6),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const MFA_ENCRYPTION_KEY = ENV.cookieSecret;

        if (user.mfaEnabled !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MFA is not enabled for this account",
          });
        }

        if (!user.totpSecret) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "MFA data not found",
          });
        }

        // Verify current TOTP before regenerating
        const decryptedSecret = decryptData(user.totpSecret, MFA_ENCRYPTION_KEY);
        const isValid = verifyTOTP(decryptedSecret, input.token);

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid verification code",
          });
        }

        // Generate new backup codes
        const newBackupCodes = Array.from({ length: 10 }, () =>
          require('crypto').randomBytes(4).toString('hex').toUpperCase()
        );

        await db.updateUser(user.id, {
          backupCodes: encryptData(
            JSON.stringify(newBackupCodes),
            MFA_ENCRYPTION_KEY
          ),
        });

        return {
          backupCodes: newBackupCodes,
          message: "New backup codes generated. Save them securely.",
        };
      }),
  }),
  projects: projectsRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
