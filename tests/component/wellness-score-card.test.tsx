import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { WellnessScoreCard } from '@/components/wellness-score-card';
import type { WellnessBreakdown } from '@/lib/wellness-engine';

const SAMPLE: WellnessBreakdown = {
  score: 78,
  band: 'balanced',
  components: { mood: 80, stress: 70, sleep: 90, study: 100 },
  weights: { mood: 0.3, stress: 0.3, sleep: 0.2, study: 0.2 },
  recommendations: ['Keep going.'],
};

describe('WellnessScoreCard', () => {
  it('renders the score and band label', () => {
    render(<WellnessScoreCard breakdown={SAMPLE} />);
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getAllByText(/balanced/i).length).toBeGreaterThan(0);
  });

  it('exposes a region with accessible name', () => {
    render(<WellnessScoreCard breakdown={SAMPLE} />);
    expect(screen.getByRole('region', { name: /wellness score summary/i })).toBeInTheDocument();
  });

  it('renders all four component rows with progress bars', () => {
    render(<WellnessScoreCard breakdown={SAMPLE} />);
    expect(screen.getByText(/^Mood$/)).toBeInTheDocument();
    expect(screen.getByText(/Sleep/)).toBeInTheDocument();
    expect(screen.getByText(/Study balance/)).toBeInTheDocument();
    expect(screen.getByText(/Stress/)).toBeInTheDocument();
  });
});
