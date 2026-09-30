import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40; // 40 requests per minute
const MAX_MAP_ENTRIES = 10000; // Hard cap on entries to prevent memory exhaustion

/**
 * Sweeps expired records to prevent memory leak.
 */
function cleanupExpiredRecords(now: number) {
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Safely extracts client IP address.
 * Only trusts X-Forwarded-For if TRUST_PROXY is explicitly enabled,
 * preventing IP spoofing and rate limit bypasses.
 */
function resolveClientIp(req: Request): string {
  const trustProxy = !!process.env.VERCEL || process.env.TRUST_PROXY === 'true' || !!req.app?.get('trust proxy');
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const parts = forwarded.split(',');
      const first = parts[0]?.trim();
      if (first) return first;
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return forwarded[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) {
      return realIp.trim();
    }
  }

  // Authoritative network socket address with safe fallbacks
  try {
    if (req.ip) return req.ip;
  } catch {
    // Ignore getter failure if socket is mock or detached
  }
  return req.socket?.remoteAddress || (req as any).connection?.remoteAddress || '127.0.0.1';
}

export function aiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = resolveClientIp(req);
  const now = Date.now();

  // Bounded store protection: sweep if map exceeds threshold
  if (rateLimitMap.size >= MAX_MAP_ENTRIES) {
    cleanupExpiredRecords(now);
    // If still full after cleanup, evict oldest entry
    if (rateLimitMap.size >= MAX_MAP_ENTRIES) {
      const firstKey = rateLimitMap.keys().next().value;
      if (firstKey) rateLimitMap.delete(firstKey);
    }
  }

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded. Please wait a moment before trying again.',
      retryAfterSeconds: retryAfter,
    });
  }

  record.count += 1;
  return next();
}

/**
 * Test helper to reset rate limit state between test runs.
 */
export function _resetRateLimitMap() {
  rateLimitMap.clear();
}
