/**
 * Integration test: API authentication gate.
 * Verifies that protected routes return 401 when no session is present
 * and that validation works correctly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET as moodGET, POST as moodPOST } from '@/app/api/mood/route';
import { GET as wellnessGET } from '@/app/api/wellness/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    moodEntry: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    stressLog: { findMany: vi.fn(), createMany: vi.fn() },
    wellnessMetric: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

function url(path: string) {
  return new Request(`http://localhost${path}`, { method: 'GET' });
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/mood', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API auth gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/mood returns 401 when unauthenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await moodGET(url('/api/mood') as never);
    expect(res.status).toBe(401);
  });

  it('GET /api/wellness returns 401 when unauthenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await wellnessGET(url('/api/wellness') as never);
    expect(res.status).toBe(401);
  });

  it('POST /api/mood returns 400 on invalid body', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'u1' } });
    const res = await moodPOST(jsonRequest({ mood: 'NOT_A_MOOD' }) as never);
    expect(res.status).toBe(400);
  });

  it('POST /api/mood creates an entry for an authenticated user', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.moodEntry.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'm1',
      mood: 'GOOD',
    });
    (prisma.moodEntry.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.stressLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.wellnessMetric.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const res = await moodPOST(jsonRequest({ mood: 'GOOD' }) as never);
    expect(res.status).toBe(201);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(true);
  });
});
