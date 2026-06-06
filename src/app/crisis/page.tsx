import { CRISIS_RESOURCES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Crisis Resources' };

export default function CrisisPage() {
  return (
    <main id="main-content" className="container max-w-3xl py-12">
      <div className="mb-6 flex items-start gap-3 rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-semibold text-destructive">If you are in immediate danger</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Please call <strong className="text-foreground">112</strong> (India emergency) or go to the nearest hospital.
            You matter. Help is available right now.
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Mental health helplines (India)</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {CRISIS_RESOURCES.map((r) => (
          <Card key={r.name}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                {r.name}
              </CardTitle>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={`tel:${r.phone.replace(/\s/g, '')}`}
                className="text-lg font-mono font-semibold text-primary underline-offset-4 hover:underline"
                aria-label={`Call ${r.name} at ${r.phone}`}
              >
                {r.phone}
              </a>
              <p className="mt-1 text-xs text-muted-foreground">{r.hours}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        You are not alone. Reaching out is a sign of strength, not weakness.
      </p>
    </main>
  );
}
