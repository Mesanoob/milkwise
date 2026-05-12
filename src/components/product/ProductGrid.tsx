/**
 * ProductGrid — dispatches to one of three child components based on the
 * current `DisplayMode`. The Compare screen passes the mode + the visible
 * product array; we own only the layout container.
 *
 * Why not FlatList?
 *   FlatList is the right choice for thousands of rows on native — it
 *   virtualises off-screen items. With ~60 products and a multi-column
 *   layout, the overhead of measuring item heights actually makes FlatList
 *   slower than a plain flex-wrap. We can swap in `@shopify/flash-list`
 *   when the catalogue grows.
 */

import { View } from 'react-native';
import type { Product } from '../../types/product';
import type { DisplayMode } from '../../types/filters';
import { ProductCard }    from './ProductCard';
import { ProductListRow } from './ProductListRow';
import { ProductPicture } from './ProductPicture';
import { EmptyState }     from '../EmptyState';

export interface ProductGridProps {
  products:    Product[];
  displayMode: DisplayMode;
  // Called when the user taps "Reset" inside the empty state.
  onReset?:    () => void;
}

export const ProductGrid = ({ products, displayMode, onReset }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products match your filters"
        description="Try clearing a filter or searching for a different keyword."
        actionLabel={onReset ? 'Reset filters' : undefined}
        onAction={onReset}
      />
    );
  }

  // List mode renders rows vertically — a single column, full-width.
  if (displayMode === 'list') {
    return (
      <View className="gap-2 px-4 py-3">
        {products.map((product) => (
          <ProductListRow key={product.id} product={product} />
        ))}
      </View>
    );
  }

  // Card and picture modes use a flex-wrap grid. We let flex-basis do the
  // column-counting based on viewport width — simpler than computing
  // numColumns ourselves and stays responsive without media queries.
  const isPicture = displayMode === 'picture';

  return (
    <View className="flex-row flex-wrap gap-3 px-4 py-3">
      {products.map((product) => (
        isPicture
          ? <ProductPicture key={product.id} product={product} />
          : <ProductCard    key={product.id} product={product} />
      ))}
    </View>
  );
};
