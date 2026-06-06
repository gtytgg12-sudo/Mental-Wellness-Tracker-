import { redirect } from 'next/navigation';

/**
 * Open-access mode. There is no signup flow — the demo user is
 * provisioned automatically on the first request. This page exists as
 * a stable URL for shared bookmarks.
 */
export default function RegisterPage(): never {
  redirect('/dashboard');
}
