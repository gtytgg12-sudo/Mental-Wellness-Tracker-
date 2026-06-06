import { type NextRequest } from 'next/server';
import { getDemoUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { calculateWellness, generateRecommendations } from '@/lib/wellness-engine';
import { startOfDay } from '@/lib/utils';
import { asMood } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await getDemoUserId();
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`wellness:get:${userId}:${ip}`);
  if (!limit.success) return rateLimitResponse(limit);

  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const [latestMood, stressLogs, recentMoods, recentWellness] = await Promise.all([
    prisma.moodEntry.findFirst({
      where: { userId, recordedAt: { gte: today, lt: tomorrow } },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.stressLog.findMany({
      where: { userId, recordedAt: { gte: today, lt: tomorrow } },
    }),
    prisma.moodEntry.findMany({
      where: { userId, recordedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { recordedAt: 'desc' },
      take: 14,
    }),
    prisma.wellnessMetric.findMany({
      where: { userId },
      orderBy: { computedFor: 'desc' },
      take: 30,
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

  if (latestMood || stressLogs.length > 0) {
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

  const avgRecentWellness =
    recentWellness.length === 0
      ? null
      : Math.round(
          recentWellness.reduce((sum, w) => sum + w.score, 0) / recentWellness.length,
        );

  return successResponse(
    {
      today: breakdown,
      recentAverage: avgRecentWellness,
      recentMoodsCount: recentMoods.length,
      suggestions: generateRecommendations(breakdown.components, {
        avgStressIntensity: avgStress ?? undefined,
        sleepHours: latestMood?.sleepHours,
        studyHours: latestMood?.studyHours,
      }),
    },
    200,
    rateLimitHeaders(limit),
  );
}
