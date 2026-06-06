'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  moodTrend: Array<{ date: string; value: number }>;
  wellnessTrend: Array<{ date: string; value: number }>;
  stressStats: Array<{ trigger: string; count: number; avgIntensity: number }>;
}

interface WellnessChartLoaderProps {
  data: AnalyticsData;
}

const WellnessChart = dynamic(
  () => import('@/components/wellness-chart').then((m) => m.WellnessChart),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Your Trends</CardTitle>
          <CardDescription>Loading charts…</CardDescription>
        </CardHeader>
        <CardContent className="h-64 animate-pulse rounded-md bg-muted" />
      </Card>
    ),
  },
);

export function WellnessChartLoader({ data }: WellnessChartLoaderProps) {
  return <WellnessChart data={data} />;
}
