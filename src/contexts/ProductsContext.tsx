/**
 * ProductsContext — keeps filter state alive across screen navigations.
 *
 * WHY this exists:
 *   The Compare screen previously called `useProducts()` directly. Each
 *   time the user opened a product detail and tapped "Back to compare",
 *   the screen remounted and `useProducts` reset to defaults — the
 *   filters the user just chose were wiped.
 *
 *   In Expo Router, the parent layout (`app/_layout.tsx`) stays mounted
 *   for the entire session even as child screens come and go. By
 *   instantiating `useProducts` *once* inside a Context Provider hosted
 *   in the layout, all child screens read the same state — closing the
 *   product detail screen brings the user back to exactly the filter set
 *   they had.
 *
 * Lifetime: the state survives navigation but DIES on a hard refresh.
 *   That's the contract the user asked for. Promoting to URL state /
 *   AsyncStorage is a follow-up if we need shareable filter URLs.
 *
 * Pattern note: this is the standard React "lifted state via context"
 * pattern. We deliberately do NOT use a state library (Zustand, Redux)
 * — the surface area is small, and adding a dep just for cross-screen
 * state would be over-engineering at this scale.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useProducts, type UseProductsResult } from '../hooks/useProducts';

// `undefined` default forces consumers to error loudly if they forget the
// Provider — more helpful than silently returning empty arrays.
const ProductsContext = createContext<UseProductsResult | undefined>(undefined);

export interface ProductsProviderProps {
  children: ReactNode;
}

/**
 * Wrap the app once at the root layout. All descendants can call
 * `useProductsContext()` and read the same state instance.
 */
export const ProductsProvider = ({ children }: ProductsProviderProps) => {
  // Calling the hook here means it's instantiated exactly once for the
  // life of the layout. React's reconciler guarantees the context value
  // identity is stable until the underlying hook output changes.
  const value = useProducts();
  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

/**
 * Hook every screen uses to read the shared filter/selection state.
 * Throws when called outside the Provider — that's a programming error
 * we want to surface immediately rather than masking with defaults.
 */
export const useProductsContext = (): UseProductsResult => {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error(
      'useProductsContext must be used inside <ProductsProvider>. ' +
      'Check that your screen tree is wrapped in app/_layout.tsx.',
    );
  }
  return ctx;
};
