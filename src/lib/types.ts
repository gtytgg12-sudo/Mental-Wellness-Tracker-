/**
 * Domain types.
 *
 * Defined as TypeScript unions (not Prisma enums) so they work with
 * SQLite while keeping strict, autocomplete-friendly types in the app.
 * The same string sets are enforced at the API boundary by Zod schemas
 * in src/lib/validation.ts.
 */

export const MOOD_VALUES = ['AWFUL', 'LOW', 'NEUTRAL', 'GOOD', 'GREAT'] as const;
export type Mood = (typeof MOOD_VALUES)[number];

export const STRESS_TRIGGER_VALUES = [
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
export type StressTrigger = (typeof STRESS_TRIGGER_VALUES)[number];

export const EXAM_TYPE_VALUES = [
  'BOARD',
  'NEET',
  'JEE',
  'CUET',
  'CAT',
  'GATE',
  'UPSC',
  'OTHER',
] as const;
export type ExamType = (typeof EXAM_TYPE_VALUES)[number];

export const SENTIMENT_VALUES = ['positive', 'neutral', 'negative', 'mixed'] as const;
export type Sentiment = (typeof SENTIMENT_VALUES)[number];

/**
 * Type guards for converting DB strings (Prisma returns plain string
 * when using SQLite) into the strict union types defined above.
 * Each function returns `undefined` for invalid values so callers can
 * degrade gracefully instead of throwing.
 */
export function asMood(value: string | null | undefined): Mood | undefined {
  return isOneOf(value, MOOD_VALUES);
}

export function asStressTrigger(value: string | null | undefined): StressTrigger | undefined {
  return isOneOf(value, STRESS_TRIGGER_VALUES);
}

export function asExamType(value: string | null | undefined): ExamType | undefined {
  return isOneOf(value, EXAM_TYPE_VALUES);
}

export function asSentiment(value: string | null | undefined): Sentiment | undefined {
  return isOneOf(value, SENTIMENT_VALUES);
}

function isOneOf<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | undefined {
  if (value == null) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}
