'use client';

import type { SkillLevel } from '@/lib/types';

type Props = {
  value: SkillLevel;
  onChange: (value: SkillLevel) => void;
};

const OPTIONS: { value: SkillLevel; label: string; descriptor: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    descriptor: 'Foam board, whitewater, learning to stand',
  },
  {
    value: 'improver',
    label: 'Improver',
    descriptor: 'Catching unbroken waves, learning turns',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    descriptor: 'Comfortable head-high, reads the lineup',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    descriptor: 'Overhead surf, reef breaks, heavy conditions',
  },
];

export function SkillPills({ value, onChange }: Props) {
  const descriptor = OPTIONS.find((o) => o.value === value)?.descriptor ?? '';

  return (
    <div>
      <p className="block text-[13px] font-medium text-text-secondary tracking-[0.02em] mb-2">
        Skill level
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={`h-12 px-3 rounded-lg text-[14px] font-medium border transition-colors duration-150 ${
                selected
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface text-text-primary border-border hover:border-text-tertiary'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] text-text-tertiary">{descriptor}</p>
    </div>
  );
}
