/**
 * Design tokens — the single source of truth for brand colour, spacing,
 * typography, and elevation values used anywhere in the app.
 *
 * WHY this file exists separately from `tailwind.config.js`:
 *   Tailwind config drives `className="bg-green"` (NativeWind/web styling),
 *   but pieces of the app written in plain `StyleSheet` (e.g. native-only
 *   animation helpers, third-party components that demand a hex string)
 *   still need access to the same palette. Both files must stay in sync.
 *
 * If you change a value here, also update the matching key in
 * `tailwind.config.js`. The two files are mirrors of each other by design.
 */

// ── Brand palette ───────────────────────────────────────────────────────────
// Hex values come straight from the MilkWise SG design system.
// `as const` makes every value a literal type — autocomplete inside the app
// will suggest `theme.colors.green` rather than `string`.
export const colors = {
  bg:            '#F5F2EB', // page background — warm off-white
  surface:       '#FFFFFF', // primary card / sheet background
  surface2:      '#F9F7F2', // alternate surface for subtle striping
  green:         '#1B5E3B', // primary brand colour
  greenMid:      '#2D7A52',
  greenLight:    '#EBF5EE', // tint for active states and highlights
  amber:         '#E07B39', // accent — used sparingly for value/best-in-class
  amberLight:    '#FDF0E6',
  text:          '#1A1A1A', // primary text
  muted:         '#6B7280', // secondary text, captions, hints
  border:        '#E0D9CC', // hairline dividers and field borders
  danger:        '#DC2626', // destructive / error states
  warning:       '#F59E0B',
} as const;

// ── Specialty colours ───────────────────────────────────────────────────────
// One colour pair per specialty tag. Each entry has a `bg` (light tint used
// as pill background) and a `fg` (dark variant used for text + border + icon).
//
// These hex values are LIFTED VERBATIM from the design handoff
// (`SPECIALTY_COLOR` map in the prototype `index.html`). Do not "fix" the
// contrast or tune the hues — the design team picked these to read as a
// coherent system across all 11 specialties. Every pair is WCAG AA at the
// 10–12px tag sizes we ship.
//
// Keys MUST match the raw specialty strings in `products.json` — see
// `ALL_SPECIALTIES` in `src/data/products.ts`.
export const specialtyColors = {
  ar:             { bg: '#FEF3C7', fg: '#92400E' }, // anti-reflux — warm amber
  budget:         { bg: '#DBEAFE', fg: '#1E40AF' }, // value/budget — blue
  csection:       { bg: '#F3E8FF', fg: '#6B21A8' }, // c-section recovery — purple
  gentle:         { bg: '#FCE7F3', fg: '#9D174D' }, // gentle digestion — pink
  goat:           { bg: '#FEF9C3', fg: '#713F12' }, // goat milk — mustard
  ha:             { bg: '#EDE9FE', fg: '#6D28D9' }, // hypoallergenic-lite (HA) — violet
  hypoallergenic: { bg: '#FFE4E6', fg: '#9F1239' }, // full hypoallergenic — rose
  lactosefree:    { bg: '#E0F2FE', fg: '#0369A1' }, // lactose-free — sky blue
  organic:        { bg: '#DCFCE7', fg: '#166534' }, // organic — fresh green
  premature:      { bg: '#FFF7ED', fg: '#9A3412' }, // premature/low-birthweight — orange
  soy:            { bg: '#D1FAE5', fg: '#065F46' }, // soy-based — emerald
} as const;

// ── Stage badge palette ─────────────────────────────────────────────────────
// Subtle pastel pills used to flag what life stage a formula targets.
// Also lifted from the design handoff. Each stage has its own colour so the
// eye can spot "Stage 1 vs Stage 2" without reading the text.
export const stageColors = {
  'Stage 1': { bg: '#DBEAFE', fg: '#1E40AF' },
  'Stage 2': { bg: '#FCE7F3', fg: '#9D174D' },
  'Stage 3': { bg: '#D1FAE5', fg: '#065F46' },
  'Newborn': { bg: '#FFE4E6', fg: '#9F1239' },
} as const;

export type StageKey = keyof typeof stageColors;

export type SpecialtyKey = keyof typeof specialtyColors;

// ── Typography ──────────────────────────────────────────────────────────────
// Font family names must match the keys passed to `useFonts` in
// `app/_layout.tsx`. The `@expo-google-fonts/*` packages use the literal
// "<Family>_<Weight><Style>" naming convention — keep it intact.
//
// On native, React Native does NOT synthesise weights for custom fonts —
// `fontWeight: '700'` on `DMSans_400Regular` will render at 400. To get
// bold, you must explicitly set `fontFamily: 'DMSans_700Bold'`. The helpers
// below give component code a single source of truth.
export const fonts = {
  serif:        'DMSerifDisplay_400Regular',
  sansLight:    'DMSans_300Light',
  sans:         'DMSans_400Regular',
  sansMedium:   'DMSans_500Medium',
  sansSemibold: 'DMSans_600SemiBold',
  sansBold:     'DMSans_700Bold',
} as const;

export const fontSizes = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   15,
  lg:   18,
  xl:   22,
  '2xl': 28,
  '3xl': 34,
} as const;

// ── Spacing ─────────────────────────────────────────────────────────────────
// 4-pixel base unit. Use these instead of arbitrary numbers in StyleSheet
// (in Tailwind classes you'd write `p-2`, `gap-4` etc.).
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

// ── Shape ───────────────────────────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 10,
  lg: 14, // brand default — used on cards
  xl: 20,
  full: 9999,
} as const;

// ── Elevation ───────────────────────────────────────────────────────────────
// Web/Android use `shadow*` keys; iOS reads the same keys but the values are
// approximations of `box-shadow`. Always test on a real device after edits.
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 1,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 32,
    elevation: 4,
  },
} as const;

// Aggregate export for ergonomic consumption: `import { theme } from ...`
export const theme = {
  colors,
  specialtyColors,
  stageColors,
  fonts,
  fontSizes,
  spacing,
  radius,
  shadow,
} as const;
export type Theme = typeof theme;
