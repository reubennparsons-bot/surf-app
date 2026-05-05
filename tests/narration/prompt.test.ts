import { describe, it, expect } from 'vitest';
import { NARRATION_SYSTEM_PROMPT } from '@/lib/narration/prompt';

describe('NARRATION_SYSTEM_PROMPT', () => {
  it('includes the role anchor (experienced Victorian surf advisor)', () => {
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/experienced Victorian surf advisor/i);
  });

  it('forbids hype words explicitly', () => {
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/no hype/i);
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/epic.*stoked/i);
  });

  it('declares the hard rules are non-negotiable', () => {
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/Hard rules \(never override\)/i);
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/Never recommend a spot above the user's skill level/i);
  });

  it('includes the v1 tide-disclaimer addendum', () => {
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/Tide is not factored into v1 scores/i);
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/Do NOT invent tide warnings/i);
  });

  it('forbids inventing data not in the structured input', () => {
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/Never invent information not in the structured data/i);
  });

  it('lists the four output sections', () => {
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/Opening summary/i);
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/Top recommendations/i);
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/What to skip and why/i);
    expect(NARRATION_SYSTEM_PROMPT).toMatch(/Global advisory/i);
  });

  it('is at least 4000 chars (large enough to benefit from prompt caching)', () => {
    // Caching threshold for Sonnet 4.6 is 2048 tokens (~6000 chars). Confirm
    // the prompt is in that ballpark so cache_control on it isn't wasted.
    expect(NARRATION_SYSTEM_PROMPT.length).toBeGreaterThan(4000);
  });
});
