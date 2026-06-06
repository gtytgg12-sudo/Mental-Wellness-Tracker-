import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const PUBLIC_PATHS = new Set<string>([
  '/',
  '/login',
  '/register',
  '/about',
  '/crisis',
  '/privacy',
  '/terms',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/favicon')) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/api/health')) return true;
  if (pathname.startsWith('/icons/')) return true;
  if (pathname.startsWith('/manifest')) return true;
  return false;
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  // Defence-in-depth — these are also set in next.config.mjs
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // 1. Rate limit per IP
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`mw:${ip}`);
  if (!limit.success && pathname.startsWith('/api/')) {
    return addSecurityHeaders(rateLimitResponse(limit));
  }

  // 2. Auth gate
  if (!isPublicPath(pathname)) {
    const isAuthed = Boolean(req.auth?.user);
    if (!isAuthed) {
      if (pathname.startsWith('/api/')) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 },
          ),
        );
      }
      const loginUrl = new URL('/login', nextUrl);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // 3. Inject rate-limit headers on successful responses
  const res = NextResponse.next();
  Object.entries(rateLimitHeaders(limit)).forEach(([k, v]) => res.headers.set(k, v));
  return addSecurityHeaders(res);
});

export const config = {
  matcher: [
    // Run on everything except static assets
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)',
  ],
};
