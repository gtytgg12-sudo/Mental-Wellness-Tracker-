import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalEditor } from '@/components/journal-editor';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

global.fetch = vi.fn();

describe('JournalEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editor with heading and textarea', () => {
    render(<JournalEditor />);
    expect(screen.getByText('AI Reflection Journal')).toBeInTheDocument();
    expect(screen.getByLabelText(/journal entry/i)).toBeInTheDocument();
  });

  it('disables submit when content is too short', async () => {
    const user = userEvent.setup();
    render(<JournalEditor />);
    const button = screen.getByRole('button', { name: /save & reflect/i });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText(/journal entry/i), 'short');
    expect(button).toBeDisabled();
  });

  it('enables submit when content is at least 10 characters', async () => {
    const user = userEvent.setup();
    render(<JournalEditor />);
    const textarea = screen.getByLabelText(/journal entry/i);
    await user.type(textarea, 'I feel overwhelmed by exams today.');
    expect(screen.getByRole('button', { name: /save & reflect/i })).toBeEnabled();
  });

  it('submits the entry and shows the AI reflection', async () => {
    const user = userEvent.setup();
    const mockReflection = {
      entry: {
        id: 'j1',
        content: 'I am anxious about NEET results.',
        aiReflection: 'Take a deep breath. You have prepared well.',
        sentiment: 'negative',
        keywords: ['anxious', 'neet', 'results'],
        createdAt: new Date().toISOString(),
      },
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockReflection }),
    });

    render(<JournalEditor />);
    const textarea = screen.getByLabelText(/journal entry/i);
    await user.type(textarea, 'I am anxious about NEET results.');
    await user.click(screen.getByRole('button', { name: /save & reflect/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/journal', expect.objectContaining({ method: 'POST' }));
    });
    await waitFor(() => {
      expect(screen.getByText(/Take a deep breath/i)).toBeInTheDocument();
    });
    expect(toast.success).toHaveBeenCalledWith('Journal entry saved');
  });

  it('shows an error toast on failed submission', async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Server error' }),
    });

    render(<JournalEditor />);
    await user.type(screen.getByLabelText(/journal entry/i), 'Something is on my mind today.');
    await user.click(screen.getByRole('button', { name: /save & reflect/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('updates the character counter as the user types', async () => {
    const user = userEvent.setup();
    render(<JournalEditor />);
    const textarea = screen.getByLabelText(/journal entry/i);
    await user.type(textarea, 'hello');
    expect(screen.getByText(/5 \/ 5000/)).toBeInTheDocument();
  });
});
