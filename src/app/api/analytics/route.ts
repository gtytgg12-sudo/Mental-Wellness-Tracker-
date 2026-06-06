import { type NextRequest } from 'next/server';
import { getDemoUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';
import { rangeSchema } from '@/lib/validation';
import { toDateKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await getDemoUserId();
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`analytics:get:${userId}:${ip}`);
  if (!limit.success) return rateLimitResponse(limit);

  const { searchParams } = new URL(req.url);
  const parsed = rangeSchema.safeParse({ range: searchParams.get('range') ?? '7d' });
  if (!parsed.success) return errorResponse('Invalid range', 400);

  const days = parsed.data.range === '7d' ? 7 : parsed.data.range === '30d' ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [moods, stress, wellness, journal] = await Promise.all([
    prisma.moodEntry.findMany({
      where: { userId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    }),
    prisma.stressLog.findMany({
      where: { userId, recordedAt: { gte: since } },
    }),
    prisma.wellnessMetric.findMany({
      where: { userId, computedFor: { gte: since } },
      orderBy: { computedFor: 'asc' },
    }),
    prisma.journalEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { sentiment: true, createdAt: true },
    }),
  ]);

  const moodTrendMap = new Map<string, { sum: number; count: number }>();
  const MOOD_VALUES: Record<string, number> = { AWFUL: 1, LOW: 2, NEUTRAL: 3, GOOD: 4, GREAT: 5 };
  for (const m of moods) {
    const k = toDateKey(m.recordedAt);
    const e = moodTrendMap.get(k) ?? { sum: 0, count: 0 };
    e.sum += MOOD_VALUES[m.mood] ?? 3;
    e.count += 1;
    moodTrendMap.set(k, e);
  }
  const moodTrend = [...moodTrendMap.entries()]
    .map(([date, v]) => ({ date, value: Math.round((v.sum / v.count) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const wellnessTrendMap = new Map<string, { sum: number; count: number }>();
  for (const w of wellness) {
    const k = toDateKey(w.computedFor);
    const e = wellnessTrendMap.get(k) ?? { sum: 0, count: 0 };
    e.sum += w.score;
    e.count += 1;
    wellnessTrendMap.set(k, e);
  }
  const wellnessTrend = [...wellnessTrendMap.entries()]
    .map(([date, v]) => ({ date, value: Math.round(v.sum / v.count) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const triggerCounts = new Map<string, { count: number; totalIntensity: number }>();
  for (const s of stress) {
    const e = triggerCounts.get(s.trigger) ?? { count: 0, totalIntensity: 0 };
    e.count += 1;
    e.totalIntensity += s.intensity;
    triggerCounts.set(s.trigger, e);
  }
  const stressStats = [...triggerCounts.entries()]
    .map(([trigger, v]) => ({
      trigger,
      count: v.count,
      avgIntensity: Math.round((v.totalIntensity / v.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const sentimentCounts = journal.reduce<Record<string, number>>((acc, j) => {
    const s = j.sentiment ?? 'neutral';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const daysWithEntries = new Set(moods.map((m) => toDateKey(m.recordedAt)));
  let streak = 0;
  const cursor = new Date();
  while (daysWithEntries.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return successResponse(
    {
      range: parsed.data.range,
      moodTrend,
      wellnessTrend,
      stressStats,
      sentimentCounts,
      streak,
      totals: {
        moods: moods.length,
        stressLogs: stress.length,
        journalEntries: journal.length,
        wellnessSnapshots: wellness.length,
      },
    },
    200,
    rateLimitHeaders(limit),
  );
}
