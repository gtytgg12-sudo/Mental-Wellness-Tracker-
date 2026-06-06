/**
 * In-memory data store. Fallback for serverless deployments where the
 * SQLite file is ephemeral (e.g. Vercel). Data does NOT persist across
 * cold starts, but the app remains fully functional for demos.
 */

import type { MoodEntry, StressLog, JournalEntry, WellnessMetric } from '@prisma/client';
import { randomUUID } from 'node:crypto';

interface MemoryStore {
  users: Map<string, { id: string; email: string; name: string | null; examType: string | null }>;
  moods: MoodEntry[];
  stressLogs: StressLog[];
  journal: JournalEntry[];
  wellness: WellnessMetric[];
}

declare global {
  // eslint-disable-next-line no-var
  var __mwMemoryStore: MemoryStore | undefined;
}

function getStore(): MemoryStore {
  if (!globalThis.__mwMemoryStore) {
    globalThis.__mwMemoryStore = {
      users: new Map(),
      moods: [],
      stressLogs: [],
      journal: [],
      wellness: [],
    };
    seedDemoData(globalThis.__mwMemoryStore);
  }
  return globalThis.__mwMemoryStore;
}

function seedDemoData(store: MemoryStore): void {
  const userId = 'demo-user-1';
  store.users.set(userId, {
    id: userId,
    email: 'demo@mindfulprep.app',
    name: 'Demo Student',
    examType: 'JEE',
  });

  const MOOD_CYCLE = ['GOOD', 'NEUTRAL', 'GREAT', 'LOW', 'GOOD', 'GREAT', 'NEUTRAL'] as const;
  const TRIGGERS = ['EXAM_PRESSURE', 'ACADEMIC_WORKLOAD', 'LACK_OF_SLEEP'] as const;
  const MOOD_VALUE: Record<string, number> = { AWFUL: 1, LOW: 2, NEUTRAL: 3, GOOD: 4, GREAT: 5 };

  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now - i * 24 * 60 * 60 * 1000);
    const mood = MOOD_CYCLE[i % MOOD_CYCLE.length]!;
    const sleep = 5 + Math.random() * 3;
    const study = 3 + Math.random() * 5;
    const score = Math.round(
      MOOD_VALUE[mood]! * 18 +
        (10 - (i % 5)) * 4 +
        Math.min(sleep, 8) * 4 +
        Math.min(study, 8) * 3,
    );
    store.moods.push({
      id: randomUUID(),
      userId,
      mood,
      note: null,
      sleepHours: Math.round(sleep * 10) / 10,
      studyHours: Math.round(study * 10) / 10,
      recordedAt: day,
      createdAt: day,
    });
    if (i % 3 === 0) {
      store.stressLogs.push({
        id: randomUUID(),
        userId,
        trigger: TRIGGERS[i % TRIGGERS.length]!,
        intensity: 4 + (i % 5),
        recordedAt: day,
      });
    }
    store.wellness.push({
      id: randomUUID(),
      userId,
      score: Math.max(20, Math.min(95, score)),
      moodComponent: MOOD_VALUE[mood]! * 20,
      stressComponent: 60 + (i % 30),
      sleepComponent: Math.round(sleep * 12),
      studyComponent: Math.round(Math.min(study, 8) * 12),
      computedFor: day,
    });
  }
}

// ── Public API ──────────────────────────────────────────────────────

export const memoryDb = {
  async getDemoUserId(): Promise<string> {
    const store = getStore();
    let user = store.users.get('demo-user-1');
    if (!user) {
      user = { id: 'demo-user-1', email: 'demo@mindfulprep.app', name: 'Demo Student', examType: 'JEE' };
      store.users.set(user.id, user);
    }
    return user.id;
  },

  // Mood
  async createMood(data: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<MoodEntry> {
    const store = getStore();
    const entry: MoodEntry = { ...data, id: randomUUID(), createdAt: new Date() };
    store.moods.push(entry);
    return entry;
  },
  async findMoods(userId: string, since: Date, take = 200): Promise<MoodEntry[]> {
    return getStore()
      .moods.filter((m) => m.userId === userId && m.recordedAt >= since)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, take);
  },
  async findLatestMoodToday(userId: string, dayStart: Date, dayEnd: Date): Promise<MoodEntry | null> {
    const matches = getStore().moods
      .filter((m) => m.userId === userId && m.recordedAt >= dayStart && m.recordedAt < dayEnd)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    return matches[0] ?? null;
  },
  async findRecentMoods(userId: string, since: Date, take: number): Promise<MoodEntry[]> {
    return getStore()
      .moods.filter((m) => m.userId === userId && m.recordedAt >= since)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, take);
  },

  // Stress
  async createManyStress(entries: Array<Omit<StressLog, 'id'>>): Promise<number> {
    const store = getStore();
    for (const e of entries) store.stressLogs.push({ ...e, id: randomUUID() });
    return entries.length;
  },
  async findStressToday(userId: string, dayStart: Date, dayEnd: Date): Promise<StressLog[]> {
    return getStore().stressLogs.filter(
      (s) => s.userId === userId && s.recordedAt >= dayStart && s.recordedAt < dayEnd,
    );
  },
  async findStress(userId: string, since: Date): Promise<StressLog[]> {
    return getStore()
      .stressLogs.filter((s) => s.userId === userId && s.recordedAt >= since)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  },

  // Journal
  async createJournal(data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const store = getStore();
    const entry: JournalEntry = { ...data, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    store.journal.unshift(entry);
    return entry;
  },
  async findJournal(userId: string, since?: Date, take = 100): Promise<JournalEntry[]> {
    let list = getStore().journal.filter((j) => j.userId === userId);
    if (since) list = list.filter((j) => j.createdAt >= since);
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, take);
  },

  // Wellness
  async createWellness(data: Omit<WellnessMetric, 'id'>): Promise<WellnessMetric> {
    const store = getStore();
    const entry: WellnessMetric = { ...data, id: randomUUID() };
    store.wellness.push(entry);
    return entry;
  },
  async findWellness(userId: string, since?: Date, take = 30): Promise<WellnessMetric[]> {
    let list = getStore().wellness.filter((w) => w.userId === userId);
    if (since) list = list.filter((w) => w.computedFor >= since);
    return list.sort((a, b) => b.computedFor.getTime() - a.computedFor.getTime()).slice(0, take);
  },
};
