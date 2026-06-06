import { getDemoUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JournalEditor } from '@/components/journal-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Journal' };
export const dynamic = 'force-dynamic';

export default async function JournalPage() {
  const userId = await getDemoUserId();
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Reflection Journal</h1>
        <p className="text-sm text-muted-foreground">
          Write openly. Your entries are private and encrypted in transit.
        </p>
      </header>

      <JournalEditor />

      <section aria-labelledby="past-entries">
        <h2 id="past-entries" className="mb-3 text-lg font-semibold">
          Past entries
        </h2>
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Your past journal entries will appear here.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <Card key={e.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {new Date(e.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </CardTitle>
                    {e.sentiment && <Badge variant="secondary">{e.sentiment}</Badge>}
                  </div>
                  {e.keywords && (
                    <CardDescription className="flex flex-wrap gap-1 pt-1">
                      {e.keywords
                        .split(',')
                        .filter(Boolean)
                        .slice(0, 6)
                        .map((k) => (
                          <Badge key={k} variant="outline" className="text-xs">
                            {k.trim()}
                          </Badge>
                        ))}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="whitespace-pre-line text-sm text-foreground">{e.content}</p>
                  {e.aiReflection && (
                    <div className="rounded-md bg-primary/5 p-3 text-sm">
                      <p className="mb-1 text-xs font-medium text-primary">AI Reflection</p>
                      <p className="whitespace-pre-line text-muted-foreground">{e.aiReflection}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
