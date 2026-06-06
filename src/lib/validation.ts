import { z } from 'zod';

// ──────────────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name must be at most 80 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(254, 'Email is too long'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string(),
    examType: z.enum(['BOARD', 'NEET', 'JEE', 'CUET', 'CAT', 'GATE', 'UPSC', 'OTHER']).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ──────────────────────────────────────────────────────────────────────
// Mood
// ──────────────────────────────────────────────────────────────────────

export const moodSchema = z.object({
  mood: z.enum(['AWFUL', 'LOW', 'NEUTRAL', 'GOOD', 'GREAT']),
  note: z
    .string()
    .trim()
    .max(500, 'Note must be 500 characters or fewer')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  sleepHours: z
    .number()
    .min(0, 'Sleep cannot be negative')
    .max(24, 'Sleep cannot exceed 24 hours')
    .optional(),
  studyHours: z
    .number()
    .min(0, 'Study hours cannot be negative')
    .max(24, 'Study hours cannot exceed 24 hours')
    .optional(),
});

export type MoodInput = z.infer<typeof moodSchema>;

// ──────────────────────────────────────────────────────────────────────
// Stress
// ──────────────────────────────────────────────────────────────────────

export const stressLogSchema = z.object({
  triggers: z
    .array(
      z.enum([
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
      ]),
    )
    .min(1, 'Select at least one trigger')
    .max(10, 'Select at most 10 triggers'),
  intensity: z
    .number()
    .int('Intensity must be a whole number')
    .min(1, 'Intensity must be at least 1')
    .max(10, 'Intensity must be at most 10'),
});

export type StressLogInput = z.infer<typeof stressLogSchema>;

// ──────────────────────────────────────────────────────────────────────
// Journal
// ──────────────────────────────────────────────────────────────────────

export const journalSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, 'Write at least 10 characters to get a meaningful reflection')
    .max(5000, 'Entry is too long (max 5000 characters)'),
});

export type JournalInput = z.infer<typeof journalSchema>;

// ──────────────────────────────────────────────────────────────────────
// Query helpers
// ──────────────────────────────────────────────────────────────────────

export const rangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d']).default('7d'),
});

export type RangeInput = z.infer<typeof rangeSchema>;
