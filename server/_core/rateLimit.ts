import type { Request, Response, NextFunction } from 'express';

/**
 * In-memory rate limiting store
 * For production, consider using Redis or another distributed store
 */
interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Rate limiting middleware
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param keyGenerator - Function to generate unique keys for rate limiting
 */
export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => {
      // Use IP address as default key
      const ip = req.headers['x-forwarded-for'] as string || 
                 req.headers['x-real-ip'] as string || 
                 req.socket.remoteAddress || 'unknown';
      return ip;
    },
    skipSuccessfulRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Clean up expired entries
    if (rateLimitStore.size > 10000) {
      for (const [storeKey, store] of rateLimitStore.entries()) {
        if (store.resetTime < now) {
          rateLimitStore.delete(storeKey);
        }
      }
    }

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const resetTime = Math.ceil((entry.resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
      res.setHeader('Retry-After', resetTime.toString());

      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
        retryAfter: resetTime,
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

    // Skip successful requests if configured
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          entry.count--; // Don't count successful requests
        }
        return originalSend.call(this, data);
      };
    }

    next();
  };
}

/**
 * Specific rate limiters for different use cases
 */

// Strict rate limiting for authentication endpoints (10 requests per 15 minutes)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
});

// Moderate rate limiting for general API (100 requests per minute)
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

// Strict rate limiting for sensitive operations (5 requests per hour)
export const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
});