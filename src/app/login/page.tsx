import { redirect } from 'next/navigation';

/**
 * Open-access mode. There is no login flow — every visitor shares the
 * demo user. This page exists as a stable URL for shared bookmarks.
 */
export default function LoginPage(): never {
  redirect('/dashboard');
}
