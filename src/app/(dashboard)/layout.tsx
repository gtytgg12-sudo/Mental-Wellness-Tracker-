import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Nav } from '@/components/nav';
import { Providers } from '@/components/providers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Nav userName={session.user.name} userEmail={session.user.email ?? undefined} />
        <main id="main-content" className="container flex-1 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          <p>
            Mindful Prep ·{' '}
            <a href="/crisis" className="underline-offset-4 hover:underline">
              Crisis resources
            </a>{' '}
            · Your data is private and encrypted
          </p>
        </footer>
      </div>
    </Providers>
  );
}
