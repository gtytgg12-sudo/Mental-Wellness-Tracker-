'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Top-level loading state for the App Router.
 * Rendered automatically while route segments are streaming in.
 */
export default function Loading() {
  return (
    <main
      id="main-content"
      className="container flex min-h-[60vh] items-center justify-center py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm font-medium">Loading your wellness data…</p>
      </div>
    </main>
  );
}
