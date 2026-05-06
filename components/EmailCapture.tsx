'use client';

import { useState, type FormEvent } from 'react';

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    console.log('[email-capture]', email);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="mt-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Thanks — we&apos;ll let you know.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-12 flex flex-col gap-2 sm:flex-row"
      aria-label="Premium feature notification signup"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <button
        type="submit"
        className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        Notify me when premium features launch
      </button>
    </form>
  );
}
