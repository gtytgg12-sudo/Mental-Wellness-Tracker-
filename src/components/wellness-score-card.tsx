'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { bandCopy, type WellnessBreakdown } from '@/lib/wellness-engine';
import { Moon, Brain, Smile, BookOpen } from 'lucide-react';

interface WellnessScoreCardProps {
  breakdown: WellnessBreakdown;
  loading?: boolean;
}

export function WellnessScoreCard({ breakdown, loading }: WellnessScoreCardProps) {
  const { score, band, components } = breakdown;
  const copy = bandCopy(band);

  return (
    <Card role="region" aria-label="Wellness score summary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardDescription>Wellness Score</CardDescription>
            <CardTitle className="mt-1 flex items-baseline gap-2">
              {loading ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <>
                  <span className="text-5xl font-bold tabular-nums">{score}</span>
                  <span className="text-base font-normal text-muted-foreground">/ 100</span>
                </>
              )}
            </CardTitle>
          </div>
          <Badge variant={band === 'at-risk' ? 'destructive' : band === 'stressed' ? 'warning' : 'success'}>
            <span aria-hidden="true">{copy.emoji}</span> {copy.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ComponentRow
          icon={<Smile className="h-4 w-4" aria-hidden="true" />}
          label="Mood"
          value={components.mood}
        />
        <ComponentRow
          icon={<Brain className="h-4 w-4" aria-hidden="true" />}
          label="Stress (lower is better)"
          value={components.stress}
        />
        <ComponentRow
          icon={<Moon className="h-4 w-4" aria-hidden="true" />}
          label="Sleep"
          value={components.sleep}
        />
        <ComponentRow
          icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
          label="Study balance"
          value={components.study}
        />
      </CardContent>
    </Card>
  );
}

interface ComponentRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function ComponentRow({ icon, label, value }: ComponentRowProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <Progress
        value={value}
        aria-label={`${label} score: ${value} out of 100`}
      />
    </div>
  );
}
