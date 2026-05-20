/**
 * FormulaCompareContext — Compare-page state that survives route navigation.
 *
 * WHY a separate context from `ProductsContext`:
 *   • The new Compare runs on `Formula[]` (76 flat rows from
 *     `src/data/formulas.ts`); ProductsContext runs on `Product[]` (61
 *     nested products) and is still consumed by Most Sold and Calculator.
 *     Forking the state keeps each side strongly typed against its own
 *     model and avoids ping-pong refactors as later phases migrate.
 *   • The design's Compare uses string-flag classifiers
 *     (`milkSourceOf`/`specialtiesOf`) — semantics that don't map onto
 *     the typed-boolean filter dimensions in `ProductsContext`.
 *
 * Lifecycle (mirrors ProductsContext §7 architecture decision):
 *   • State is in-memory; a hard browser refresh resets it. Intentional.
 *   • Mounted in `_layout.tsx` ABOVE the Stack so it survives
 *     /compare → /product/[id] → /compare round-trips.
 *   • No persistence — the design's prototype doesn't persist these and
 *     adding it would break the "fresh start on reload" mental model.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Formula } from '../types/formula';

export type CompareStage = 'All Stages' | 'Stage 1' | 'Stage 2' | 'Stage 3';
export type CompareSortKey = 'ppg' | 'pps' | 'price' | 'size' | 'brand';
export type CompareSortDir = 'asc' | 'desc';
export type CompareView = 'list' | 'grid';

export interface CompareFilters {
  /** Milk source classifiers — 'Cow' | 'Goat' | 'Soy' | 'pHF' | 'eHF'. */
  source: string[];
  /** Specialty / claim tags from `specialtiesOf`. */
  specialty: string[];
  /** Certification tags (currently only 'halal'). */
  certs: string[];
  /** Country names ("Singapore", "Netherlands"…). */
  origin: string[];
  /** Tin sizes in grams (matched ±30g to handle 850/820 etc. variance). */
  size: number[];
}

export type FilterKey = keyof CompareFilters;

const EMPTY_FILTERS: CompareFilters = {
  source: [],
  specialty: [],
  certs: [],
  origin: [],
  size: [],
};

interface FormulaCompareContextValue {
  // Filters & sort
  stage: CompareStage;
  brand: string | null;
  sortKey: CompareSortKey;
  sortDir: CompareSortDir;
  view: CompareView;
  filters: CompareFilters;

  setStage: (s: CompareStage) => void;
  setBrand: (b: string | null) => void;
  setSortKey: (k: CompareSortKey) => void;
  setSortDir: (d: CompareSortDir) => void;
  setView: (v: CompareView) => void;
  toggleFilter: (key: FilterKey, value: string | number) => void;
  resetFilters: () => void;
  /** Brand + filters + stage all back to default (the toolbar "Clear all"). */
  clearAll: () => void;

  // Compare tray (≤ 5)
  tray: Formula[];
  toggleTray: (f: Formula) => void;
  removeFromTray: (id: string) => void;
  clearTray: () => void;

  /** Total filter-pill count across all 5 dimensions (toolbar badge). */
  activeFilterCount: number;
}

const Ctx = createContext<FormulaCompareContextValue | undefined>(undefined);

/** Default stage matches the design (`useState('Stage 1')` in Compare.jsx). */
const DEFAULT_STAGE: CompareStage = 'Stage 1';
const DEFAULT_SORT: CompareSortKey = 'ppg';
const DEFAULT_VIEW: CompareView = 'list';
const TRAY_MAX = 5;

export const FormulaCompareProvider = ({ children }: { children: ReactNode }) => {
  const [stage, setStage] = useState<CompareStage>(DEFAULT_STAGE);
  const [brand, setBrand] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<CompareSortKey>(DEFAULT_SORT);
  const [sortDir, setSortDir] = useState<CompareSortDir>('asc');
  const [view, setView] = useState<CompareView>(DEFAULT_VIEW);
  const [filters, setFilters] = useState<CompareFilters>(EMPTY_FILTERS);
  const [tray, setTray] = useState<Formula[]>([]);

  const toggleFilter = useCallback<
    FormulaCompareContextValue['toggleFilter']
  >((key, value) => {
    setFilters((prev) => {
      // Each filter array carries one of two value types (string|number).
      // We treat them generically here; `key` discriminates at call sites.
      const arr = prev[key] as unknown as Array<string | number>;
      const has = arr.includes(value);
      const next = has ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next } as CompareFilters;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const clearAll = useCallback(() => {
    setBrand(null);
    setFilters(EMPTY_FILTERS);
    setStage('All Stages');
  }, []);

  const toggleTray = useCallback((f: Formula) => {
    setTray((prev) => {
      const has = prev.some((x) => x.id === f.id);
      if (has) return prev.filter((x) => x.id !== f.id);
      if (prev.length >= TRAY_MAX) return prev;
      return [...prev, f];
    });
  }, []);

  const removeFromTray = useCallback((id: string) => {
    setTray((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clearTray = useCallback(() => setTray([]), []);

  const activeFilterCount = useMemo(
    () =>
      filters.source.length +
      filters.specialty.length +
      filters.certs.length +
      filters.origin.length +
      filters.size.length,
    [filters],
  );

  const value = useMemo<FormulaCompareContextValue>(
    () => ({
      stage, brand, sortKey, sortDir, view, filters,
      setStage, setBrand, setSortKey, setSortDir, setView,
      toggleFilter, resetFilters, clearAll,
      tray, toggleTray, removeFromTray, clearTray,
      activeFilterCount,
    }),
    [
      stage, brand, sortKey, sortDir, view, filters,
      toggleFilter, resetFilters, clearAll,
      tray, toggleTray, removeFromTray, clearTray,
      activeFilterCount,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useFormulaCompare = (): FormulaCompareContextValue => {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error(
      'useFormulaCompare must be used inside <FormulaCompareProvider>. ' +
        'Check that app/_layout.tsx wraps the Stack in the provider.',
    );
  }
  return v;
};
