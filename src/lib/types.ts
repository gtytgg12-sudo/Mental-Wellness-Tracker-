/**
 * Domain type definitions.
 * The Prisma schema stores these as `String` columns (SQLite has no native
 * enums), so we re-assert the union here and provide type-guards for
 * untrusted values pulled from the database.
 */

export const MOODS = ['AWFUL', 'LOW', 'NEUTRAL', 'GOOD', 'GREAT'] as const;
export type Mood = (typeof MOODS)[number];

export const STRESS_TRIGGERS = [
  'EXAM_PRESSURE',
  'RESULTS_ANXIETY',
  'FAMILY_EXPECTATIONS',
  'LACK_OF_SLEEP',
  'ACADEMIC_WORKLOAD',
  'PEER_COMPARISON',
  'FINANCIAL_PRESSURE',
  'HEALTH_ISSUES',
  'SOCIAL_ISOLATION',
  'UNCERTAINTY',
] as const;
export type StressTrigger = (typeof STRESS_TRIGGERS)[number];

export const EXAM_TYPES = ['BOARD', 'NEET', 'JEE', 'CUET', 'CAT', 'GATE', 'UPSC', 'OTHER'] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

function isOneOf<T extends readonly string[]>(value: unknown, list: T): value is T[number] {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

export function asMood(v: unknown): Mood | null {
  return isOneOf(v, MOODS) ? v : null;
}
export function asStressTrigger(v: unknown): StressTrigger | null {
  return isOneOf(v, STRESS_TRIGGERS) ? v : null;
}
export function asExamType(v: unknown): ExamType | null {
  return isOneOf(v, EXAM_TYPES) ? v : null;
}
export function asSentiment(v: unknown): Sentiment {
  return isOneOf(v, SENTIMENTS) ? v : 'neutral';
}
