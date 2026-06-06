import { describe, it, expect } from 'vitest';
import {
  moodScore,
  stressScore,
  sleepScore,
  studyScore,
  calculateWellness,
  classifyScore,
  generateRecommendations,
  bandCopy,
  tipsForTrigger,
  DEFAULT_WEIGHTS,
} from '@/lib/wellness-engine';
import { clamp, mean, toDateKey, startOfDay, startOfWeek } from '@/lib/utils';

describe('wellness-engine — component scores', () => {
  it('moodScore maps each Mood to expected range', () => {
    expect(moodScore('AWFUL')).toBe(0);
    expect(moodScore('LOW')).toBe(25);
    expect(moodScore('NEUTRAL')).toBe(50);
    expect(moodScore('GOOD')).toBe(80);
    expect(moodScore('GREAT')).toBe(100);
    expect(moodScore(null)).toBe(50);
  });

  it('stressScore inverts intensity 1..10', () => {
    expect(stressScore(1)).toBe(100);
    expect(stressScore(10)).toBe(0);
    expect(stressScore(5.5)).toBeGreaterThan(40);
    expect(stressScore(5.5)).toBeLessThan(50);
    expect(stressScore(null)).toBe(50);
  });

  it('sleepScore peaks around 8h', () => {
    expect(sleepScore(0)).toBe(0);
    expect(sleepScore(8)).toBe(100);
    expect(sleepScore(6)).toBeGreaterThan(70);
    expect(sleepScore(12)).toBeLessThan(40);
    expect(sleepScore(null)).toBe(50);
  });

  it('studyScore rewards 4-8h and penalises extremes', () => {
    expect(studyScore(0)).toBe(30);
    expect(studyScore(6)).toBe(100);
    expect(studyScore(10)).toBeLessThan(80);
    expect(studyScore(20)).toBeLessThanOrEqual(20);
  });

  it('classifyScore maps ranges to bands', () => {
    expect(classifyScore(90)).toBe('thriving');
    expect(classifyScore(70)).toBe('balanced');
    expect(classifyScore(50)).toBe('stressed');
    expect(classifyScore(20)).toBe('at-risk');
  });

  it('bandCopy returns labels for every band', () => {
    (['thriving', 'balanced', 'stressed', 'at-risk'] as const).forEach((b) => {
      expect(bandCopy(b).label).toBeTruthy();
      expect(bandCopy(b).color).toBeTruthy();
    });
  });
});

describe('wellness-engine — calculateWellness', () => {
  it('produces weighted score in 0..100', () => {
    const r = calculateWellness({
      mood: 'GOOD',
      avgStressIntensity: 4,
      sleepHours: 7,
      studyHours: 5,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.band).toMatch(/thriving|balanced|stressed|at-risk/);
  });

  it('default weights sum to 1', () => {
    const sum = DEFAULT_WEIGHTS.mood + DEFAULT_WEIGHTS.stress + DEFAULT_WEIGHTS.sleep + DEFAULT_WEIGHTS.study;
    expect(sum).toBeCloseTo(1, 5);
  });

  it('throws on invalid weights', () => {
    expect(() =>
      calculateWellness({
        mood: 'NEUTRAL',
        weights: { mood: 0.5, stress: 0.5, sleep: 0, study: 0 },
      }),
    ).toThrow();
  });

  it('handles all null inputs gracefully', () => {
    const r = calculateWellness({});
    expect(r.score).toBe(50);
    expect(r.components.mood).toBe(50);
  });

  it('generates recommendations for poor sleep', () => {
    const r = generateRecommendations({ mood: 50, stress: 50, sleep: 20, study: 50 });
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((x) => /sleep/i.test(x))).toBe(true);
  });

  it('tipsForTrigger returns content for every known trigger', () => {
    const triggers = [
      'EXAM_PRESSURE', 'RESULTS_ANXIETY', 'FAMILY_EXPECTATIONS', 'LACK_OF_SLEEP',
      'ACADEMIC_WORKLOAD', 'PEER_COMPARISON', 'FINANCIAL_PRESSURE', 'HEALTH_ISSUES',
      'SOCIAL_ISOLATION', 'UNCERTAINTY',
    ] as const;
    for (const t of triggers) {
      expect(tipsForTrigger(t)).toBeTruthy();
      expect(tipsForTrigger(t).length).toBeGreaterThan(10);
    }
  });
});
