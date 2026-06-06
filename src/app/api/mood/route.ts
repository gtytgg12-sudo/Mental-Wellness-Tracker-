import { type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { moodSchema, stressLogSchema, rangeSchema } from '@/lib/validation';
import { errorResponse, successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { calculateWellness } from '@/lib/wellness-engine';
import { startOfDay } from '@/lib/utils';
import { asMood } from '@/lib/types';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET /api/mood?range=7d — mood history
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse('Authentication required', 401);
  }

  const ip = getClientIp(req.headers);
  const limit = rateLimit(`mood:get:${session.user.id}:${ip}`);
  if (!limit.success) return rateLimitResponse(limit);

  const { searchParams } = new URL(req.url);
  const parsed = rangeSchema.safeParse({ range: searchParams.get('range') ?? '7d' });
  if (!parsed.success) {
    return errorResponse('Invalid range parameter', 400, parsed.error.flatten());
  }

  const days = parsed.data.range === '7d' ? 7 : parsed.data.range === '30d' ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const entries = await prisma.moodEntry.findMany({
    where: { userId: session.user.id, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'desc' },
    take: 200,
  });

  return successResponse({ entries }, 200, rateLimitHeaders(limit));
}

// POST /api/mood — create a mood entry
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse('Authentication required', 401);
  }

  const ip = getClientIp(req.headers);
  const limit = rateLimit(`mood:post:${session.user.id}:${ip}`, { windowMs: 60_000, max: 20 });
  if (!limit.success) return rateLimitResponse(limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = moodSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Validation failed', 400, parsed.error.flatten());
  }

  // If user wants to log stress triggers in the same call, accept them too
  const stress = z
    .object({ triggers: stressLogSchema.shape.triggers, intensity: stressLogSchema.shape.intensity })
    .partial()
    .safeParse(body);

  const entry = await prisma.moodEntry.create({
    data: {
      userId: session.user.id,
      mood: parsed.data.mood,
      note: parsed.data.note,
      sleepHours: parsed.data.sleepHours,
      studyHours: parsed.data.studyHours,
    },
  });

  // Optional: also log stress triggers
  if (stress.success && stress.data.triggers && stress.data.intensity) {
    await prisma.stressLog.createMany({
      data: stress.data.triggers.map((trigger) => ({
        userId: session.user.id!,
        trigger,
        intensity: stress.data.intensity!,
      })),
    });
  }

  // Recompute wellness for today
  await recomputeWellness(session.user.id);

  return successResponse({ entry }, 201, rateLimitHeaders(limit));
}

async function recomputeWellness(userId: string): Promise<void> {
  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const [latestMood, stressLogs] = await Promise.all([
    prisma.moodEntry.findFirst({
      where: { userId, recordedAt: { gte: today, lt: tomorrow } },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.stressLog.findMany({
      where: { userId, recordedAt: { gte: today, lt: tomorrow } },
    }),
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

  await prisma.wellnessMetric.create({
    data: {
      userId,
      score: breakdown.score,
      moodComponent: breakdown.components.mood,
      stressComponent: breakdown.components.stress,
      sleepComponent: breakdown.components.sleep,
      studyComponent: breakdown.components.study,
    },
  });
}
