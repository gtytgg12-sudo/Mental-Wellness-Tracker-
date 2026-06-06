/**
 * Client-side cache for the open-access demo.
 *
 * Server data lives in an in-memory store and resets on cold start.
 * To make the demo feel real, every write is mirrored to localStorage
 * and read on the client before server data is fetched.
 *
 * The cache is best-effort: malformed entries are dropped silently.
 */

const KEY = 'mwt:cache:v1';

export interface CacheShape {
  moods: Array<{ id: string; mood: string; note: string | null; sleepHours: number | null; studyHours: number | null; recordedAt: string }>;
  stress: Array<{ id: string; trigger: string; intensity: number; recordedAt: string }>;
  journal: Array<{ id: string; content: string; aiReflection: string | null; sentiment: string | null; keywords: string[]; createdAt: string }>;
  wellness: Array<{ id: string; score: number; computedFor: string }>;
}

const EMPTY: CacheShape = { moods: [], stress: [], journal: [], wellness: [] };

function safeRead(): CacheShape {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<CacheShape>;
    return {
      moods: Array.isArray(parsed.moods) ? parsed.moods : [],
      stress: Array.isArray(parsed.stress) ? parsed.stress : [],
      journal: Array.isArray(parsed.journal) ? parsed.journal : [],
      wellness: Array.isArray(parsed.wellness) ? parsed.wellness : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function safeWrite(shape: CacheShape): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(shape));
  } catch {
    /* quota or private mode — ignore */
  }
}

export const clientCache = {
  read(): CacheShape {
    return safeRead();
  },
  write(shape: CacheShape): void {
    safeWrite(shape);
  },
  appendMood(entry: CacheShape['moods'][number]): void {
    const data = safeRead();
    data.moods.unshift(entry);
    safeWrite(data);
  },
  appendStress(entries: CacheShape['stress']): void {
    const data = safeRead();
    data.stress.unshift(...entries);
    safeWrite(data);
  },
  appendJournal(entry: CacheShape['journal'][number]): void {
    const data = safeRead();
    data.journal.unshift(entry);
    safeWrite(data);
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
  },
};
