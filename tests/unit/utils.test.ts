import { describe, it, expect } from 'vitest';
import { cn, clamp, mean, toDateKey, startOfDay, startOfWeek, formatRelative } from '@/lib/utils';

describe('utils', () => {
  it('cn merges classes and resolves conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', false && 'hidden', 'text-blue-500')).toContain('text-blue-500');
  });

  it('clamp enforces bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('mean handles empty and non-empty arrays', () => {
    expect(mean([])).toBe(0);
    expect(mean([2, 4, 6])).toBe(4);
  });

  it('toDateKey returns YYYY-MM-DD', () => {
    const d = new Date('2025-06-07T10:00:00Z');
    const key = toDateKey(d);
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('startOfDay zeroes time', () => {
    const d = new Date('2025-06-07T15:34:22');
    const s = startOfDay(d);
    expect(s.getHours()).toBe(0);
    expect(s.getMinutes()).toBe(0);
    expect(s.getSeconds()).toBe(0);
  });

  it('startOfWeek returns a Monday', () => {
    const s = startOfWeek(new Date('2025-06-11T12:00:00'));
    expect(s.getDay()).toBe(1);
  });

  it('formatRelative returns human strings', () => {
    const now = new Date();
    expect(formatRelative(now)).toBe('just now');
    expect(formatRelative(new Date(now.getTime() - 5 * 60_000))).toMatch(/5m ago/);
  });
});
