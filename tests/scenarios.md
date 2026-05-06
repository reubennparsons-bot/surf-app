# Manual end-to-end scenarios

These five scenarios are the v1 verification gates from the build plan. Run
them after Phase 6 against a live `npm run dev` server, then again before
shipping in Phase 8 against the Vercel deployment URL.

## Setup

1. **Start the dev server:** `npm run dev` (defaults to `http://localhost:3000`)
2. **Set `ANTHROPIC_API_KEY`** in `.env.local` if you want live Claude
   narration; otherwise the route returns the deterministic fallback
   automatically.
3. Each scenario below is a `curl` invocation. PowerShell users: prefix the
   variable with `$env:` or use `Invoke-RestMethod` (one example shown at
   the bottom).

## Verification gates (must pass before declaring v1 done)

For every scenario, check:

- [ ] HTTP 200 with `{"ok": true, ...}`
- [ ] `result.rankedSpots[]` is sorted descending by `rankingScore`
- [ ] No spot in `rankedSpots` has a `skillFloor` higher than the user's skill
- [ ] Hazards are surfaced in `result.rankedSpots[i].activeHazards` and
      mentioned in `narration` text
- [ ] Total wall-clock time ≤ 8 seconds (target from spec)
- [ ] Tide caveat appears ONLY for spots whose `caveats` array contains it

---

## Scenario 1: Melbourne CBD + intermediate + Saturday

```sh
curl -s -X POST http://localhost:3000/api/recommend \
  -H "content-type: application/json" \
  -d '{
    "location": { "kind": "text", "query": "Melbourne" },
    "skill": "intermediate",
    "timing": { "kind": "today", "timeOfDay": "morning" }
  }' | jq .
```

**Expected:**

- Bells / Winki / Rincon / Point Addis frequently appear when SW swell is in
  window
- Bells Bowl, Cyrils, Express Point, F Break NEVER in `rankedSpots`
  (advanced-only)
- If a notable advanced spot is firing today, it shows in
  `eliminatedSpotsOfNote` with `reason: "skill_below_floor"`
- Drive times in the 90–135 minute range for Surf Coast spots
- `narration` reads as honest practical advice — no "epic", no emoji

---

## Scenario 2: Melbourne CBD + beginner + tomorrow

```sh
curl -s -X POST http://localhost:3000/api/recommend \
  -H "content-type: application/json" \
  -d '{
    "location": { "kind": "text", "query": "Melbourne" },
    "skill": "beginner",
    "timing": { "kind": "tomorrow", "timeOfDay": "morning" }
  }' | jq .
```

**Expected:**

- Top spots come from the forgiving-floor set: Smiths Beach, Sorrento Back,
  Cape Paterson 1st, Apollo Bay, Inverloch (and only when conditions don't
  exceed the 3ft beginner ceiling)
- **Bells NEVER appears under any conditions** — even if the wave is firing
  for advanced. This is the safety-critical gate from Phase 4.
- Anglesea, Torquay Front Beach, Point Leo, Shoreham (beginner-floor but
  moderate forgiveness) should be filtered out by Gate 1.7
- If Bells happens to be working, it should appear in
  `eliminatedSpotsOfNote`
- Narration uses plain language, mentions patrols / sand bottom / safety
  basics

---

## Scenario 3: Geelong + improver + 5 days out

```sh
# Replace ISO date with one ~5 days from today
curl -s -X POST http://localhost:3000/api/recommend \
  -H "content-type: application/json" \
  -d '{
    "location": { "kind": "text", "query": "Geelong" },
    "skill": "improver",
    "timing": { "kind": "specific", "date": "2026-05-10", "timeOfDay": "morning" }
  }' | jq .
```

**Expected:**

- `result.context.forecastHorizonHours` ~120
- Every spot's `certaintyMultiplier` ≤ 0.70 (drives `finalScore` down)
- Narration hedges with "looks like" / "the trend is pointing to" / similar —
  the spec's hard rule #7 fires below 0.70 certainty
- Drive baseline is shorter than Melbourne CBD scenarios (Geelong is closer
  to the Surf Coast)
- Spots that exceed the 5ft improver effective-size ceiling are eliminated
  by Gate 1.7

---

## Scenario 4: Tiny windswell day (advisory test)

Use a coastal location and pick a date that's known to be flat. If the
current forecast is clean, this test won't fire reliably — try mid-summer
afternoon when sea breezes typically nuke conditions.

```sh
curl -s -X POST http://localhost:3000/api/recommend \
  -H "content-type: application/json" \
  -d '{
    "location": { "kind": "text", "query": "Torquay" },
    "skill": "improver",
    "timing": { "kind": "today", "timeOfDay": "morning" }
  }' | jq .
```

**Expected (when conditions are genuinely poor):**

- `result.globalAdvisory` is non-null and reads "nothing's really firing
  today" or similar
- Narration leads with the advisory rather than burying it
- `rankedSpots` may be short or empty
- If empty, `narration` is the deterministic fallback (Claude is skipped
  per the API route's empty-list short-circuit)

---

## Scenario 5: Bells coordinates + advanced + flat day

```sh
curl -s -X POST http://localhost:3000/api/recommend \
  -H "content-type: application/json" \
  -d '{
    "location": { "kind": "coords", "lat": -38.3686, "lng": 144.2814, "name": "Bells Beach" },
    "skill": "advanced",
    "timing": { "kind": "today", "timeOfDay": "morning" }
  }' | jq .
```

**Expected:**

- Baseline drive time near 0 (already at Bells)
- All advanced sub-breaks (Bells Bowl, Bells Little Rincon, Winki Uppers,
  Winki Lowers, Cyrils, etc.) are visible candidates
- On a genuinely flat day, `rankedSpots` may be empty → narration is the
  static "no surfable spots" message and `narrationFallback: true`
- No spots are eliminated by skill (advanced has no skill ceiling)

---

## PowerShell variant

PowerShell doesn't ship with `curl` by default (the `curl` alias points at
`Invoke-WebRequest`, which has different flag semantics). Use
`Invoke-RestMethod` instead:

```powershell
$body = @{
  location = @{ kind = 'text'; query = 'Melbourne' }
  skill = 'intermediate'
  timing = @{ kind = 'today'; timeOfDay = 'morning' }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/recommend' `
  -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 8
```

Or call `scripts/smoke-api.ts` for a pre-canned set of requests.

---

## Failure modes to test

| Input | Expected response |
|---|---|
| Empty body (`-d '{}'`) | `400 { ok: false, error: "invalid_input", ... }` |
| `skill: "expert"` | `400 invalid_input` (must be one of beginner/improver/intermediate/advanced) |
| `location.kind: "text", query: ""` | `400 invalid_input` |
| `location.kind: "text", query: "Mars"` | `400 geocoding_failed` |
| `timing: { kind: "specific", date: "not-a-date", timeOfDay: "morning" }` | `400 invalid_input` |
| `timing: { kind: "today" }` (missing timeOfDay) | `400 invalid_input` |
| Open-Meteo down (mock by spoofing DNS or shutting off internet) | `503 conditions_unavailable` |
