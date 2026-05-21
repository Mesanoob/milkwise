/**
 * Supabase implementation of `ProductRepository` — STUB ONLY.
 *
 * Will be filled in during Session 3 once the Supabase project is set up.
 * For now every method throws so a misconfigured production build fails
 * loudly instead of returning empty arrays that look like "no products
 * found in your country".
 *
 * The file exists today because:
 *   • it documents the intended schema for the migration script, and
 *   • it lets `productRepository.ts` reference the type without breaking
 *     the build.
 */

import type { Product, ProductDetail } from '../types/product';
import type { ProductRepository } from './productRepository';

const notReady = (method: string): never => {
  throw new Error(
    `[SupabaseProductRepository.${method}] not yet implemented. ` +
    `Run the data migration in Session 3 before enabling FEATURES.useRemoteData.`,
  );
};

export class SupabaseProductRepository implements ProductRepository {
  async listProducts(): Promise<Product[]>                          { return notReady('listProducts'); }
  async getProductById(_id: string): Promise<Product | undefined>   { return notReady('getProductById'); }
  async getProductDetail(_id: string): Promise<ProductDetail | undefined> { return notReady('getProductDetail'); }
  async createProduct(): Promise<Product>                           { return notReady('createProduct'); }
  async updateProduct(): Promise<Product>                           { return notReady('updateProduct'); }
  async deleteProduct(): Promise<void>                              { return notReady('deleteProduct'); }
}
