/**
 * Icon helpers — single source of truth for emoji used as lightweight icons
 * across product cards, filter pills, and detail screens.
 *
 * WHY emoji instead of an SVG icon set:
 *   1. Zero bundle cost. Native flag SVGs add ~30 KB per icon set, and a
 *      goat/cow line icon set adds another ~15 KB.
 *   2. Renders consistently on every OS via the system emoji font (we don't
 *      load Twemoji or similar — the user's OS handles it). On Android 8+,
 *      iOS 12+, and modern desktop browsers the glyph coverage we need is
 *      universal.
 *   3. Accessibility: screen readers announce emoji with their Unicode name
 *      automatically — e.g. "Flag: Singapore" — without us wiring `aria-label`.
 *
 * Tradeoff: we cannot recolour emoji. If the design team wants monochrome
 * brand-tinted icons, swap to SVG. For now, the visual style is informal
 * and friendly which matches the parent/caregiver audience.
 */

/* -------------------------------------------------------------------------- */
/* Country flags                                                              */
/* -------------------------------------------------------------------------- */

// Map from `Product.origin` (country of manufacture) to the country flag.
// The design handoff keys flags by ORIGIN (where the product is made), not
// by brand HQ — this is honest for shoppers: a Nestlé tin made in Singapore
// should fly the Singapore flag, not the Swiss one.
//
// Source of truth: the `FLAG` constant in the design handoff `index.html`.
// If new origins appear in the dataset, add an entry here AND have the
// design team approve the flag choice (some countries share visual symbols).
const ORIGIN_TO_FLAG: Readonly<Record<string, string>> = {
  Germany:       '🇩🇪',
  'New Zealand': '🇳🇿',
  USA:           '🇺🇸',
  Netherlands:   '🇳🇱',
  Australia:     '🇦🇺',
  Singapore:     '🇸🇬',
  Ireland:       '🇮🇪',
  Switzerland:   '🇨🇭',
  Denmark:       '🇩🇰',
};

// Globe used when an origin has no explicit mapping. The "Earth with
// meridians" variant is more legible at small sizes than the regional globes.
const FLAG_FALLBACK = '🌏';

/**
 * Return the flag emoji for a country-of-origin string.
 *
 * @param origin Exact string from `Product.origin` (e.g. "Singapore").
 * @returns A flag emoji or globe fallback. Never throws.
 */
export const getOriginFlag = (origin: string | null | undefined): string => {
  if (!origin) return FLAG_FALLBACK;
  return ORIGIN_TO_FLAG[origin] ?? FLAG_FALLBACK;
};

// Backward-compatible alias for the earlier brand-keyed helper. Some
// components still pass a brand string; they fall through to the globe.
// Prefer `getOriginFlag` in new code — it's the design-spec contract.
export const getCountryFlag = (brandOrOrigin: string): string =>
  ORIGIN_TO_FLAG[brandOrOrigin] ?? FLAG_FALLBACK;

/* -------------------------------------------------------------------------- */
/* Milk type icons                                                            */
/* -------------------------------------------------------------------------- */

// Matches the literal strings used in `Product.milkType` (see products.json).
// Keep this union narrow so a typo in a new product entry surfaces as a
// type error during development rather than silently rendering the fallback.
export type MilkType = 'cow' | 'goat' | 'soy';

const MILK_TYPE_TO_ICON: Readonly<Record<MilkType, string>> = {
  cow:  '🐄',
  goat: '🐐',
  soy:  '🌱',
};

// Generic milk bottle for unknown / future milk types (camel? sheep? rice?).
const MILK_FALLBACK = '🍼';

/**
 * Return the icon emoji for a given milk type.
 *
 * Accepts an arbitrary string at the type boundary because product data
 * arrives from JSON (and later Supabase) — we cannot guarantee at compile
 * time that the value is a `MilkType`. The runtime check + fallback makes
 * the function safe for any input.
 *
 * @param type Milk base — typically "cow", "goat", or "soy".
 * @returns Emoji string. Falls back to 🍼 for unknown types.
 */
export const getMilkTypeIcon = (type: string): string => {
  // Defensive lowercase + trim: lets the function tolerate "Cow", " goat ",
  // etc. without forcing every call site to pre-normalise.
  const key = type.trim().toLowerCase() as MilkType;
  return MILK_TYPE_TO_ICON[key] ?? MILK_FALLBACK;
};
