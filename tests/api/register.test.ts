/**
 * The /api/auth/register route was removed in open-access mode
 * (no sign-up needed). The /login and /register pages now redirect
 * to /dashboard. This file remains as a regression guard for the
 * redirect behaviour.
 */
import { describe, it, expect, vi } from 'vitest';
import { redirect } from 'next/navigation';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('Open-access redirect', () => {
  it('login page redirects to /dashboard', () => {
    LoginPage();
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('register page redirects to /dashboard', () => {
    RegisterPage();
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
});
