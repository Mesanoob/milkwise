/**
 * Product repository — abstraction over the data source.
 *
 * Why an interface instead of importing `src/data/products` directly from
 * the UI:
 *
 *   The MilkWise data layer will move from static JSON to a Supabase-backed
 *   database (Session 3). When that happens we want to change ONE line in
 *   `getProductRepository()` and have every screen pick up the new source
 *   automatically. Components that "know they're talking to a JSON file"
 *   would all need rewriting; components that "know they have a repository"
 *   don't.
 *
 *   This is the classic Repository pattern — keep persistence concerns
 *   behind a stable API so business logic doesn't care where data lives.
 */

import type { Product, ProductDetail } from '../types/product';

// ── Repository contract ─────────────────────────────────────────────────────
// Every method returns a Promise even when the static implementation
// resolves synchronously, because the Supabase implementation will be
// async. Forcing the async signature now means we don't have to refactor
// every caller later.
export interface ProductRepository {
  /** Return every product. */
  listProducts(): Promise<Product[]>;

  /** Look up a single product by its stable slug id. */
  getProductById(id: string): Promise<Product | undefined>;

  /** Return the verbose detail record (ingredients, full nutrition). */
  getProductDetail(id: string): Promise<ProductDetail | undefined>;

  // The mutation methods are listed here for type completeness; the static
  // implementation will throw `NotImplementedError` so we never silently
  // "save" to localStorage. They will become real when Supabase lands.
  createProduct?(input: Omit<Product, 'id'>): Promise<Product>;
  updateProduct?(id: string, patch: Partial<Product>): Promise<Product>;
  deleteProduct?(id: string): Promise<void>;
}

// Singleton holder. Lazy so the bundle does not import a Supabase client
// we don't yet need.
let cachedRepository: ProductRepository | null = null;

/**
 * Return the configured product repository.
 *
 * Currently always returns the static implementation. Flip the
 * `FEATURES.useRemoteData` flag (in `src/config/constants.ts`) once the
 * Supabase client is in place — no other call site has to change.
 */
export const getProductRepository = async (): Promise<ProductRepository> => {
  if (cachedRepository) return cachedRepository;

  // Dynamic imports keep tree-shakers happy and let us swap implementations
  // without touching this file's import header. The Supabase constructor
  // fail-fasts if its env vars are missing, so a misconfigured remote-data
  // build dies loudly at startup instead of rendering an empty catalogue.
  const { FEATURES } = await import('../config/constants');
  if (FEATURES.useRemoteData) {
    const { SupabaseProductRepository } = await import('./supabaseProductRepository');
    cachedRepository = new SupabaseProductRepository();
  } else {
    const { StaticProductRepository } = await import('./staticProductRepository');
    cachedRepository = new StaticProductRepository();
  }
  return cachedRepository;
};

/**
 * Test seam — lets unit tests inject a mock repository.
 * Production code should never call this.
 */
export const __setProductRepositoryForTests = (repo: ProductRepository): void => {
  cachedRepository = repo;
};
