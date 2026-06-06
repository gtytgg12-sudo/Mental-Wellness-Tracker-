'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wind, Brain, Pause, Moon, Droplet, Footprints, Phone } from 'lucide-react';
import { SUGGESTIONS, type SuggestionCategory, CRISIS_RESOURCES } from '@/lib/constants';

const ICONS: Record<SuggestionCategory, React.ComponentType<{ className?: string }>> = {
  breathing: Wind,
  meditation: Brain,
  'study-break': Pause,
  sleep: Moon,
  hydration: Droplet,
  movement: Footprints,
};

interface SuggestionListProps {
  highlight?: SuggestionCategory[];
}

export function SuggestionList({ highlight = [] }: SuggestionListProps) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="suggestions-heading">
        <h2 id="suggestions-heading" className="mb-3 text-xl font-semibold">
          Personalised suggestions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(SUGGESTIONS) as Array<[SuggestionCategory, (typeof SUGGESTIONS)[SuggestionCategory]]>).map(
            ([key, item]) => {
              const Icon = ICONS[key];
              const isHighlight = highlight.includes(key);
              return (
                <Card key={key} className={isHighlight ? 'border-primary/50 ring-1 ring-primary/30' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl" aria-hidden="true">
                        {item.emoji}
                      </span>
                      <Badge variant="outline">{item.minutes} min</Badge>
                    </div>
                    <CardTitle className="mt-2 flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{item.description}</CardDescription>
                    {isHighlight && (
                      <p className="mt-2 text-xs font-medium text-primary">Suggested for you today</p>
                    )}
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      </section>

      <section
        aria-labelledby="crisis-heading"
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <Phone className="mt-1 h-5 w-5 text-destructive" aria-hidden="true" />
          <div className="flex-1">
            <h2 id="crisis-heading" className="text-base font-semibold text-destructive">
              Need to talk to someone?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If you are in crisis or feel overwhelmed, please reach out. You are not alone.
            </p>
            <ul className="mt-3 space-y-2">
              {CRISIS_RESOURCES.map((r) => (
                <li key={r.name} className="flex flex-col text-sm sm:flex-row sm:items-center sm:gap-3">
                  <span className="font-medium">{r.name}</span>
                  <a
                    href={`tel:${r.phone.replace(/\s/g, '')}`}
                    className="font-mono text-primary underline-offset-4 hover:underline"
                  >
                    {r.phone}
                  </a>
                  <span className="text-xs text-muted-foreground">({r.hours})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
