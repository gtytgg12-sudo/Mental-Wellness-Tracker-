import { describe, it, expect, beforeEach } from 'vitest';
import { HeuristicReflectionProvider, _resetReflectionProvider } from '@/lib/ai-reflection';
import { sanitizeText, safeCompare, normalizeKeywords, getClientIp } from '@/lib/security';
import {
  registerSchema,
  loginSchema,
  moodSchema,
  stressLogSchema,
  journalSchema,
} from '@/lib/validation';

describe('security helpers', () => {
  it('sanitizeText strips HTML tags', () => {
    expect(sanitizeText('<script>alert(1)</script>hi')).toBe('hi');
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('sanitizeText removes javascript: and data: URLs', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeText('data:text/html,<h1>x</h1>')).toBe(',x');
    expect(sanitizeText('vbscript:msgbox(1)')).toBe('msgbox(1)');
  });

  it('safeCompare is constant-time-ish', () => {
    expect(safeCompare('abc', 'abc')).toBe(true);
    expect(safeCompare('abc', 'abd')).toBe(false);
    expect(safeCompare('abc', 'abcd')).toBe(false);
  });

  it('normalizeKeywords strips non-alphanumeric', () => {
    expect(normalizeKeywords('Hello! World, Test-123')).toBe('hello world test-123');
  });

  it('getClientIp reads forwarded headers', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
    expect(getClientIp(h)).toBe('1.2.3.4');
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});

describe('validation schemas', () => {
  it('registerSchema requires matching passwords', () => {
    const r = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password2',
    });
    expect(r.success).toBe(false);
  });

  it('registerSchema requires strong password', () => {
    const r = registerSchema.safeParse({
      name: 'Test',
      email: 't@e.com',
      password: 'weak',
      confirmPassword: 'weak',
    });
    expect(r.success).toBe(false);
  });

  it('registerSchema accepts valid input', () => {
    const r = registerSchema.safeParse({
      name: 'Test User',
      email: '  Test@Example.com  ',
      password: 'Password1',
      confirmPassword: 'Password1',
      examType: 'JEE',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe('test@example.com');
    }
  });

  it('loginSchema requires email and password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
  });

  it('moodSchema bounds numeric fields', () => {
    expect(moodSchema.safeParse({ mood: 'GOOD', sleepHours: -1 }).success).toBe(false);
    expect(moodSchema.safeParse({ mood: 'GOOD', studyHours: 30 }).success).toBe(false);
  });

  it('stressLogSchema requires at least one trigger', () => {
    expect(stressLogSchema.safeParse({ triggers: [], intensity: 5 }).success).toBe(false);
    expect(stressLogSchema.safeParse({ triggers: ['EXAM_PRESSURE'], intensity: 11 }).success).toBe(false);
  });

  it('journalSchema enforces length limits', () => {
    expect(journalSchema.safeParse({ content: 'short' }).success).toBe(false);
    expect(journalSchema.safeParse({ content: 'a'.repeat(5001) }).success).toBe(false);
  });
});

describe('ai-reflection (heuristic)', () => {
  beforeEach(() => _resetReflectionProvider());

  it('returns placeholder for very short input', async () => {
    const r = await new HeuristicReflectionProvider().reflect('hi');
    expect(r.text).toMatch(/more sentences/i);
  });

  it('detects negative sentiment for anxious content', async () => {
    const r = await new HeuristicReflectionProvider().reflect(
      'I feel so overwhelmed and anxious about the exam. I cannot focus and I am exhausted.',
    );
    expect(['negative', 'mixed']).toContain(r.sentiment);
    expect(r.text.length).toBeGreaterThan(40);
  });

  it('detects positive sentiment for grateful content', async () => {
    const r = await new HeuristicReflectionProvider().reflect(
      'I am so grateful for my progress today. I feel proud and energized after my study session.',
    );
    expect(r.sentiment).toBe('positive');
  });

  it('extracts keywords', async () => {
    const r = await new HeuristicReflectionProvider().reflect(
      'Studying for the NEET exam is stressful. Sleep is important for focus and memory.',
    );
    expect(r.keywords.length).toBeGreaterThan(0);
    expect(r.keywords.length).toBeLessThanOrEqual(6);
  });
});
