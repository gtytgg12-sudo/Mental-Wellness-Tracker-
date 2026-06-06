'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Top-level error boundary for the App Router.
 * Captures uncaught rendering errors and shows a friendly recovery screen
 * rather than a blank page. The `digest` is the server-side correlation id
 * which the user can include when reporting the issue.
 */
export default function GlobalError({ error, reset }: ErrorPageProps) {
  React.useEffect(() => {
    if (typeof console !== 'undefined') {
      console.error('[mw:error-boundary]', error);
    }
  }, [error]);

  return (
    <main
      id="main-content"
      className="container flex min-h-screen items-center justify-center py-12"
      role="alert"
      aria-live="assertive"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We hit an unexpected error. Your data is safe. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error.digest && (
            <p className="rounded-md bg-muted px-3 py-2 text-center text-xs font-mono text-muted-foreground">
              Ref: {error.digest}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="flex-1">
              <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
