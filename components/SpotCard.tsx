import type { ScoredSpot } from '@/lib/types';
import { QualityBadge } from './QualityBadge';
import { ConditionsStrip } from './ConditionsStrip';
import { HazardTag } from './HazardTag';

type Props = {
  spot: ScoredSpot;
  index?: number;
};

function formatDrive(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

export function SpotCard({ spot, index = 0 }: Props) {
  return (
    <article
      className="bg-bg border border-border rounded-xl p-6
                 opacity-0 animate-[fadein-up_250ms_ease-out_forwards]"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        animationDelay: `${index * 50}ms`,
      }}
    >
      <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3">
        <h3 className="text-[18px] font-semibold text-text-primary leading-tight min-w-0 break-words">
          {spot.spotName}
        </h3>
        <span className="text-[14px] text-text-secondary shrink-0">
          {formatDrive(spot.driveMinutes)}
        </span>
      </header>

      <div className="mt-3">
        <QualityBadge category={spot.qualityCategory} isFiring={spot.isFiring} />
      </div>

      <div className="mt-4">
        <ConditionsStrip conditions={spot.conditionsSummary} />
      </div>

      {spot.activeHazards.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
            Heads up
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {spot.activeHazards.map((h, i) => (
              <HazardTag key={`${h.hazard}-${i}`} hazard={h} />
            ))}
          </div>
        </div>
      )}

      {spot.caveats.length > 0 && (
        <div className="mt-3 space-y-1">
          {spot.caveats.map((c, i) => (
            <p key={i} className="text-[13px] italic text-text-tertiary leading-snug">
              {c}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
