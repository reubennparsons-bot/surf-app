import type { ActiveHazard, HazardSeverity } from '@/lib/types';

type Props = {
  hazard: ActiveHazard;
};

const STYLES: Record<HazardSeverity, string> = {
  caution: 'bg-hazard-amber-bg text-hazard-amber',
  warning: 'bg-hazard-amber-bg text-hazard-amber',
  danger: 'bg-hazard-danger-bg text-hazard-danger',
};

export function HazardTag({ hazard }: Props) {
  return (
    <span
      title={hazard.reason}
      className={`inline-flex items-center px-2 py-0.5 rounded-md
                  text-[12px] font-medium ${STYLES[hazard.severity]}`}
    >
      {hazard.hazard}
    </span>
  );
}
