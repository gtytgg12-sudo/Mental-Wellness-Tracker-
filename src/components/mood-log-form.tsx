'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoodSelector } from '@/components/mood-selector';
import { StressTriggerSelector } from '@/components/stress-trigger-selector';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Mood, StressTrigger } from '@prisma/client';

export function MoodLogForm() {
  const router = useRouter();
  const [mood, setMood] = React.useState<Mood | null>(null);
  const [triggers, setTriggers] = React.useState<StressTrigger[]>([]);
  const [intensity, setIntensity] = React.useState(5);
  const [sleepHours, setSleepHours] = React.useState('');
  const [studyHours, setStudyHours] = React.useState('');
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const toggleTrigger = (t: StressTrigger) => {
    setTriggers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 10),
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) {
      toast.error('Please select a mood');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { mood, note: note || undefined };
      if (sleepHours) body.sleepHours = Number(sleepHours);
      if (studyHours) body.studyHours = Number(studyHours);
      if (triggers.length > 0) {
        body.triggers = triggers;
        body.intensity = intensity;
      }
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Failed to save mood');
      }
      toast.success('Mood logged! Your wellness score has been updated.');
      setMood(null);
      setTriggers([]);
      setIntensity(5);
      setSleepHours('');
      setStudyHours('');
      setNote('');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>How are you feeling?</CardTitle>
          <CardDescription>Tap the emoji that best matches your mood right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <MoodSelector value={mood} onChange={setMood} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily details</CardTitle>
          <CardDescription>Optional, but helps us compute an accurate wellness score.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sleep">Sleep last night (hours)</Label>
              <Input
                id="sleep"
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="e.g. 7.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="study">Study hours today</Label>
              <Input
                id="study"
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step="0.5"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Optional note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything specific you want to remember about today?"
              maxLength={500}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stress triggers</CardTitle>
          <CardDescription>Pick anything that is weighing on you, and rate the intensity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StressTriggerSelector selected={triggers} onToggle={toggleTrigger} />
          {triggers.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="intensity">
                Intensity: <span className="font-bold tabular-nums">{intensity}</span> / 10
              </Label>
              <input
                id="intensity"
                type="range"
                min={1}
                max={10}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={intensity}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!mood || submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            'Log my mood'
          )}
        </Button>
      </div>
    </form>
  );
}
