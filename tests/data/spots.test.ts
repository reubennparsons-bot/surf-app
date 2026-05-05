/**
 * Schema sanity tests for data/spots.ts.
 *
 * These exist to catch authoring errors (typos in parent ids, off-by-one
 * counts, invalid degree windows). Real algorithmic behavior is tested in
 * tests/scoring/.
 */

import { describe, it, expect } from 'vitest';
import { spots, spotById } from '@/data/spots';
import type { Spot, SkillLevel } from '@/lib/types';

const NOTABLE_IDS = [
  'bells-beach',
  'winki-pop',
  'gunnamatta',
  'johanna',
  'cape-woolamai',
  'flinders-cyrils',
  'express-point',
  'cape-paterson-f-break',
] as const;

const VALID_SKILLS: SkillLevel[] = ['beginner', 'improver', 'intermediate', 'advanced'];

describe('data/spots.ts — schema sanity', () => {
  it('contains the expected count of entries (27 parents + 12 sub-breaks = 39)', () => {
    const parents = spots.filter((s) => s.parentId === null);
    const subs = spots.filter((s) => s.parentId !== null);
    expect(parents).toHaveLength(27);
    expect(subs).toHaveLength(12);
    expect(spots).toHaveLength(39);
  });

  it('has unique ids', () => {
    const ids = spots.map((s) => s.id);
    const uniq = new Set(ids);
    expect(uniq.size).toBe(ids.length);
  });

  it('every sub-break references a real parent', () => {
    for (const s of spots) {
      if (s.parentId !== null) {
        const parent = spotById.get(s.parentId);
        expect(parent, `sub-break ${s.id} references missing parent ${s.parentId}`).toBeDefined();
        expect(parent!.parentId, `parent ${s.parentId} of ${s.id} is itself a sub-break`).toBeNull();
      }
    }
  });

  it('flags notable=true on exactly the 8 famous spots', () => {
    const notable = spots.filter((s) => s.notable).map((s) => s.id).sort();
    expect(notable).toEqual([...NOTABLE_IDS].sort());
  });

  it('every spot has a valid skill floor', () => {
    for (const s of spots) {
      expect(VALID_SKILLS, `spot ${s.id}`).toContain(s.skillFloor);
    }
  });

  it('working size is well-formed (min < max, both positive)', () => {
    for (const s of spots) {
      expect(s.workingSize.min, `spot ${s.id}`).toBeGreaterThan(0);
      expect(s.workingSize.max, `spot ${s.id}`).toBeGreaterThan(s.workingSize.min);
    }
  });

  it('sweet spot lies within working size', () => {
    for (const s of spots) {
      expect(s.sweetSpot.min, `spot ${s.id} sweet spot below working min`).toBeGreaterThanOrEqual(s.workingSize.min);
      expect(s.sweetSpot.max, `spot ${s.id} sweet spot above working max`).toBeLessThanOrEqual(s.workingSize.max);
      expect(s.sweetSpot.min, `spot ${s.id} sweet spot inverted`).toBeLessThan(s.sweetSpot.max);
    }
  });

  it('swell direction window degrees are in [0, 360]', () => {
    for (const s of spots) {
      const { min, max } = s.optimalSwellDirection;
      expect(min, `spot ${s.id} swell dir min`).toBeGreaterThanOrEqual(0);
      expect(min, `spot ${s.id} swell dir min`).toBeLessThanOrEqual(360);
      expect(max, `spot ${s.id} swell dir max`).toBeGreaterThanOrEqual(0);
      expect(max, `spot ${s.id} swell dir max`).toBeLessThanOrEqual(360);
    }
  });

  it('offshoreDirection in [0, 360] and offshoreBand in [15, 90]', () => {
    for (const s of spots) {
      expect(s.offshoreDirection, `spot ${s.id} offshore dir`).toBeGreaterThanOrEqual(0);
      expect(s.offshoreDirection, `spot ${s.id} offshore dir`).toBeLessThanOrEqual(360);
      expect(s.offshoreBand, `spot ${s.id} offshore band`).toBeGreaterThanOrEqual(15);
      expect(s.offshoreBand, `spot ${s.id} offshore band`).toBeLessThanOrEqual(90);
    }
  });

  it('optimal swell period is at least 6s (windswell floor)', () => {
    for (const s of spots) {
      expect(s.optimalSwellPeriod, `spot ${s.id}`).toBeGreaterThanOrEqual(6);
    }
  });

  it('hazards have non-empty hazard label and description', () => {
    for (const s of spots) {
      for (const h of s.hazards) {
        expect(h.hazard.length, `spot ${s.id} hazard label`).toBeGreaterThan(0);
        expect(h.description.length, `spot ${s.id} hazard description`).toBeGreaterThan(0);
      }
    }
  });

  it('coordinates are within Victoria-ish bounds', () => {
    // Loose bounding box for Victoria's south coast, some buffer.
    for (const s of spots) {
      expect(s.coordinates.lat, `spot ${s.id}`).toBeLessThan(-37.5);
      expect(s.coordinates.lat, `spot ${s.id}`).toBeGreaterThan(-39.5);
      expect(s.coordinates.lng, `spot ${s.id}`).toBeGreaterThan(143);
      expect(s.coordinates.lng, `spot ${s.id}`).toBeLessThan(146.5);
    }
  });

  it('drive-from-Melbourne minutes are positive and plausible (< 5h)', () => {
    for (const s of spots) {
      expect(s.driveFromMelbourneCBDMinutes, `spot ${s.id}`).toBeGreaterThan(0);
      expect(s.driveFromMelbourneCBDMinutes, `spot ${s.id}`).toBeLessThan(300);
    }
  });

  it('parent visibility is "all"; sub-breaks are intermediate_advanced or advanced', () => {
    for (const s of spots) {
      if (s.parentId === null) {
        expect(s.visibility, `parent ${s.id}`).toBe('all');
      } else {
        expect(['intermediate_advanced', 'advanced'], `sub-break ${s.id}`).toContain(s.visibility);
      }
    }
  });

  it('beginner-floor spots are never punishing, and at least 5 are forgiving', () => {
    // Gate 1.7 enforces SKILL_MIN_FORGIVENESS.beginner = ['forgiving'], so
    // there must be at least a handful of forgiving beginner-floor spots
    // or beginners get blocked everywhere.
    const beginnerSpots = spots.filter((s) => s.skillFloor === 'beginner');
    expect(beginnerSpots.length).toBeGreaterThan(0);
    for (const s of beginnerSpots) {
      expect(['forgiving', 'moderate'], `beginner spot ${s.id}`).toContain(s.forgiveness);
    }
    const forgivingBeginnerSpots = beginnerSpots.filter((s) => s.forgiveness === 'forgiving');
    expect(forgivingBeginnerSpots.length, 'need at least 5 forgiving beginner spots').toBeGreaterThanOrEqual(5);
  });
});
