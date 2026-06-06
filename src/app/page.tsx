import Link from 'next/link';
import { Heart, Sparkles, BarChart3, Brain, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main id="main-content" className="container py-12 sm:py-20">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium">
          <Heart className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Built for Board, NEET, JEE, CUET, CAT, GATE, UPSC students
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Your mental wellness companion for <span className="text-primary">exam prep</span>.
        </h1>
        <p className="mt-4 text-balance text-lg text-muted-foreground sm:text-xl">
          Track mood, log stress, journal with AI, and get a personalised wellness score — built with privacy and accessibility first.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get started — it's free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Features">
        <Feature
          icon={<Heart className="h-5 w-5" aria-hidden="true" />}
          title="Daily mood check-in"
          description="Quick emoji-based logging. Track your mood over days and weeks."
        />
        <Feature
          icon={<Brain className="h-5 w-5" aria-hidden="true" />}
          title="Stress trigger radar"
          description="Spot what's draining you — exam pressure, sleep, workload, and more."
        />
        <Feature
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
          title="AI reflection journal"
          description="Write your thoughts; get a supportive, personalised reflection."
        />
        <Feature
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
          title="Wellness score"
          description="A daily 0–100 score combining mood, stress, sleep, and study."
        />
        <Feature
          icon={<Shield className="h-5 w-5" aria-hidden="true" />}
          title="Private & secure"
          description="Encrypted passwords, rate limiting, secure headers. Your data is yours."
        />
        <Feature
          icon={<Lock className="h-5 w-5" aria-hidden="true" />}
          title="Accessible by design"
          description="WCAG-aligned, keyboard-friendly, screen-reader ready, high-contrast mode."
        />
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
