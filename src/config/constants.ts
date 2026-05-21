/**
 * App-wide constants.
 *
 * Anything that is a literal number, magic string, or fixed list shared
 * between two or more files lives here. The rule of thumb: if you would
 * grep the codebase to find every place it is used, it belongs in this file.
 *
 * Keeping these centralised matches the project's "Avoid Hard-Coded Numbers"
 * standard and makes future refactors safer — change a value once, the
 * whole app picks it up.
 */

// ── Branding ────────────────────────────────────────────────────────────────
export const APP_NAME    = 'MilkWise SG';
export const APP_TAGLINE = 'Compare baby formula in Singapore';
export const APP_VERSION = '1.0.0';

// ── Pagination & list limits ────────────────────────────────────────────────
// Used by Compare to avoid mounting every row/image on first render.
export const INITIAL_RENDER_COUNT = 12;
export const PAGE_SIZE            = 24;

// ── Feature flags ───────────────────────────────────────────────────────────
// Flags let us ship code that is "off" by default until a feature is ready.
// Replace these with reads from a remote-config service (e.g. Supabase) once
// the backend is wired up.
export const FEATURES = {
  // Switches the data source. When false → static JSON. When true → Supabase.
  // Will flip in Session 3 once the database is provisioned.
  useRemoteData: false,
  // Calculator screen is built but the rounding logic still needs review.
  calculatorEnabled: true,
  // Most-sold rankings depend on an analytics backend we have not built yet.
  mostSoldEnabled:   true,
} as const;

// ── Currency & locale ───────────────────────────────────────────────────────
// MilkWise SG sells exclusively in Singapore — defaults reflect that, but
// pulling them out as constants means swapping for another region later is
// a single-line change.
export const CURRENCY_CODE  = 'SGD';
export const CURRENCY_LABEL = 'S$';
export const LOCALE         = 'en-SG';
