/**
 * Static (JSON-backed) implementation of `ProductRepository`.
 *
 * Reads from the in-bundle JSON files. Methods are async-by-signature
 * even though they resolve immediately — see the comment in
 * `productRepository.ts` for why.
 *
 * Mutations throw `NotImplementedError` rather than silently no-op'ing.
 * That way, if a developer wires the admin CRUD UI to this repo by
 * mistake, the error surface is obvious and immediate.
 */

import type { Product, ProductDetail } from '../types/product';
import type { ProductRepository } from './productRepository';
import { getAllProducts, getProductById } from '../data/products';
import { getProductDetail } from '../data/productDetails';

// Custom error class so the admin UI can distinguish "this backend can't do
// that" from real network errors. (Classes survive a `JSON.stringify` round
// trip better than tagged-object errors do.)
export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`StaticProductRepository.${method}() is not implemented. ` +
          `Enable the Supabase repository to perform mutations.`);
    this.name = 'NotImplementedError';
  }
}

export class StaticProductRepository implements ProductRepository {
  async listProducts(): Promise<Product[]> {
    return getAllProducts();
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return getProductById(id);
  }

  async getProductDetail(id: string): Promise<ProductDetail | undefined> {
    return getProductDetail(id);
  }

  async createProduct(): Promise<Product> {
    throw new NotImplementedError('createProduct');
  }

  async updateProduct(): Promise<Product> {
    throw new NotImplementedError('updateProduct');
  }

  async deleteProduct(): Promise<void> {
    throw new NotImplementedError('deleteProduct');
  }
}
