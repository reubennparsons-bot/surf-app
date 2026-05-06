'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const VISIT_COUNT_KEY = 'swell.visitCount';
const DISMISSED_KEY = 'swell.feedbackDismissed';
const FORM_URL = 'https://forms.gle/w3U4VWygVusPK9888';

export function FeedbackBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(VISIT_COUNT_KEY);
    const count = raw ? parseInt(raw, 10) || 0 : 0;
    const next = count + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(next));

    const dismissed = localStorage.getItem(DISMISSED_KEY) === '1';
    // Hydrating UI state from a browser-only source (localStorage) on mount —
    // a setState in this effect is the intended pattern, not a render bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(next >= 2 && !dismissed);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      className="mt-8 flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300"
      aria-label="Feedback prompt"
    >
      <p className="flex-1">
        Used this before?{' '}
        <a
          href={FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          We&apos;d love your feedback
        </a>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss feedback prompt"
        className="-mr-1 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <X size={14} />
      </button>
    </aside>
  );
}
