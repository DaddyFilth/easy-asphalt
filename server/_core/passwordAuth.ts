import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { nanoid } from "nanoid";

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const PASSWORD_SALT_BYTES = 16;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const MAX_LOGIN_FAILURES = 5;
export const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;

type LoginThrottleState = {
  attempts: number;
  blockedUntil: number;
  lastSeenAt: number;
};

const loginThrottle = new Map<string, LoginThrottleState>();

function pruneLoginThrottle(now: number) {
  loginThrottle.forEach((value, key) => {
    const stillBlocked = value.blockedUntil > now;
    const stillFresh = now - value.lastSeenAt <= LOGIN_LOCK_WINDOW_MS;

    if (!stillBlocked && !stillFresh) {
      loginThrottle.delete(key);
    }
  });
}

function derivePasswordKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey as Buffer);
      }
    );
  });
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createLocalOpenId() {
  return `local:${nanoid(21)}`;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString("base64url");
  const derivedKey = await derivePasswordKey(password, salt);

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt,
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedHash: string | null | undefined
) {
  if (!encodedHash) return false;

  const [algorithm, cost, blockSize, parallelization, salt, expectedHash] =
    encodedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  if (
    Number(cost) !== SCRYPT_COST ||
    Number(blockSize) !== SCRYPT_BLOCK_SIZE ||
    Number(parallelization) !== SCRYPT_PARALLELIZATION
  ) {
    return false;
  }

  const derivedKey = await derivePasswordKey(password, salt);
  const expectedBuffer = Buffer.from(expectedHash, "base64url");

  if (expectedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedBuffer);
}

export function getLoginThrottleUntil(key: string, now = Date.now()) {
  pruneLoginThrottle(now);
  const state = loginThrottle.get(key);
  if (!state || state.blockedUntil <= now) {
    return null;
  }

  return state.blockedUntil;
}

export function recordLoginFailure(key: string, now = Date.now()) {
  pruneLoginThrottle(now);

  const existing = loginThrottle.get(key);
  const attempts =
    existing && now - existing.lastSeenAt <= LOGIN_LOCK_WINDOW_MS
      ? existing.attempts + 1
      : 1;
  const blockedUntil =
    attempts >= MAX_LOGIN_FAILURES ? now + LOGIN_LOCK_WINDOW_MS : 0;

  loginThrottle.set(key, {
    attempts,
    blockedUntil,
    lastSeenAt: now,
  });

  return blockedUntil > now ? blockedUntil : null;
}

export function clearLoginThrottle(key: string) {
  loginThrottle.delete(key);
}
