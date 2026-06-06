import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { SUGGESTIONS, type SuggestionCategory } from '@/lib/constants';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  category: z.enum(['breathing', 'meditation', 'study-break', 'sleep', 'hydration', 'movement']).optional(),
});

export async function GET(req: NextRequest) {
  const userId = await db.getDemoUserId();
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`suggestions:get:${userId}:${ip}`);
  if (!limit.success) return rateLimitResponse(limit);

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ category: searchParams.get('category') ?? undefined });
  if (!parsed.success) return successResponse({ items: Object.values(SUGGESTIONS) }, 200, rateLimitHeaders(limit));

  if (parsed.data.category) {
    const item = SUGGESTIONS[parsed.data.category as SuggestionCategory];
    return successResponse({ items: [item] }, 200, rateLimitHeaders(limit));
  }
  return successResponse({ items: Object.values(SUGGESTIONS) }, 200, rateLimitHeaders(limit));
}
