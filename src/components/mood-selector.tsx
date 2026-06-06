'use client';

import * as React from 'react';
import { MOODS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Mood } from '@prisma/client';

interface MoodSelectorProps {
  value?: Mood | null;
  onChange: (mood: Mood) => void;
  /** Optional id for ARIA labelling from a parent. */
  id?: string;
  disabled?: boolean;
}

export function MoodSelector({ value, onChange, id = 'mood-selector', disabled }: MoodSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={`${id}-label`}
      id={id}
      className="grid grid-cols-5 gap-2 sm:gap-3"
    >
      <span id={`${id}-label`} className="sr-only">
        How are you feeling today?
      </span>
      {MOODS.map((m) => {
        const selected = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={m.ariaLabel}
            disabled={disabled}
            onClick={() => onChange(m.value)}
            className={cn(
              'group flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all',
              'hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              selected
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border bg-card hover:border-primary/40',
              disabled && 'cursor-not-allowed opacity-50 hover:scale-100',
            )}
          >
            <span className="text-3xl sm:text-4xl" aria-hidden="true">
              {m.emoji}
            </span>
            <span className={cn('text-xs font-medium', selected && 'text-primary')}>
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
