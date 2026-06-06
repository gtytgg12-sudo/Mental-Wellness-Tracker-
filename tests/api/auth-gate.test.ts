/**
 * Integration test: API endpoints in open-access mode.
 * Verifies validation, persistence, and the aggregated analytics shape.
 * (The app is open-access for the hackathon demo, so there are no 401 gates.)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET as moodGET, POST as moodPOST } from '@/app/api/mood/route';
import { GET as wellnessGET } from '@/app/api/wellness/route';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    getDemoUserId: vi.fn(),
    findMoods: vi.fn(),
    findLatestMoodToday: vi.fn(),
    findRecentMoods: vi.fn(),
    createMood: vi.fn(),
    findStressToday: vi.fn(),
    createManyStress: vi.fn(),
    findWellness: vi.fn(),
    createWellness: vi.fn(),
  },
}));

function url(path: string) {
  return new Request(`http://localhost${path}`, { method: 'GET' });
}

function jsonRequest(urlPath: string, body: unknown) {
  return new Request(`http://localhost${urlPath}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API mood + wellness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.getDemoUserId as ReturnType<typeof vi.fn>).mockResolvedValue('u1');
  });

  it('GET /api/mood returns 200 with the demo user entries', async () => {
    (db.findMoods as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'm1', mood: 'GOOD', recordedAt: new Date() },
    ]);
    const res = await moodGET(url('/api/mood') as never);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: { entries: unknown[] } };
    expect(json.success).toBe(true);
    expect(json.data.entries).toHaveLength(1);
  });

  it('GET /api/wellness returns 200 with score components', async () => {
    (db.findLatestMoodToday as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (db.findStressToday as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.findRecentMoods as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.findWellness as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.createWellness as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const res = await wellnessGET(url('/api/wellness') as never);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      success: boolean;
      data: { today: { score: number; components: { mood: number; stress: number; sleep: number; study: number } } };
    };
    expect(json.success).toBe(true);
    expect(json.data.today.components).toBeDefined();
  });

  it('POST /api/mood returns 400 on invalid body', async () => {
    const res = await moodPOST(jsonRequest('/api/mood', { mood: 'NOT_A_MOOD' }) as never);
    expect(res.status).toBe(400);
  });

  it('POST /api/mood creates an entry for the demo user', async () => {
    (db.createMood as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'm1', mood: 'GOOD' });
    (db.findLatestMoodToday as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (db.findStressToday as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.createWellness as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const res = await moodPOST(jsonRequest('/api/mood', { mood: 'GOOD' }) as never);
    expect(res.status).toBe(201);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(true);
    expect(db.createMood).toHaveBeenCalled();
  });

  it('POST /api/mood also persists stress triggers when provided', async () => {
    (db.createMood as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'm1', mood: 'GOOD' });
    (db.findLatestMoodToday as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (db.findStressToday as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.createManyStress as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (db.createWellness as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const res = await moodPOST(
      jsonRequest('/api/mood', { mood: 'GOOD', triggers: ['EXAM_PRESSURE'], intensity: 7 }) as never,
    );
    expect(res.status).toBe(201);
    expect(db.createManyStress).toHaveBeenCalled();
  });
});
