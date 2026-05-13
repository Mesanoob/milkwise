/**
 * ProductGrid — dispatches to one of three child components based on the
 * current `DisplayMode`. The Compare screen passes the mode + the visible
 * product array + the current selection state; we only own the layout
 * container.
 *
 * ── Why CSS Grid on web (not flex-wrap) ────────────────────────────────
 * The original implementation used `flex-row flex-wrap` with `flex: 1` on
 * each card. That has a well-known bug: when the last row is partial, the
 * remaining items grow to fill the leftover space because flex-grow runs
 * per-row independently. Result: at the bottom of the Compare screen, a
 * lone card stretched edge-to-edge and the last row of Photos mode showed
 * ~33% wider tiles than the rest of the grid.
 *
 * CSS Grid `repeat(auto-fill, minmax(N, 1fr))` keeps every cell at the
 * same width across all rows — empty cells in a partial row just stay
 * empty. This is exactly what the design handoff uses
 * (`.grid-card { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) }`).
 *
 * React Native doesn't support `display: grid` on native, so we branch:
 *   • Web   → inline CSS Grid style. Honored by `react-native-web`.
 *   • Native → flex-wrap fallback. Phone widths give 1-column layouts
 *              where the stretch bug doesn't visually appear.
 *
 * Why not FlatList?
 *   FlatList virtualises off-screen rows on native, which is the right
 *   call for thousands of items. With ~60 products and a multi-column
 *   layout, the overhead of measuring item heights makes FlatList slower
 *   than the simple grid. We can swap in `@shopify/flash-list` later.
 */

import { Platform, View } from 'react-native';
import type { Product } from '../../types/product';
import type { DisplayMode } from '../../types/filters';
import { ProductCard }    from './ProductCard';
import { ProductListRow } from './ProductListRow';
import { ProductPicture } from './ProductPicture';
import { EmptyState }     from '../EmptyState';

const IS_WEB = Platform.OS === 'web';

export interface ProductGridProps {
  products:       Product[];
  displayMode:    DisplayMode;
  // Selection state propagates down to each card / row so they can render
  // the appropriate dot state and disable when the limit is hit.
  selectedIds:    readonly string[];
  canSelectMore:  boolean;
  onToggleSelect: (id: string) => void;
  // Called when the user taps "Reset" inside the empty state.
  onReset?:       () => void;
}

export const ProductGrid = ({
  products,
  displayMode,
  selectedIds,
  canSelectMore,
  onToggleSelect,
  onReset,
}: ProductGridProps) => {
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
      <View className="gap-2.5">
        {products.map((product) => (
          <ProductListRow
            key={product.id}
            product={product}
            selected={selectedIds.includes(product.id)}
            canSelect={canSelectMore}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </View>
    );
  }

  // Card and picture modes both use a column-grid. Picture cells are
  // smaller (140px min) because they only show an image + price.
  const isPicture = displayMode === 'picture';
  const minColPx  = isPicture ? 140 : 220;
  const gapPx     = isPicture ? 12  : 16;

  // Web: CSS Grid. Native: flex-wrap (single column on phone widths).
  // `as never` casts past RN's type narrowing — `display: 'grid'` and
  // `gridTemplateColumns` are valid CSS values that RN-web honors but
  // RN's TypeScript types don't enumerate.
  const containerStyle = IS_WEB
    ? {
        display: 'grid' as never,
        gridTemplateColumns: `repeat(auto-fill, minmax(${minColPx}px, 1fr))` as never,
        gap: gapPx,
      }
    : {
        flexDirection: 'row' as const,
        flexWrap:      'wrap' as const,
        gap: gapPx,
      };

  return (
    <View style={containerStyle}>
      {products.map((product) =>
        isPicture ? (
          <ProductPicture key={product.id} product={product} />
        ) : (
          <ProductCard
            key={product.id}
            product={product}
            selected={selectedIds.includes(product.id)}
            canSelect={canSelectMore}
            onToggleSelect={onToggleSelect}
          />
        ),
      )}
    </View>
  );
};
