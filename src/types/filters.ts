/**
 * Filter, sort, and display-mode types for the Compare screen.
 *
 * These describe the *shape of the user's intent*, not the data itself.
 * Keeping them in their own module means the hook (`useProducts`) and the
 * UI components (FilterBar, SortDropdown, …) share the same vocabulary
 * without either depending on the other.
 */

import type { MilkType, Stage, Specialty } from './product';

// ── Display mode ────────────────────────────────────────────────────────────
// Three layouts in the Compare screen. The user toggles between them.
//   • card    — image-forward tiles (default on mobile)
//   • list    — dense rows with the most data per inch of screen
//   • picture — image-only gallery, useful on a phone in-store
export type DisplayMode = 'card' | 'list' | 'picture';

// ── Multi-select filter arrays ──────────────────────────────────────────────
// Empty array = "no filter applied for this dimension". A user picks any
// number of stages/brands/specialties and the result is the AND across
// dimensions, OR within a dimension (same semantics as faceted search on
// every modern storefront).
//
// We chose arrays over `Set<string>` because:
//   1. Sets don't JSON-serialise — so we can't drop them into a URL query.
//   2. React state comparisons rely on reference equality; arrays make the
//      "did this dimension change?" check explicit.
//
// Backward-compat note: the previous shape used a literal `'All' | T`
// string. Code reading the old shape will break — every consumer was
// updated in the same refactor.
export type StageFilter     = readonly Stage[];
export type BrandFilter     = readonly string[];
export type OriginFilter    = readonly string[];
export type MilkTypeFilter  = readonly MilkType[];
// `Specialty` already includes `null` for the "no specialty" case; we
// strip it out here because the filter array semantics treat empty as "all".
export type SpecialtyFilter = readonly Exclude<Specialty, null>[];

// ── Sort options ────────────────────────────────────────────────────────────
// `SortField` is the column being sorted on; `SortDirection` is asc/desc.
// Two fields kept independent because a user often flips direction without
// changing field (e.g. "actually I want highest price first").
export type SortField =
  | 'name'
  | 'brand'
  | 'price'
  | 'pricePerGram'
  | 'pricePerScoop'
  | 'pricePerMl'
  | 'protein'
  | 'dha';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field:     SortField;
  direction: SortDirection;
}

// ── Aggregate filter state ──────────────────────────────────────────────────
// The single object the `useProducts` hook accepts and reduces against.
// Bundling the keys lets us pass one prop down, persist the state to a URL
// query string, and reset it in one assignment.
export interface FilterState {
  search:      string;
  stages:      StageFilter;
  brands:      BrandFilter;
  specialties: SpecialtyFilter;
  origins:     OriginFilter;
  milkTypes:   MilkTypeFilter;
  halalOnly:   boolean;
  partialHydroOnly: boolean;
  extHydroOnly:     boolean;
  sort:        SortState;
}

// Sensible defaults — referenced by the hook and the "Reset filters" button.
// `as const` arrays serve as readonly empty arrays without allocating a
// fresh `[]` on every reference.
export const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  stages:      [] as const,
  brands:      [] as const,
  specialties: [] as const,
  origins:     [] as const,
  milkTypes:   [] as const,
  halalOnly:   false,
  partialHydroOnly: false,
  extHydroOnly:     false,
  sort: { field: 'pricePerGram', direction: 'asc' },
};

// ── Compare selection ───────────────────────────────────────────────────────
// Up to N products the user has pinned for side-by-side comparison.
// Kept in the same state container as filters so a single Context provider
// covers the whole Compare-screen experience.
export const MAX_COMPARE_SELECTION = 5;
