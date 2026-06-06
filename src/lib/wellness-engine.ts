/**
 * Wellness Score Engine.
 *
 * The score (0–100) blends four signals:
 *   • Mood      (30%)  — 1..5 mapped to 0..100
 *   • Stress    (30%)  — intensity 1..10 inverted (lower stress = higher score)
 *   • Sleep     (20%)  — bell curve around the 7–9h optimal range
 *   • Study     (20%)  — bell curve around 4–8h balanced study
 *
 * Pure, deterministic, fully unit-tested.
 */

import type { Mood, StressTrigger } from './types';
import { clamp, mean } from './utils';

export interface WellnessInput {
  /** Latest mood value (or average of last few entries). */
  mood?: Mood | null;
  /** Average stress intensity 1..10 from the last 24h. */
  avgStressIntensity?: number | null;
  /** Hours slept (last night). */
  sleepHours?: number | null;
  /** Hours studied today. */
  studyHours?: number | null;
  /** Optional override weights (must sum to 1). */
  weights?: WellnessWeights;
}

export interface WellnessWeights {
  mood: number;
  stress: number;
  sleep: number;
  study: number;
}

export const DEFAULT_WEIGHTS: WellnessWeights = {
  mood: 0.3,
  stress: 0.3,
  sleep: 0.2,
  study: 0.2,
};

export interface WellnessBreakdown {
  score: number;
  band: WellnessBand;
  components: {
    mood: number;
    stress: number;
    sleep: number;
    study: number;
  };
  weights: WellnessWeights;
  recommendations: string[];
}

export type WellnessBand = 'thriving' | 'balanced' | 'stressed' | 'at-risk';

// ──────────────────────────────────────────────────────────────────────
// Component calculators (each returns 0..100)
// ──────────────────────────────────────────────────────────────────────

const MOOD_SCORES: Record<Mood, number> = {
  AWFUL: 0,
  LOW: 25,
  NEUTRAL: 50,
  GOOD: 80,
  GREAT: 100,
};

export function moodScore(mood: Mood | null | undefined): number {
  if (!mood) return 50; // neutral when missing
  return MOOD_SCORES[mood];
}

/** Stress is inverted: high intensity → low score. */
export function stressScore(avgIntensity: number | null | undefined): number {
  if (avgIntensity == null) return 50;
  const clamped = clamp(avgIntensity, 1, 10);
  return Math.round(100 - (clamped - 1) * (100 / 9));
}

/** Sleep uses a piecewise bell curve peaking at 8h. */
export function sleepScore(hours: number | null | undefined): number {
  if (hours == null) return 50;
  const h = clamp(hours, 0, 24);
  if (h <= 0) return 0;
  if (h >= 12) return 30; // oversleeping is also unhealthy
  // Peak at 8h, falloff 0h→8h and 8h→12h
  if (h <= 8) return Math.round((h / 8) * 100);
  return Math.round(100 - ((h - 8) / 4) * 70);
}

/** Study hours: 0 = bad, 4-8h = optimal, 12h+ = burnout. */
export function studyScore(hours: number | null | undefined): number {
  if (hours == null) return 50;
  const h = clamp(hours, 0, 24);
  if (h === 0) return 30; // no study = low productivity
  if (h < 4) return Math.round(30 + (h / 4) * 50); // 30→80
  if (h <= 8) return 100; // sweet spot
  if (h <= 12) return Math.round(100 - ((h - 8) / 4) * 40); // 100→60
  return Math.max(20, Math.round(60 - ((h - 12) / 12) * 40)); // 60→20
}

// ──────────────────────────────────────────────────────────────────────
// Aggregation
// ──────────────────────────────────────────────────────────────────────

export function classifyScore(score: number): WellnessBand {
  if (score >= 80) return 'thriving';
  if (score >= 60) return 'balanced';
  if (score >= 40) return 'stressed';
  return 'at-risk';
}

const BAND_COPY: Record<WellnessBand, { label: string; color: string; emoji: string }> = {
  thriving: { label: 'Thriving', color: 'text-emerald-600 dark:text-emerald-400', emoji: '🌟' },
  balanced: { label: 'Balanced', color: 'text-sky-600 dark:text-sky-400', emoji: '🌿' },
  stressed: { label: 'Stressed', color: 'text-amber-600 dark:text-amber-400', emoji: '🌧️' },
  'at-risk': { label: 'At risk', color: 'text-rose-600 dark:text-rose-400', emoji: '🆘' },
};

export function bandCopy(band: WellnessBand) {
  return BAND_COPY[band];
}

export function calculateWellness(input: WellnessInput): WellnessBreakdown {
  const weights = input.weights ?? DEFAULT_WEIGHTS;
  const totalWeight = weights.mood + weights.stress + weights.sleep + weights.study;
  if (Math.abs(totalWeight - 1) > 0.001) {
    throw new Error(`Wellness weights must sum to 1 (got ${totalWeight})`);
  }

  const components = {
    mood: moodScore(input.mood),
    stress: stressScore(input.avgStressIntensity ?? null),
    sleep: sleepScore(input.sleepHours ?? null),
    study: studyScore(input.studyHours ?? null),
  };

  const weighted =
    components.mood * weights.mood +
    components.stress * weights.stress +
    components.sleep * weights.sleep +
    components.study * weights.study;

  const score = Math.round(clamp(weighted, 0, 100));
  const band = classifyScore(score);
  const recommendations = generateRecommendations(components, input);

  return { score, band, components, weights, recommendations };
}

// ──────────────────────────────────────────────────────────────────────
// Recommendations
// ──────────────────────────────────────────────────────────────────────

const TRIGGER_TIPS: Record<StressTrigger, string> = {
  EXAM_PRESSURE: 'Try the Pomodoro technique — 25 min study, 5 min break.',
  RESULTS_ANXIETY: 'Remember: one exam does not define your worth or future.',
  FAMILY_EXPECTATIONS: 'Share how you feel with a trusted family member or mentor.',
  LACK_OF_SLEEP: 'Aim for 7–8 hours. Sleep is when memory consolidates.',
  ACADEMIC_WORKLOAD: 'Break large tasks into 30-minute chunks. Small wins compound.',
  PEER_COMPARISON: 'Compare with your past self, not others. Progress > perfection.',
  FINANCIAL_PRESSURE: 'Look into scholarships and fee-waiver programs early.',
  HEALTH_ISSUES: 'See a doctor if symptoms persist. Health is non-negotiable.',
  SOCIAL_ISOLATION: 'Schedule one short call with a friend this week.',
  UNCERTAINTY: 'Focus on what you can control today. Plan, then act.',
};

export function generateRecommendations(
  components: WellnessBreakdown['components'],
  input: WellnessInput = {},
): string[] {
  const recs: string[] = [];

  if (components.stress < 60 && input.avgStressIntensity && input.avgStressIntensity >= 6) {
    recs.push('Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Repeat 4 times.');
  }

  if (components.sleep < 60) {
    if ((input.sleepHours ?? 0) < 6) {
      recs.push('Sleep is critical. Aim to be in bed 30 minutes earlier tonight.');
    } else {
      recs.push('You may be over-sleeping. A consistent wake time helps energy.');
    }
  }

  if (components.study < 60) {
    if ((input.studyHours ?? 0) === 0) {
      recs.push('Even 25 minutes of focused study today counts. Start small.');
    } else if ((input.studyHours ?? 0) > 10) {
      recs.push('Long study sessions hurt retention. Schedule a real break.');
    }
  }

  if (components.mood < 50) {
    recs.push('Write 3 things you are grateful for in your journal tonight.');
  }

  if (recs.length === 0) {
    recs.push("You're doing great. Maintain your routine and check in tomorrow.");
  }

  return recs.slice(0, 4);
}

export function tipsForTrigger(trigger: StressTrigger): string {
  return TRIGGER_TIPS[trigger];
}

export const ALL_TRIGGER_TIPS = TRIGGER_TIPS;

// ──────────────────────────────────────────────────────────────────────
// Aggregations for analytics
// ──────────────────────────────────────────────────────────────────────

export function averageBy<T>(items: T[], selector: (item: T) => number | null | undefined): number {
  const values = items
    .map(selector)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  return Math.round(mean(values));
}
