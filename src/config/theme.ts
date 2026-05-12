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

// ── Typography ──────────────────────────────────────────────────────────────
// Two-family system. Serif for marketing headlines, sans for everything else.
// Numeric size scale follows a perceptual ratio (~1.2) for visual rhythm.
export const fonts = {
  serif: 'DMSerifDisplay',
  sans:  'DMSans',
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
export const theme = { colors, fonts, fontSizes, spacing, radius, shadow } as const;
export type Theme = typeof theme;
