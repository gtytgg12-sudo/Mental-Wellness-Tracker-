/**
 * Security helpers — input sanitisation and API response utilities.
 * Centralised so all API routes apply the same defences.
 */

/** Strip HTML tags and decode common entities. */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // strip tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

/** Normalize a string for keyword/safe-storage use (alphanum, hyphens, spaces, commas). */
export function normalizeKeywords(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s,\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Build a generic JSON error response. */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: unknown,
): Response {
  return new Response(
    JSON.stringify({
      error: true,
      message,
      ...(details ? { details } : {}),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
}

/** Build a generic JSON success response. */
export function successResponse<T>(data: T, status: number = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

/** Constant-time string comparison (for tokens). */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Get client IP from common proxy headers, falling back to 'unknown'. */
export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? 'unknown';
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    'unknown'
  );
}
