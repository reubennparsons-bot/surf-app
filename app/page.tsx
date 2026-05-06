'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { LocationInput } from '@/components/LocationInput';
import { SkillPills } from '@/components/SkillPills';
import { TimingPills, type Timing } from '@/components/TimingPills';
import { Results } from '@/components/Results';
import type { RecommendationResult, SkillLevel } from '@/lib/types';

type StreamFrame =
  | { type: 'result'; result: RecommendationResult }
  | { type: 'delta'; text: string }
  | { type: 'done'; fallback: boolean };

type Phase = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

const LOADING_MESSAGES = [
  'Checking live conditions...',
  'Scoring 39 spots...',
  'Asking a local...',
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [skill, setSkill] = useState<SkillLevel>('intermediate');
  const [locationQuery, setLocationQuery] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const [timing, setTiming] = useState<Timing>('today');
  const [specificDate, setSpecificDate] = useState('');

  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [narration, setNarration] = useState('');
  const [narrationFallback, setNarrationFallback] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const isLoading = phase === 'loading' || phase === 'streaming';
  const showResults = (phase === 'streaming' || phase === 'done') && result !== null;

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [isLoading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPhase('loading');
    setLoadingMsgIdx(0);
    setErrorMsg('');
    setResult(null);
    setNarration('');
    setNarrationFallback(false);
    setStreamError(null);
    let receivedResult = false;

    const timingPayload =
      timing === 'specific' && specificDate
        ? { kind: 'specific' as const, iso: new Date(`${specificDate}T08:00:00`).toISOString() }
        : { kind: timing === 'specific' ? ('today' as const) : timing };

    const body = {
      location: coords
        ? {
            kind: 'coords' as const,
            lat: coords.lat,
            lng: coords.lng,
            name: locationQuery || 'your location',
          }
        : { kind: 'text' as const, query: locationQuery },
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
            receivedResult = true;
            setResult(frame.result);
            setPhase('streaming');
          } else if (frame.type === 'delta') {
            setNarration((prev) => prev + frame.text);
          } else if (frame.type === 'done') {
            setNarrationFallback(frame.fallback);
            setPhase('done');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (receivedResult) {
        setStreamError(message);
        setPhase('done');
      } else {
        setErrorMsg(message);
        setPhase('error');
      }
    }
  }

  function requestGeolocation() {
    if (!('geolocation' in navigator)) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationQuery(
          `(${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`,
        );
        setGeolocating(false);
      },
      (err) => {
        console.warn('geolocation denied:', err);
        setGeolocating(false);
      },
    );
  }

  function reset() {
    setPhase('idle');
    setErrorMsg('');
    setResult(null);
    setNarration('');
    setNarrationFallback(false);
    setStreamError(null);
  }

  return (
    <>
      {isLoading && (
        <div
          className="fixed top-0 inset-x-0 h-[2px] bg-accent/20 z-50 overflow-hidden"
          aria-hidden
        >
          <div className="h-full w-1/3 bg-accent animate-[loadingbar_1.2s_ease-in-out_infinite]" />
        </div>
      )}

      <div className="min-h-screen bg-bg">
        <header className="px-6 pt-6 max-w-[680px] mx-auto">
          {showResults ? (
            <button
              type="button"
              onClick={reset}
              className="text-[16px] font-semibold text-text-primary tracking-tight
                         hover:text-accent transition-colors duration-150"
              aria-label="Start a new search"
            >
              Swell
            </button>
          ) : (
            <span className="text-[16px] font-semibold text-text-primary tracking-tight">
              Swell
            </span>
          )}
        </header>

        <main
          className={`px-6 max-w-[680px] mx-auto ${
            showResults
              ? 'pt-2'
              : 'min-h-[calc(100vh-56px)] flex items-center'
          }`}
        >
          {showResults && result ? (
            <div className="w-full">
              <Results
                result={result}
                narration={narration}
                streaming={phase === 'streaming'}
                fallback={phase === 'done' && narrationFallback}
                streamError={streamError}
              />
            </div>
          ) : (
            <div className="w-full animate-[fadein_200ms_ease-out]">
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <LocationInput
                  value={locationQuery}
                  onChange={(v) => {
                    setLocationQuery(v);
                    setCoords(null);
                  }}
                  onGeolocate={requestGeolocation}
                  geolocating={geolocating}
                />

                <SkillPills value={skill} onChange={setSkill} />

                <TimingPills
                  value={timing}
                  onChange={setTiming}
                  dateValue={specificDate}
                  onDateChange={setSpecificDate}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-accent text-white font-medium rounded-lg
                             hover:bg-accent-hover transition-colors duration-150
                             disabled:opacity-70 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 size={18} className="animate-spin" />}
                  {isLoading ? 'Checking conditions...' : 'Find waves'}
                </button>
              </form>

              {isLoading && (
                <p className="mt-6 text-[13px] text-text-tertiary text-center">
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </p>
              )}

              {phase === 'error' && (
                <p className="mt-6 text-[15px] text-text-secondary text-center">
                  {errorMsg ||
                    "Couldn't fetch conditions right now — try again in a moment."}
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
