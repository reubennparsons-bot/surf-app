'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { MapPin } from 'lucide-react';
import { EmailCapture } from '@/components/EmailCapture';
import { toTraditionalFt } from '@/lib/scoring/heightScale';
import type {
  ActiveHazard,
  EliminationDetail,
  HazardSeverity,
  QualityCategory,
  RecommendationResult,
  ScoredSpot,
  SkillLevel,
  TimeOfDay,
  TimingInput,
} from '@/lib/types';

// ─── Types for the NDJSON stream ────────────────────────────────────────────

type StreamFrame =
  | { type: 'result'; result: RecommendationResult }
  | { type: 'delta'; text: string }
  | { type: 'done'; fallback: boolean };

type Phase = 'idle' | 'loading' | 'streaming' | 'done' | 'error' | 'limit_reached';

const SEARCH_COUNT_KEY = 'swell.searchCount';
const MAX_SEARCHES = 6;
const FEEDBACK_FORM_URL = 'https://forms.gle/w3U4VWygVusPK9888';

// ─── Visual helpers ────────────────────────────────────────────────────────

const QUALITY_STYLES: Record<QualityCategory, { label: string; classes: string }> = {
  poor: { label: 'Poor', classes: 'bg-red-100 text-red-800 ring-red-200' },
  fair: { label: 'Fair', classes: 'bg-amber-100 text-amber-800 ring-amber-200' },
  good: { label: 'Good', classes: 'bg-lime-100 text-lime-800 ring-lime-200' },
  very_good: { label: 'Very good', classes: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  firing: { label: 'Firing', classes: 'bg-cyan-100 text-cyan-900 ring-cyan-300' },
};

const SEVERITY_STYLES: Record<HazardSeverity, string> = {
  caution: 'bg-yellow-50 text-yellow-900 ring-yellow-200',
  warning: 'bg-orange-50 text-orange-900 ring-orange-200',
  danger: 'bg-red-50 text-red-900 ring-red-300 font-medium',
};

function formatDriveMin(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}min`;
}

function compassLabel(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function HazardChip({ hazard }: { hazard: ActiveHazard }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ring-inset ${SEVERITY_STYLES[hazard.severity]}`}
      title={hazard.reason}
    >
      {hazard.hazard}
    </span>
  );
}

function SpotCard({ spot }: { spot: ScoredSpot }) {
  const q = QUALITY_STYLES[spot.qualityCategory];
  const c = spot.conditionsSummary;
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
            {spot.spotName}
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {spot.region} · {formatDriveMin(spot.driveMinutes)} drive
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${q.classes}`}
        >
          {spot.isFiring ? 'Firing' : q.label}
          <span className="ml-1.5 opacity-70">{Math.round(spot.finalScore)}</span>
        </span>
      </header>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Swell</dt>
          <dd className="font-medium text-zinc-800 dark:text-zinc-200">
            {c.swellHeightFt.toFixed(1)}ft @ {c.swellPeriodS.toFixed(0)}s
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Direction</dt>
          <dd className="font-medium text-zinc-800 dark:text-zinc-200">
            {compassLabel(c.swellDirectionDeg)} ({Math.round(c.swellDirectionDeg)}°)
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Wind</dt>
          <dd className="font-medium text-zinc-800 dark:text-zinc-200">
            {Math.round(c.windSpeedKt)}kt {compassLabel(c.windDirectionDeg)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Surf height</dt>
          <dd className="font-medium text-zinc-800 dark:text-zinc-200">
            {toTraditionalFt(spot.effectiveSizeFt).toFixed(1)}ft
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-zinc-500 dark:text-zinc-400">Forecast</dt>
          <dd className="font-medium text-zinc-800 dark:text-zinc-200">
            {c.forecastHorizonHours}h ahead · certainty {(spot.certaintyMultiplier * 100).toFixed(0)}%
          </dd>
        </div>
      </dl>

      {spot.activeHazards.length > 0 && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Hazards</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {spot.activeHazards.map((h, i) => (
              <HazardChip key={`${h.hazard}-${i}`} hazard={h} />
            ))}
          </div>
        </div>
      )}

      {spot.caveats.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {spot.caveats.map((c, i) => (
            <li key={i}>· {c}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

function EliminatedSpot({ entry }: { entry: EliminationDetail }) {
  return (
    <li className="text-sm text-zinc-600 dark:text-zinc-400">
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{entry.spotName}</span>
      <span className="mx-1.5 text-zinc-400">·</span>
      <span>{entry.note}</span>
    </li>
  );
}

function NarrationBody({ text, streaming, fallback }: { text: string; streaming: boolean; fallback: boolean }) {
  return (
    <div className="text-zinc-800 dark:text-zinc-200">
      {fallback && (
        <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900">
          AI narration unavailable — showing structured data only.
        </div>
      )}
      <div className="space-y-3 leading-relaxed">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h2 className="mt-4 text-lg font-semibold">{children}</h2>,
            h2: ({ children }) => <h3 className="mt-3 text-base font-semibold">{children}</h3>,
            h3: ({ children }) => <h4 className="mt-2 text-sm font-semibold">{children}</h4>,
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            hr: () => <hr className="my-3 border-zinc-200 dark:border-zinc-800" />,
            ul: ({ children }) => <ul className="ml-5 list-disc space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1">{children}</ol>,
          }}
        >
          {text}
        </ReactMarkdown>
        {streaming && (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-zinc-400 align-text-bottom dark:bg-zinc-500" aria-label="streaming" />
        )}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

const SKILL_OPTIONS: { value: SkillLevel; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Beginner', hint: 'Foam board, whitewater, learning to stand' },
  { value: 'improver', label: 'Improver', hint: 'Catching unbroken waves, learning turns' },
  { value: 'intermediate', label: 'Intermediate', hint: 'Comfortable head-high, reads the lineup' },
  { value: 'advanced', label: 'Advanced', hint: 'Overhead surf, reef breaks, heavy conditions' },
];

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'midday', label: 'Midday' },
  { value: 'evening', label: 'Evening' },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [skill, setSkill] = useState<SkillLevel>('intermediate');
  const [locationQuery, setLocationQuery] = useState('Melbourne');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [timing, setTiming] = useState<'today' | 'tomorrow' | 'specific'>('today');
  const [specificDate, setSpecificDate] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [searchCount, setSearchCount] = useState(0);

  // Hydrate searchCount from localStorage on mount; if at the cap, surface
  // the limit-reached state immediately so the user doesn't see the form.
  // Reading from a browser-only store on mount is the intended useEffect
  // pattern; the lint rule's "render-instead" suggestion doesn't apply.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = localStorage.getItem(SEARCH_COUNT_KEY);
    const count = raw ? parseInt(raw, 10) || 0 : 0;
    setSearchCount(count);
    if (count >= MAX_SEARCHES) setPhase('limit_reached');
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Result state
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [narration, setNarration] = useState('');
  const [narrationFallback, setNarrationFallback] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (searchCount >= MAX_SEARCHES) {
      setPhase('limit_reached');
      return;
    }
    setPhase('loading');
    setErrorMsg('');
    setResult(null);
    setNarration('');
    setNarrationFallback(false);

    const timingPayload: TimingInput =
      timing === 'specific' && specificDate
        ? { kind: 'specific', date: specificDate, timeOfDay }
        : { kind: timing === 'specific' ? 'today' : timing, timeOfDay };

    const body: unknown = {
      location: coords
        ? { kind: 'coords', lat: coords.lat, lng: coords.lng, name: locationQuery || 'your location' }
        : { kind: 'text', query: locationQuery },
      skill,
      timing: timingPayload,
    };

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status !== 200) {
        const err = (await response.json().catch(() => ({}))) as { message?: string };
        setErrorMsg(err.message ?? `Server returned ${response.status}`);
        setPhase('error');
        return;
      }
      if (!response.body) {
        setErrorMsg('No response body from server.');
        setPhase('error');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          let frame: StreamFrame;
          try {
            frame = JSON.parse(line);
          } catch {
            continue;
          }
          if (frame.type === 'result') {
            setResult(frame.result);
            setPhase('streaming');
          } else if (frame.type === 'delta') {
            setNarration((prev) => prev + frame.text);
          } else if (frame.type === 'done') {
            setNarrationFallback(frame.fallback);
            setPhase('done');
            const nextCount = searchCount + 1;
            setSearchCount(nextCount);
            localStorage.setItem(SEARCH_COUNT_KEY, String(nextCount));
          }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }

  function useGeolocation() {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationQuery(`(${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
      },
      (err) => {
        console.warn('geolocation denied:', err);
      },
    );
  }

  function reset() {
    setPhase('idle');
    setErrorMsg('');
    setResult(null);
    setNarration('');
    setNarrationFallback(false);
  }

  const showResults = phase === 'streaming' || phase === 'done';
  const limitReached = phase === 'limit_reached';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <img
            src="/swell-logo.svg"
            alt="Swell — Victoria surf assistant"
            className="h-24 w-auto invert dark:invert-0"
          />
        </div>
        {showResults && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            New search
          </button>
        )}
      </header>

      {!showResults && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Where are you starting from?
            </label>
            <div className="relative mt-1.5">
              <input
                id="location"
                type="text"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setCoords(null);
                }}
                placeholder="e.g. Melbourne, Geelong, Torquay"
                className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                required
              />
              <button
                type="button"
                onClick={useGeolocation}
                aria-label="Use my location"
                title="Use my location"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <MapPin size={16} />
              </button>
            </div>
            {coords && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Using GPS coordinates: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
              </p>
            )}
          </div>

          {/* Skill */}
          <fieldset>
            <legend className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Your skill level
            </legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SKILL_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                    skill === opt.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900'
                  }`}
                  title={opt.hint}
                >
                  <input
                    type="radio"
                    name="skill"
                    value={opt.value}
                    checked={skill === opt.value}
                    onChange={() => setSkill(opt.value)}
                    className="sr-only"
                  />
                  <span className="block text-center font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {SKILL_OPTIONS.find((o) => o.value === skill)?.hint}
            </p>
          </fieldset>

          {/* Timing */}
          <fieldset>
            <legend className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
              When?
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(['today', 'tomorrow', 'specific'] as const).map((t) => (
                <label
                  key={t}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                    timing === t
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="timing"
                    value={t}
                    checked={timing === t}
                    onChange={() => {
                      setTiming(t);
                      if (t === 'specific') {
                        setTimeout(() => dateInputRef.current?.showPicker?.(), 50);
                      }
                    }}
                    className="sr-only"
                  />
                  {t === 'specific' ? 'Choose a date' : t}
                </label>
              ))}
            </div>
            {timing === 'specific' && (
              <input
                ref={dateInputRef}
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:w-auto"
                required
              />
            )}

            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Time of day
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {TIME_OF_DAY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                    timeOfDay === opt.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="timeOfDay"
                    value={opt.value}
                    checked={timeOfDay === opt.value}
                    onChange={() => setTimeOfDay(opt.value)}
                    className="sr-only"
                  />
                  <span className="block text-center font-medium capitalize">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Submit */}
          <button
            type="submit"
            disabled={phase === 'loading'}
            className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {phase === 'loading' ? 'Checking conditions…' : 'Find waves'}
          </button>

          {searchCount >= MAX_SEARCHES - 1 && (
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              Search {searchCount + 1} of {MAX_SEARCHES}
            </p>
          )}
        </form>
      )}

      {limitReached && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            You&apos;ve used your {MAX_SEARCHES} searches for this beta.
          </p>
          <p className="mt-2">
            Thanks for testing! Please share your feedback in the form so we know what to improve.
          </p>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Share feedback
          </a>
        </div>
      )}

      {phase === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-medium">Couldn&apos;t get recommendations.</p>
          <p className="mt-1">{errorMsg}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40"
          >
            Try again
          </button>
        </div>
      )}

      {showResults && result && (
        <>
          {result.globalAdvisory && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="font-medium">Heads up</p>
              <p className="mt-1">{result.globalAdvisory}</p>
            </div>
          )}

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              The call
            </h2>
            <div className="mt-2">
              {narration ? (
                <NarrationBody
                  text={narration}
                  streaming={phase === 'streaming'}
                  fallback={phase === 'done' && narrationFallback}
                />
              ) : (
                <p className="text-sm italic text-zinc-500 dark:text-zinc-400">Writing…</p>
              )}
            </div>
          </section>

          {result.rankedSpots.length > 0 && (
            <section>
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Ranked spots ({result.rankedSpots.length})
              </h2>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {result.rankedSpots.map((s) => (
                  <SpotCard key={s.spotId} spot={s} />
                ))}
              </div>
            </section>
          )}

          {result.eliminatedSpotsOfNote.length > 0 && (
            <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Worth knowing
              </h2>
              <ul className="mt-2 space-y-1.5">
                {result.eliminatedSpotsOfNote.map((e) => (
                  <EliminatedSpot key={e.spotId} entry={e} />
                ))}
              </ul>
            </section>
          )}

          <footer className="text-xs text-zinc-500 dark:text-zinc-400">
            Forecast {result.context.forecastHorizonHours}h ahead · baseline drive {formatDriveMin(result.context.baselineDriveMinutes)} ·{' '}
            {result.user.skill} session, {result.user.sessionTiming}, near {result.user.location.name}.
          </footer>

          <EmailCapture />
        </>
      )}

      <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Help us improve —{' '}
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          share your feedback
        </a>
        .
      </p>
    </div>
  );
}
