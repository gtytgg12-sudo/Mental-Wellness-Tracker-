import { getDemoUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateWellness } from '@/lib/wellness-engine';
import { SuggestionList } from '@/components/suggestion-list';
import { startOfDay } from '@/lib/utils';
import type { SuggestionCategory } from '@/lib/constants';
import { asMood } from '@/lib/types';

export const metadata = { title: 'Wellness Suggestions' };
export const dynamic = 'force-dynamic';

export default async function SuggestionsPage() {
  const userId = await getDemoUserId();
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
    mood: asMood(latestMood?.mood) ?? null,
    avgStressIntensity: avgStress,
    sleepHours: latestMood?.sleepHours ?? null,
    studyHours: latestMood?.studyHours ?? null,
  });

  const highlight: SuggestionCategory[] = [];
  if (breakdown.components.stress < 60) highlight.push('breathing', 'meditation');
  if (breakdown.components.sleep < 60) highlight.push('sleep');
  if ((breakdown.components.study < 60 && (latestMood?.studyHours ?? 0) > 10)) highlight.push('study-break');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Wellness suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Small, science-backed actions you can take right now.
        </p>
      </header>
      <SuggestionList highlight={highlight} />
    </div>
  );
}
