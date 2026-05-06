'use client';

export type Timing = 'today' | 'tomorrow' | 'specific';

type Props = {
  value: Timing;
  onChange: (value: Timing) => void;
  dateValue: string;
  onDateChange: (value: string) => void;
};

const OPTIONS: { value: Timing; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'specific', label: 'Choose a date' },
];

export function TimingPills({ value, onChange, dateValue, onDateChange }: Props) {
  return (
    <div>
      <p className="block text-[13px] font-medium text-text-secondary tracking-[0.02em] mb-2">
        When
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={`h-12 px-4 rounded-lg text-[14px] font-medium border transition-colors duration-150 ${
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
      {value === 'specific' && (
        <input
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          required
          className="mt-3 h-12 px-4 bg-surface border border-border rounded-lg
                     text-[15px] text-text-primary
                     focus:outline-none focus:border-accent
                     transition-colors duration-150"
        />
      )}
    </div>
  );
}
