import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { calculateWellness, generateRecommendations } from '@/lib/wellness-engine';
import { startOfDay } from '@/lib/utils';
import { asMood } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await db.getDemoUserId();
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`wellness:get:${userId}:${ip}`);
  if (!limit.success) return rateLimitResponse(limit);

  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const [latestMood, stressLogs, recentMoods, recentWellness] = await Promise.all([
    db.findLatestMoodToday(userId, today, tomorrow),
    db.findStressToday(userId, today, tomorrow),
    db.findRecentMoods(userId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 14),
    db.findWellness(userId, undefined, 30),
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

  const avgRecentWellness =
    recentWellness.length === 0
      ? null
      : Math.round(recentWellness.reduce((sum, w) => sum + w.score, 0) / recentWellness.length);

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
