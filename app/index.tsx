/**
 * app/index.tsx — the Compare screen (home).
 *
 * This is the heaviest screen in the app. Its job is to wire together:
 *   • the `useProducts` hook (state + derived data)
 *   • the filter components (SearchBar, StageTabs, BrandPills, SpecialtyChips)
 *   • the display toggle and sort controls
 *   • the product grid in the chosen layout (card / list / picture)
 *
 * Note how thin the component is: every piece of logic lives in a hook or
 * a child component. The screen itself only describes the shape of the page.
 * That's the production pattern — screens *compose*, they don't *compute*.
 */

import { useState } from 'react';
import { View, Text } from 'react-native';
import { Screen }            from '../src/components/Screen';
import { SearchBar }         from '../src/components/SearchBar';
import { StageTabs }         from '../src/components/filters/StageTabs';
import { BrandPills }        from '../src/components/filters/BrandPills';
import { SpecialtyChips }    from '../src/components/filters/SpecialtyChips';
import { DisplayToggle }     from '../src/components/DisplayToggle';
import { SortDropdown }      from '../src/components/SortDropdown';
import { ProductGrid }       from '../src/components/product/ProductGrid';
import { useProducts }       from '../src/hooks/useProducts';
import type { DisplayMode }  from '../src/types/filters';
import { APP_TAGLINE }       from '../src/config/constants';

export default function CompareScreen() {
  // `useProducts` is the single source of truth for the screen's data.
  // Local state below (display mode) is UI-only and never affects data.
  const {
    visibleProducts,
    allProducts,
    isLoading,
    error,
    filters,
    setSearch,
    setStage,
    setBrand,
    setSpecialty,
    setSort,
    resetFilters,
  } = useProducts();

  // Display mode is purely visual — kept local so a remount of the screen
  // resets to the user's preferred default. If we want it to persist, the
  // next step is moving it into AsyncStorage in a follow-up session.
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');

  return (
    <Screen>
      {/* ── Page heading ────────────────────────────────────────────── */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-serif text-green">Compare formulas</Text>
        <Text className="text-sm text-muted mt-0.5">{APP_TAGLINE}</Text>
      </View>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <View className="px-4 pb-2">
        <SearchBar value={filters.search} onChange={setSearch} />
      </View>

      {/* ── Filter rows ─────────────────────────────────────────────── */}
      <StageTabs       value={filters.stage}     onChange={setStage} />
      <BrandPills      value={filters.brand}     onChange={setBrand} />
      <SpecialtyChips  value={filters.specialty} onChange={setSpecialty} />

      {/* ── Toolbar (display mode + sort + result count) ────────────── */}
      <View className="flex-row items-center justify-between px-4 py-3 gap-3 flex-wrap">
        <Text className="text-xs text-muted font-medium">
          {/* Avoid mid-string punctuation that breaks RTL — keep it simple */}
          {isLoading
            ? 'Loading products…'
            : `${visibleProducts.length} of ${allProducts.length} products`}
        </Text>
        <View className="flex-row items-center gap-2">
          <SortDropdown    value={filters.sort} onChange={setSort} />
          <DisplayToggle   value={displayMode}  onChange={setDisplayMode} />
        </View>
      </View>

      {/* ── Error band — surfaces fetch failures without blocking the UI */}
      {error && (
        <View className="mx-4 mb-2 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
          <Text className="text-red-700 text-xs font-medium">
            Couldn't load products: {error.message}
          </Text>
        </View>
      )}

      {/* ── Results ─────────────────────────────────────────────────── */}
      <ProductGrid
        products={visibleProducts}
        displayMode={displayMode}
        onReset={resetFilters}
      />
    </Screen>
  );
}
