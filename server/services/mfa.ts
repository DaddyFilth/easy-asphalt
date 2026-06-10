import { OTPAuth } from 'otpauth';
import crypto from 'crypto';

/**
 * MFA Service for TOTP-based two-factor authentication
 */

const TOTP_ISSUER = 'Easy Asphalt';

export interface TOTPSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  verified: boolean;
  backupCodeUsed?: string;
}

/**
 * Generate a secure random secret for TOTP
 */
function generateSecret(): string {
  return crypto.randomBytes(32).toString('base64').substring(0, 32);
}

/**
 * Generate backup codes for MFA recovery
 */
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Setup TOTP for a user
 */
export function setupTOTP(userEmail: string): TOTPSetupResult {
  const secret = generateSecret();
  const backupCodes = generateBackupCodes();

  const totp = new OTPAuth({
    issuer: TOTP_ISSUER,
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const qrCodeUrl = totp.toString();

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify a TOTP code
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    const totp = new OTPAuth({
      issuer: TOTP_ISSUER,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    // Allow 1 time step tolerance (window = 1)
    const delta = totp.validate({ token, window: 1 });
    return delta === null;
  } catch (error) {
    console.error('[MFA] TOTP verification error:', error);
    return false;
  }
}

/**
 * Verify a backup code
 */
export function verifyBackupCode(
  storedBackupCodes: string[],
  providedCode: string
): { valid: boolean; usedCode?: string } {
  const normalizedProvided = providedCode.toUpperCase().trim();
  
  for (const code of storedBackupCodes) {
    if (code.toUpperCase() === normalizedProvided) {
      return { valid: true, usedCode: code };
    }
  }
  
  return { valid: false };
}

/**
 * Remove a used backup code from the list
 */
export function removeBackupCode(
  storedBackupCodes: string[],
  usedCode: string
): string[] {
  const normalizedUsed = usedCode.toUpperCase().trim();
  return storedBackupCodes.filter(code => code.toUpperCase() !== normalizedUsed);
}

/**
 * Encrypt sensitive data (TOTP secret, backup codes)
 */
export function encryptData(data: string, encryptionKey: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(
  encryptedData: string,
  encryptionKey: string
): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}