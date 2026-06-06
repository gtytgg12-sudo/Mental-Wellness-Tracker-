import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main id="main-content" className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We couldn&apos;t find what you were looking for. Let&apos;s get you back to safety.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/crisis">Crisis resources</Link>
        </Button>
      </div>
    </main>
  );
}
