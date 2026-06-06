import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoodLogForm } from '@/components/mood-log-form';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

global.fetch = vi.fn();

describe('MoodLogForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all sections', () => {
    render(<MoodLogForm />);
    expect(screen.getByText('How are you feeling?')).toBeInTheDocument();
    expect(screen.getByText('Daily details')).toBeInTheDocument();
    expect(screen.getByText('Stress triggers')).toBeInTheDocument();
  });

  it('disables submit until a mood is selected', () => {
    render(<MoodLogForm />);
    expect(screen.getByRole('button', { name: /log my mood/i })).toBeDisabled();
  });

  it('enables submit after selecting a mood', async () => {
    const user = userEvent.setup();
    render(<MoodLogForm />);
    await user.click(screen.getByRole('radio', { name: /good/i }));
    expect(screen.getByRole('button', { name: /log my mood/i })).toBeEnabled();
  });

  it('shows intensity slider only after selecting a trigger', async () => {
    const user = userEvent.setup();
    render(<MoodLogForm />);
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /exam pressure/i }));
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { entry: { id: 'm1' } } }),
    });

    render(<MoodLogForm />);
    await user.click(screen.getByRole('radio', { name: /good/i }));
    await user.click(screen.getByRole('button', { name: /log my mood/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/mood', expect.objectContaining({ method: 'POST' }));
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles submission errors', async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Validation failed' }),
    });

    render(<MoodLogForm />);
    await user.click(screen.getByRole('radio', { name: /good/i }));
    await user.click(screen.getByRole('button', { name: /log my mood/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });
  });
});
