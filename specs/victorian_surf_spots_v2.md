# Victorian Surf Spot Database — v2

**Purpose:** Static spot DNA for the surf recommendation tool. The AI combines this with live conditions to determine per-session skill suitability dynamically.

**Sources cross-referenced:** Surfline, Surf-Forecast, Swellnet (community), Parks Victoria, Visit Victoria, local surf guides, Surfer Magazine spot mechanics articles.

**Last updated:** 2026-05-05

---

## Skill level model

Four user skill levels:
- **Beginner** — Foam/soft top, whitewater, lessons. Standing up on small waves.
- **Improver** — Catching unbroken waves, learning turns. Confident waist-to-chest high beach breaks.
- **Intermediate** — Comfortable head-high. Reads lineup, handles moderate rips, ready for less-crowded reefs.
- **Advanced** — Overhead surf, reef breaks, powerful waves, heavy crowds.

The database does NOT pre-categorize spots into skill levels. Instead, the AI computes per-session skill suitability by combining:

1. **Spot inherent characteristics** (below)
2. **Today's live conditions** (size, period, wind, tide)
3. **User's skill level**

A spot may be improver-friendly on a 2ft day and advanced-only on an 8ft day. The system reasons accordingly.

## Spot characteristic fields

- **Baseline difficulty** (Low / Moderate / High / Expert): how challenging when conditions are typical for this spot
- **Forgiveness** (Forgiving / Moderate / Punishing): wipeout consequences — sand+deep is forgiving, shallow reef is punishing
- **Size sensitivity** (Linear / Steep): how fast the spot escalates with size — Smiths gets harder gradually, Johanna's shore break becomes deadly above a threshold
- **Skill floor** — the absolute minimum skill level this spot can ever accept, even on its smallest, cleanest day. Below this, never recommend.
- **Hazard profile** — list of hazards with conditions that activate/amplify them
- **Sub-break visibility** — `all` / `intermediate_advanced` / `advanced` (controls who sees this entry in candidate ranking)

## Tiered sub-break logic

- `all` — parent spot, visible to all skill levels
- `intermediate_advanced` — sub-breaks shown only to intermediate/advanced
- `advanced` — expert-only sub-breaks (e.g. Bells Bowl, Cyrils, F Break)

Beginners and improvers never see expert sub-breaks as candidates.

---

## SURF COAST REGION

### 1. Bells Beach
- **Region:** Surf Coast
- **Coordinates:** -38.3686, 144.2814
- **Break type:** Right-hand point break, rock reef with sand
- **Wave size range:** 3-15ft+ (sweet spot 4-8ft)
- **Optimal swell direction:** SW, ideally 196-215° (SSW)
- **Optimal swell period:** 12s+ (15s+ ideal for proper Bells)
- **Optimal wind:** N to NW (offshore). NE wind is the "devil wind"
- **Wind tolerance:** Light only, unsurfable above ~15kt
- **Tide:** Different sub-breaks favor different tides
- **Baseline difficulty:** High
- **Forgiveness:** Punishing (shallow reef sections, strong currents)
- **Size sensitivity:** Steep (gets significantly harder above 6ft)
- **Skill floor:** Intermediate (and only on small, clean days)
- **Hazard profile:**
  - Strong rips — worse on lower tides and bigger swells
  - Rocky bottom, shallow sections at low tide
  - Crowd extreme on quality days (drop-ins, vibe)
  - Moderate-high localism
  - Sea breeze blow-out by midday in summer
- **Visibility:** all (parent), sub-breaks below
- **Crowd factor:** Very high any quality day
- **Parking:** Large clifftop carparks
- **Access:** Stair access, 5min walk
- **Best season:** Autumn-Winter (April-August)
- **Drive from Melbourne CBD:** ~1h 45min
- **Consistency:** High
- **Variability:** Low (reef-stabilized)
- **Notes:** Site of Rip Curl Pro since 1961. "Heaps overrated for average surfer" per local consensus — Winki next door often more fun. Often blown out by sea breezes by midday in summer.

### 1a. Bells — The Bowl
- **Parent:** Bells Beach
- **Visibility:** advanced
- **Break type:** Right-hand reef break (main Bells section)
- **Wave size range:** 3-15ft, sweet spot 4-10ft
- **Optimal swell direction:** SSW 196-215°
- **Optimal swell period:** 12s+ (15s+ ideal)
- **Optimal wind:** WNW to NW
- **Tide:** Low to mid (jacks up over shallow reef on lower tides)
- **Baseline difficulty:** Expert
- **Forgiveness:** Punishing
- **Size sensitivity:** Steep
- **Skill floor:** Advanced
- **Hazard profile:** Heavy thick lip, shallow reef, strong currents, intense crowd
- **Notes:** Where the Rip Curl Pro contest runs. Powerful, demands commitment.

### 1b. Bells — Rincon
- **Parent:** Bells Beach
- **Visibility:** intermediate_advanced
- **Break type:** Right-hand reef break (inside section)
- **Wave size range:** 2-6ft
- **Optimal swell direction:** S to SSW
- **Optimal swell period:** 10s+
- **Optimal wind:** N to NW
- **Tide:** High tide (works as Bowl backs off)
- **Baseline difficulty:** High
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Intermediate
- **Hazard profile:** Rocks, rips, crowd
- **Notes:** Longer, more workable wave than the Bowl. Better choice when Bowl is too heavy.

### 1c. Bells — Little Rincon
- **Parent:** Bells Beach
- **Visibility:** advanced
- **Break type:** Right-hand reef break (off the cliff)
- **Wave size range:** 3-8ft
- **Optimal swell direction:** Straight S
- **Optimal swell period:** 12s+
- **Optimal wind:** NW
- **Tide:** Mid to high
- **Baseline difficulty:** Expert
- **Forgiveness:** Punishing
- **Size sensitivity:** Steep
- **Skill floor:** Advanced
- **Hazard profile:** Vertical/hollow wave, fast and sectiony, rocks
- **Notes:** Lights up on south swells.

### 2. Winki Pop
- **Region:** Surf Coast
- **Coordinates:** -38.3700, 144.2870
- **Break type:** Right-hand reef/point break
- **Wave size range:** 2-12ft (sweet spot 3-6ft)
- **Optimal swell direction:** SW (handles slightly more westerly swells than Bells)
- **Optimal swell period:** 10s+
- **Optimal wind:** N to NW
- **Wind tolerance:** Light to moderate
- **Tide:** Most tides
- **Baseline difficulty:** High
- **Forgiveness:** Punishing (urchins, rocks)
- **Size sensitivity:** Linear
- **Skill floor:** Intermediate (smaller days only)
- **Hazard profile:** Urchins, rocks, rips, very crowded, moderate-high localism
- **Visibility:** all
- **Crowd factor:** Very high
- **Parking:** Same as Bells
- **Access:** Walk from Bells carpark
- **Best season:** Autumn-Winter (peak August)
- **Drive from Melbourne CBD:** ~1h 45min
- **Consistency:** High
- **Variability:** Low
- **Notes:** High-performance wave, often more fun than Bells.

### 2a. Winki — Uppers
- **Parent:** Winki Pop
- **Visibility:** advanced
- **Break type:** Right-hand reef (top of point)
- **Wave size range:** 2-8ft
- **Optimal swell direction:** SW
- **Optimal wind:** NW
- **Tide:** Most tides
- **Baseline difficulty:** High
- **Forgiveness:** Punishing
- **Size sensitivity:** Linear
- **Skill floor:** Advanced
- **Notes:** Classic down-the-line wave.

### 2b. Winki — Lowers
- **Parent:** Winki Pop
- **Visibility:** advanced
- **Break type:** Right-hand reef (towards Torquay)
- **Wave size range:** 2-8ft
- **Optimal swell direction:** SW
- **Optimal wind:** NW
- **Tide:** Mid to high
- **Baseline difficulty:** Expert
- **Forgiveness:** Punishing
- **Size sensitivity:** Linear
- **Skill floor:** Advanced
- **Notes:** Hollower, faster than Uppers. Resembles J-Bay on its day.

### 3. Jan Juc
- **Region:** Surf Coast
- **Coordinates:** -38.3500, 144.3050
- **Break type:** Beach break (sand)
- **Wave size range:** 1-6ft (best 2-4ft)
- **Optimal swell direction:** SW
- **Optimal swell period:** 8s+
- **Optimal wind:** NW
- **Wind tolerance:** Moderate
- **Tide:** All tides
- **Baseline difficulty:** Moderate
- **Forgiveness:** Moderate (sand bottom but rips)
- **Size sensitivity:** Linear
- **Skill floor:** Improver (beginner on very small clean days only)
- **Hazard profile:** Rips can be dangerous, sandbanks shift, Bird Rock at western end
- **Visibility:** all
- **Crowd factor:** High (backup spot when reefs are off)
- **Parking:** Plenty along beachfront
- **Access:** Easy, short walk
- **Best season:** Year-round, peak August
- **Drive from Melbourne CBD:** ~1h 40min
- **Consistency:** Very high
- **Variability:** Medium-High (sandbank dependent)
- **Notes:** In front of Torquay golf club. Closest decent beach break to Torquay reefs.

### 4. Torquay Point (Front Beach)
- **Region:** Surf Coast
- **Coordinates:** -38.3380, 144.3270
- **Break type:** Reef and point break (left and right)
- **Wave size range:** 1-5ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 8s+
- **Optimal wind:** NW
- **Wind tolerance:** Moderate
- **Tide:** Mid tide
- **Baseline difficulty:** Low-Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Beginner (on small clean days)
- **Hazard profile:** Rips, rocks
- **Visibility:** all
- **Crowd factor:** High
- **Parking:** Front Beach carpark
- **Access:** Direct from carpark
- **Best season:** Year-round
- **Drive from Melbourne CBD:** ~1h 35min
- **Consistency:** High
- **Variability:** Low
- **Notes:** Good fallback when bigger spots are blown out. Family-friendly area.

### 5. Point Addis
- **Region:** Surf Coast
- **Coordinates:** -38.4020, 144.2700
- **Break type:** Reef break (left and right options)
- **Wave size range:** 2-8ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 10s+
- **Optimal wind:** NW (some shelter from SW)
- **Wind tolerance:** Moderate
- **Tide:** Mid tide rising
- **Baseline difficulty:** Moderate-High
- **Forgiveness:** Moderate-Punishing (rocks)
- **Size sensitivity:** Linear
- **Skill floor:** Improver (small clean days), Intermediate generally
- **Hazard profile:** Rips, rocks
- **Visibility:** all
- **Crowd factor:** Medium-High
- **Parking:** Cliff-top carpark
- **Access:** Steps down cliff, longer walk
- **Best season:** Winter (peak July)
- **Drive from Melbourne CBD:** ~1h 50min
- **Consistency:** High
- **Variability:** Low
- **Notes:** Choice of left and right reefs. Less crowded than Bells/Winki.

### 6. Anglesea
- **Region:** Surf Coast
- **Coordinates:** -38.4080, 144.1870
- **Break type:** Beach break
- **Wave size range:** 1-5ft
- **Optimal swell direction:** SSE (more easterly than other Surf Coast spots)
- **Optimal swell period:** 8s+
- **Optimal wind:** NW
- **Wind tolerance:** Moderate
- **Tide:** Mid tide
- **Baseline difficulty:** Low-Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Beginner (small days, patrolled summer)
- **Hazard profile:** Submerged groyne (real risk), rips
- **Visibility:** all
- **Crowd factor:** Medium
- **Parking:** Town beachfront
- **Access:** Direct from main street
- **Best season:** Year-round
- **Drive from Melbourne CBD:** ~1h 50min
- **Consistency:** High but often small
- **Variability:** Medium-High (sandbanks)
- **Notes:** Beach breaks favour rights.

### 7. Fairhaven
- **Region:** Surf Coast
- **Coordinates:** -38.4660, 144.0820
- **Break type:** Beach break (long stretch)
- **Wave size range:** 2-6ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 9s+
- **Optimal wind:** NW
- **Wind tolerance:** Moderate
- **Tide:** Most tides depending on banks
- **Baseline difficulty:** Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Improver (small days)
- **Hazard profile:** Rips, exposure to wind
- **Visibility:** all
- **Crowd factor:** Low-Medium
- **Parking:** Multiple carparks
- **Access:** Easy
- **Best season:** Autumn-Winter
- **Drive from Melbourne CBD:** ~2h
- **Consistency:** High
- **Variability:** High (sandbanks shift)
- **Notes:** Long beach with many peaks, room to spread out.

### 8. Lorne Point
- **Region:** Surf Coast / Otway Coast
- **Coordinates:** -38.5410, 143.9830
- **Break type:** Right-hand point break
- **Wave size range:** 2-8ft
- **Optimal swell direction:** SW (needs size to wrap into Loutit Bay)
- **Optimal swell period:** 12s+
- **Optimal wind:** NW (sheltered from W)
- **Wind tolerance:** Moderate-High (sheltered)
- **Tide:** Mid-high
- **Baseline difficulty:** Moderate-High
- **Forgiveness:** Moderate-Punishing (rocks)
- **Size sensitivity:** Linear
- **Skill floor:** Improver (small clean days), Intermediate generally
- **Hazard profile:** Rocks, rips when bigger
- **Visibility:** all
- **Crowd factor:** Medium-High when working
- **Parking:** Town carparks
- **Access:** Easy
- **Best season:** Winter
- **Drive from Melbourne CBD:** ~2h 15min
- **Consistency:** Medium (needs decent swell)
- **Variability:** Low
- **Notes:** Lorne Front Beach (separate spot, on Loutit Bay) is good for absolute beginners — patrolled, small waves.

### 9. Johanna Beach
- **Region:** Otway Coast / Shipwreck Coast
- **Coordinates:** -38.7560, 143.3890
- **Break type:** Beach break (powerful, sand+reef sections)
- **Wave size range:** 2-15ft (handles big swell)
- **Optimal swell direction:** SW
- **Optimal swell period:** 10s+
- **Optimal wind:** N to NE
- **Wind tolerance:** Moderate
- **Tide:** Sandbank dependent
- **Baseline difficulty:** High
- **Forgiveness:** Punishing (brutal shore break, deep water close to shore)
- **Size sensitivity:** Steep (becomes deadly above ~5ft)
- **Skill floor:** Intermediate (very small days only), Advanced generally
- **Hazard profile:** Brutal shore break, ripping currents, deep water close to shore, very remote (no quick rescue)
- **Visibility:** all
- **Crowd factor:** Low (remote)
- **Parking:** Beach carpark and campground
- **Access:** Stairs down to beach
- **Best season:** Autumn-Winter
- **Drive from Melbourne CBD:** ~3h 30min
- **Consistency:** Very High (swell magnet)
- **Variability:** High (sandbanks)
- **Notes:** Backup venue for Rip Curl Pro when Bells flat (2007, 2010). Hosted World Championships 1970.

---

## MORNINGTON PENINSULA

### 10. Gunnamatta
- **Region:** Mornington Peninsula
- **Coordinates:** -38.4760, 144.8730
- **Break type:** Beach break (powerful, with reef sections)
- **Wave size range:** 2-10ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 10s+
- **Optimal wind:** N to NE
- **Wind tolerance:** Low-Moderate (very exposed)
- **Tide:** Sandbank dependent
- **Baseline difficulty:** High
- **Forgiveness:** Punishing (strong rips, big waves, has claimed lives)
- **Size sensitivity:** Steep
- **Skill floor:** Intermediate (small days, light wind only), Advanced generally
- **Hazard profile:** Strong rips, large waves, undertows. Has claimed lives. Outflow ("poo pipe") far offshore. Recent storm damage to main carpark stairs (check current status)
- **Visibility:** all
- **Crowd factor:** Medium
- **Parking:** Two large carparks
- **Access:** Stairs (check current closures)
- **Best season:** Autumn-Winter
- **Drive from Melbourne CBD:** ~1h 15min
- **Consistency:** High
- **Variability:** High (sandbanks)
- **Notes:** Most popular and biggest-wave Peninsula spot. NOT for beginners despite easy access.

### 11. Rye Back Beach
- **Region:** Mornington Peninsula
- **Coordinates:** -38.3870, 144.8170
- **Break type:** Beach break with reef sections
- **Wave size range:** 1-6ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 9s+
- **Optimal wind:** N to NE
- **Wind tolerance:** Moderate
- **Tide:** Most tides
- **Baseline difficulty:** Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Improver (small days, with caution)
- **Hazard profile:** Rips, submerged rocks, unpatrolled
- **Visibility:** all
- **Crowd factor:** Medium
- **Parking:** Multiple back beach carparks (numbered)
- **Access:** Easy walks down dunes
- **Best season:** Year-round
- **Drive from Melbourne CBD:** ~1h 20min
- **Consistency:** High
- **Variability:** High (sandbanks)
- **Notes:** Multiple peaks across long stretch.

### 12. Portsea Back Beach
- **Region:** Mornington Peninsula
- **Coordinates:** -38.3290, 144.6960
- **Break type:** Beach break
- **Wave size range:** 2-8ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 10s+
- **Optimal wind:** N to NE
- **Wind tolerance:** Moderate
- **Tide:** Sandbank dependent
- **Baseline difficulty:** Moderate-High
- **Forgiveness:** Moderate-Punishing
- **Size sensitivity:** Linear-Steep
- **Skill floor:** Intermediate
- **Hazard profile:** Rips, large waves. PM Harold Holt disappeared here in 1967
- **Visibility:** all
- **Crowd factor:** Medium
- **Parking:** Back beach carpark
- **Access:** Stairs
- **Best season:** Autumn-Winter
- **Drive from Melbourne CBD:** ~1h 30min
- **Consistency:** High
- **Variability:** High (sandbanks)
- **Notes:** Patrolled in summer at Portsea SLSC area only.

### 13. Sorrento Back Beach
- **Region:** Mornington Peninsula
- **Coordinates:** -38.3450, 144.7330
- **Break type:** Beach break (cove-like setting)
- **Wave size range:** 2-6ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 9s+
- **Optimal wind:** NE
- **Wind tolerance:** Moderate
- **Tide:** Most tides
- **Baseline difficulty:** Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Beginner (small days only — sheltered cove shape helps)
- **Hazard profile:** Rips, rocks at edges
- **Visibility:** all
- **Crowd factor:** Medium-High in summer
- **Parking:** Back beach carpark
- **Access:** Easy
- **Best season:** Year-round
- **Drive from Melbourne CBD:** ~1h 30min
- **Consistency:** High
- **Variability:** Medium
- **Notes:** Cove-like shape provides some shelter. Family-friendly with rock pools at low tide.

### 14. Point Leo
- **Region:** Mornington Peninsula (Western Port side)
- **Coordinates:** -38.4170, 145.0810
- **Break type:** Reef break with multiple sections
- **Wave size range:** 1-6ft
- **Optimal swell direction:** SW (needs to wrap into Western Port)
- **Optimal swell period:** 10s+
- **Optimal wind:** N to NW
- **Wind tolerance:** Moderate-High (sheltered)
- **Tide:** Mid to high
- **Baseline difficulty:** Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Beginner (longboard section on small days, surf school operates here)
- **Hazard profile:** Rocks, rips
- **Visibility:** all
- **Crowd factor:** High when working
- **Parking:** Foreshore reserve
- **Access:** Easy
- **Best season:** Winter
- **Drive from Melbourne CBD:** ~1h 20min
- **Consistency:** Medium (needs swell to wrap)
- **Variability:** Low
- **Notes:** Multiple skill levels accommodated across different sections (Suicide Point, 1st Reef, 2nd Reef, Honeysuckle).

### 15. Shoreham (The Pines)
- **Region:** Mornington Peninsula (Western Port side)
- **Coordinates:** -38.4360, 145.0490
- **Break type:** Right-hand reef/point break
- **Wave size range:** 1-4ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 10s+
- **Optimal wind:** NW
- **Wind tolerance:** Moderate-High
- **Tide:** High tide best (shallow at point)
- **Baseline difficulty:** Low-Moderate
- **Forgiveness:** Moderate (rocks shallow at low tide)
- **Size sensitivity:** Linear (caps out around 4ft)
- **Skill floor:** Beginner (small days, longboard-friendly)
- **Hazard profile:** Rocks (shallow at low tide), rips
- **Visibility:** all
- **Crowd factor:** Medium-High
- **Parking:** Beach reserve
- **Access:** Easy
- **Best season:** Winter
- **Drive from Melbourne CBD:** ~1h 30min
- **Consistency:** Medium
- **Variability:** Low
- **Notes:** "Little Noosa." Long, mellow, longboard-friendly point.

### 16. Flinders
- **Region:** Mornington Peninsula (south side)
- **Coordinates:** -38.4790, 145.0220
- **Break type:** Reef break (multiple)
- **Wave size range:** 2-8ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 10s+
- **Optimal wind:** N to NW (or NE depending on break)
- **Wind tolerance:** Low-Moderate
- **Tide:** Variable by break
- **Baseline difficulty:** High
- **Forgiveness:** Punishing
- **Size sensitivity:** Linear-Steep
- **Skill floor:** Intermediate (some breaks on smaller days)
- **Hazard profile:** Strong currents, powerful waves, rocks, high localism. Cerberus Naval Range — guns fire Thursdays 11am from cliff above
- **Visibility:** all
- **Crowd factor:** Low-Medium
- **Parking:** Various access points
- **Access:** Walks required for some breaks
- **Best season:** Autumn-Winter
- **Drive from Melbourne CBD:** ~1h 30min
- **Consistency:** High
- **Variability:** Low
- **Notes:** Multiple expert sub-breaks (Cyrils, Gunnery).

### 16a. Flinders — Cyrils
- **Parent:** Flinders
- **Visibility:** advanced
- **Break type:** Heavy reef break
- **Wave size range:** 3-10ft+
- **Optimal swell direction:** SW
- **Optimal swell period:** 11s+
- **Optimal wind:** N to NW
- **Tide:** Specific window — local knowledge essential
- **Baseline difficulty:** Expert
- **Forgiveness:** Punishing
- **Size sensitivity:** Steep
- **Skill floor:** Advanced
- **Hazard profile:** One of Victoria's heaviest waves. Strong localism.
- **Notes:** Do not paddle out without local knowledge.

### 16b. Flinders — The Gunnery
- **Parent:** Flinders
- **Visibility:** advanced
- **Break type:** Reef break
- **Wave size range:** 2-6ft
- **Optimal swell direction:** SW
- **Optimal wind:** N to NW
- **Tide:** Variable
- **Baseline difficulty:** High
- **Forgiveness:** Punishing
- **Size sensitivity:** Linear
- **Skill floor:** Advanced
- **Notes:** Named for proximity to Cerberus Naval Range.

### 17. St Andrews Beach
- **Region:** Mornington Peninsula
- **Coordinates:** -38.4400, 144.8400
- **Break type:** Beach break
- **Wave size range:** 2-6ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 9s+
- **Optimal wind:** N to NE
- **Wind tolerance:** Moderate
- **Tide:** Sandbank dependent
- **Baseline difficulty:** Moderate-High
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Intermediate
- **Hazard profile:** Rips, exposure
- **Visibility:** all
- **Crowd factor:** Low-Medium
- **Parking:** Beach carparks
- **Access:** Stairs/walks
- **Best season:** Autumn-Winter
- **Drive from Melbourne CBD:** ~1h 25min
- **Consistency:** High
- **Variability:** High (sandbanks)
- **Notes:** Less crowded alternative to Gunnamatta, similar character.

---

## PHILLIP ISLAND

### 18. Cape Woolamai
- **Region:** Phillip Island
- **Coordinates:** -38.5550, 145.3380
- **Break type:** Beach break (multiple peaks along 4.2km)
- **Wave size range:** 2-10ft
- **Optimal swell direction:** SSW
- **Optimal swell period:** 10s+
- **Optimal wind:** Varies by section (NE for main beach, NW Ocean Reach, E-SE Magiclands)
- **Wind tolerance:** Moderate
- **Tide:** All tides except dead low; mid-high preferred
- **Baseline difficulty:** High
- **Forgiveness:** Punishing
- **Size sensitivity:** Steep
- **Skill floor:** Intermediate (smaller days only)
- **Hazard profile:** Strong rips (worst at northern end), powerful closeouts, sharks sighted (no recorded attacks). Has claimed lives.
- **Visibility:** all
- **Crowd factor:** Low-Medium
- **Parking:** Multiple carparks along beach
- **Access:** Stairs/walks
- **Best season:** Autumn (peak April)
- **Drive from Melbourne CBD:** ~2h
- **Consistency:** Very High (swell magnet)
- **Variability:** Medium (some reef stabilizes banks)
- **Notes:** National Surfing Reserve. Different sections have different ideal wind directions.

### 18a. Cape Woolamai — Magiclands
- **Parent:** Cape Woolamai
- **Visibility:** intermediate_advanced
- **Break type:** Beach break (eastern end, sheltered)
- **Wave size range:** 1-5ft
- **Optimal swell direction:** SSW
- **Optimal wind:** E to SE (sheltered by cape)
- **Tide:** All tides
- **Baseline difficulty:** Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Improver
- **Notes:** Most sheltered Woolamai option. Often works when other sections blown out.

### 18b. Cape Woolamai — Anzacs (1st Carpark)
- **Parent:** Cape Woolamai
- **Visibility:** intermediate_advanced
- **Break type:** Beach break (western end)
- **Wave size range:** 2-8ft
- **Optimal swell direction:** SSW
- **Optimal wind:** NE to N
- **Tide:** Mid to high
- **Baseline difficulty:** High
- **Forgiveness:** Punishing
- **Size sensitivity:** Steep
- **Skill floor:** Intermediate
- **Notes:** Hosts state and national titles. Rippy and dangerous when bigger.

### 18c. Cape Woolamai — Ocean Reach / Forrest Caves
- **Parent:** Cape Woolamai
- **Visibility:** intermediate_advanced
- **Break type:** Beach break (further west)
- **Wave size range:** 2-8ft
- **Optimal swell direction:** SSW
- **Optimal wind:** N to NW
- **Tide:** Mid to high
- **Baseline difficulty:** High
- **Forgiveness:** Punishing
- **Size sensitivity:** Linear-Steep
- **Skill floor:** Intermediate
- **Notes:** Less consistent than Anzacs, quieter on busy days.

### 19. Smiths Beach
- **Region:** Phillip Island
- **Coordinates:** -38.5180, 145.2630
- **Break type:** Beach break (sand banks)
- **Wave size range:** 1-4ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 9s+
- **Optimal wind:** N to NW
- **Wind tolerance:** Moderate
- **Tide:** Most tides
- **Baseline difficulty:** Low-Moderate
- **Forgiveness:** Moderate (sand bottom)
- **Size sensitivity:** Linear (caps small)
- **Skill floor:** Beginner (popular surf school spot, patrolled summer)
- **Hazard profile:** Rips on bigger days
- **Visibility:** all
- **Crowd factor:** High in summer
- **Parking:** Beach carpark
- **Access:** Easy
- **Best season:** Year-round
- **Drive from Melbourne CBD:** ~2h
- **Consistency:** High
- **Variability:** Medium
- **Notes:** Best Phillip Island beginner spot. Best at 1-1.5m days.

### 20. YCW Beach
- **Region:** Phillip Island
- **Coordinates:** -38.5200, 145.2500
- **Break type:** Beach break with shore break sections
- **Wave size range:** 1-4ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 9s+
- **Optimal wind:** NW to N
- **Wind tolerance:** Moderate
- **Tide:** High for shore breaks (west), low for rights (east)
- **Baseline difficulty:** Moderate
- **Forgiveness:** Moderate (shore break power on inside)
- **Size sensitivity:** Linear
- **Skill floor:** Improver (small days)
- **Hazard profile:** Rips, shore break power
- **Visibility:** all
- **Crowd factor:** Medium
- **Parking:** YCW carpark
- **Access:** Easy
- **Best season:** Winter
- **Drive from Melbourne CBD:** ~2h
- **Consistency:** Medium
- **Variability:** Medium
- **Notes:** Often works when rest of island blown out. Good for bodyboarding.

### 21. Express Point
- **Region:** Phillip Island
- **Coordinates:** -38.5280, 145.2400
- **Break type:** Right-hand reef break
- **Wave size range:** 3-10ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 11s+
- **Optimal wind:** N to NW
- **Wind tolerance:** Low-Moderate
- **Tide:** Mid to high
- **Baseline difficulty:** Expert
- **Forgiveness:** Punishing
- **Size sensitivity:** Steep
- **Skill floor:** Advanced
- **Hazard profile:** Rocks, rips, power, high localism
- **Visibility:** all
- **Crowd factor:** Medium
- **Parking:** Various
- **Access:** Walk
- **Best season:** Autumn-Winter
- **Drive from Melbourne CBD:** ~2h
- **Consistency:** Medium-High
- **Variability:** Low
- **Notes:** Big-wave barreling spot.

### 22. Summerland (Centre Break)
- **Region:** Phillip Island
- **Coordinates:** -38.5180, 145.1500
- **Break type:** Reef break
- **Wave size range:** 2-6ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 10s+
- **Optimal wind:** N to W
- **Wind tolerance:** Moderate-High (sheltered)
- **Tide:** High tide
- **Baseline difficulty:** Moderate-High
- **Forgiveness:** Moderate-Punishing
- **Size sensitivity:** Linear
- **Skill floor:** Intermediate
- **Hazard profile:** Rocks, rips, restricted access (penguin parade hours)
- **Visibility:** all
- **Crowd factor:** Low (access restrictions)
- **Parking:** Penguin Parade area
- **Access:** Restricted hours due to penguin parade
- **Best season:** Winter
- **Drive from Melbourne CBD:** ~2h
- **Consistency:** Medium
- **Variability:** Low
- **Notes:** Birthplace of Phillip Island surfing. Often works when other spots blown out by westerlies.

### 23. Cat Bay (Right Point)
- **Region:** Phillip Island
- **Coordinates:** -38.4910, 145.1800
- **Break type:** Reef break (left and right)
- **Wave size range:** 2-6ft
- **Optimal swell direction:** Bigger SW swells (needs 2m+)
- **Optimal swell period:** 11s+
- **Optimal wind:** S to E (unique — works on southerly winds)
- **Wind tolerance:** Moderate
- **Tide:** All tides for Right Point; varies by sub-break
- **Baseline difficulty:** Moderate-High
- **Forgiveness:** Moderate-Punishing
- **Size sensitivity:** Linear
- **Skill floor:** Intermediate
- **Hazard profile:** Rocks
- **Visibility:** all
- **Crowd factor:** Low
- **Parking:** Cat Bay area
- **Access:** Walk
- **Best season:** Summer (counter-intuitive)
- **Drive from Melbourne CBD:** ~2h
- **Consistency:** Low-Medium (needs big swell)
- **Variability:** Low
- **Notes:** Works in summer when other spots flat — opposite ideal wind direction to most Victorian spots.

---

## BASS COAST REGION

### 24. Cape Paterson (1st Surf Beach)
- **Region:** Bass Coast
- **Coordinates:** -38.6750, 145.6320
- **Break type:** Beach break (sheltered)
- **Wave size range:** 1-4ft
- **Optimal swell direction:** SW
- **Optimal swell period:** 9s+
- **Optimal wind:** N to NE
- **Wind tolerance:** Moderate-High (sheltered)
- **Tide:** Most tides
- **Baseline difficulty:** Low-Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear (caps small)
- **Skill floor:** Beginner (patrolled summer, family-friendly)
- **Hazard profile:** Rips on bigger days
- **Visibility:** all
- **Crowd factor:** Low-Medium
- **Parking:** Beach carpark
- **Access:** Easy
- **Best season:** Year-round
- **Drive from Melbourne CBD:** ~1h 50min
- **Consistency:** Medium-High
- **Variability:** Medium
- **Notes:** "Torquay 30 years ago" feel. Less crowded than Surf Coast equivalents.

### 24a. Cape Paterson — The Channel
- **Parent:** Cape Paterson
- **Visibility:** intermediate_advanced
- **Break type:** Reef break
- **Wave size range:** 1-5ft
- **Optimal swell direction:** SW
- **Optimal wind:** NE
- **Tide:** Works varying tides
- **Baseline difficulty:** Moderate
- **Forgiveness:** Moderate-Punishing
- **Size sensitivity:** Linear
- **Skill floor:** Intermediate
- **Notes:** Good introduction to reef break surfing for intermediates stepping up.

### 24b. Cape Paterson — F Break
- **Parent:** Cape Paterson
- **Visibility:** advanced
- **Break type:** Powerful beach break (sand over rocky seabed)
- **Wave size range:** 3-8ft
- **Optimal swell direction:** SW
- **Optimal wind:** NE
- **Tide:** Mid
- **Baseline difficulty:** Expert
- **Forgiveness:** Punishing
- **Size sensitivity:** Steep
- **Skill floor:** Advanced
- **Hazard profile:** Hidden rocks, strong rips on good ground swells, local knowledge essential
- **Notes:** Other side of the Cape from First Surf Beach.

### 25. Inverloch
- **Region:** Bass Coast
- **Coordinates:** -38.6280, 145.7280
- **Break type:** Beach break (peaky)
- **Wave size range:** 1-6ft (works from waist-high, maxes ~2m)
- **Optimal swell direction:** SW
- **Optimal swell period:** 8s+
- **Optimal wind:** NW
- **Wind tolerance:** Moderate
- **Tide:** Mid to high (rising)
- **Baseline difficulty:** Low-Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear
- **Skill floor:** Beginner (small days, SLSC presence)
- **Hazard profile:** Rips, undertow, water quality affected by Anderson Inlet runoff after rain
- **Visibility:** all
- **Crowd factor:** Low
- **Parking:** Multiple beach access points
- **Access:** Easy
- **Best season:** December-April
- **Drive from Melbourne CBD:** ~2h
- **Consistency:** Medium
- **Variability:** High (sandbanks, runoff)
- **Notes:** Quiet South Gippsland spot. Rewards patience and local knowledge of banks.

---

## OTWAY COAST EXTENSION

### 26. Apollo Bay
- **Region:** Otway Coast
- **Coordinates:** -38.7570, 143.6700
- **Break type:** Beach break (with point break sections)
- **Wave size range:** 1-4ft
- **Optimal swell direction:** SW (some E in swell helps)
- **Optimal swell period:** 9s+
- **Optimal wind:** W (offshore)
- **Wind tolerance:** Moderate-High (somewhat sheltered)
- **Tide:** Low tide rising
- **Baseline difficulty:** Low-Moderate
- **Forgiveness:** Moderate
- **Size sensitivity:** Linear (caps small)
- **Skill floor:** Beginner (surf schools operate here)
- **Hazard profile:** Rips on bigger days, overcrowding can be hazardous per local notes
- **Visibility:** all
- **Crowd factor:** Medium
- **Parking:** Town beachfront
- **Access:** Easy — straight off the beach
- **Best season:** Winter (peak August)
- **Drive from Melbourne CBD:** ~3h
- **Consistency:** Medium-High
- **Variability:** Medium
- **Notes:** Great Ocean Walk start point. Surf schools operate here.

### 27. Marengo
- **Region:** Otway Coast
- **Coordinates:** -38.7920, 143.6580
- **Break type:** Reef and point break (left and right)
- **Wave size range:** 2-6ft
- **Optimal swell direction:** SSW
- **Optimal swell period:** 10s+
- **Optimal wind:** W
- **Wind tolerance:** Moderate
- **Tide:** Variable
- **Baseline difficulty:** Moderate-High
- **Forgiveness:** Moderate-Punishing (rocks)
- **Size sensitivity:** Linear
- **Skill floor:** Intermediate
- **Hazard profile:** Rocks, rips
- **Visibility:** all
- **Crowd factor:** Medium when on
- **Parking:** Marengo area
- **Access:** Walk
- **Best season:** Winter (peak August)
- **Drive from Melbourne CBD:** ~3h 5min
- **Consistency:** Medium-High
- **Variability:** Low (reef)
- **Notes:** Reef break alternative to Apollo Bay's beach break. ~3km south of Apollo Bay town.

---

## SUMMARY

**Final spot count:** 27 parent spots + 11 sub-break entries = 38 total entries

**Skill floor distribution:**
- Beginner-floor spots: Torquay Front Beach, Anglesea, Sorrento Back, Point Leo, Shoreham, Smiths Beach, Cape Paterson 1st, Inverloch, Apollo Bay
- Improver-floor spots: Jan Juc, Fairhaven, Rye, Magiclands, YCW
- Intermediate-floor spots: Bells, Winki Pop, Point Addis, Lorne Point, Johanna, Gunnamatta, Portsea, St Andrews, Flinders, Anzacs, Ocean Reach, Summerland, Cat Bay, Marengo, The Channel, Bells Rincon
- Advanced-floor spots: Bells Bowl, Bells Little Rincon, Winki Uppers, Winki Lowers, Express Point, Cyrils, The Gunnery, F Break

The dynamic skill model means the AI checks skill floor first (eliminate spots below user's level), then evaluates whether *today's specific conditions* at qualifying spots are appropriate for that user's skill level.

**v2 future additions to consider:**
- Warrnambool (Logans Beach, Levys), Port Fairy East Beach (~3h 30min drive)
- Portland reef breaks (~4h drive)
- Wilsons Promontory area (~3h drive east)
- Wonthaggi / Kilcunda / Eagles Nest (Bass Coast in-fills)
- Real-time spot status flags (closures, hazards, sandbank reports)
