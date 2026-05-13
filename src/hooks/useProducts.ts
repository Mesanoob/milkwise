/**
 * useProducts — the Compare screen's brain.
 *
 * Responsibilities:
 *   1. Load the dataset from the configured `ProductRepository`.
 *   2. Hold the user's filter + sort + search intent + compare selection.
 *   3. Derive (not store!) the visible product list from raw data + intent.
 *
 * Why derived state instead of storing the filtered array:
 *   The filtered list is a *function* of (rawProducts, filters). If we
 *   stored it in state, two sources of truth would drift. `useMemo`
 *   guarantees they never can — the visible list is recomputed only when
 *   the inputs change. Same principle as React's own "minimize state".
 *
 * Why this hook is paired with a Context (see `ProductsContext.tsx`):
 *   Calling `useProducts()` directly inside the Compare screen means
 *   filters reset on every back-navigation because the screen unmounts.
 *   Lifting state into a Context at `_layout.tsx` keeps the state alive
 *   for the whole session — refresh wipes it (intentional UX).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MilkType, Product, Stage, Specialty } from '../types/product';
import type {
  FilterState,
  SortField,
  SortDirection,
  BrandFilter,
  MilkTypeFilter,
  OriginFilter,
  StageFilter,
  SpecialtyFilter,
} from '../types/filters';
import { DEFAULT_FILTER_STATE, MAX_COMPARE_SELECTION } from '../types/filters';
import { getProductRepository } from '../services/productRepository';
import { normaliseForSearch } from '../utils/strings';

// ── Public hook return shape ────────────────────────────────────────────────
export interface UseProductsResult {
  // Raw data + load state.
  allProducts: Product[];
  isLoading:   boolean;
  error:       Error | null;

  // The list to render. Already filtered and sorted.
  visibleProducts: Product[];

  // User intent (filters/sort/search) + setters.
  filters: FilterState;
  setSearch:     (q: string) => void;
  toggleStage:   (stage: Stage) => void;
  toggleBrand:   (brand: string) => void;
  toggleSpecialty: (key: Exclude<Specialty, null>) => void;
  toggleOrigin:  (origin: string) => void;
  toggleMilkType:(milkType: MilkType) => void;
  toggleHalalOnly: () => void;
  togglePartialHydroOnly: () => void;
  toggleExtHydroOnly: () => void;
  setStages:     (next: StageFilter) => void;
  setBrands:     (next: BrandFilter) => void;
  setSpecialties:(next: SpecialtyFilter) => void;
  setOrigins:    (next: OriginFilter) => void;
  setMilkTypes:  (next: MilkTypeFilter) => void;
  setSort:       (field: SortField, direction?: SortDirection) => void;
  clearAdvancedFilters: () => void;
  resetFilters:  () => void;

  // Compare selection (up to 5 products).
  selectedIds:     readonly string[];
  selectedProducts: Product[];
  toggleSelection: (id: string) => void;
  removeSelection: (id: string) => void;
  clearSelection:  () => void;
  canSelectMore:   boolean;
}

export const useProducts = (): UseProductsResult => {
  // ── Raw dataset ──────────────────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading,   setLoading]     = useState<boolean>(true);
  const [error,       setError]       = useState<Error | null>(null);

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
          setError(caught instanceof Error ? caught : new Error(String(caught)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // ── User intent ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);

  // Setters wrapped in `useCallback` because they're handed to filter
  // components via context — stable references prevent gratuitous
  // re-renders down the tree.
  const setSearch = useCallback(
    (search: string) => setFilters((prev) => ({ ...prev, search })),
    [],
  );

  // `toggleX` helpers add/remove from the multi-select array. We keep the
  // mutation pure (return a new array) so React's identity-based memo
  // tracking works correctly downstream.
  const toggleStage = useCallback(
    (stage: Stage) => setFilters((prev) => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter((s) => s !== stage)
        : [...prev.stages, stage],
    })),
    [],
  );

  const toggleBrand = useCallback(
    (brand: string) => setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    })),
    [],
  );

  const toggleSpecialty = useCallback(
    (key: Exclude<Specialty, null>) => setFilters((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(key)
        ? prev.specialties.filter((s) => s !== key)
        : [...prev.specialties, key],
    })),
    [],
  );

  const toggleOrigin = useCallback(
    (origin: string) => setFilters((prev) => ({
      ...prev,
      origins: prev.origins.includes(origin)
        ? prev.origins.filter((o) => o !== origin)
        : [...prev.origins, origin],
    })),
    [],
  );

  const toggleMilkType = useCallback(
    (milkType: MilkType) => setFilters((prev) => ({
      ...prev,
      milkTypes: prev.milkTypes.includes(milkType)
        ? prev.milkTypes.filter((type) => type !== milkType)
        : [...prev.milkTypes, milkType],
    })),
    [],
  );

  const toggleHalalOnly = useCallback(
    () => setFilters((prev) => ({ ...prev, halalOnly: !prev.halalOnly })),
    [],
  );

  const togglePartialHydroOnly = useCallback(
    () => setFilters((prev) => ({ ...prev, partialHydroOnly: !prev.partialHydroOnly })),
    [],
  );

  const toggleExtHydroOnly = useCallback(
    () => setFilters((prev) => ({ ...prev, extHydroOnly: !prev.extHydroOnly })),
    [],
  );

  // Bulk setters — useful for "All" buttons or programmatic resets.
  const setStages      = useCallback((next: StageFilter)     => setFilters((p) => ({ ...p, stages:      next })), []);
  const setBrands      = useCallback((next: BrandFilter)     => setFilters((p) => ({ ...p, brands:      next })), []);
  const setSpecialties = useCallback((next: SpecialtyFilter) => setFilters((p) => ({ ...p, specialties: next })), []);
  const setOrigins     = useCallback((next: OriginFilter)    => setFilters((p) => ({ ...p, origins:     next })), []);
  const setMilkTypes   = useCallback((next: MilkTypeFilter)  => setFilters((p) => ({ ...p, milkTypes:   next })), []);

  // Sort toggles direction when the same field is selected twice — same
  // pattern as every spreadsheet on earth.
  const setSort = useCallback(
    (field: SortField, direction?: SortDirection) =>
      setFilters((prev) => {
        const nextDirection: SortDirection =
          direction ??
          (prev.sort.field === field
            ? (prev.sort.direction === 'asc' ? 'desc' : 'asc')
            : 'asc');
        return { ...prev, sort: { field, direction: nextDirection } };
      }),
    [],
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTER_STATE), []);
  const clearAdvancedFilters = useCallback(
    () => setFilters((prev) => ({
      ...prev,
      origins: [] as const,
      milkTypes: [] as const,
      halalOnly: false,
      partialHydroOnly: false,
      extHydroOnly: false,
    })),
    [],
  );

  // ── Compare selection ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Silently cap at MAX_COMPARE_SELECTION. The card UI greys out the
      // select dot when the limit is hit so the user gets feedback.
      if (prev.length >= MAX_COMPARE_SELECTION) return prev;
      return [...prev, id];
    });
  }, []);

  const removeSelection = useCallback(
    (id: string) => setSelectedIds((prev) => prev.filter((x) => x !== id)),
    [],
  );

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  // Resolve selected ids to full Product records once per change. Filter
  // out misses defensively — an id could theoretically reference a
  // product that was removed from the dataset between selection and render.
  const selectedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined),
    [selectedIds, allProducts],
  );

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
    toggleStage,
    toggleBrand,
    toggleSpecialty,
    toggleOrigin,
    toggleMilkType,
    toggleHalalOnly,
    togglePartialHydroOnly,
    toggleExtHydroOnly,
    setStages,
    setBrands,
    setSpecialties,
    setOrigins,
    setMilkTypes,
    setSort,
    clearAdvancedFilters,
    resetFilters,
    selectedIds,
    selectedProducts,
    toggleSelection,
    removeSelection,
    clearSelection,
    canSelectMore: selectedIds.length < MAX_COMPARE_SELECTION,
  };
};

// ── Pure helpers ────────────────────────────────────────────────────────────

/**
 * Filter products against the user's current intent. Each clause is short-
 * circuited — the more restrictive filters (stage, brand) run first to
 * trim the candidate list before the more expensive substring match.
 *
 * Semantics:
 *   - Empty filter array = no constraint on that dimension.
 *   - Non-empty array    = product must match ONE of the array values
 *                          (OR within dimension, AND across dimensions).
 *   - Search is substring-based across name + brand + fullName + bestFor.
 */
const filterProducts = (products: Product[], filters: FilterState): Product[] => {
  const needle = normaliseForSearch(filters.search.trim());

  return products.filter((product) => {
    if (filters.stages.length > 0 && !filters.stages.includes(product.stage)) {
      return false;
    }
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
      return false;
    }
    if (filters.specialties.length > 0) {
      // `null` specialty never matches a non-empty filter; we cast the
      // remaining check to drop the null branch from the union.
      if (!product.specialty) return false;
      if (!filters.specialties.includes(product.specialty)) return false;
    }
    if (filters.origins.length > 0 && !filters.origins.includes(product.origin)) {
      return false;
    }
    if (filters.milkTypes.length > 0 && !filters.milkTypes.includes(product.milkType)) {
      return false;
    }
    if (filters.halalOnly && !product.halal) {
      return false;
    }
    if (filters.partialHydroOnly && !product.partialHydro) {
      return false;
    }
    if (filters.extHydroOnly && !product.extHydro) {
      return false;
    }

    if (needle.length > 0) {
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
 * sort logic stays small and adding a new sort field is a one-place change.
 */
const readSortValue = (product: Product, field: SortField): string | number | null => {
  switch (field) {
    case 'name':          return product.name;
    case 'brand':         return product.brand;
    case 'price':         return product.price          ?? null;
    case 'pricePerGram':  return product.pricePerGram   ?? null;
    case 'pricePerScoop': return product.pricePerScoop  ?? null;
    case 'pricePerMl':    return product.pricePerMl     ?? null;
    case 'protein':       return product.nutrition.protein ?? null;
    case 'dha':           return product.nutrition.dha     ?? null;
  }
};
