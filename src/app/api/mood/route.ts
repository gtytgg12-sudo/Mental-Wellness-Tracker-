import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { moodSchema, stressLogSchema, rangeSchema } from '@/lib/validation';
import { errorResponse, successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { calculateWellness } from '@/lib/wellness-engine';
import { startOfDay } from '@/lib/utils';
import { asMood } from '@/lib/types';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await db.getDemoUserId();
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`mood:get:${userId}:${ip}`);
  if (!limit.success) return rateLimitResponse(limit);

  const { searchParams } = new URL(req.url);
  const parsed = rangeSchema.safeParse({ range: searchParams.get('range') ?? '7d' });
  if (!parsed.success) return errorResponse('Invalid range parameter', 400, parsed.error.flatten());

  const days = parsed.data.range === '7d' ? 7 : parsed.data.range === '30d' ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const entries = await db.findMoods(userId, since);
  return successResponse({ entries }, 200, rateLimitHeaders(limit));
}

export async function POST(req: NextRequest) {
  const userId = await db.getDemoUserId();
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`mood:post:${userId}:${ip}`, { windowMs: 60_000, max: 20 });
  if (!limit.success) return rateLimitResponse(limit);

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = moodSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Validation failed', 400, parsed.error.flatten());

  const stress = z
    .object({ triggers: stressLogSchema.shape.triggers, intensity: stressLogSchema.shape.intensity })
    .partial()
    .safeParse(body);

  const entry = await db.createMood({
    userId,
    mood: parsed.data.mood,
    note: parsed.data.note ?? null,
    sleepHours: parsed.data.sleepHours ?? null,
    studyHours: parsed.data.studyHours ?? null,
    recordedAt: new Date(),
  });

  if (stress.success && stress.data.triggers && stress.data.intensity) {
    await db.createManyStress(
      stress.data.triggers.map((trigger) => ({
        userId,
        trigger,
        intensity: stress.data.intensity!,
        recordedAt: new Date(),
      })),
    );
  }

  await recomputeWellness(userId);
  return successResponse({ entry }, 201, rateLimitHeaders(limit));
}

async function recomputeWellness(userId: string): Promise<void> {
  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const [latestMood, stressLogs] = await Promise.all([
    db.findLatestMoodToday(userId, today, tomorrow),
    db.findStressToday(userId, today, tomorrow),
  ]);
  const avgStress =
    stressLogs.length === 0
      ? null
      : stressLogs.reduce((sum, s) => sum + s.intensity, 0) / stressLogs.length;
  const breakdown = calculateWellness({
    mood: asMood(latestMood?.mood),
    avgStressIntensity: avgStress,
    sleepHours: latestMood?.sleepHours,
    studyHours: latestMood?.studyHours,
  });
  await db.createWellness({
    userId,
    score: breakdown.score,
    moodComponent: breakdown.components.mood,
    stressComponent: breakdown.components.stress,
    sleepComponent: breakdown.components.sleep,
    studyComponent: breakdown.components.study,
    computedFor: new Date(),
  });
}
