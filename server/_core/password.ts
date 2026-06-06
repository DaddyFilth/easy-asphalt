import { scrypt, randomBytes, timingSafeEqual } from "crypto";

// Password hashing using scrypt with proper salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const keyLength = 64; // 512 bits
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `${salt}:${derivedKey.toString('hex')}`;
}

// Password verification with timing-safe comparison
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    
    const keyLength = 64;
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, keyLength, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
    
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(derivedKey, keyBuffer);
  } catch (error) {
    return false;
  }
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
