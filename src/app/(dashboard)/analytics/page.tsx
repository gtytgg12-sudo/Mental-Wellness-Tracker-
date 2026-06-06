import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WellnessChartLoader } from '@/components/wellness-chart-loader';
import { toDateKey } from '@/lib/utils';

export const metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

const MOOD_VALUES: Record<string, number> = { AWFUL: 1, LOW: 2, NEUTRAL: 3, GOOD: 4, GREAT: 5 };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const userId = await db.getDemoUserId();
  const params = await searchParams;
  const range = (params.range === '30d' || params.range === '90d' ? params.range : '7d') as
    | '7d'
    | '30d'
    | '90d';
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [moodsDesc, stress, wellnessDesc, journal] = await Promise.all([
    db.findMoods(userId, since, 500),
    db.findStress(userId, since),
    db.findWellness(userId, since, 100),
    db.findJournal(userId, since, 100),
  ]);
  const moods = [...moodsDesc].reverse();
  const wellness = [...wellnessDesc].reverse();
  const journalSentiment = journal.map((j) => ({ sentiment: j.sentiment }));

  const moodMap = new Map<string, { sum: number; count: number }>();
  for (const m of moods) {
    const k = toDateKey(m.recordedAt);
    const e = moodMap.get(k) ?? { sum: 0, count: 0 };
    e.sum += MOOD_VALUES[m.mood] ?? 3;
    e.count += 1;
    moodMap.set(k, e);
  }
  const moodTrend = [...moodMap.entries()]
    .map(([date, v]) => ({ date, value: Math.round((v.sum / v.count) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const wellnessMap = new Map<string, { sum: number; count: number }>();
  for (const w of wellness) {
    const k = toDateKey(w.computedFor);
    const e = wellnessMap.get(k) ?? { sum: 0, count: 0 };
    e.sum += w.score;
    e.count += 1;
    wellnessMap.set(k, e);
  }
  const wellnessTrend = [...wellnessMap.entries()]
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

  const sentimentCounts = journalSentiment.reduce<Record<string, number>>((acc, j) => {
    const s = j.sentiment ?? 'neutral';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Analytics</h1>
          <p className="text-sm text-muted-foreground">Patterns from the last {days} days.</p>
        </div>
        <nav aria-label="Time range" className="flex gap-1 rounded-md border p-1 text-sm">
          {(['7d', '30d', '90d'] as const).map((r) => {
            const active = range === r;
            return (
              <a
                key={r}
                href={`/analytics?range=${r}`}
                aria-current={active ? 'page' : undefined}
                className={`rounded px-3 py-1.5 ${
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
              >
                {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}
              </a>
            );
          })}
        </nav>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Mood entries" value={moods.length} />
        <Stat label="Stress logs" value={stress.length} />
        <Stat label="Wellness snapshots" value={wellness.length} />
        <Stat label="Journal entries" value={journal.length} />
      </div>

      <WellnessChartLoader data={{ moodTrend, wellnessTrend, stressStats }} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Journal sentiment</CardTitle>
            <CardDescription>How your writing has felt.</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(sentimentCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">No journal entries in this range.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Object.entries(sentimentCounts).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span className="capitalize">{k}</span>
                    <span className="font-mono text-muted-foreground">{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top stress triggers</CardTitle>
            <CardDescription>What is affecting you most.</CardDescription>
          </CardHeader>
          <CardContent>
            {stressStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stress logs in this range.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stressStats.slice(0, 5).map((s) => (
                  <li key={s.trigger} className="flex items-center justify-between">
                    <span>{s.trigger.replaceAll('_', ' ').toLowerCase()}</span>
                    <span className="font-mono text-muted-foreground">
                      {s.count}× · avg {s.avgIntensity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
