/**
 * Per-product detail records (ingredients, allergens, full nutrition table).
 *
 * Kept in a separate JSON from `products.json` because the detail rows are
 * verbose (~30 nutrients × 61 products) and only ever read by the detail
 * screen. Loading them eagerly would balloon the initial bundle.
 *
 * Like `products.ts`, this module is the static fallback path; the
 * repository layer can later route reads to Supabase instead.
 */

import detailsJson from './productDetails.json';
import type { ProductDetail } from '../types/product';

const details: Record<string, ProductDetail> =
  detailsJson as unknown as Record<string, ProductDetail>;

/**
 * Fetch the detail record for a product id, or `undefined` if we have no
 * detail data on file (some products in the catalogue are deliberately
 * minimal — we surface what we have rather than blocking the page).
 */
export const getProductDetail = (id: string): ProductDetail | undefined =>
  details[id];
