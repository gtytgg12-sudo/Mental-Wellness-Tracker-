/**
 * Data layer — tries Prisma (SQLite/Postgres) first and falls back to
 * in-memory storage if the database is unavailable. This lets the app
 * run on serverless platforms where the SQLite file is ephemeral.
 */

import { prisma } from './prisma';
import { memoryDb } from './memory-db';
import type { MoodEntry, StressLog, JournalEntry, WellnessMetric } from '@prisma/client';
import { Prisma } from '@prisma/client';

let prismaBroken = false;

async function tryPrisma<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (prismaBroken) return fallback();
  try {
    return await fn();
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientInitializationError ||
      (err instanceof Error && /database|datasource|sqlite|file/i.test(err.message))
    ) {
      console.warn('[db] Prisma unavailable, using in-memory store:', (err as Error).message);
      prismaBroken = true;
      return fallback();
    }
    throw err;
  }
}

export const db = {
  async getDemoUserId(): Promise<string> {
    return tryPrisma(
      async () => {
        const DEMO_EMAIL = 'demo@mindfulprep.app';
        const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.user.create({
          data: { email: DEMO_EMAIL, name: 'Demo Student', examType: 'JEE', onboardedAt: new Date() },
          select: { id: true },
        });
        return created.id;
      },
      () => memoryDb.getDemoUserId(),
    );
  },

  // ── Mood ───────────────────────────────────────────────
  async createMood(data: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<MoodEntry> {
    return tryPrisma(
      () => prisma.moodEntry.create({ data }) as Promise<MoodEntry>,
      () => memoryDb.createMood(data),
    );
  },
  async findMoods(userId: string, since: Date, take = 200): Promise<MoodEntry[]> {
    return tryPrisma(
      () => prisma.moodEntry.findMany({ where: { userId, recordedAt: { gte: since } }, orderBy: { recordedAt: 'desc' }, take }) as Promise<MoodEntry[]>,
      () => memoryDb.findMoods(userId, since, take),
    );
  },
  async findLatestMoodToday(userId: string, dayStart: Date, dayEnd: Date): Promise<MoodEntry | null> {
    return tryPrisma(
      async () => (await prisma.moodEntry.findFirst({ where: { userId, recordedAt: { gte: dayStart, lt: dayEnd } }, orderBy: { recordedAt: 'desc' } })) as MoodEntry | null,
      () => memoryDb.findLatestMoodToday(userId, dayStart, dayEnd),
    );
  },
  async findRecentMoods(userId: string, since: Date, take: number): Promise<MoodEntry[]> {
    return tryPrisma(
      () => prisma.moodEntry.findMany({ where: { userId, recordedAt: { gte: since } }, orderBy: { recordedAt: 'desc' }, take }) as Promise<MoodEntry[]>,
      () => memoryDb.findRecentMoods(userId, since, take),
    );
  },

  // ── Stress ─────────────────────────────────────────────
  async createManyStress(entries: Array<Omit<StressLog, 'id'>>): Promise<number> {
    return tryPrisma(
      async () => {
        await prisma.stressLog.createMany({ data: entries });
        return entries.length;
      },
      () => memoryDb.createManyStress(entries),
    );
  },
  async findStressToday(userId: string, dayStart: Date, dayEnd: Date): Promise<StressLog[]> {
    return tryPrisma(
      () => prisma.stressLog.findMany({ where: { userId, recordedAt: { gte: dayStart, lt: dayEnd } } }) as Promise<StressLog[]>,
      () => memoryDb.findStressToday(userId, dayStart, dayEnd),
    );
  },
  async findStress(userId: string, since: Date): Promise<StressLog[]> {
    return tryPrisma(
      () => prisma.stressLog.findMany({ where: { userId, recordedAt: { gte: since } }, orderBy: { recordedAt: 'desc' } }) as Promise<StressLog[]>,
      () => memoryDb.findStress(userId, since),
    );
  },

  // ── Journal ─────────────────────────────────────────────
  async createJournal(data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    return tryPrisma(
      () => prisma.journalEntry.create({ data }) as Promise<JournalEntry>,
      () => memoryDb.createJournal(data),
    );
  },
  async findJournal(userId: string, since?: Date, take = 100): Promise<JournalEntry[]> {
    return tryPrisma(
      () => {
        const where: Record<string, unknown> = { userId };
        if (since) where.createdAt = { gte: since };
        return prisma.journalEntry.findMany({ where, orderBy: { createdAt: 'desc' }, take }) as Promise<JournalEntry[]>;
      },
      () => memoryDb.findJournal(userId, since, take),
    );
  },

  // ── Wellness ───────────────────────────────────────────
  async createWellness(data: Omit<WellnessMetric, 'id'>): Promise<WellnessMetric> {
    return tryPrisma(
      () => prisma.wellnessMetric.create({ data }) as Promise<WellnessMetric>,
      () => memoryDb.createWellness(data),
    );
  },
  async findWellness(userId: string, since?: Date, take = 30): Promise<WellnessMetric[]> {
    return tryPrisma(
      () => {
        const where: Record<string, unknown> = { userId };
        if (since) where.computedFor = { gte: since };
        return prisma.wellnessMetric.findMany({ where, orderBy: { computedFor: 'desc' }, take }) as Promise<WellnessMetric[]>;
      },
      () => memoryDb.findWellness(userId, since, take),
    );
  },
};
