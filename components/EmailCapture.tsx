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
      <p className="mt-16 text-[13px] text-text-tertiary text-center">
        Thanks — we&apos;ll let you know.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-16 flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="flex-1 h-10 px-3 bg-surface border border-border rounded-md
                   text-[13px] text-text-primary placeholder:text-text-tertiary
                   focus:outline-none focus:border-accent
                   transition-colors duration-150"
      />
      <button
        type="submit"
        className="h-10 px-4 bg-bg border border-border rounded-md
                   text-[13px] font-medium text-text-secondary
                   hover:text-text-primary hover:border-text-tertiary
                   transition-colors duration-150 text-center"
      >
        Notify me when premium features launch
      </button>
    </form>
  );
}
