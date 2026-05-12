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

// ── Comparison rules ────────────────────────────────────────────────────────
// Maximum products a user can pin for side-by-side comparison.
// 5 was chosen because (a) most users compare 2–3, and (b) more than 5
// produces an unreadable table on mobile widths.
export const MAX_COMPARE_PRODUCTS = 5;

// ── Pagination & list limits ────────────────────────────────────────────────
// Used by ProductGrid to decide how many items to render eagerly.
// Mobile devices struggle with React Native FlatList past ~50 visible items.
export const INITIAL_RENDER_COUNT = 12;
export const PAGE_SIZE            = 24;

// ── Search ──────────────────────────────────────────────────────────────────
// Debounce delay (ms) before search input triggers a filter pass.
// Below 150ms feels jittery, above 400ms feels unresponsive.
export const SEARCH_DEBOUNCE_MS = 200;
export const MIN_SEARCH_LENGTH  = 1;

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

// ── Storage keys ────────────────────────────────────────────────────────────
// Namespaced to avoid collisions if another app shares localStorage on web.
export const STORAGE_KEYS = {
  comparison: 'milkwise.comparison.v1',
  lastViewed: 'milkwise.lastViewed.v1',
} as const;
