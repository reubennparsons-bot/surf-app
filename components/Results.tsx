'use client';

import type { RecommendationResult } from '@/lib/types';
import { NarrationBlock } from './NarrationBlock';
import { SpotCard } from './SpotCard';
import { EmailCapture } from './EmailCapture';

type Props = {
  result: RecommendationResult;
  narration: string;
  streaming: boolean;
  fallback: boolean;
  streamError: string | null;
};

export function Results({ result, narration, streaming, fallback, streamError }: Props) {
  const showEmptyFallback =
    !streaming &&
    result.rankedSpots.length === 0 &&
    narration.trim().length === 0 &&
    !result.globalAdvisory;

  return (
    <div className="pb-20 animate-[fadein-up_250ms_ease-out]">
      {result.globalAdvisory && (
        <div className="mt-6 mb-6 bg-surface border-l-[3px] border-accent px-5 py-4 text-[15px] text-text-primary">
          {result.globalAdvisory}
        </div>
      )}

      {(narration || streaming) && (
        <NarrationBlock text={narration} streaming={streaming} fallback={fallback} />
      )}

      {showEmptyFallback && (
        <p className="my-12 text-[15px] text-text-secondary text-center">
          Nothing&apos;s worth chasing today.
        </p>
      )}

      {result.rankedSpots.length > 0 && (
        <div className="flex flex-col gap-4">
          {result.rankedSpots.map((spot, i) => (
            <SpotCard key={spot.spotId} spot={spot} index={i} />
          ))}
        </div>
      )}

      {result.eliminatedSpotsOfNote.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[13px] font-medium text-text-secondary tracking-[0.02em] mb-3">
            What to skip today
          </h2>
          <ul className="space-y-2">
            {result.eliminatedSpotsOfNote.map((entry) => (
              <li key={entry.spotId} className="text-[14px] leading-snug">
                <span className="text-text-primary">{entry.spotName}</span>
                <span className="mx-2 text-text-tertiary">·</span>
                <span className="text-text-tertiary">{entry.note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {streamError && (
        <p className="mt-8 text-[13px] text-text-tertiary text-center italic">
          Connection interrupted — showing partial results.
        </p>
      )}

      <EmailCapture />
    </div>
  );
}
