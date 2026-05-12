/**
 * Static product dataset.
 *
 * `products.json` was hand-curated from the Singapore retail market in 2025.
 * Once the Supabase backend is wired up (Session 3), this module will become
 * the *fallback* — used only when the network is offline or the remote
 * fetch fails. The repository pattern (`src/services/productRepository.ts`)
 * makes that swap a one-line change at the call site.
 *
 * The JSON file is the source of truth; this module only:
 *   1. casts it to the `Product[]` type, and
 *   2. exposes thin helpers (`getProductById`, `getAllBrands`, …) that the
 *      UI can call without re-implementing the same `find` / `Set` logic.
 *
 * We intentionally do NOT mutate the imported JSON — anything derived
 * (e.g. sorted brand list) is computed once on module load.
 */

import productsJson from './products.json';
import type { Product, Stage } from '../types/product';

// `as` cast lets TypeScript treat the JSON as our domain type. We accept
// this risk because (a) the data is hand-curated, (b) we read it with the
// same code that wrote it, and (c) the repository layer can validate at the
// boundary once we move to Supabase.
const products: Product[] = productsJson as unknown as Product[];

/**
 * Return every product. Returns a *copy* so consumers can sort/mutate
 * without polluting the shared dataset.
 */
export const getAllProducts = (): Product[] => [...products];

/**
 * Lookup by stable slug id (e.g. "abbott-grow-s1").
 * Returns `undefined` rather than throwing so the caller can show a
 * "not found" screen instead of an error boundary.
 */
export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

/**
 * Unique, alphabetically sorted list of brands for the brand filter pills.
 * Computed once at module load — the dataset is static so there is no need
 * to recompute on each call.
 */
export const ALL_BRANDS: readonly string[] = Array.from(
  new Set(products.map((p) => p.brand)),
).sort((a, b) => a.localeCompare(b));

/**
 * Stages, in canonical order. Hard-coded instead of derived so that an
 * empty product list (e.g. during a failed fetch) does not collapse the
 * stage filter UI.
 */
export const ALL_STAGES: readonly Stage[] = ['Stage 1', 'Stage 2', 'Stage 3'];

/**
 * Unique specialty tags actually present in the dataset.
 * Filters out `null` ("no specialty") so the chip row only shows real keys.
 * The predicate is split into two steps: pull the specialty out, then
 * type-narrow to non-null via `!== null`.
 */
export const ALL_SPECIALTIES: readonly string[] = Array.from(
  new Set(
    products
      .map((p) => p.specialty)
      .filter((s): s is NonNullable<typeof s> => s !== null && s !== undefined),
  ),
).sort();
