'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AnalyticsData {
  moodTrend: Array<{ date: string; value: number }>;
  wellnessTrend: Array<{ date: string; value: number }>;
  stressStats: Array<{ trigger: string; count: number; avgIntensity: number }>;
}

interface WellnessChartProps {
  data: AnalyticsData;
  loading?: boolean;
}

const TRIGGER_LABELS: Record<string, string> = {
  EXAM_PRESSURE: 'Exam Pressure',
  RESULTS_ANXIETY: 'Results Anxiety',
  FAMILY_EXPECTATIONS: 'Family Expectations',
  LACK_OF_SLEEP: 'Lack of Sleep',
  ACADEMIC_WORKLOAD: 'Academic Workload',
  PEER_COMPARISON: 'Peer Comparison',
  FINANCIAL_PRESSURE: 'Financial Pressure',
  HEALTH_ISSUES: 'Health Issues',
  SOCIAL_ISOLATION: 'Social Isolation',
  UNCERTAINTY: 'Uncertainty',
};

const SHORT_DATE = (d: string) => {
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
};

export function WellnessChart({ data, loading }: WellnessChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
          <CardDescription>Loading your data…</CardDescription>
        </CardHeader>
        <CardContent className="h-64 animate-pulse rounded-md bg-muted" />
      </Card>
    );
  }

  const empty = data.moodTrend.length === 0 && data.wellnessTrend.length === 0;
  if (empty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
          <CardDescription>Log a mood or journal entry to see your trends here.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card role="region" aria-label="Wellness analytics charts">
      <CardHeader>
        <CardTitle>Your Trends</CardTitle>
        <CardDescription>Track how your mood and wellness score change over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mood">
          <TabsList aria-label="Chart view">
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="wellness">Wellness</TabsTrigger>
            <TabsTrigger value="stress">Stress Triggers</TabsTrigger>
          </TabsList>

          <TabsContent value="mood">
            <div className="h-64" aria-label="Mood trend line chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.moodTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tickFormatter={SHORT_DATE} fontSize={12} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} fontSize={12} />
                  <Tooltip
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(v: number) => [v.toFixed(1), 'Mood (1-5)']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(174 62% 41%)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="wellness">
            <div className="h-64" aria-label="Wellness score line chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.wellnessTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tickFormatter={SHORT_DATE} fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(v: number) => [v, 'Wellness Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(220 80% 55%)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="stress">
            <div className="h-64" aria-label="Stress trigger frequency bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.stressStats.map((s) => ({
                    ...s,
                    label: TRIGGER_LABELS[s.trigger] ?? s.trigger,
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} fontSize={11} height={60} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Times logged" fill="hsl(174 62% 41%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
