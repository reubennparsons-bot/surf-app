/**
 * Static surf-spot DNA for Victoria.
 *
 * Hand-converted from specs/victorian_surf_spots_v2.md per the v1 plan's
 * field-mapping rules:
 *   - skillFloor = absolute minimum skill ever permitted (dynamic skill check
 *     handles "but only on small days").
 *   - sweetSpot defaults to the middle 50% of working size when not explicit.
 *   - optimalSwellDirection: a 60° window centered on the compass bearing
 *     when the source only specifies a compass direction (e.g. "SW" → 195–255°).
 *   - offshoreDirection: midpoint of the database's optimal-wind range.
 *   - notable=true on the eight famous spots that drive eliminatedSpotsOfNote.
 *   - sub-breaks reference parents via parentId.
 *
 * Compass bearings used:
 *   N=0  NNE=22.5  NE=45   ENE=67.5  E=90   ESE=112.5  SE=135  SSE=157.5
 *   S=180 SSW=202.5 SW=225  WSW=247.5 W=270  WNW=292.5 NW=315   NNW=337.5
 */

import type { Spot } from '@/lib/types';

export const spots: Spot[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // SURF COAST
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Bells Beach
  {
    id: 'bells-beach',
    name: 'Bells Beach',
    region: 'Surf Coast',
    coordinates: { lat: -38.3686, lng: 144.2814 },
    parentId: null,
    visibility: 'all',
    notable: true,
    breakType: 'reef_point',
    workingSize: { min: 3, max: 15 },
    sweetSpot: { min: 4, max: 8 },
    optimalSwellDirection: { min: 196, max: 215 },
    optimalSwellPeriod: 12,
    offshoreDirection: 337.5, // N to NW → midpoint
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Different sub-breaks favor different tides' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rips', description: 'Strong rips, worse on lower tides and bigger swells', activation: 'always', severity: 'warning' },
      { hazard: 'shallow reef', description: 'Rocky bottom with shallow sections at low tide', activation: 'shallow_reef_low_tide', severity: 'warning' },
      { hazard: 'crowd', description: 'Crowd extreme on quality days — drop-ins, vibe, moderate-high localism', activation: 'always', severity: 'caution' },
      { hazard: 'sea breeze blow-out', description: 'Often blown out by sea breezes by midday in summer', activation: 'sea_breeze_summer_afternoon', severity: 'caution' },
    ],
    crowd: 'very_high',
    driveFromMelbourneCBDMinutes: 105,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter (April-August)',
    notes: 'Site of Rip Curl Pro since 1961. Local consensus: "heaps overrated for average surfer" — Winki next door often more fun.',
  },

  // 1a. Bells — The Bowl
  {
    id: 'bells-bowl',
    name: 'Bells — The Bowl',
    region: 'Surf Coast',
    coordinates: { lat: -38.3686, lng: 144.2814 },
    parentId: 'bells-beach',
    visibility: 'advanced',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 3, max: 15 },
    sweetSpot: { min: 4, max: 10 },
    optimalSwellDirection: { min: 196, max: 215 },
    optimalSwellPeriod: 12,
    offshoreDirection: 303.75, // WNW to NW → midpoint
    offshoreBand: 45,
    tide: { sensitivity: 'high', preference: 'Low to mid (jacks up over shallow reef on lower tides)' },
    baselineDifficulty: 'expert',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'advanced',
    hazards: [
      { hazard: 'heavy lip', description: 'Thick, powerful lip — demands commitment', activation: 'always', severity: 'warning' },
      { hazard: 'shallow reef', description: 'Reef shallows out at lower tides', activation: 'shallow_reef_low_tide', severity: 'danger' },
      { hazard: 'rips', description: 'Strong currents through the bowl', activation: 'always', severity: 'warning' },
      { hazard: 'crowd', description: 'Intense crowd — contest pros and locals', activation: 'always', severity: 'caution' },
    ],
    crowd: 'very_high',
    driveFromMelbourneCBDMinutes: 105,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Where the Rip Curl Pro contest runs. Powerful, demands commitment.',
  },

  // 1b. Bells — Rincon
  {
    id: 'bells-rincon',
    name: 'Bells — Rincon',
    region: 'Surf Coast',
    coordinates: { lat: -38.3686, lng: 144.2814 },
    parentId: 'bells-beach',
    visibility: 'intermediate_advanced',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 2, max: 6 },
    sweetSpot: { min: 3, max: 5 },
    optimalSwellDirection: { min: 172.5, max: 232.5 }, // S to SSW → wider window
    optimalSwellPeriod: 10,
    offshoreDirection: 337.5, // N to NW → midpoint
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'High tide (works as Bowl backs off)' },
    baselineDifficulty: 'high',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
      { hazard: 'rips', description: 'Currents through the inside', activation: 'always', severity: 'caution' },
      { hazard: 'crowd', description: 'High crowd when working', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 105,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Longer, more workable wave than the Bowl. Better choice when Bowl is too heavy.',
  },

  // 1c. Bells — Little Rincon
  {
    id: 'bells-little-rincon',
    name: 'Bells — Little Rincon',
    region: 'Surf Coast',
    coordinates: { lat: -38.3686, lng: 144.2814 },
    parentId: 'bells-beach',
    visibility: 'advanced',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 3, max: 8 },
    sweetSpot: { min: 4, max: 6 },
    optimalSwellDirection: { min: 150, max: 210 }, // straight S, 60° window
    optimalSwellPeriod: 12,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid to high' },
    baselineDifficulty: 'expert',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'advanced',
    hazards: [
      { hazard: 'hollow vertical sections', description: 'Vertical and hollow, fast and sectiony', activation: 'always', severity: 'warning' },
      { hazard: 'rocks', description: 'Reef bottom directly off the cliff', activation: 'always', severity: 'warning' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 105,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Lights up on south swells.',
  },

  // 2. Winki Pop
  {
    id: 'winki-pop',
    name: 'Winki Pop',
    region: 'Surf Coast',
    coordinates: { lat: -38.37, lng: 144.287 },
    parentId: null,
    visibility: 'all',
    notable: true,
    breakType: 'reef_point',
    workingSize: { min: 2, max: 12 },
    sweetSpot: { min: 3, max: 6 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW, 60° window
    optimalSwellPeriod: 10,
    offshoreDirection: 337.5, // N to NW
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Most tides' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'urchins', description: 'Sea urchins on the reef', activation: 'always', severity: 'caution' },
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
      { hazard: 'rips', description: 'Currents through the lineup', activation: 'always', severity: 'caution' },
      { hazard: 'crowd', description: 'Very crowded, moderate-high localism', activation: 'always', severity: 'caution' },
    ],
    crowd: 'very_high',
    driveFromMelbourneCBDMinutes: 105,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter (peak August)',
    notes: 'High-performance wave, often more fun than Bells. Handles slightly more westerly swells.',
  },

  // 2a. Winki — Uppers
  {
    id: 'winki-uppers',
    name: 'Winki — Uppers',
    region: 'Surf Coast',
    coordinates: { lat: -38.37, lng: 144.287 },
    parentId: 'winki-pop',
    visibility: 'advanced',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 2, max: 8 },
    sweetSpot: { min: 3, max: 6 },
    optimalSwellDirection: { min: 195, max: 255 },
    optimalSwellPeriod: 10,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Most tides' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'advanced',
    hazards: [
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
      { hazard: 'urchins', description: 'Sea urchins', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 105,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Classic down-the-line wave at the top of the point.',
  },

  // 2b. Winki — Lowers
  {
    id: 'winki-lowers',
    name: 'Winki — Lowers',
    region: 'Surf Coast',
    coordinates: { lat: -38.37, lng: 144.287 },
    parentId: 'winki-pop',
    visibility: 'advanced',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 2, max: 8 },
    sweetSpot: { min: 3, max: 6 },
    optimalSwellDirection: { min: 195, max: 255 },
    optimalSwellPeriod: 10,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid to high' },
    baselineDifficulty: 'expert',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'advanced',
    hazards: [
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'warning' },
      { hazard: 'urchins', description: 'Sea urchins', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 105,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Hollower and faster than Uppers. Resembles J-Bay on its day.',
  },

  // 3. Jan Juc
  {
    id: 'jan-juc',
    name: 'Jan Juc',
    region: 'Surf Coast',
    coordinates: { lat: -38.35, lng: 144.305 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 6 },
    sweetSpot: { min: 2, max: 4 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 8,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'All tides' },
    baselineDifficulty: 'moderate',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'beginner', // beginner on very small clean days only
    hazards: [
      { hazard: 'rips', description: 'Rips can be dangerous, especially on bigger days', activation: 'strong_rip_with_onshore', severity: 'warning' },
      { hazard: 'shifting sandbanks', description: 'Sandbanks shift after storms', activation: 'always', severity: 'caution' },
      { hazard: 'Bird Rock', description: 'Bird Rock at the western end', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 100,
    consistency: 'very_high',
    variability: 'high',
    bestSeason: 'Year-round, peak August',
    notes: 'In front of Torquay golf club. Closest decent beach break to Torquay reefs.',
  },

  // 4. Torquay Point (Front Beach)
  {
    id: 'torquay-front-beach',
    name: 'Torquay Point (Front Beach)',
    region: 'Surf Coast',
    coordinates: { lat: -38.338, lng: 144.327 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'reef_point',
    workingSize: { min: 1, max: 5 },
    sweetSpot: { min: 2, max: 3.5 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 8,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid tide' },
    baselineDifficulty: 'low',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'beginner',
    hazards: [
      { hazard: 'rips', description: 'Rips on bigger days', activation: 'strong_rip_with_onshore', severity: 'caution' },
      { hazard: 'rocks', description: 'Rocks around the point', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 95,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Year-round',
    notes: 'Good fallback when bigger spots are blown out. Family-friendly area.',
  },

  // 5. Point Addis
  {
    id: 'point-addis',
    name: 'Point Addis',
    region: 'Surf Coast',
    coordinates: { lat: -38.402, lng: 144.27 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 2, max: 8 },
    sweetSpot: { min: 3, max: 6 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 10,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid tide rising' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'improver', // improver small clean days, intermediate generally
    hazards: [
      { hazard: 'rips', description: 'Rips through the lineup', activation: 'always', severity: 'caution' },
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 110,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Winter (peak July)',
    notes: 'Choice of left and right reefs. Less crowded than Bells/Winki.',
  },

  // 6. Anglesea
  {
    id: 'anglesea',
    name: 'Anglesea',
    region: 'Surf Coast',
    coordinates: { lat: -38.408, lng: 144.187 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 5 },
    sweetSpot: { min: 2, max: 3.5 },
    optimalSwellDirection: { min: 127.5, max: 187.5 }, // SSE, more easterly
    optimalSwellPeriod: 8,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid tide' },
    baselineDifficulty: 'low',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'beginner',
    hazards: [
      { hazard: 'submerged groyne', description: 'Submerged groyne presents a real impact risk', activation: 'submerged_groyne', severity: 'danger' },
      { hazard: 'rips', description: 'Rips on bigger days', activation: 'strong_rip_with_onshore', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 110,
    consistency: 'high',
    variability: 'high',
    bestSeason: 'Year-round',
    notes: 'Beach breaks favour rights. Patrolled in summer.',
  },

  // 7. Fairhaven
  {
    id: 'fairhaven',
    name: 'Fairhaven',
    region: 'Surf Coast',
    coordinates: { lat: -38.466, lng: 144.082 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 2, max: 6 },
    sweetSpot: { min: 3, max: 5 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 9,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Most tides depending on banks' },
    baselineDifficulty: 'moderate',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'improver',
    hazards: [
      { hazard: 'rips', description: 'Rips through gaps in the bank', activation: 'always', severity: 'caution' },
      { hazard: 'wind exposure', description: 'Long open beach, wind-exposed', activation: 'always', severity: 'caution' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'high',
    variability: 'high',
    bestSeason: 'Autumn-Winter',
    notes: 'Long beach with many peaks, room to spread out.',
  },

  // 8. Lorne Point
  {
    id: 'lorne-point',
    name: 'Lorne Point',
    region: 'Surf Coast',
    coordinates: { lat: -38.541, lng: 143.983 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'point',
    workingSize: { min: 2, max: 8 },
    sweetSpot: { min: 3, max: 6 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW (needs size to wrap)
    optimalSwellPeriod: 12,
    offshoreDirection: 315, // NW (sheltered from W)
    offshoreBand: 60, // sheltered, more wind tolerance
    tide: { sensitivity: 'medium', preference: 'Mid-high' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'improver', // improver small clean days, intermediate generally
    hazards: [
      { hazard: 'rocks', description: 'Rocks along the point', activation: 'always', severity: 'caution' },
      { hazard: 'rips', description: 'Rips when bigger', activation: 'strong_rip_with_onshore', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 135,
    consistency: 'medium',
    variability: 'low',
    bestSeason: 'Winter',
    notes: 'Lorne Front Beach (separate spot, on Loutit Bay) is good for absolute beginners — patrolled, small waves.',
  },

  // 9. Johanna Beach
  {
    id: 'johanna',
    name: 'Johanna Beach',
    region: 'Otway Coast',
    coordinates: { lat: -38.756, lng: 143.389 },
    parentId: null,
    visibility: 'all',
    notable: true,
    breakType: 'beach',
    workingSize: { min: 2, max: 15 },
    sweetSpot: { min: 4, max: 8 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 10,
    offshoreDirection: 22.5, // N to NE
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Sandbank dependent' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'intermediate', // very small days only, advanced generally
    hazards: [
      { hazard: 'shore break', description: 'Brutal shore break — deadly above ~5ft', activation: 'shore_break_above_threshold', severity: 'danger' },
      { hazard: 'rips', description: 'Ripping currents, deep water close to shore', activation: 'always', severity: 'warning' },
      { hazard: 'remote location', description: 'Very remote, no quick rescue', activation: 'always', severity: 'warning' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 210,
    consistency: 'very_high',
    variability: 'high',
    bestSeason: 'Autumn-Winter',
    notes: 'Backup venue for Rip Curl Pro when Bells flat (2007, 2010). Hosted World Championships 1970.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MORNINGTON PENINSULA
  // ══════════════════════════════════════════════════════════════════════════

  // 10. Gunnamatta
  {
    id: 'gunnamatta',
    name: 'Gunnamatta',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.476, lng: 144.873 },
    parentId: null,
    visibility: 'all',
    notable: true,
    breakType: 'beach',
    workingSize: { min: 2, max: 10 },
    sweetSpot: { min: 3, max: 6 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 10,
    offshoreDirection: 22.5, // N to NE
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Sandbank dependent' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'intermediate', // small days light wind only, advanced generally
    hazards: [
      { hazard: 'rips', description: 'Strong rips, undertows. Has claimed lives.', activation: 'always', severity: 'danger' },
      { hazard: 'large waves', description: 'Powerful surf — sandbank-dependent peaks', activation: 'large_size_below_advanced', severity: 'danger' },
      { hazard: 'storm damage', description: 'Recent storm damage to main carpark stairs (check current status)', activation: 'always', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 75,
    consistency: 'high',
    variability: 'high',
    bestSeason: 'Autumn-Winter',
    notes: 'Most popular and biggest-wave Peninsula spot. NOT for beginners despite easy access.',
  },

  // 11. Rye Back Beach
  {
    id: 'rye-back-beach',
    name: 'Rye Back Beach',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.387, lng: 144.817 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 6 },
    sweetSpot: { min: 2, max: 4 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 9,
    offshoreDirection: 22.5, // N to NE
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Most tides' },
    baselineDifficulty: 'moderate',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'improver',
    hazards: [
      { hazard: 'rips', description: 'Rips through the bank gaps', activation: 'always', severity: 'caution' },
      { hazard: 'submerged rocks', description: 'Submerged rocks, unpatrolled', activation: 'always', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 80,
    consistency: 'high',
    variability: 'high',
    bestSeason: 'Year-round',
    notes: 'Multiple peaks across long stretch of numbered carparks.',
  },

  // 12. Portsea Back Beach
  {
    id: 'portsea-back-beach',
    name: 'Portsea Back Beach',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.329, lng: 144.696 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 2, max: 8 },
    sweetSpot: { min: 3, max: 5.5 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 10,
    offshoreDirection: 22.5, // N to NE
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Sandbank dependent' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rips', description: 'Strong rips and large waves', activation: 'always', severity: 'warning' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 90,
    consistency: 'high',
    variability: 'high',
    bestSeason: 'Autumn-Winter',
    notes: 'PM Harold Holt disappeared here in 1967. Patrolled in summer at Portsea SLSC area only.',
  },

  // 13. Sorrento Back Beach
  {
    id: 'sorrento-back-beach',
    name: 'Sorrento Back Beach',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.345, lng: 144.733 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 2, max: 6 },
    sweetSpot: { min: 3, max: 4.5 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 9,
    offshoreDirection: 45, // NE
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Most tides' },
    baselineDifficulty: 'moderate',
    forgiveness: 'forgiving', // cove shelters, sand bottom, family-friendly
    sizeSensitivity: 'linear',
    skillFloor: 'beginner',
    hazards: [
      { hazard: 'rips', description: 'Rips on bigger days', activation: 'strong_rip_with_onshore', severity: 'caution' },
      { hazard: 'rocks', description: 'Rocks at the edges of the cove', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 90,
    consistency: 'high',
    variability: 'medium',
    bestSeason: 'Year-round',
    notes: 'Cove-like shape provides some shelter. Family-friendly with rock pools at low tide.',
  },

  // 14. Point Leo
  {
    id: 'point-leo',
    name: 'Point Leo',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.417, lng: 145.081 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 1, max: 6 },
    sweetSpot: { min: 2, max: 4 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW (needs to wrap)
    optimalSwellPeriod: 10,
    offshoreDirection: 337.5, // N to NW
    offshoreBand: 60, // sheltered
    tide: { sensitivity: 'medium', preference: 'Mid to high' },
    baselineDifficulty: 'moderate',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'beginner', // longboard section, surf school operates here
    hazards: [
      { hazard: 'rocks', description: 'Rocks across the multiple sections', activation: 'always', severity: 'caution' },
      { hazard: 'rips', description: 'Rips between sections', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 80,
    consistency: 'medium',
    variability: 'low',
    bestSeason: 'Winter',
    notes: 'Multiple skill levels accommodated across different sections (Suicide Point, 1st Reef, 2nd Reef, Honeysuckle).',
  },

  // 15. Shoreham (The Pines)
  {
    id: 'shoreham',
    name: 'Shoreham (The Pines)',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.436, lng: 145.049 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'reef_point',
    workingSize: { min: 1, max: 4 },
    sweetSpot: { min: 1.5, max: 3 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 10,
    offshoreDirection: 315, // NW
    offshoreBand: 60, // sheltered
    tide: { sensitivity: 'high', preference: 'High tide best (shallow at point)' },
    baselineDifficulty: 'low',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'beginner',
    hazards: [
      { hazard: 'shallow rocks', description: 'Rocks shallow at low tide', activation: 'shallow_reef_low_tide', severity: 'warning' },
      { hazard: 'rips', description: 'Rips along the point', activation: 'always', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 90,
    consistency: 'medium',
    variability: 'low',
    bestSeason: 'Winter',
    notes: '"Little Noosa." Long, mellow, longboard-friendly point.',
  },

  // 16. Flinders
  {
    id: 'flinders',
    name: 'Flinders',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.479, lng: 145.022 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 2, max: 8 },
    sweetSpot: { min: 3, max: 6 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 10,
    offshoreDirection: 337.5, // N to NW (varies by break)
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Variable by break' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'strong currents', description: 'Powerful currents through the lineups', activation: 'always', severity: 'warning' },
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
      { hazard: 'localism', description: 'High localism', activation: 'always', severity: 'caution' },
      { hazard: 'naval gunnery', description: 'Cerberus Naval Range — guns fire Thursdays 11am from the cliff above', activation: 'always', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 90,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Multiple expert sub-breaks (Cyrils, Gunnery).',
  },

  // 16a. Flinders — Cyrils
  {
    id: 'flinders-cyrils',
    name: 'Flinders — Cyrils',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.479, lng: 145.022 },
    parentId: 'flinders',
    visibility: 'advanced',
    notable: true,
    breakType: 'reef',
    workingSize: { min: 3, max: 12 },
    sweetSpot: { min: 4, max: 8 },
    optimalSwellDirection: { min: 195, max: 255 },
    optimalSwellPeriod: 11,
    offshoreDirection: 337.5, // N to NW
    offshoreBand: 45,
    tide: { sensitivity: 'high', preference: 'Specific window — local knowledge essential' },
    baselineDifficulty: 'expert',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'advanced',
    hazards: [
      { hazard: 'heavy wave', description: "One of Victoria's heaviest waves", activation: 'always', severity: 'danger' },
      { hazard: 'localism', description: 'Strong localism — do not paddle out without local knowledge', activation: 'always', severity: 'warning' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 90,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Do not paddle out without local knowledge.',
  },

  // 16b. Flinders — The Gunnery
  {
    id: 'flinders-gunnery',
    name: 'Flinders — The Gunnery',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.479, lng: 145.022 },
    parentId: 'flinders',
    visibility: 'advanced',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 2, max: 6 },
    sweetSpot: { min: 3, max: 5 },
    optimalSwellDirection: { min: 195, max: 255 },
    optimalSwellPeriod: 10,
    offshoreDirection: 337.5,
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Variable' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'advanced',
    hazards: [
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
      { hazard: 'naval gunnery', description: 'Named for proximity to Cerberus Naval Range', activation: 'always', severity: 'caution' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 90,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Named for proximity to Cerberus Naval Range.',
  },

  // 17. St Andrews Beach
  {
    id: 'st-andrews-beach',
    name: 'St Andrews Beach',
    region: 'Mornington Peninsula',
    coordinates: { lat: -38.44, lng: 144.84 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 2, max: 6 },
    sweetSpot: { min: 3, max: 5 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 9,
    offshoreDirection: 22.5, // N to NE
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Sandbank dependent' },
    baselineDifficulty: 'high',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rips', description: 'Rips through bank gaps', activation: 'always', severity: 'caution' },
      { hazard: 'wind exposure', description: 'Open beach exposure', activation: 'always', severity: 'caution' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 85,
    consistency: 'high',
    variability: 'high',
    bestSeason: 'Autumn-Winter',
    notes: 'Less crowded alternative to Gunnamatta, similar character.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PHILLIP ISLAND
  // ══════════════════════════════════════════════════════════════════════════

  // 18. Cape Woolamai
  {
    id: 'cape-woolamai',
    name: 'Cape Woolamai',
    region: 'Phillip Island',
    coordinates: { lat: -38.555, lng: 145.338 },
    parentId: null,
    visibility: 'all',
    notable: true,
    breakType: 'beach',
    workingSize: { min: 2, max: 10 },
    sweetSpot: { min: 3, max: 6 },
    optimalSwellDirection: { min: 172.5, max: 232.5 }, // SSW, 60° window
    optimalSwellPeriod: 10,
    offshoreDirection: 22.5, // NE for main beach
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'All tides except dead low; mid-high preferred' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rips', description: 'Strong rips, worst at northern end', activation: 'always', severity: 'warning' },
      { hazard: 'closeouts', description: 'Powerful closeouts on big days', activation: 'large_size_below_advanced', severity: 'warning' },
      { hazard: 'sharks', description: 'Sharks sighted (no recorded attacks)', activation: 'always', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'very_high',
    variability: 'medium',
    bestSeason: 'Autumn (peak April)',
    notes: 'National Surfing Reserve. Different sections have different ideal wind directions.',
  },

  // 18a. Cape Woolamai — Magiclands
  {
    id: 'cape-woolamai-magiclands',
    name: 'Cape Woolamai — Magiclands',
    region: 'Phillip Island',
    coordinates: { lat: -38.555, lng: 145.338 },
    parentId: 'cape-woolamai',
    visibility: 'intermediate_advanced',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 5 },
    sweetSpot: { min: 2, max: 3.5 },
    optimalSwellDirection: { min: 172.5, max: 232.5 }, // SSW
    optimalSwellPeriod: 9,
    offshoreDirection: 112.5, // E to SE (sheltered by cape)
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'All tides' },
    baselineDifficulty: 'moderate',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'improver',
    hazards: [
      { hazard: 'rips', description: 'Rips on bigger days', activation: 'strong_rip_with_onshore', severity: 'caution' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'high',
    variability: 'medium',
    bestSeason: 'Autumn-Winter',
    notes: 'Most sheltered Woolamai option. Often works when other sections blown out.',
  },

  // 18b. Cape Woolamai — Anzacs (1st Carpark)
  {
    id: 'cape-woolamai-anzacs',
    name: 'Cape Woolamai — Anzacs (1st Carpark)',
    region: 'Phillip Island',
    coordinates: { lat: -38.555, lng: 145.338 },
    parentId: 'cape-woolamai',
    visibility: 'intermediate_advanced',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 2, max: 8 },
    sweetSpot: { min: 3, max: 5.5 },
    optimalSwellDirection: { min: 172.5, max: 232.5 }, // SSW
    optimalSwellPeriod: 10,
    offshoreDirection: 22.5, // NE to N
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid to high' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rips', description: 'Rippy and dangerous when bigger', activation: 'large_size_below_advanced', severity: 'warning' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'high',
    variability: 'medium',
    bestSeason: 'Autumn',
    notes: 'Hosts state and national titles.',
  },

  // 18c. Cape Woolamai — Ocean Reach / Forrest Caves
  {
    id: 'cape-woolamai-ocean-reach',
    name: 'Cape Woolamai — Ocean Reach / Forrest Caves',
    region: 'Phillip Island',
    coordinates: { lat: -38.555, lng: 145.338 },
    parentId: 'cape-woolamai',
    visibility: 'intermediate_advanced',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 2, max: 8 },
    sweetSpot: { min: 3, max: 5.5 },
    optimalSwellDirection: { min: 172.5, max: 232.5 }, // SSW
    optimalSwellPeriod: 10,
    offshoreDirection: 337.5, // N to NW
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid to high' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rips', description: 'Rips on bigger days', activation: 'large_size_below_advanced', severity: 'warning' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'medium',
    variability: 'medium',
    bestSeason: 'Autumn-Winter',
    notes: 'Less consistent than Anzacs, quieter on busy days.',
  },

  // 19. Smiths Beach
  {
    id: 'smiths-beach',
    name: 'Smiths Beach',
    region: 'Phillip Island',
    coordinates: { lat: -38.518, lng: 145.263 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 4 },
    sweetSpot: { min: 1.5, max: 3 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 9,
    offshoreDirection: 337.5, // N to NW
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Most tides' },
    baselineDifficulty: 'low',
    forgiveness: 'forgiving', // best PI beginner spot, sand bottom, patrolled summer
    sizeSensitivity: 'linear',
    skillFloor: 'beginner',
    hazards: [
      { hazard: 'rips', description: 'Rips on bigger days', activation: 'strong_rip_with_onshore', severity: 'caution' },
    ],
    crowd: 'high',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'high',
    variability: 'medium',
    bestSeason: 'Year-round',
    notes: 'Best Phillip Island beginner spot. Best at 1-1.5m days. Patrolled summer.',
  },

  // 20. YCW Beach
  {
    id: 'ycw-beach',
    name: 'YCW Beach',
    region: 'Phillip Island',
    coordinates: { lat: -38.52, lng: 145.25 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 4 },
    sweetSpot: { min: 1.5, max: 3 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 9,
    offshoreDirection: 337.5, // NW to N
    offshoreBand: 45,
    tide: { sensitivity: 'high', preference: 'High for shore breaks (west), low for rights (east)' },
    baselineDifficulty: 'moderate',
    forgiveness: 'moderate',
    sizeSensitivity: 'linear',
    skillFloor: 'improver',
    hazards: [
      { hazard: 'rips', description: 'Rips through the bank', activation: 'always', severity: 'caution' },
      { hazard: 'shore break power', description: 'Punchy shore break on the inside', activation: 'always', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'medium',
    variability: 'medium',
    bestSeason: 'Winter',
    notes: 'Often works when rest of island blown out. Good for bodyboarding.',
  },

  // 21. Express Point
  {
    id: 'express-point',
    name: 'Express Point',
    region: 'Phillip Island',
    coordinates: { lat: -38.528, lng: 145.24 },
    parentId: null,
    visibility: 'all',
    notable: true,
    breakType: 'reef',
    workingSize: { min: 3, max: 10 },
    sweetSpot: { min: 4, max: 7 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 11,
    offshoreDirection: 337.5, // N to NW
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid to high' },
    baselineDifficulty: 'expert',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'advanced',
    hazards: [
      { hazard: 'rocks', description: 'Rocks across the reef', activation: 'always', severity: 'warning' },
      { hazard: 'rips', description: 'Strong rips through the lineup', activation: 'always', severity: 'warning' },
      { hazard: 'localism', description: 'High localism', activation: 'always', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Big-wave barreling spot.',
  },

  // 22. Summerland (Centre Break)
  {
    id: 'summerland',
    name: 'Summerland (Centre Break)',
    region: 'Phillip Island',
    coordinates: { lat: -38.518, lng: 145.15 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 2, max: 6 },
    sweetSpot: { min: 3, max: 5 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 10,
    offshoreDirection: 292.5, // N to W → midpoint WNW (290 ish)
    offshoreBand: 60, // sheltered, generous
    tide: { sensitivity: 'high', preference: 'High tide' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
      { hazard: 'rips', description: 'Currents through the lineup', activation: 'always', severity: 'caution' },
      { hazard: 'access restrictions', description: 'Restricted hours due to penguin parade', activation: 'always', severity: 'caution' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'medium',
    variability: 'low',
    bestSeason: 'Winter',
    notes: 'Birthplace of Phillip Island surfing. Often works when other spots blown out by westerlies.',
  },

  // 23. Cat Bay (Right Point)
  {
    id: 'cat-bay',
    name: 'Cat Bay (Right Point)',
    region: 'Phillip Island',
    coordinates: { lat: -38.491, lng: 145.18 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 2, max: 6 },
    sweetSpot: { min: 3, max: 5 },
    optimalSwellDirection: { min: 195, max: 255 }, // bigger SW swells (needs 2m+)
    optimalSwellPeriod: 11,
    offshoreDirection: 135, // S to E → midpoint SE (counter-intuitive)
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'All tides for Right Point; varies by sub-break' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'low',
    variability: 'low',
    bestSeason: 'Summer (counter-intuitive)',
    notes: 'Works in summer when other spots flat — opposite ideal wind direction to most Victorian spots.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BASS COAST
  // ══════════════════════════════════════════════════════════════════════════

  // 24. Cape Paterson (1st Surf Beach)
  {
    id: 'cape-paterson',
    name: 'Cape Paterson (1st Surf Beach)',
    region: 'Bass Coast',
    coordinates: { lat: -38.675, lng: 145.632 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 4 },
    sweetSpot: { min: 1.5, max: 3 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 9,
    offshoreDirection: 22.5, // N to NE
    offshoreBand: 60, // sheltered
    tide: { sensitivity: 'low', preference: 'Most tides' },
    baselineDifficulty: 'low',
    forgiveness: 'forgiving', // sheltered, patrolled summer, family-friendly
    sizeSensitivity: 'linear',
    skillFloor: 'beginner',
    hazards: [
      { hazard: 'rips', description: 'Rips on bigger days', activation: 'strong_rip_with_onshore', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 110,
    consistency: 'high',
    variability: 'medium',
    bestSeason: 'Year-round',
    notes: '"Torquay 30 years ago" feel. Less crowded than Surf Coast equivalents. Patrolled summer.',
  },

  // 24a. Cape Paterson — The Channel
  {
    id: 'cape-paterson-channel',
    name: 'Cape Paterson — The Channel',
    region: 'Bass Coast',
    coordinates: { lat: -38.675, lng: 145.632 },
    parentId: 'cape-paterson',
    visibility: 'intermediate_advanced',
    notable: false,
    breakType: 'reef',
    workingSize: { min: 1, max: 5 },
    sweetSpot: { min: 2, max: 4 },
    optimalSwellDirection: { min: 195, max: 255 },
    optimalSwellPeriod: 9,
    offshoreDirection: 45, // NE
    offshoreBand: 45,
    tide: { sensitivity: 'low', preference: 'Works varying tides' },
    baselineDifficulty: 'moderate',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 110,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Autumn-Winter',
    notes: 'Good introduction to reef break surfing for intermediates stepping up.',
  },

  // 24b. Cape Paterson — F Break
  {
    id: 'cape-paterson-f-break',
    name: 'Cape Paterson — F Break',
    region: 'Bass Coast',
    coordinates: { lat: -38.675, lng: 145.632 },
    parentId: 'cape-paterson',
    visibility: 'advanced',
    notable: true,
    breakType: 'beach',
    workingSize: { min: 3, max: 8 },
    sweetSpot: { min: 4, max: 6.5 },
    optimalSwellDirection: { min: 195, max: 255 },
    optimalSwellPeriod: 10,
    offshoreDirection: 45, // NE
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid' },
    baselineDifficulty: 'expert',
    forgiveness: 'punishing',
    sizeSensitivity: 'steep',
    skillFloor: 'advanced',
    hazards: [
      { hazard: 'hidden rocks', description: 'Hidden rocks under the sand — local knowledge essential', activation: 'any_size_below_advanced', severity: 'danger' },
      { hazard: 'rips', description: 'Strong rips on good ground swells', activation: 'always', severity: 'warning' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 110,
    consistency: 'medium',
    variability: 'medium',
    bestSeason: 'Autumn-Winter',
    notes: 'Other side of the Cape from First Surf Beach. Powerful beach break over rocky seabed.',
  },

  // 25. Inverloch
  {
    id: 'inverloch',
    name: 'Inverloch',
    region: 'Bass Coast',
    coordinates: { lat: -38.628, lng: 145.728 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 6 },
    sweetSpot: { min: 2, max: 4 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW
    optimalSwellPeriod: 8,
    offshoreDirection: 315, // NW
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Mid to high (rising)' },
    baselineDifficulty: 'low',
    forgiveness: 'forgiving', // small surf, SLSC presence, sand bottom
    sizeSensitivity: 'linear',
    skillFloor: 'beginner',
    hazards: [
      { hazard: 'rips', description: 'Rips and undertow', activation: 'strong_rip_with_onshore', severity: 'caution' },
      { hazard: 'water quality', description: 'Water quality affected by Anderson Inlet runoff after rain', activation: 'always', severity: 'caution' },
    ],
    crowd: 'low',
    driveFromMelbourneCBDMinutes: 120,
    consistency: 'medium',
    variability: 'high',
    bestSeason: 'December-April',
    notes: 'Quiet South Gippsland spot. Rewards patience and local knowledge of banks.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OTWAY COAST EXTENSION
  // ══════════════════════════════════════════════════════════════════════════

  // 26. Apollo Bay
  {
    id: 'apollo-bay',
    name: 'Apollo Bay',
    region: 'Otway Coast',
    coordinates: { lat: -38.757, lng: 143.67 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'beach',
    workingSize: { min: 1, max: 4 },
    sweetSpot: { min: 1.5, max: 3 },
    optimalSwellDirection: { min: 195, max: 255 }, // SW (some E in swell helps)
    optimalSwellPeriod: 9,
    offshoreDirection: 270, // W (offshore)
    offshoreBand: 60, // sheltered
    tide: { sensitivity: 'medium', preference: 'Low tide rising' },
    baselineDifficulty: 'low',
    forgiveness: 'forgiving', // sheltered town beach, surf schools, gentle
    sizeSensitivity: 'linear',
    skillFloor: 'beginner',
    hazards: [
      { hazard: 'rips', description: 'Rips on bigger days', activation: 'strong_rip_with_onshore', severity: 'caution' },
      { hazard: 'overcrowding', description: 'Overcrowding can be hazardous per local notes', activation: 'crowd_for_lower_skill', severity: 'caution', appliesToSkill: ['beginner', 'improver'] },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 180,
    consistency: 'high',
    variability: 'medium',
    bestSeason: 'Winter (peak August)',
    notes: 'Great Ocean Walk start point. Surf schools operate here.',
  },

  // 27. Marengo
  {
    id: 'marengo',
    name: 'Marengo',
    region: 'Otway Coast',
    coordinates: { lat: -38.792, lng: 143.658 },
    parentId: null,
    visibility: 'all',
    notable: false,
    breakType: 'reef_point',
    workingSize: { min: 2, max: 6 },
    sweetSpot: { min: 3, max: 5 },
    optimalSwellDirection: { min: 172.5, max: 232.5 }, // SSW
    optimalSwellPeriod: 10,
    offshoreDirection: 270, // W
    offshoreBand: 45,
    tide: { sensitivity: 'medium', preference: 'Variable' },
    baselineDifficulty: 'high',
    forgiveness: 'punishing',
    sizeSensitivity: 'linear',
    skillFloor: 'intermediate',
    hazards: [
      { hazard: 'rocks', description: 'Rocky reef bottom', activation: 'always', severity: 'caution' },
      { hazard: 'rips', description: 'Rips through the point', activation: 'always', severity: 'caution' },
    ],
    crowd: 'medium',
    driveFromMelbourneCBDMinutes: 185,
    consistency: 'high',
    variability: 'low',
    bestSeason: 'Winter (peak August)',
    notes: 'Reef break alternative to Apollo Bay\'s beach break. ~3km south of Apollo Bay town.',
  },
];

// Lookup by id for quick parent resolution.
export const spotById: Map<string, Spot> = new Map(spots.map((s) => [s.id, s]));
