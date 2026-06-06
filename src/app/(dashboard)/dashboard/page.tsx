import { getDemoUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateWellness, generateRecommendations } from '@/lib/wellness-engine';
import { WellnessScoreCard } from '@/components/wellness-score-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Smile, BookHeart, BarChart3, ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { startOfDay, toDateKey } from '@/lib/utils';
import { tipsForTrigger, ALL_TRIGGER_TIPS } from '@/lib/wellness-engine';
import { asMood, asStressTrigger } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const userId = await getDemoUserId();
  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const [latestMood, stressLogs, streakData, totalEntries] = await Promise.all([
    prisma.moodEntry.findFirst({
      where: { userId, recordedAt: { gte: today, lt: tomorrow } },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.stressLog.findMany({
      where: { userId, recordedAt: { gte: today, lt: tomorrow } },
    }),
    prisma.moodEntry.findMany({
      where: { userId, recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { recordedAt: true },
    }),
    prisma.moodEntry.count({ where: { userId } }),
  ]);

  const avgStress =
    stressLogs.length === 0
      ? null
      : stressLogs.reduce((sum, s) => sum + s.intensity, 0) / stressLogs.length;

  const breakdown = calculateWellness({
    mood: asMood(latestMood?.mood) ?? null,
    avgStressIntensity: avgStress,
    sleepHours: latestMood?.sleepHours ?? null,
    studyHours: latestMood?.studyHours ?? null,
  });

  // Streak
  const days = new Set(streakData.map((m) => toDateKey(m.recordedAt)));
  let streak = 0;
  const cursor = new Date();
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const topTrigger = asStressTrigger(stressLogs[0]?.trigger);
  const topTip = topTrigger ? tipsForTrigger(topTrigger) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Welcome, Student 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {streak > 0 && (
          <Badge variant="success" className="px-3 py-1 text-sm">
            <Flame className="mr-1 h-4 w-4" aria-hidden="true" /> {streak}-day streak
          </Badge>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WellnessScoreCard breakdown={breakdown} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-between">
                <Link href="/mood">
                  <span className="flex items-center gap-2">
                    <Smile className="h-4 w-4" aria-hidden="true" />
                    Log mood
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/journal">
                  <span className="flex items-center gap-2">
                    <BookHeart className="h-4 w-4" aria-hidden="true" />
                    Journal entry
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/analytics">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                    See trends
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s tip</CardTitle>
            </CardHeader>
            <CardContent>
              {topTip ? (
                <p className="text-sm">{topTip}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Log a mood to unlock personalised suggestions.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            Suggestions for you
          </CardTitle>
          <CardDescription>Based on your latest mood, sleep, and study data.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {generateRecommendations(breakdown.components, {
              avgStressIntensity: avgStress ?? undefined,
              sleepHours: latestMood?.sleepHours,
              studyHours: latestMood?.studyHours,
            }).map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button asChild variant="link" size="sm">
              <Link href="/suggestions">
                View all suggestions <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">You have logged {totalEntries} entries so far</CardTitle>
          <CardDescription>Keep showing up for yourself — every entry helps.</CardDescription>
        </CardHeader>
      </Card>

      <details className="rounded-lg border bg-muted/30 p-4 text-sm">
        <summary className="cursor-pointer font-medium">All stress trigger tips</summary>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {Object.entries(ALL_TRIGGER_TIPS).map(([k, v]) => (
            <li key={k}>
              <span className="font-medium text-foreground">{k.replaceAll('_', ' ').toLowerCase()}:</span> {v}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
