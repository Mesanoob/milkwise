/**
 * useProducts — the Compare screen's brain.
 *
 * Responsibilities:
 *   1. Load the dataset from the configured `ProductRepository`.
 *   2. Hold the user's filter / sort / search intent in a single state object.
 *   3. Derive (not store!) the visible product list from raw data + intent.
 *
 * Why derived state instead of storing the filtered array:
 *   The filtered list is a *function* of (rawProducts, filters). If we stored
 *   it in `useState`, two sources of truth would drift. By recomputing with
 *   `useMemo`, the visible list can never be out of sync with the filters
 *   that produced it. This is the same principle React's docs call
 *   "minimize state".
 *
 * Performance:
 *   `useMemo` only recomputes when its dependency identities change, so a
 *   keystroke in the search box does not re-sort the array unless the
 *   normalised search string actually changed. The dataset is small (61
 *   products) but the same approach scales to thousands without a rewrite.
 */

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../types/product';
import type { FilterState, SortField, SortDirection } from '../types/filters';
import { DEFAULT_FILTER_STATE } from '../types/filters';
import { getProductRepository } from '../services/productRepository';
import { normaliseForSearch } from '../utils/strings';

// ── Public hook return shape ────────────────────────────────────────────────
export interface UseProductsResult {
  // Raw data + load state — useful for headers ("loading…", "61 products").
  allProducts: Product[];
  isLoading:   boolean;
  error:       Error | null;

  // The list to render. Already filtered and sorted.
  visibleProducts: Product[];

  // User intent (filters/sort/search) + setters.
  filters: FilterState;
  setSearch:    (q: string) => void;
  setStage:     (stage:   FilterState['stage'])     => void;
  setBrand:     (brand:   FilterState['brand'])     => void;
  setSpecialty: (key:     FilterState['specialty']) => void;
  setSort:      (field: SortField, direction?: SortDirection) => void;
  resetFilters: () => void;
}

export const useProducts = (): UseProductsResult => {
  // ── Raw dataset ──────────────────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading,   setLoading]     = useState<boolean>(true);
  const [error,       setError]       = useState<Error | null>(null);

  // One-shot load on mount. The repository abstraction lets us swap to
  // Supabase later without rewriting this effect.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const repo = await getProductRepository();
        const list = await repo.listProducts();
        if (!cancelled) {
          setAllProducts(list);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          // We coerce to Error to give consumers a stable type.
          setError(caught instanceof Error ? caught : new Error(String(caught)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    // Cleanup guards against the (rare) case where the user navigates away
    // mid-fetch — calling setState on an unmounted component would warn.
    return () => {
      cancelled = true;
    };
  }, []);

  // ── User intent ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);

  // Setters are wrapped functions so callers don't have to know the FilterState
  // shape — they just pass the new value. Note the use of functional updates
  // (`prev => …`) which protect against stale-closure bugs in async paths.
  const setSearch    = (search: string) => setFilters((prev) => ({ ...prev, search }));
  const setStage     = (stage:  FilterState['stage']) => setFilters((prev) => ({ ...prev, stage }));
  const setBrand     = (brand:  FilterState['brand']) => setFilters((prev) => ({ ...prev, brand }));
  const setSpecialty = (specialty: FilterState['specialty']) =>
    setFilters((prev) => ({ ...prev, specialty }));

  // Sort toggles direction when the same field is selected twice, mirroring
  // the behaviour of every spreadsheet on earth.
  const setSort = (field: SortField, direction?: SortDirection) =>
    setFilters((prev) => {
      const nextDirection: SortDirection =
        direction ??
        (prev.sort.field === field
          ? (prev.sort.direction === 'asc' ? 'desc' : 'asc')
          : 'asc');
      return { ...prev, sort: { field, direction: nextDirection } };
    });

  const resetFilters = () => setFilters(DEFAULT_FILTER_STATE);

  // ── Derived list ─────────────────────────────────────────────────────────
  const visibleProducts = useMemo(
    () => sortProducts(filterProducts(allProducts, filters), filters.sort),
    [allProducts, filters],
  );

  return {
    allProducts,
    isLoading,
    error,
    visibleProducts,
    filters,
    setSearch,
    setStage,
    setBrand,
    setSpecialty,
    setSort,
    resetFilters,
  };
};

// ── Pure helpers ────────────────────────────────────────────────────────────
// Kept outside the hook so they can be unit-tested with no React in the loop.

/**
 * Filter products against the user's current intent. Each clause is short-
 * circuited — the more restrictive filters (stage, brand) run first to
 * trim the candidate list before the more expensive substring match.
 */
const filterProducts = (products: Product[], filters: FilterState): Product[] => {
  // Pre-normalise the search query once instead of per-product.
  const needle = normaliseForSearch(filters.search.trim());

  return products.filter((product) => {
    if (filters.stage     !== 'All' && product.stage !== filters.stage)         return false;
    if (filters.brand     !== 'All' && product.brand !== filters.brand)         return false;
    if (filters.specialty !== 'All' && product.specialty !== filters.specialty) return false;

    if (needle.length > 0) {
      // Search across the most relevant fields — broader than name alone
      // so users can find "soy" by typing "soy" without knowing brand names.
      const haystack = normaliseForSearch(
        [product.name, product.brand, product.fullName, product.bestFor].join(' '),
      );
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
};

/**
 * Sort by the configured field. Returns a NEW array (does not mutate input)
 * so React's referential equality checks work correctly.
 */
const sortProducts = (products: Product[], sort: FilterState['sort']): Product[] => {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...products].sort((a, b) => {
    const av = readSortValue(a, sort.field);
    const bv = readSortValue(b, sort.field);

    // Push null/undefined to the bottom regardless of direction — a missing
    // value is never "cheapest" or "highest protein", it's just unknown.
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    if (typeof av === 'string' && typeof bv === 'string') {
      return av.localeCompare(bv) * direction;
    }
    return ((av as number) - (bv as number)) * direction;
  });
};

/**
 * Pull the comparable value for a given sort field. Centralised so the
 * sort logic above stays small and so adding a new sort field is a
 * one-place change.
 */
const readSortValue = (product: Product, field: SortField): string | number | null => {
  switch (field) {
    case 'name':          return product.name;
    case 'brand':         return product.brand;
    case 'price':         return product.price          ?? null;
    case 'pricePerGram':  return product.pricePerGram   ?? null;
    case 'pricePerScoop': return product.pricePerScoop  ?? null;
    case 'protein':       return product.nutrition.protein ?? null;
    case 'dha':           return product.nutrition.dha     ?? null;
  }
};
