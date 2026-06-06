import { MoodLogForm } from '@/components/mood-log-form';

export const metadata = { title: 'Log Mood' };

export default function MoodPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">How are you today?</h1>
        <p className="text-sm text-muted-foreground">
          A quick check-in helps us understand your wellness over time.
        </p>
      </header>
      <MoodLogForm />
    </div>
  );
}
