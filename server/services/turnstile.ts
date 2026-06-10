/**
 * Cloudflare Turnstile validation service
 */

export interface TurnstileValidationResult {
  success: boolean;
  error?: string;
  hostname?: string;
}

export async function validateTurnstileToken(
  token: string,
  ip?: string
): Promise<TurnstileValidationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not configured, skipping validation');
    return { success: true }; // Allow if not configured (development mode)
  }

  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip: ip,
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        hostname: result.hostname,
      };
    } else {
      return {
        success: false,
        error: result['error-codes']?.join(', ') || 'Validation failed',
      };
    }
  } catch (error) {
    console.error('[Turnstile] Validation error:', error);
    return {
      success: false,
      error: 'Validation service error',
    };
  }
}