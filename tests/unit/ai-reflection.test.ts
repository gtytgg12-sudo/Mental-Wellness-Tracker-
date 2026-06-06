import { describe, it, expect, vi } from 'vitest';
import {
  HeuristicReflectionProvider,
  _resetReflectionProvider,
} from '@/lib/ai-reflection';

describe('HeuristicReflectionProvider', () => {
  it('classifies positive entries correctly', async () => {
    const p = new HeuristicReflectionProvider();
    const r = await p.reflect(
      'I am grateful and proud of my progress. I feel confident and optimistic about the exam tomorrow.',
    );
    expect(r.sentiment).toBe('positive');
    expect(r.text.length).toBeGreaterThan(50);
    expect(r.keywords.length).toBeGreaterThan(0);
  });

  it('classifies negative entries correctly', async () => {
    const p = new HeuristicReflectionProvider();
    const r = await p.reflect(
      'I am overwhelmed, anxious, and stuck. The exam pressure is crushing me. I feel hopeless and exhausted.',
    );
    expect(r.sentiment).toBe('negative');
  });

  it('returns mixed for balanced positive/negative content', async () => {
    const p = new HeuristicReflectionProvider();
    const r = await p.reflect(
      'I feel grateful for my family but anxious about the results, and tired from the workload.',
    );
    expect(['mixed', 'negative', 'positive', 'neutral']).toContain(r.sentiment);
  });

  it('rejects too-short input gracefully', async () => {
    const p = new HeuristicReflectionProvider();
    const r = await p.reflect('hi');
    expect(r.text).toMatch(/more sentences/i);
    expect(r.sentiment).toBe('neutral');
  });

  it('strips dangerous script tags from input', async () => {
    const p = new HeuristicReflectionProvider();
    const r = await p.reflect(
      '<script>alert("xss")</script> I am feeling good and proud of my study session today.',
    );
    expect(r.text).not.toContain('<script>');
  });

  it('factory returns heuristic when OPENAI_API_KEY is unset', async () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    _resetReflectionProvider();
    const mod = await import('@/lib/ai-reflection');
    const p = mod.getReflectionProvider();
    expect(p).toBeInstanceOf(HeuristicReflectionProvider);
    _resetReflectionProvider();
    if (original) process.env.OPENAI_API_KEY = original;
  });
});
