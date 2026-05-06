import { Waves, Wind, Droplets } from 'lucide-react';
import type { ConditionsSummary } from '@/lib/types';

type Props = {
  conditions: ConditionsSummary;
};

const COMPASS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

function compass(deg: number): string {
  const idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS[idx];
}

export function ConditionsStrip({ conditions }: Props) {
  const c = conditions;
  const tide = c.tideState?.trim();

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-text-secondary">
      <span className="inline-flex items-center gap-1.5">
        <Waves size={14} className="text-text-tertiary" />
        {c.swellHeightFt.toFixed(1)}ft @ {c.swellPeriodS.toFixed(0)}s {compass(c.swellDirectionDeg)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Wind size={14} className="text-text-tertiary" />
        {Math.round(c.windSpeedKt)}kt {compass(c.windDirectionDeg)}
      </span>
      {tide && (
        <span className="inline-flex items-center gap-1.5">
          <Droplets size={14} className="text-text-tertiary" />
          {tide}
        </span>
      )}
    </div>
  );
}
