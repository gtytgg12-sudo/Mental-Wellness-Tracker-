import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestionList } from '@/components/suggestion-list';

describe('SuggestionList', () => {
  it('renders all six suggestion cards', () => {
    render(<SuggestionList />);
    expect(screen.getByText(/4-7-8 Breathing/i)).toBeInTheDocument();
    expect(screen.getByText(/Guided Body Scan/i)).toBeInTheDocument();
    expect(screen.getByText(/Pomodoro Break/i)).toBeInTheDocument();
    expect(screen.getByText(/Wind-Down Routine/i)).toBeInTheDocument();
    expect(screen.getByText(/Hydration Check/i)).toBeInTheDocument();
    expect(screen.getByText(/5-Minute Movement/i)).toBeInTheDocument();
  });

  it('renders crisis resources section with helplines', () => {
    render(<SuggestionList />);
    expect(screen.getByText('Need to talk to someone?')).toBeInTheDocument();
    expect(screen.getByText('iCall (India)')).toBeInTheDocument();
    expect(screen.getByText('Vandrevala Foundation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /9152987821/i })).toBeInTheDocument();
  });

  it('marks highlighted suggestions as suggested for you', () => {
    render(<SuggestionList highlight={['breathing', 'meditation']} />);
    const suggestions = screen.getAllByText(/Suggested for you today/i);
    expect(suggestions.length).toBe(2);
  });
});
