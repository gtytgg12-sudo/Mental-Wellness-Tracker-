'use client';

import * as React from 'react';
import { STRESS_TRIGGERS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { StressTrigger } from '@prisma/client';

interface StressTriggerSelectorProps {
  selected: StressTrigger[];
  onToggle: (trigger: StressTrigger) => void;
  max?: number;
}

export function StressTriggerSelector({
  selected,
  onToggle,
  max = 10,
}: StressTriggerSelectorProps) {
  const isSelected = (t: StressTrigger) => selected.includes(t);
  const isMaxed = selected.length >= max;

  return (
    <fieldset>
      <legend className="text-sm font-medium leading-none">
        What is stressing you out?
        <span className="ml-2 text-xs text-muted-foreground">
          {selected.length}/{max} selected
        </span>
      </legend>
      <p id="stress-help" className="mt-1 text-xs text-muted-foreground">
        Pick any that apply. You can choose more than one.
      </p>
      <div
        role="group"
        aria-describedby="stress-help"
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5"
      >
        {STRESS_TRIGGERS.map((t) => {
          const active = isSelected(t.value);
          const disabled = !active && isMaxed;
          return (
            <button
              key={t.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              aria-label={`${t.label}: ${t.description}`}
              disabled={disabled}
              onClick={() => onToggle(t.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card hover:border-primary/40',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              <span className="text-lg" aria-hidden="true">
                {t.emoji}
              </span>
              <span className="font-medium leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
