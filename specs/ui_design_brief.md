# Surf App — UI Design Brief

## Design direction

Clean, minimal, professional. References: Medium, Dropbox, Apple.com.
Lots of white space. Large confident typography. Minimal colour. Smooth transitions. The UI gets out of the way of the information.

This is not a surf brand website. No wave graphics, no aggressive ocean imagery, no "stoked" energy. Think: a calm, trustworthy tool that a surfer opens at 6am and immediately understands.

---

## Typography

- **Font:** Inter (already available via next/font/google — use Inter)
- **Weights used:** 300 (light), 400 (regular), 500 (medium), 600 (semibold) only. No bold/700 except the app name.
- **Scale:** large and confident. Headings should feel spacious, not cramped.
- **Line height:** generous. 1.6 for body text, 1.2 for headings.
- **Letter spacing:** slightly loose on headings and labels (0.02–0.04em).

---

## Colour palette

Keep it almost entirely neutral. One accent colour only.

```
Background:       #FFFFFF  (pure white)
Surface:          #F8F8F7  (off-white, for cards and input areas — very subtle)
Border:           #E8E8E6  (light grey, used sparingly)
Text primary:     #1A1A1A  (near-black, not pure black)
Text secondary:   #6B6B6B  (medium grey, for labels and secondary info)
Text tertiary:    #9B9B9B  (light grey, for caveats and fine print)
Accent:           #0066CC  (clean blue — used for the submit button, active states, links only)
Accent hover:     #0052A3

Hazard warning:   #D97706  (amber — for hazard labels only)
Hazard danger:    #DC2626  (red — for danger-level hazards only)
Quality firing:   #0066CC  (same as accent — firing is special)
Quality very_good:#1A1A1A  (strong text colour)
Quality good:     #6B6B6B  (secondary text colour)
Quality fair:     #9B9B9B  (tertiary text colour)
Quality poor:     #C4C4C4  (washed out — honest about poor conditions)
```

No gradients. No shadows except one very subtle card shadow (0 1px 3px rgba(0,0,0,0.06)).

---

## Layout

### Page structure
- Max content width: 680px, centred
- Page padding: 24px horizontal on mobile, auto on desktop
- Generous vertical spacing between sections — let things breathe

### Input form (home state)
- Full viewport height on first load, form vertically centred
- App name top-left, small and understated
- Form fields stacked vertically, generous spacing between them
- One large submit button full width of the form
- No sidebar, no split layout — just the form, centred, clean

### Results state
- Smooth transition from form to results (fade or slide, not jarring)
- Narration paragraph at the top — large-ish text, generous line height, reads like prose not a data dump
- Spot cards below, stacked vertically
- Global advisory (if present) appears as a quiet banner above the cards
- "What to skip" section at the bottom, understated

---

## Components

### App header
- App name: "Swell" or whatever the final name is — top left, font-weight 600, small (16px)
- No navigation, no hamburger menu, no clutter
- Just the name, linking back to the form

### Input form fields

**Location input:**
- Full-width text input
- Placeholder: "Where are you?" 
- Small geolocate icon button on the right edge of the input (use a location pin icon from lucide-react)
- When geolocating: icon animates subtly (pulse), input shows "Getting your location..."
- Label above input: "Location" — small, font-weight 500, text-secondary colour

**Skill selector:**
- Four options: Beginner / Improver / Intermediate / Advanced
- NOT a dropdown — render as a horizontal pill selector (4 pills in a row on desktop, 2×2 grid on mobile)
- Selected pill: accent background (#0066CC), white text
- Unselected pill: surface background (#F8F8F7), border (#E8E8E6), text-primary colour
- Label above: "Skill level"
- Below the pills, a single line of descriptor text in text-tertiary that updates as they select:
  - Beginner: "Foam board, whitewater, learning to stand"
  - Improver: "Catching unbroken waves, learning turns"
  - Intermediate: "Comfortable head-high, reads the lineup"
  - Advanced: "Overhead surf, reef breaks, heavy conditions"

**Timing selector:**
- Simple select dropdown or pill group: Today / Tomorrow / Choose a date
- If "Choose a date" selected, a date picker appears below (native HTML date input is fine)
- Label above: "When"

**Submit button:**
- Full width of the form
- Background: #0066CC, text: white, font-weight 500
- Height: 52px — chunky enough to feel satisfying on mobile
- Text: "Find waves"
- Border radius: 8px
- Hover: #0052A3, subtle transition (150ms)
- Loading state: button text changes to "Checking conditions..." with a subtle spinner — button stays full width, does not collapse

### Loading state
- The submit button enters loading state immediately on submit
- Below the form, a subtle loading indicator appears: a thin progress bar at the top of the page (like YouTube's red bar, but in accent blue) that animates while the API call is in flight
- Optional: a rotating set of quiet loading messages beneath the form, cycling every 3 seconds:
  - "Checking live conditions..."
  - "Scoring 39 spots..."  
  - "Asking a local..."
- These messages should be small, text-tertiary, not dramatic

### Narration block
- Appears above the spot cards
- Font size: 17px, line height: 1.7, text-primary colour
- No box, no card, no border — just prose floating on white
- Generous top and bottom margin (40px+)
- Feels like reading Medium — just text, well set

### Spot cards
- White background, surface border (#E8E8E6), border-radius 12px
- Subtle shadow (0 1px 3px rgba(0,0,0,0.06))
- Padding: 24px
- Vertical stack of cards, 16px gap between them

**Card anatomy (top to bottom):**

1. **Card header row** — spot name left, drive time right
   - Spot name: font-weight 600, 18px, text-primary
   - Drive time: font-weight 400, 14px, text-secondary (e.g. "1h 45m")

2. **Quality badge** — sits just below the header, left-aligned
   - Small pill/badge with the quality category text
   - Colour reflects quality (see palette above — firing is blue, poor is washed out)
   - Font: 12px, font-weight 500, letter-spacing 0.04em, uppercase

3. **Conditions row** — key conditions in a compact horizontal strip
   - Small icons + text for: swell size, swell period, wind, tide state
   - Use lucide-react icons: Waves, Wind, Droplets or similar
   - Font: 13px, text-secondary
   - Keep it to one line — this is glanceable data, not a full breakdown

4. **Narration paragraph** — the per-spot prose from Claude
   - Font: 15px, line height: 1.65, text-primary
   - Plain text, no bullet points
   - Margin top: 16px

5. **Hazards** — only shown if active hazards exist
   - Heading: "Heads up" — 12px, font-weight 500, text-tertiary, uppercase, letter-spacing
   - Each hazard as a small inline tag: amber background (light, not full #D97706 — use #FEF3C7) with amber text (#D97706) for caution; red background (#FEF2F2) with red text (#DC2626) for danger
   - Tags sit in a wrapping flex row
   - Margin top: 12px

6. **Caveats** — only shown if caveats exist
   - No heading
   - Italic, text-tertiary, 13px
   - E.g. "Tide not factored in v1 — verify against tide tables before paddling out at tide-sensitive spots."
   - Margin top: 8px

### What to skip section
- Appears below all spot cards, only if eliminated_spots_of_note is non-empty
- Heading: "What to skip today" — small, text-secondary, font-weight 500
- Each eliminated spot as a single line: spot name (text-primary, struck-through or normal) + reason in text-tertiary
- No cards, no borders — just a quiet list
- Visually understated. This is supplementary information.

### Global advisory banner
- Appears above the spot cards if global_advisory is present
- Background: #F8F8F7, border-left: 3px solid #0066CC
- Padding: 16px 20px
- Text: text-primary, 15px
- No icon, no emoji — just the text, set well
- Margin bottom: 24px

### Error state
- If the API returns an error, show a quiet inline message below the form
- Text: "Couldn't fetch conditions right now — try again in a moment."
- text-secondary colour, 15px, centred
- No modal, no alert box, no drama

---

## Motion and transitions

- Page transitions: fade only, 200ms ease
- Button hover: 150ms colour transition
- Form → results: fade out form, fade in results, 250ms
- Card appearance: cards fade in staggered (50ms delay between each), subtle translateY(8px) → translateY(0)
- Loading bar: smooth continuous animation, not chunky steps
- Nothing bounces. Nothing slides dramatically. Everything is calm.

---

## Mobile considerations

- Test at 390px width (iPhone 15 viewport)
- Skill pills: 2×2 grid on mobile (not 4 in a row — they're too small)
- Card conditions row: wraps to two lines if needed, never overflows
- Hazard tags: wrap naturally
- Submit button: full width always
- Narration text: 16px on mobile (not 17px) to avoid overflow
- Drive time on card header: may need to sit below spot name on very narrow screens

---

## What NOT to do

- No hero image or ocean background photo
- No wave SVG decorations
- No gradients or glass-morphism effects
- No dark mode (v1 — keep it simple)
- No animations that feel "app-like" or playful — this is calm and professional
- No sidebar
- No sticky header with navigation
- No footer with links (v1 — no pages to link to)
- No star ratings rendered as actual stars (the quality category badge handles this)
- No progress percentage circles
- No "powered by Claude" branding in the UI (unnecessary)
- No emoji anywhere in the UI chrome (Claude's narration may include some — strip them at the component level if they appear)

---

## Implementation notes for Claude Code

- Use Tailwind CSS utility classes throughout — no custom CSS files
- Use lucide-react for all icons — already installed
- Use next/font/google for Inter — already in Next.js
- The results page receives the full API response JSON — render both the narration string and the structured ranked_spots array
- Strip markdown asterisks from narration text before rendering — either use a lightweight markdown renderer (react-markdown, already available) or a simple regex replace for **bold** → <strong>
- Render the narration block as prose (p tags), not dangerouslySetInnerHTML unless using a sanitised markdown renderer
- The quality category string from the API (poor/fair/good/very_good/firing) maps to the colour system above — define this mapping as a constant in the component
- Hazard severity (caution/warning/danger) maps to the amber/red colour system above
- All API calls go through /api/recommend — no client-side calls to Open-Meteo or Anthropic directly
- Keep components simple: one page component, a few small sub-components (SpotCard, HazardTag, QualityBadge, ConditionsStrip). Don't over-engineer the component tree.

---

## Phased delivery

Build in this order:

1. Typography, colour system, and layout shell (just the page structure, no functionality)
2. Input form with all three fields, geolocation button, submit button with loading state
3. Results rendering: narration block + spot cards with all card anatomy
4. Polish: transitions, staggered card animation, mobile testing
5. Edge cases: empty results state, error state, global advisory, what-to-skip section

Show me the form first before building results. I want to approve the visual direction before spending time on the cards.
