import type { QualityCategory } from '@/lib/types';

type Props = {
  category: QualityCategory;
  isFiring: boolean;
};

const LABELS: Record<QualityCategory, string> = {
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  very_good: 'Very good',
  firing: 'Firing',
};

const STYLES: Record<QualityCategory, string> = {
  firing: 'text-accent border-accent',
  very_good: 'text-text-primary border-text-primary',
  good: 'text-text-secondary border-text-secondary',
  fair: 'text-text-tertiary border-text-tertiary',
  poor: 'text-quality-poor border-quality-poor',
};

export function QualityBadge({ category, isFiring }: Props) {
  const effective: QualityCategory = isFiring ? 'firing' : category;
  const label = isFiring ? 'Firing' : LABELS[category];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full
                  text-[11px] font-medium uppercase tracking-[0.04em]
                  border bg-bg ${STYLES[effective]}`}
    >
      {label}
    </span>
  );
}
