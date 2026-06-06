import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock auth for the /api routes that need it
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
  hashPassword: vi.fn(),
}));

function makeRequest(body: unknown, ip = '1.2.3.4') {
  return {
    json: async () => body,
    headers: new Headers({
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    }),
  } as unknown as Request;
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user with valid input', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
    });

    const req = makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    });
    const res = await registerPOST(req as never);
    expect(res.status).toBe(201);
    const json = (await res.json()) as { success: boolean; data: { user: { id: string } } };
    expect(json.success).toBe(true);
    expect(json.data.user.id).toBe('user-1');
  });

  it('rejects weak password', async () => {
    const req = makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak',
    });
    const res = await registerPOST(req as never);
    expect(res.status).toBe(400);
  });

  it('rejects mismatched passwords', async () => {
    const req = makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password2',
    });
    const res = await registerPOST(req as never);
    expect(res.status).toBe(400);
  });

  it('rejects duplicate email with 409', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'existing',
      email: 'test@example.com',
    });
    const req = makeRequest({
      name: 'Test',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    });
    const res = await registerPOST(req as never);
    expect(res.status).toBe(409);
  });

  it('rejects invalid JSON with 400', async () => {
    const req = {
      json: async () => {
        throw new Error('bad json');
      },
      headers: new Headers({ 'x-forwarded-for': '1.2.3.4' }),
    } as unknown as Request;
    const res = await registerPOST(req as never);
    expect(res.status).toBe(400);
  });
});
