import { describe, it, expect } from 'vitest';
import {
  calculateWellness,
  classifyScore,
  moodScore,
  stressScore,
  sleepScore,
  studyScore,
  bandCopy,
  tipsForTrigger,
  generateRecommendations,
} from '@/lib/wellness-engine';

describe('wellness-engine — edge cases', () => {
  it('handles a perfect day at the 8h study sweet spot', () => {
    const r = calculateWellness({ mood: 'GREAT', avgStressIntensity: 1, sleepHours: 8, studyHours: 6 });
    expect(r.score).toBe(100);
    expect(r.band).toBe('thriving');
  });

  it('clamps extremely low inputs', () => {
    expect(moodScore('AWFUL')).toBe(0);
    const r = calculateWellness({ mood: 'AWFUL', avgStressIntensity: 10, sleepHours: 0, studyHours: 0 });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(20);
    expect(r.band).toBe('at-risk');
  });

  it('flags over-studying as burnout territory', () => {
    const r = calculateWellness({ mood: 'NEUTRAL', avgStressIntensity: 7, sleepHours: 7, studyHours: 13 });
    expect(r.components.study).toBeLessThan(60);
  });

  it('penalises oversleeping', () => {
    expect(sleepScore(14)).toBeLessThan(50);
  });

  it('inverts stress — high stress = low score', () => {
    expect(stressScore(10)).toBeLessThan(stressScore(1));
  });

  it('classifies all four score bands', () => {
    expect(classifyScore(95)).toBe('thriving');
    expect(classifyScore(70)).toBe('balanced');
    expect(classifyScore(50)).toBe('stressed');
    expect(classifyScore(20)).toBe('at-risk');
  });

  it('returns every stress trigger tip', () => {
    const triggers = [
      'EXAM_PRESSURE', 'RESULTS_ANXIETY', 'FAMILY_EXPECTATIONS',
      'LACK_OF_SLEEP', 'ACADEMIC_WORKLOAD', 'PEER_COMPARISON',
      'FINANCIAL_PRESSURE', 'HEALTH_ISSUES', 'SOCIAL_ISOLATION', 'UNCERTAINTY',
    ] as const;
    for (const t of triggers) {
      expect(tipsForTrigger(t).length).toBeGreaterThan(10);
    }
  });

  it('returns a recommendation list capped at four', () => {
    const recs = generateRecommendations(
      { mood: 10, stress: 10, sleep: 10, study: 10 },
      { avgStressIntensity: 9, sleepHours: 3, studyHours: 14 },
    );
    expect(recs.length).toBeLessThanOrEqual(4);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('exposes band copy for every band', () => {
    for (const b of ['thriving', 'balanced', 'stressed', 'at-risk'] as const) {
      const c = bandCopy(b);
      expect(c.emoji).toBeTruthy();
      expect(c.label).toBeTruthy();
    }
  });

  it('handles missing inputs with a neutral score of ~50', () => {
    const r = calculateWellness({});
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(r.score).toBeLessThanOrEqual(60);
  });
});
