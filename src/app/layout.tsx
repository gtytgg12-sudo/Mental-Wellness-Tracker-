import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Mindful Prep — Mental Wellness for Exam Students',
    template: '%s | Mindful Prep',
  },
  description:
    'Track mood, stress, sleep and study. Get AI reflections, breathing exercises, and a personalised wellness score.',
  applicationName: 'Mindful Prep',
  keywords: ['mental wellness', 'exam preparation', 'NEET', 'JEE', 'UPSC', 'CAT', 'GATE', 'CUET', 'student'],
  authors: [{ name: 'Mindful Prep' }],
  formatDetection: { email: false, address: false, telephone: false },
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icons/icon-192.svg' },
  openGraph: {
    type: 'website',
    title: 'Mindful Prep — Mental Wellness for Exam Students',
    description: 'Track mood, stress, sleep and study. Open access, no signup, evidence-based.',
    siteName: 'Mindful Prep',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Mindful Prep' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mindful Prep — Mental Wellness for Exam Students',
    description: 'Track mood, stress, sleep and study. Open access, no signup.',
    images: ['/og-image.svg'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e14' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <noscript>
          <div
            role="alert"
            style={{
              padding: '1rem',
              textAlign: 'center',
              background: '#fef3c7',
              color: '#78350f',
              borderBottom: '1px solid #fcd34d',
            }}
          >
            Mindful Prep needs JavaScript enabled for the best experience. Core
            wellness content is still available; dynamic logging and charts
            require JS.
          </div>
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
