/**
 * app/index.tsx — the Compare screen (home).
 *
 * Reads filter + selection state from `ProductsContext` (instantiated once
 * at the root layout) so:
 *   • Navigating to a product detail and back preserves filters/sort.
 *   • The compare drawer survives the round-trip too.
 *   • A hard browser refresh resets state (intentional UX).
 *
 * Layout matches the design handoff's single-toolbar pattern:
 *   - Search lives in the nav header (see `Header.tsx`), not in this screen.
 *   - Stage tabs row.
 *   - Brand pills row.
 *   - One toolbar with [sort | direction | hint | Filters chip] on the left
 *     and [product count | view toggle] on the right.
 *   - When Filters is open, a chip drawer slides in below the toolbar with
 *     specialty / origin / milk-type / halal / pHF / eHF toggles. Specialty
 *     no longer has its own permanent row — it lives inside Filters.
 */

import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Screen }            from '../src/components/Screen';
import { StageTabs }         from '../src/components/filters/StageTabs';
import { BrandPills }        from '../src/components/filters/BrandPills';
import {
  AdvancedFilterChipsTrigger,
  AdvancedFilterChipsDrawer,
  advancedFilterCount,
} from '../src/components/filters/AdvancedFilterChips';
import { DisplayToggle }     from '../src/components/DisplayToggle';
import { SortDropdown }      from '../src/components/SortDropdown';
import { ProductGrid }       from '../src/components/product/ProductGrid';
import { CompareDrawer }     from '../src/components/compare/CompareDrawer';
import { CompareModal }      from '../src/components/compare/CompareModal';
import { useProductsContext } from '../src/contexts/ProductsContext';
import type { DisplayMode, SortField }  from '../src/types/filters';

// Sort fields where "ascending = cheapest first" reads naturally. Used to
// label the sort-direction arrow with a friendly hint.
const COST_SORT_FIELDS = new Set<SortField>(['price', 'pricePerGram', 'pricePerScoop', 'pricePerMl']);

export default function CompareScreen() {
  const {
    visibleProducts,
    allProducts,
    isLoading,
    error,
    filters,
    toggleStage,
    toggleBrand,
    toggleSpecialty,
    toggleOrigin,
    toggleMilkType,
    toggleHalalOnly,
    togglePartialHydroOnly,
    toggleExtHydroOnly,
    setStages,
    setSort,
    clearAdvancedFilters,
    resetFilters,
    selectedIds,
    selectedProducts,
    canSelectMore,
    toggleSelection,
    removeSelection,
    clearSelection,
  } = useProductsContext();

  // UI-only state — kept local so a remount resets to defaults. If we ever
  // want display mode persisted across navigation, promote into Context.
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showingCompareModal, setShowingCompareModal] = useState(false);

  // Pad the bottom of the scroll area when the compare drawer is visible
  // so the last cards don't sit underneath it.
  const bottomPad = selectedIds.length > 0 ? 120 : 40;

  // The friendly direction hint next to the sort arrow. Only shows for
  // cost-based fields where "ascending = cheapest first" is intuitive.
  const isCostSort = COST_SORT_FIELDS.has(filters.sort.field);
  const directionHint = !isCostSort
    ? ''
    : filters.sort.direction === 'asc'
      ? 'cheapest first'
      : 'most expensive first';

  return (
    <Screen>
      {/* Stage tabs — multi-select. "All" clears the array. */}
      <StageTabs
        value={filters.stages}
        onToggle={toggleStage}
        onClearAll={() => setStages([])}
      />

      {/* Brand row — multi-select pills. */}
      <BrandPills value={filters.brands} onToggle={toggleBrand} />

      {/* Toolbar — single row, design-aligned.
          Left:  [sort dropdown] [↑/↓ direction] [hint text] [Filters chip]
          Right: [N products] [Card/List toggle]
          The row wraps gracefully on narrow widths so the right cluster
          drops below without clipping. */}
      <View
        className="bg-surface border-b border-border flex-row flex-wrap items-center"
        style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        <SortDropdown value={filters.sort} onChange={setSort} />
        {directionHint ? (
          <Text className="text-[11.5px] text-green font-sans-semibold">
            {directionHint}
          </Text>
        ) : null}

        <AdvancedFilterChipsTrigger
          filters={filters}
          expanded={filtersExpanded}
          onToggle={() => setFiltersExpanded((v) => !v)}
          onClear={() => {
            clearAdvancedFilters();
          }}
        />

        <View className="flex-1" />

        <Text className="text-xs text-muted font-sans-medium">
          {isLoading
            ? 'Loading products…'
            : `${visibleProducts.length} of ${allProducts.length} products`}
        </Text>
        <DisplayToggle value={displayMode} onChange={setDisplayMode} />
      </View>

      {/* Filters drawer — sits directly below the toolbar. Only rendered
          when the user has opened it. Houses specialty + origin + milk
          type + halal + pHF + eHF toggles. */}
      {filtersExpanded && (
        <AdvancedFilterChipsDrawer
          filters={filters}
          onToggleSpecialty={toggleSpecialty}
          onToggleOrigin={toggleOrigin}
          onToggleMilkType={toggleMilkType}
          onToggleHalal={toggleHalalOnly}
          onTogglePartialHydro={togglePartialHydroOnly}
          onToggleExtHydro={toggleExtHydroOnly}
        />
      )}

      {/* Error band */}
      {error && (
        <View
          className="mx-4 mt-4 rounded-lg border"
          style={{
            backgroundColor: '#FFE4E6',
            borderColor: '#9F1239',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text className="text-xs font-sans-bold" style={{ color: '#9F1239' }}>
            Couldn't load products: {error.message}
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <View
          className="w-full"
          style={{ maxWidth: 1280, marginHorizontal: 'auto', paddingHorizontal: 16, paddingTop: 16 }}
        >
          <ProductGrid
            products={visibleProducts}
            displayMode={displayMode}
            selectedIds={selectedIds}
            canSelectMore={canSelectMore}
            onToggleSelect={toggleSelection}
            onReset={resetFilters}
          />

          {/* Footer disclaimer */}
          <View
            className="rounded-xl mt-10"
            style={{
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 18,
              paddingVertical: 16,
            }}
          >
            <Text className="text-[11.5px] text-muted font-sans" style={{ lineHeight: 18 }}>
              <Text className="text-text font-sans-bold">Disclaimer: </Text>
              All prices are indicative retail data sourced from major
              Singapore retailers (FairPrice, Watsons, Shopee, Lazada).
              Always verify current prices before purchasing.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom drawer — only renders when selection is non-empty. */}
      <CompareDrawer
        selected={selectedProducts}
        onClear={clearSelection}
        onRemove={removeSelection}
        onCompare={() => setShowingCompareModal(true)}
      />

      {showingCompareModal && (
        <CompareModal
          products={selectedProducts}
          onClose={() => setShowingCompareModal(false)}
        />
      )}
    </Screen>
  );
}

// Suppress unused-import lint: `advancedFilterCount` is re-exported by
// AdvancedFilterChips but consumed only in tests. Keeping the import
// here means typecheck still validates the export surface.
void advancedFilterCount;
