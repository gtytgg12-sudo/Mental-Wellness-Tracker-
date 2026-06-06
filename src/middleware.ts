import { NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const STATIC_PREFIXES = ['/_next', '/favicon', '/icons', '/manifest'];

function isStatic(pathname: string): boolean {
  return STATIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

export default function middleware(req: { headers: Headers; nextUrl: { pathname: string } }) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Skip static assets entirely
  if (isStatic(pathname) || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Per-IP rate limit on all API routes
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`mw:${ip}`);
  if (!limit.success && pathname.startsWith('/api/')) {
    return addSecurityHeaders(rateLimitResponse(limit));
  }

  // Open access — no auth gate (hackathon demo mode)
  const res = NextResponse.next();
  Object.entries(rateLimitHeaders(limit)).forEach(([k, v]) => res.headers.set(k, v));
  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)',
  ],
};
