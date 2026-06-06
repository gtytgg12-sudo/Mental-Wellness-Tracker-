/**
 * Lightweight in-memory token-bucket rate limiter.
 * Suitable for single-instance hackathon deployments.
 * Swap to Redis (e.g. @upstash/ratelimit) for production scale-out.
 */

import { NextResponse } from 'next/server';

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

interface RateLimitOptions {
  /** Time window in milliseconds. */
  windowMs: number;
  /** Maximum requests per window. */
  max: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 60),
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

/**
 * Check & consume a token for the given key.
 * Uses a sliding window approximation via token refill.
 */
export function rateLimit(key: string, options: Partial<RateLimitOptions> = {}): RateLimitResult {
  const { windowMs, max } = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: max, lastRefill: now };

  // Refill tokens proportional to elapsed time
  const elapsed = now - bucket.lastRefill;
  const refill = (elapsed / windowMs) * max;
  bucket.tokens = Math.min(max, bucket.tokens + refill);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return {
      success: false,
      remaining: 0,
      reset: Math.ceil((windowMs - elapsed) / 1000),
      limit: max,
    };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);

  return {
    success: true,
    remaining: Math.floor(bucket.tokens),
    reset: Math.ceil(windowMs / 1000),
    limit: max,
  };
}

/** Build a 429 NextResponse with rate-limit headers. */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Please slow down and try again shortly.',
      retryAfter: result.reset,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.reset),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.reset),
      },
    },
  );
}

/** Build rate-limit headers for a successful response. */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };
}

/** Periodically clean up stale buckets to avoid memory leaks. */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > 60 * 60 * 1000) buckets.delete(key);
    }
  }, CLEANUP_INTERVAL).unref?.();
}
