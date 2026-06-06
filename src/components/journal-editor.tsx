'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Save } from 'lucide-react';
import { toast } from 'sonner';

interface JournalEditorProps {
  onSaved?: () => void;
}

interface JournalResponse {
  entry: {
    id: string;
    content: string;
    aiReflection: string | null;
    sentiment: string | null;
    keywords: string[];
    createdAt: string;
  };
}

const MAX_LENGTH = 5000;

export function JournalEditor({ onSaved }: JournalEditorProps) {
  const router = useRouter();
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [reflection, setReflection] = React.useState<JournalResponse['entry'] | null>(null);

  const charCount = content.length;
  const isValid = charCount >= 10 && charCount <= MAX_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      toast.error('Please write at least 10 characters');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Failed to save entry');
      }
      const data = (await res.json()) as { data: JournalResponse };
      setReflection(data.data.entry);
      setContent('');
      toast.success('Journal entry saved');
      onSaved?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} aria-labelledby="journal-heading">
        <Card>
          <CardHeader>
            <CardTitle id="journal-heading" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              AI Reflection Journal
            </CardTitle>
            <CardDescription>
              Write what is on your mind. Our AI will respond with a supportive reflection.
              Your entries are private and never shared.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label htmlFor="journal-content" className="sr-only">
              Journal entry
            </label>
            <Textarea
              id="journal-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Today I felt…"
              rows={6}
              maxLength={MAX_LENGTH}
              disabled={submitting}
              aria-describedby="journal-help"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span id="journal-help">Minimum 10 characters. We never share your writing.</span>
              <span aria-live="polite" className="tabular-nums">
                {charCount} / {MAX_LENGTH}
              </span>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!isValid || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Reflecting…
                  </>
                ) : (
                  <>
                    <Save aria-hidden="true" />
                    Save & Reflect
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {reflection && (
        <Card className="animate-fade-in border-primary/30 bg-primary/5" role="status" aria-live="polite">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              Your Reflection
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {reflection.sentiment && (
                <Badge variant="secondary">Mood: {reflection.sentiment}</Badge>
              )}
              {reflection.keywords.slice(0, 4).map((k) => (
                <Badge key={k} variant="outline">
                  {k}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {reflection.aiReflection}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
