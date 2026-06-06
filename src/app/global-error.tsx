'use client';

import { Compass, Home } from 'lucide-react';

/**
 * Catch-all error boundary that wraps the entire `<html>` element.
 * Used when the root layout itself throws — falls back to a minimal
 * static page so the user can always recover.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          margin: 0,
          padding: '4rem 1rem',
          background: '#f8fafc',
          color: '#0f172a',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          role="alert"
          aria-live="assertive"
          style={{
            maxWidth: '32rem',
            background: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <Compass style={{ margin: '0 auto 0.75rem', color: '#14b8a6' }} size={40} aria-hidden />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Mindful Prep is taking a moment
          </h1>
          <p style={{ color: '#475569', margin: '0 0 1.5rem' }}>
            The app hit an unexpected error. You can retry, or head to the dashboard.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                background: '#14b8a6',
                color: 'white',
                border: 0,
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              style={{
                background: 'white',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Home size={16} /> Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
