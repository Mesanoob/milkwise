/**
 * Filter, sort, and display-mode types for the Compare screen.
 *
 * These describe the *shape of the user's intent*, not the data itself.
 * Keeping them in their own module means the hook (`useProducts`) and the
 * UI components (FilterBar, SortDropdown, …) share the same vocabulary
 * without either depending on the other.
 */

import type { Stage, Specialty } from './product';

// ── Display mode ────────────────────────────────────────────────────────────
// Three layouts in the Compare screen. The user toggles between them.
//   • card    — image-forward tiles (default on mobile)
//   • list    — dense rows with the most data per inch of screen
//   • picture — image-only gallery, useful on a phone in-store
export type DisplayMode = 'card' | 'list' | 'picture';

// ── Stage filter ────────────────────────────────────────────────────────────
// `'All'` is a UI sentinel meaning "no stage filter applied". Using a
// dedicated literal instead of `undefined` makes the discriminated union
// exhaustive — TypeScript will tell us if we forget a case.
export type StageFilter = 'All' | Stage;

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
  search:    string;
  stage:     StageFilter;
  brand:     'All' | string;
  specialty: Specialty | 'All';
  sort:      SortState;
}

// Sensible defaults — referenced by the hook and the "Reset filters" button.
export const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  stage:  'All',
  brand:  'All',
  specialty: 'All',
  sort: { field: 'price', direction: 'asc' },
};
