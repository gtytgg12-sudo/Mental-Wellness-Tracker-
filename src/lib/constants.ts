import type { Mood, StressTrigger } from '@prisma/client';

export const MOODS: Array<{
  value: Mood;
  label: string;
  emoji: string;
  description: string;
  ariaLabel: string;
}> = [
  { value: 'AWFUL', label: 'Awful', emoji: '😣', description: 'Struggling today', ariaLabel: 'Awful, struggling today' },
  { value: 'LOW', label: 'Low', emoji: '😕', description: 'A bit down', ariaLabel: 'Low, a bit down' },
  { value: 'NEUTRAL', label: 'Neutral', emoji: '😐', description: 'Okay, neutral', ariaLabel: 'Neutral, okay' },
  { value: 'GOOD', label: 'Good', emoji: '🙂', description: 'Feeling good', ariaLabel: 'Good, feeling good' },
  { value: 'GREAT', label: 'Great', emoji: '😄', description: 'Feeling great', ariaLabel: 'Great, feeling great' },
];

export const STRESS_TRIGGERS: Array<{
  value: StressTrigger;
  label: string;
  emoji: string;
  description: string;
}> = [
  { value: 'EXAM_PRESSURE', label: 'Exam Pressure', emoji: '📚', description: 'Upcoming exams feel heavy' },
  { value: 'RESULTS_ANXIETY', label: 'Results Anxiety', emoji: '📈', description: 'Worrying about scores or rank' },
  { value: 'FAMILY_EXPECTATIONS', label: 'Family Expectations', emoji: '👨\u200d👩\u200d👧', description: 'Pressure from family' },
  { value: 'LACK_OF_SLEEP', label: 'Lack of Sleep', emoji: '😴', description: 'Not sleeping enough' },
  { value: 'ACADEMIC_WORKLOAD', label: 'Academic Workload', emoji: '📖', description: 'Too much to study' },
  { value: 'PEER_COMPARISON', label: 'Peer Comparison', emoji: '👥', description: 'Comparing to others' },
  { value: 'FINANCIAL_PRESSURE', label: 'Financial Pressure', emoji: '💸', description: 'Money / fees stress' },
  { value: 'HEALTH_ISSUES', label: 'Health Issues', emoji: '🩺', description: 'Physical or mental health' },
  { value: 'SOCIAL_ISOLATION', label: 'Social Isolation', emoji: '🫂', description: 'Feeling alone' },
  { value: 'UNCERTAINTY', label: 'Uncertainty', emoji: '🌫️', description: 'Unclear future / career' },
];

export const EXAM_TYPES = [
  { value: 'BOARD', label: 'Board Exams (10th / 12th)' },
  { value: 'NEET', label: 'NEET' },
  { value: 'JEE', label: 'JEE (Main / Advanced)' },
  { value: 'CUET', label: 'CUET' },
  { value: 'CAT', label: 'CAT' },
  { value: 'GATE', label: 'GATE' },
  { value: 'UPSC', label: 'UPSC' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const SUGGESTION_CATEGORIES = [
  'breathing',
  'meditation',
  'study-break',
  'sleep',
  'hydration',
  'movement',
] as const;

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];

export const SUGGESTIONS: Record<SuggestionCategory, { title: string; description: string; emoji: string; minutes: number }> = {
  breathing: {
    title: '4-7-8 Breathing',
    description: 'Inhale 4s, hold 7s, exhale 8s. Repeat 4 cycles to calm the nervous system.',
    emoji: '🌬️',
    minutes: 2,
  },
  meditation: {
    title: 'Guided Body Scan',
    description: 'Close your eyes and slowly scan attention from toes to head. Notice without judgement.',
    emoji: '🧘',
    minutes: 5,
  },
  'study-break': {
    title: 'Pomodoro Break',
    description: 'Step away from the screen. Stretch, look at something 20 feet away for 20 seconds.',
    emoji: '⏸️',
    minutes: 5,
  },
  sleep: {
    title: 'Wind-Down Routine',
    description: 'Dim screens 30 min before bed, keep the room cool, and avoid caffeine after 4 PM.',
    emoji: '🌙',
    minutes: 30,
  },
  hydration: {
    title: 'Hydration Check',
    description: 'Drink a glass of water now. Aim for 2–3 litres spread through the day.',
    emoji: '💧',
    minutes: 1,
  },
  movement: {
    title: '5-Minute Movement',
    description: 'Walk, stretch, or do a few jumping jacks. Movement releases study-tension fast.',
    emoji: '🚶',
    minutes: 5,
  },
};

export const CRISIS_RESOURCES = [
  {
    name: 'iCall (India)',
    phone: '9152987821',
    hours: 'Mon–Sat, 8 AM – 10 PM',
    description: 'Free, confidential psychosocial support.',
  },
  {
    name: 'Vandrevala Foundation',
    phone: '1860-2662-345',
    hours: '24 / 7',
    description: 'Mental health helpline for Indians in distress.',
  },
  {
    name: 'AASRA',
    phone: '9820466726',
    hours: '24 / 7',
    description: 'Suicide prevention and emotional support.',
  },
];
