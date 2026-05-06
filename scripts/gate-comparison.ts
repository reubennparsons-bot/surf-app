/**
 * Gate-impact comparison: for each spot × representative (Hs, T) pair, list
 * any case where Gate 1.7 (skill-size ceiling) result flips between the OLD
 * linear period-multiplier formula and the NEW Komar-Gaughan formula.
 *
 * Run with:  npx tsx scripts/gate-comparison.ts
 *
 * Output: a markdown table of per-skill flips, intended to be pasted into
 * the Komar-Gaughan commit message for sanity review before merge.
 */

import { spots as ALL_SPOTS } from '@/data/spots';
import { breakerHeightFt } from '@/lib/scoring/effectiveSize';
import { SKILL_SIZE_CEILING_FT, SKILL_MIN_FORGIVENESS } from '@/lib/config';
import type { SkillLevel } from '@/lib/types';

const SKILLS: SkillLevel[] = ['beginner', 'improver', 'intermediate'];

// Representative (Hs, T) pairs typical of Vic conditions across the year.
const SCENARIOS: { hs: number; t: number }[] = [
  { hs: 1.5, t: 8 },
  { hs: 2,   t: 10 },
  { hs: 2.5, t: 12 },
  { hs: 3,   t: 10 },
  { hs: 3,   t: 14 },
  { hs: 4,   t: 10 },
  { hs: 4,   t: 14 },
  { hs: 5,   t: 12 },
  { hs: 5,   t: 14 },
  { hs: 6,   t: 14 },
  { hs: 8,   t: 16 },
];

function oldEffectiveSize(hs: number, t: number): number {
  const raw = 0.5 + (t - 7) * 0.1;
  const mult = Math.max(0.5, Math.min(1.6, raw));
  return hs * mult;
}

function gate17(spot: typeof ALL_SPOTS[number], skill: SkillLevel, eff: number): 'pass' | 'fail' {
  const ceiling = SKILL_SIZE_CEILING_FT[skill];
  if (eff > ceiling) return 'fail';
  const allowed = SKILL_MIN_FORGIVENESS[skill];
  if (!allowed.includes(spot.forgiveness)) return 'fail';
  return 'pass';
}

interface Flip {
  spotId: string;
  skill: SkillLevel;
  hs: number;
  t: number;
  oldEff: number;
  newEff: number;
  oldResult: 'pass' | 'fail';
  newResult: 'pass' | 'fail';
}

const flips: Flip[] = [];
let totalCases = 0;

for (const spot of ALL_SPOTS) {
  for (const skill of SKILLS) {
    for (const sc of SCENARIOS) {
      totalCases++;
      const oldEff = oldEffectiveSize(sc.hs, sc.t);
      const newEff = breakerHeightFt(sc.hs, sc.t);
      const oldR = gate17(spot, skill, oldEff);
      const newR = gate17(spot, skill, newEff);
      if (oldR !== newR) {
        flips.push({
          spotId: spot.id,
          skill,
          hs: sc.hs,
          t: sc.t,
          oldEff,
          newEff,
          oldResult: oldR,
          newResult: newR,
        });
      }
    }
  }
}

// Group by direction of flip.
const passToFail = flips.filter(f => f.oldResult === 'pass' && f.newResult === 'fail');
const failToPass = flips.filter(f => f.oldResult === 'fail' && f.newResult === 'pass');

console.log(`# Gate 1.7 impact — Komar-Gaughan vs old linear formula\n`);
console.log(`Tested ${totalCases} (spot × skill × condition) cases across ${ALL_SPOTS.length} spots, ${SKILLS.length} non-advanced skills, ${SCENARIOS.length} scenarios.\n`);
console.log(`- **Newly gated (was pass, now fail):** ${passToFail.length}`);
console.log(`- **Newly admitted (was fail, now pass):** ${failToPass.length}`);
console.log(``);

// Cap noisy lists — the per-skill ceiling causes the same flip across many
// spots in identical conditions. Group by (skill, hs, t) and show one row
// with the count of affected spots.
function summarise(rows: Flip[]): { skill: SkillLevel; hs: number; t: number; oldEff: number; newEff: number; spotCount: number }[] {
  const buckets = new Map<string, { skill: SkillLevel; hs: number; t: number; oldEff: number; newEff: number; spotCount: number }>();
  for (const f of rows) {
    const key = `${f.skill}|${f.hs}|${f.t}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.spotCount++;
    } else {
      buckets.set(key, { skill: f.skill, hs: f.hs, t: f.t, oldEff: f.oldEff, newEff: f.newEff, spotCount: 1 });
    }
  }
  return [...buckets.values()].sort((a, b) =>
    a.skill === b.skill ? (a.hs === b.hs ? a.t - b.t : a.hs - b.hs) : a.skill.localeCompare(b.skill),
  );
}

function summaryTable(rows: ReturnType<typeof summarise>, title: string) {
  if (rows.length === 0) {
    console.log(`## ${title}\n\n_(none)_\n`);
    return;
  }
  console.log(`## ${title}\n`);
  console.log(`| skill | Hs (ft) | T (s) | old eff | new eff | # spots affected |`);
  console.log(`|---|--:|--:|--:|--:|--:|`);
  for (const r of rows) {
    console.log(`| ${r.skill} | ${r.hs} | ${r.t} | ${r.oldEff.toFixed(2)} | ${r.newEff.toFixed(2)} | ${r.spotCount} |`);
  }
  console.log(``);
}

summaryTable(summarise(passToFail), 'Newly gated: was pass → now fail (grouped)');
summaryTable(summarise(failToPass), 'Newly admitted: was fail → now pass (grouped)');
