import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { journalSchema, rangeSchema } from '@/lib/validation';
import { errorResponse, successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { getReflectionProvider } from '@/lib/ai-reflection';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await db.getDemoUserId();
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`journal:get:${userId}:${ip}`);
  if (!limit.success) return rateLimitResponse(limit);

  const { searchParams } = new URL(req.url);
  const parsed = rangeSchema.safeParse({ range: searchParams.get('range') ?? '30d' });
  if (!parsed.success) return errorResponse('Invalid range', 400);

  const days = parsed.data.range === '7d' ? 7 : parsed.data.range === '30d' ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const entries = await db.findJournal(userId, since, 100);
  return successResponse({ entries }, 200, rateLimitHeaders(limit));
}

export async function POST(req: NextRequest) {
  const userId = await db.getDemoUserId();
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`journal:post:${userId}:${ip}`, { windowMs: 60_000, max: 10 });
  if (!limit.success) return rateLimitResponse(limit);

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = journalSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Validation failed', 400, parsed.error.flatten());

  const provider = getReflectionProvider();
  const reflection = await provider.reflect(parsed.data.content);

  const entry = await db.createJournal({
    userId,
    content: parsed.data.content,
    aiReflection: reflection.text,
    sentiment: reflection.sentiment,
    keywords: reflection.keywords.join(', '),
  });

  return successResponse(
    { entry: { ...entry, keywords: reflection.keywords } },
    201,
    rateLimitHeaders(limit),
  );
}
