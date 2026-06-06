import { describe, it, expect } from 'vitest';
import { rateLimit, rateLimitResponse, rateLimitHeaders } from '@/lib/rate-limit';

describe('rate limiter', () => {
  it('allows requests up to the limit', () => {
    const key = `test:allow:${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(key, { windowMs: 60_000, max: 5 });
      expect(r.success).toBe(true);
    }
  });

  it('rejects when limit exceeded', () => {
    const key = `test:reject:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      rateLimit(key, { windowMs: 60_000, max: 3 });
    }
    const r = rateLimit(key, { windowMs: 60_000, max: 3 });
    expect(r.success).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it('keys are isolated', () => {
    const a = `test:a:${Math.random()}`;
    const b = `test:b:${Math.random()}`;
    rateLimit(a, { windowMs: 60_000, max: 1 });
    const r1 = rateLimit(a, { windowMs: 60_000, max: 1 });
    const r2 = rateLimit(b, { windowMs: 60_000, max: 1 });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(true);
  });

  it('rateLimitResponse returns 429 with headers', () => {
    const res = rateLimitResponse({ success: false, remaining: 0, reset: 30, limit: 10 });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('rateLimitHeaders contains expected keys', () => {
    const h = rateLimitHeaders({ success: true, remaining: 5, reset: 60, limit: 10 });
    const headers = h as Record<string, string>;
    expect(headers['X-RateLimit-Limit']).toBe('10');
    expect(headers['X-RateLimit-Remaining']).toBe('5');
  });
});
