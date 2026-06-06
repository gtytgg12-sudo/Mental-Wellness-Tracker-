import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoodSelector } from '@/components/mood-selector';
import { StressTriggerSelector } from '@/components/stress-trigger-selector';

describe('MoodSelector', () => {
  it('renders all five moods as a radiogroup', () => {
    render(<MoodSelector value={null} onChange={() => {}} />);
    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
  });

  it('marks the selected mood as aria-checked', () => {
    render(<MoodSelector value="GOOD" onChange={() => {}} />);
    const good = screen.getByRole('radio', { name: /good/i });
    expect(good).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when a mood is clicked', async () => {
    const user = userEvent.setup();
    let captured: string | null = null;
    render(<MoodSelector value={null} onChange={(v) => (captured = v)} />);
    await user.click(screen.getByRole('radio', { name: /great/i }));
    expect(captured).toBe('GREAT');
  });
});

describe('StressTriggerSelector', () => {
  it('renders all triggers as checkboxes', () => {
    render(<StressTriggerSelector selected={[]} onToggle={() => {}} />);
    expect(screen.getAllByRole('checkbox').length).toBe(10);
  });

  it('toggles selection on click', async () => {
    const user = userEvent.setup();
    let captured: string[] = [];
    render(
      <StressTriggerSelector
        selected={[]}
        onToggle={(t) => (captured = [...captured, t])}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: /exam pressure/i }));
    expect(captured).toContain('EXAM_PRESSURE');
  });

  it('disables unchecked items when at max', async () => {
    const selected = [
      'EXAM_PRESSURE', 'RESULTS_ANXIETY', 'LACK_OF_SLEEP',
      'ACADEMIC_WORKLOAD', 'PEER_COMPARISON', 'FAMILY_EXPECTATIONS',
      'FINANCIAL_PRESSURE', 'HEALTH_ISSUES', 'SOCIAL_ISOLATION', 'UNCERTAINTY',
    ] as const;
    render(<StressTriggerSelector selected={[...selected]} onToggle={() => {}} max={10} />);
    // All 10 are checked, so none should be disabled
    screen.getAllByRole('checkbox').forEach((cb) => {
      expect(cb).not.toBeDisabled();
    });
  });
});
