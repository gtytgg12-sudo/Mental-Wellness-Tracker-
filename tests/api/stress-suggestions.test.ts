/**
 * Integration test: stress log + suggestions endpoints.
 * Open-access mode — no 401 gate.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as stressGET, POST as stressPOST } from '@/app/api/stress/route';
import { GET as suggestionsGET } from '@/app/api/suggestions/route';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    getDemoUserId: vi.fn(),
    findStress: vi.fn(),
    findStressToday: vi.fn(),
    createManyStress: vi.fn(),
  },
}));

function makeReq(url: string, body?: unknown) {
  const init: RequestInit = body
    ? { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }
    : {};
  return new Request(url, init);
}

describe('GET /api/stress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns aggregated stats for the demo user', async () => {
    (db.getDemoUserId as ReturnType<typeof vi.fn>).mockResolvedValue('u1');
    (db.findStress as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 's1', trigger: 'EXAM_PRESSURE', intensity: 7, recordedAt: new Date() },
      { id: 's2', trigger: 'EXAM_PRESSURE', intensity: 5, recordedAt: new Date() },
      { id: 's3', trigger: 'LACK_OF_SLEEP', intensity: 8, recordedAt: new Date() },
    ]);
    const res = await stressGET(makeReq('http://x/api/stress?range=7d') as never);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: { stats: Array<{ trigger: string; count: number }> } };
    expect(json.success).toBe(true);
    const examStat = json.data.stats.find((s) => s.trigger === 'EXAM_PRESSURE');
    expect(examStat?.count).toBe(2);
  });
});

describe('POST /api/stress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates stress log entries for the demo user', async () => {
    (db.getDemoUserId as ReturnType<typeof vi.fn>).mockResolvedValue('u1');
    (db.createManyStress as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    const res = await stressPOST(
      makeReq('http://x/api/stress', { triggers: ['EXAM_PRESSURE', 'LACK_OF_SLEEP'], intensity: 7 }) as never,
    );
    expect(res.status).toBe(201);
    expect(db.createManyStress).toHaveBeenCalled();
  });

  it('rejects empty triggers with 400', async () => {
    (db.getDemoUserId as ReturnType<typeof vi.fn>).mockResolvedValue('u1');
    const res = await stressPOST(makeReq('http://x/api/stress', { triggers: [], intensity: 5 }) as never);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/suggestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all six suggestions when no category is specified', async () => {
    (db.getDemoUserId as ReturnType<typeof vi.fn>).mockResolvedValue('u1');
    const res = await suggestionsGET(makeReq('http://x/api/suggestions') as never);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { items: unknown[] } };
    expect(json.data.items.length).toBe(6);
  });

  it('returns one suggestion when category is specified', async () => {
    (db.getDemoUserId as ReturnType<typeof vi.fn>).mockResolvedValue('u1');
    const res = await suggestionsGET(makeReq('http://x/api/suggestions?category=breathing') as never);
    const json = (await res.json()) as { data: { items: Array<{ title: string }> } };
    expect(json.data.items[0]?.title).toContain('Breathing');
  });
});
