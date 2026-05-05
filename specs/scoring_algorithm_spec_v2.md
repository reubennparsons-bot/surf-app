# Surf Recommendation Scoring Algorithm — v2 Specification

**Purpose:** Defines the deterministic logic that takes live conditions + user input + spot database and produces a ranked list of recommended spots with structured quality data. This is the engine. The AI narration layer wraps this output in natural language.

**Model:** Hierarchical multiplicative scoring (industry-standard, validated against Magicseaweed and Surfline approaches).

**Last updated:** 2026-05-05

---

## Inputs

### Per request, the engine receives:

**User inputs:**
- User location (lat/long, or geocoded from text input)
- User skill level (beginner / improver / intermediate / advanced)
- Session timing (today / tomorrow / specific date+time, e.g. "Saturday morning")

**Live conditions data (per spot, from APIs like Stormglass / Open-Meteo):**
- Primary swell: height (m or ft), period (s), direction (°)
- Secondary swell (if present): height, period, direction
- Wind: speed (kt), direction (°)
- Tide: current state (height + rising/falling), upcoming high/low times
- Forecast horizon (hours ahead)

**Static data (from spot database v2):**
- Full spot profile per database

---

## Architectural model

The algorithm uses **hierarchical multiplicative scoring**, not additive weighting. This matches how Magicseaweed, Surfline, and experienced human forecasters actually reason about surf quality.

The key insight: **swell determines the ceiling, wind determines how much of the ceiling is realized, tide and crowd are minor modifiers.**

```
final_score = swell_quality × wind_factor × tide_factor × crowd_factor × certainty_multiplier
```

Where:
- `swell_quality`: 0-100 (the foundation, can be high or low)
- `wind_factor`: 0.20-1.0 (multiplier — bad wind nukes good swell)
- `tide_factor`: 0.80-1.05 (small modifier)
- `crowd_factor`: 0.80-1.00 (small modifier)
- `certainty_multiplier`: 0.40-1.00 (forecast confidence discount)

**Why this matters in practice:**

- 5ft 14s SW swell + onshore wind: swell_quality = 88, wind_factor = 0.30 → final score ~26. Correctly rated "poor" despite the great swell, because no one wants to surf onshore mush.
- 2ft 7s windswell + perfect offshore: swell_quality = 35, wind_factor = 1.0 → final score ~35. Correctly rated "fair at best" because there's nothing to work with regardless of wind.
- 5ft 14s SW + light NW + perfect tide: swell_quality = 92, wind_factor = 0.98, tide_factor = 1.05 → final score ~95. Correctly rated "firing."

This hierarchical model is mathematically consistent with how surfers think: you don't add wind quality to swell quality — wind multiplies what the swell can deliver.

---

## Layer 1: Hard gates

Hard gates eliminate spots before any scoring occurs. Spot does not appear in results unless surfaced as "what to skip and why" reference.

### Gate 1.1: Skill floor gate
**Rule:** If `user_skill_level < spot.skill_floor`, eliminate.

Skill order: beginner < improver < intermediate < advanced.

Non-negotiable. Cannot be softened. Cyrils stays out for intermediates regardless of conditions.

### Gate 1.2: Swell size gate
**Rule:** If `swell_height < spot.min_working_size` OR `swell_height > spot.max_working_size`, eliminate.

Size considered is *primary swell height*, not significant wave height (which can be inflated by windswell mixing in).

### Gate 1.3: Swell direction gate
**Rule:** If swell direction is more than `30°` outside the spot's optimal window, eliminate.

The 30° tolerance handles "the spot will work but not optimally." Beyond that, the energy is passing the spot by.

**Tunable parameter:** `swell_direction_gate_tolerance` (default: 30°).

### Gate 1.4: Wind gate
**Rule:** If wind direction is onshore (within ±45° of direct onshore at this spot) AND wind speed > `12kt`, eliminate.

Strong onshore is unsurfable mush. Below 12kt onshore is rideable but heavily penalized in scoring.

**Tunable parameter:** `onshore_wind_gate_threshold` (default: 12kt).

### Gate 1.5: Period gate
**Rule:** Conditional on spot type:
- Reef breaks, point breaks: eliminate if period < `8s`
- Beach breaks: eliminate if period < `6s`

Below these thresholds, the swell is local windswell with insufficient energy to break properly at the spot type.

**Tunable parameters:** `reef_period_threshold` (default: 8s), `beach_period_threshold` (default: 6s).

### Gate 1.6: Conditional hazard gates
**Rule:** Spot-specific hazard-condition combinations eliminate the spot.

Examples:
- Bells Bowl at low tide with swell < 2ft: reef showing, dangerous
- Johanna shore break above 5ft for users below advanced: lethal
- Cape Paterson F Break at any size for users below advanced: hidden rocks
- Any spot with strong rip + onshore wind below gate threshold: paddle-out dangerous

Structure: `{condition_check, threshold, applies_to_skill_levels}`.

### Gate 1.7: Skill-conditions mismatch gate (dynamic skill check)
**Rule:** Even if user passes spot's skill floor, eliminate if today's specific conditions exceed user's skill level.

Per-skill condition ceilings:

| Skill | Max effective size | Min forgiveness |
|---|---|---|
| Beginner | 3ft | Forgiving only |
| Improver | 5ft | Forgiving or Moderate |
| Intermediate | 8ft | Any |
| Advanced | No limit | Any |

Note: this uses **effective size** (Layer 2 calculation), not raw swell height. A 4ft swell at 14s creates effectively 6ft+ breaking waves and is intermediate territory at minimum, even though raw size says "improver."

---

## Layer 2: Swell quality score (the ceiling)

For spots that pass all gates, compute swell quality on a 0-100 scale.

### 2.1: Effective size calculation

**Critical concept:** Period multiplies size. A 3ft swell at 14s breaks bigger than a 5ft swell at 7s. The algorithm must compute *effective surf size* before scoring against the spot's sweet spot.

```
period_multiplier = clamp(0.5 + (period - 7) × 0.1, 0.5, 1.6)

effective_size = swell_height × period_multiplier
```

Curve calibration:
- 6s period: multiplier 0.5 (windswell, breaks smaller than nominal)
- 8s: 0.6
- 10s: 0.8
- 12s: 1.0 (nominal)
- 14s: 1.2
- 16s: 1.4
- 18s+: 1.6 (maxes out — diminishing returns)

This is the surfer-known fact: "2ft @ 15s breaks bigger than 4ft @ 7s." Effective size captures this.

**Tunable parameters:** the curve coefficients.

### 2.2: Three sub-components of swell quality

**Direction match score (0-100):**
Score how aligned the swell is with the spot's optimal window.

```
center_of_window = (window_min + window_max) / 2
distance_from_center = |swell_direction - center_of_window|
half_window_width = (window_max - window_min) / 2

if distance_from_center ≤ half_window_width:
    direction_score = 100 - (distance_from_center / half_window_width) × 20
    # 100 at center, 80 at window edge
else:
    overshoot = distance_from_center - half_window_width
    direction_score = max(20, 80 - overshoot × 2)
    # falls off rapidly outside window, gate eliminates beyond 30°
```

**Period quality score (0-100):**
How clean and powerful is the swell energy?

```
if period < 8: period_score = 30 + (period - 6) × 15  # 30 at 6s, 60 at 8s
elif period < 12: period_score = 60 + (period - 8) × 7.5  # 60 at 8s, 90 at 12s
elif period < 16: period_score = 90 + (period - 12) × 2.5  # 90 at 12s, 100 at 16s
else: period_score = 100  # 16s+ is peak
```

**Size sweet-spot score (0-100):**
Score `effective_size` against the spot's sweet-spot range.

```
if effective_size in spot.sweet_spot_range:
    size_score = 100
else:
    distance_from_sweet_spot = min distance to nearest edge of sweet spot
    if distance is "below" sweet spot:
        # Too small but rideable
        size_score = max(40, 100 - distance × 15)
    else:
        # Too big but rideable
        size_score = max(40, 100 - distance × 12)
```

### 2.3: Combining into swell quality

```
swell_quality = (direction_score × 0.45) + (period_score × 0.35) + (size_score × 0.20)
```

**Why these sub-weights:**

Direction at 45% — if direction's wrong, nothing else matters. The gate already eliminated truly bad direction; this rewards being centered in the window.

Period at 35% — period is the quality multiplier on the surf experience. Industry consensus is unanimous on its importance.

Size at 20% — size matters less than direction and period because effective size already accounts for period. We don't double-count.

**Tunable parameters:** sub-component weights.

---

## Layer 3: Wind factor (the multiplier)

Wind is a multiplier on swell quality, not a separate score. Bad wind nukes good swell. Good wind doesn't elevate bad swell.

### 3.1: Wind direction component

Compute angular distance from spot's offshore direction:

```
angular_distance = |wind_direction - spot.offshore_direction|
if angular_distance > 180: angular_distance = 360 - angular_distance
```

Map to direction factor:

| Angular distance from offshore | Wind classification | Direction factor |
|---|---|---|
| 0-30° | Direct/cross-offshore | 1.00 |
| 30-60° | Cross-offshore | 0.92 |
| 60-90° | Cross-shore | 0.75 |
| 90-120° | Cross-onshore | 0.55 |
| 120-150° | Strong cross-onshore | 0.35 |
| 150-180° | Direct onshore | 0.20 (gate-adjacent) |

### 3.2: Wind strength component

For offshore winds (angular distance < 90°):

| Wind speed (kt) | Strength factor |
|---|---|
| 0-3 (glassy) | 0.95 |
| 3-12 (light offshore) | 1.00 |
| 12-18 (moderate offshore) | 0.92 |
| 18-25 (strong offshore) | 0.75 |
| 25+ (very strong offshore) | 0.55 |

For cross-shore and onshore winds, strength factor is more punishing:

| Wind speed (kt) | Cross-shore | Onshore |
|---|---|---|
| 0-5 | 1.00 | 1.00 |
| 5-10 | 0.90 | 0.85 |
| 10-15 | 0.80 | 0.65 |
| 15-20 | 0.65 | 0.45 |
| 20+ | 0.45 | gate eliminates |

### 3.3: Combining into wind factor

```
wind_factor = direction_factor × strength_factor
```

Wind factor is in the range 0.20-1.00. It directly multiplies swell quality.

**Wind history modifier (optional, requires hourly history):**
If wind has been onshore in previous 2-3 hours and just turned offshore, water surface is still chopped. Apply additional penalty:

```
wind_factor *= 0.90  # for first hour of cleanup
wind_factor *= 0.95  # for second hour
```

**Tunable parameters:** all factor mappings, history penalty values.

---

## Layer 4: Tide factor (modifier, 0.80-1.05)

Tide is a smaller modifier — important but not dominant.

### 4.1: Tide-state matching

Each spot's database entry specifies tide preference and sensitivity.

**Low sensitivity spots** (works all tides):
```
tide_factor = 1.00
```

**Medium sensitivity spots:**
```
if current_tide in preferred_window: tide_factor = 1.02
elif current_tide adjacent to preferred: tide_factor = 0.95
else: tide_factor = 0.85
```

**High sensitivity spots:**
```
if current_tide in preferred_window: tide_factor = 1.05
elif current_tide adjacent to preferred: tide_factor = 0.88
else: tide_factor = 0.80
```

### 4.2: Tide trajectory bonus

If tide is moving *toward* preferred window (rising into a high-tide spot, falling into a low-tide spot), boost factor by 0.03. Rewards sessions timed at the start of a good window.

If tide is moving *away* from preferred window, apply 0.03 penalty.

**Tunable parameters:** the tide factor values per sensitivity level.

---

## Layer 5: Crowd factor (modifier, 0.80-1.00)

Crowds reduce session quality. Capped impact, never dominant.

### 5.1: Base crowd factor

| Spot crowd factor (database) | Base factor |
|---|---|
| Low | 1.00 |
| Medium | 0.95 |
| High | 0.88 |
| Very high | 0.80 |

### 5.2: Crowd modifiers

Crowd amplifiers stack:

- Weekend session: subtract 0.04
- School holidays: subtract 0.04
- Pristine conditions everywhere: subtract 0.03 (everyone's coming out)
- Pristine at this specific spot: subtract 0.05 (this spot specifically gets crushed)
- Dawn session (before 7am): add 0.05 (less crowd)
- Sunset session (last hour of light): add 0.03

Final crowd factor capped at 1.00 (no positive boost beyond no-impact) and 0.70 (worst case still doesn't fully nuke).

### 5.3: Skill-relative crowd risk

For beginners and improvers, "very high" crowd is dangerous (drop-ins from people who don't know what they're doing). Apply additional 0.05 penalty for these skill levels at high-crowd spots.

For advanced surfers, crowd is competition, not danger. No additional penalty beyond base.

**Tunable parameters:** all modifier values.

---

## Layer 6: Certainty multiplier

Forecast accuracy degrades with horizon.

| Hours ahead | Multiplier |
|---|---|
| 0-12h | 1.00 |
| 12-36h | 0.95 |
| 36-72h | 0.85 |
| 72-120h | 0.70 |
| 120-168h | 0.55 |
| 168h+ | 0.40 |

**Effect in practice:**
A "firing" 95-score session 5 days out becomes 95 × 0.55 = 52, ranking below a "good" 75-score session tomorrow at 75 × 0.95 = 71. The algorithm honestly weights certainty.

For sessions far out (>3 days), the narration layer should communicate at the *region* level rather than the spot level, since direction/wind shifts will move the call.

**Tunable parameter:** the multiplier curve.

---

## Layer 7: Drive time adjustment

Drive time adjusts *ranking*, not raw score. Capped at 15 points off effective ranking.

### 7.1: Compute baseline drive

Find user's nearest viable spot (any spot that passed all gates). That drive time is `baseline_drive_minutes`.

### 7.2: Compute extra drive per spot

```
extra_minutes = max(0, spot_drive_minutes - baseline_drive_minutes)
```

Nearest qualifying spot has 0 extra minutes (no penalty). All others penalized by how much further.

### 7.3: Apply square-root curve

```
drive_penalty_factor = sqrt(extra_minutes / 60)
drive_penalty_points = min(15, drive_penalty_factor × 8)
```

Cap at 15 points ensures drive time is a tiebreaker, not a deciding factor. A meaningfully better wave further away still wins.

### 7.4: Apply to ranking

```
ranking_score = final_score - drive_penalty_points
```

Spots are ordered by `ranking_score`, but `final_score` is what's reported as the quality rating to the user.

### 7.5: Worked examples

User in Melbourne CBD, baseline = 90 min:

| Spot | Drive | Extra min | Penalty |
|---|---|---|---|
| Torquay Front Beach | 90 | 0 | 0 |
| Bells | 105 | 15 | 4 |
| Cape Woolamai | 120 | 30 | 5.7 |
| Johanna | 210 | 120 | 11.3 |
| Anything 3.5h+ extra | | 210+ | 15 (capped) |

User in Torquay, baseline = 5 min:

| Spot | Drive | Extra min | Penalty |
|---|---|---|---|
| Torquay Front Beach | 5 | 0 | 0 |
| Bells | 15 | 10 | 3.3 |
| Cape Woolamai | 120 | 115 | 11.1 |
| Johanna | 210 | 205 | 14.8 |

Same algorithm, different feel based on user location.

**Tunable parameters:** cap (default 15), coefficient (default 8), curve shape.

---

## Layer 8: Composite final score

Putting it all together:

```
swell_quality = compute_swell_quality(swell_data, spot)         # 0-100
wind_factor = compute_wind_factor(wind_data, spot)               # 0.20-1.00
tide_factor = compute_tide_factor(tide_data, spot)               # 0.80-1.05
crowd_factor = compute_crowd_factor(spot, time_context, skill)   # 0.70-1.00
certainty_multiplier = compute_certainty(forecast_horizon)        # 0.40-1.00

final_score = swell_quality × wind_factor × tide_factor × crowd_factor × certainty_multiplier

# Clamp to 0-100
final_score = clamp(final_score, 0, 100)

# Apply drive time for ranking only
ranking_score = final_score - drive_penalty_points
```

### 8.1: Secondary factors (post-multiplication adjustments)

Applied as small adjustments to `final_score`:

**Cross-swell penalty:**
If a meaningful secondary swell exists from a different direction (>30° offset from primary):
- At exposed beach breaks: subtract 5-10 points (creates messy peaks)
- At points and reefs: subtract 2-5 points (filters mostly to dominant direction)

**Sea breeze risk:**
For afternoon sessions in summer at exposed Surf Coast / Mornington Peninsula spots, if forecast wind looks marginal: subtract 5 points and surface as caveat.

**Variability uncertainty:**
For spots with high variability rating (sandbank-dependent beach breaks): no score change, but reduce confidence indicator and surface as caveat.

### 8.2: "Firing" detection

Mark spot as `firing` if all conditions met:
- `swell_quality > 88`
- `wind_factor > 0.92`  
- `tide_factor >= 1.00`
- `final_score > 85`

This requires genuine alignment across multiple factors — a rare occurrence the narration layer can highlight specifically.

---

## Quality category mapping

Translation from `final_score` to user-facing category:

| Score | Category |
|---|---|
| 0-30 | Poor |
| 30-50 | Fair |
| 50-70 | Good |
| 70-85 | Very good |
| 85+ AND firing flag | Firing |

For beginners and improvers, language adjusts at the narration layer. A "very good" session for an improver is genuinely good for that skill level. The underlying score doesn't change.

---

## Output structure

The engine returns structured data the narration layer renders into language.

### Per-spot data:

```
{
  spot_id: string,
  spot_name: string,
  region: string,
  drive_minutes: int,
  extra_drive_minutes: int,
  
  swell_quality: float (0-100),
  wind_factor: float (0.20-1.00),
  tide_factor: float (0.80-1.05),
  crowd_factor: float (0.70-1.00),
  certainty_multiplier: float (0.40-1.00),
  
  final_score: float (0-100, post-everything),
  ranking_score: float (final_score minus drive penalty),
  
  quality_category: enum { poor, fair, good, very_good, firing },
  is_firing: bool,
  
  effective_size: float (computed wave size at spot),
  active_sub_break: string | null,
  
  active_hazards: [{
    hazard: string,
    severity: enum { caution, warning, danger },
    reason: string
  }],
  
  caveats: [string],
  
  conditions_summary: {
    swell_height: float,
    swell_period: float,
    swell_direction: int,
    wind_speed: float,
    wind_direction: int,
    tide_state: string,
    forecast_horizon_hours: int,
  }
}
```

### List-level data:

```
{
  user_skill_level: string,
  session_timing: string,
  user_location: { name, lat, lng },
  baseline_drive_minutes: int,
  
  ranked_spots: [per-spot data, sorted by ranking_score desc],
  
  eliminated_spots_of_note: [{
    spot_name: string,
    reason: string,
    skill_appropriate: bool
  }],
  
  global_advisory: string | null
}
```

`eliminated_spots_of_note` powers "what to skip and why" — surfaces famous spots that would tempt the user but are wrong for them today (e.g. "Bells is firing for advanced surfers but exceeds your level today").

`global_advisory` handles the "nothing's good today" case — surfaces honestly when conditions are marginal everywhere.

---

## Tunable parameters reference

Every threshold should be a configurable parameter, not hardcoded.

### Gates
- `swell_direction_gate_tolerance` (default: 30°)
- `onshore_wind_gate_threshold` (default: 12kt)
- `reef_period_threshold` (default: 8s)
- `beach_period_threshold` (default: 6s)
- Skill-conditions ceilings (3/5/8/no-limit ft per skill)
- Forgiveness mappings per skill

### Swell quality
- Period multiplier curve coefficients
- Direction match curve shape
- Sub-component weights (direction 45%, period 35%, size 20%)

### Wind factor
- All direction factor mappings
- All strength factor mappings  
- Wind history penalty values

### Tide factor
- Sensitivity-level factor values
- Trajectory bonus/penalty values

### Crowd factor
- Base factors per crowd level
- All modifier values

### Certainty
- Multiplier curve per hour-range

### Drive time
- Penalty cap (default 15)
- Curve coefficient (default 8)
- Curve shape (square root)

---

## Design principles enforced

1. **Hierarchical, not additive.** Swell is the foundation, wind multiplies, tide and crowd nudge. Reflects how surfers actually think.

2. **Period multiplies size.** "2ft at 15s breaks bigger than 4ft at 7s" — captured via `effective_size`.

3. **Bad wind nukes good swell.** Multiplicative model means onshore wind correctly destroys the score regardless of swell quality.

4. **Skill is dynamic.** Spot floor + condition ceiling + hazard activation, all checked per session.

5. **Forecast certainty is honest.** Aggressive discount for far-out forecasts.

6. **Drive time is a tiebreaker.** Capped at 15 points, baseline-relative.

7. **Hazards are conditional.** Only activated by today's conditions.

8. **Output is structured.** Numbers, flags, categories. Narration layer interprets.

9. **Everything tunable is parameterized.** No magic numbers buried in code.

---

## What this spec does NOT cover (deliberately)

- The narration layer prompt (separate spec, drafted next)
- UI layout
- API integration details (which provider, caching, refresh cadence)
- User accounts and preferences (out of scope for v1)
- Real-time spot status flags (closures, sandbank reports — v2 enhancement)

---

## Validation against industry standards

This algorithm aligns with:

- **Magicseaweed's solid-stars-faded-stars model:** swell determines base rating, wind reduces it. Our hierarchical multiplication is the mathematical generalization.
- **Surfline's data inputs:** primary factors are surf height (which we compute as effective_size), period, direction, and wind. Tide and spot dynamics are secondary.
- **NOAA / oceanographic consensus:** period is a force multiplier on energy, not just one factor among many.
- **Surf forecaster heuristics:** "swell direction has to be right or nothing else matters" → our direction gate. "Long period beats high height" → our period multiplier. "Bad wind ruins good swell" → our multiplicative model.

We are not reinventing the wheel. We are implementing the industry-standard model in a way that's transparent, tunable, and skill-level-aware.
