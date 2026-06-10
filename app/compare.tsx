/**
 * app/compare.tsx — Compare (`/compare`). Phase 4 rebuild.
 *
 * Renders the 76-row `Formula[]` dataset (via `getAllFormulas()`) with the
 * design's chrome: StageTabs → BrandBar → Toolbar → (FilterPanel) →
 * Results grid or list → empty state → disclaimer. CompareTray overlays
 * the bottom of the viewport whenever the user has ≥1 formula picked.
 *
 * State lives in `FormulaCompareContext` (mounted in _layout.tsx) so:
 *   • Filters survive /compare → /product/[id] → /compare round-trips.
 *   • The tray survives the same round-trip — users build their compare
 *     set across navigation.
 *   • A hard browser refresh resets state (matches the design + the §7
 *     architecture decision for ProductsContext).
 *
 * Phase-4 deliberate deferments (will land in later phases):
 *   • Sticky StageTabs / BrandBar / Toolbar — they scroll away with the
 *     page for now. Phase 9 polish can pin them under the NavBar.
 *   • The CompareTray "Compare Now" action routes to the first picked
 *     formula's product detail (a placeholder) until Phase 6 builds the
 *     Head-to-Head overlay.
 *   • The product detail at /product/[id] is still the v1 layout — Phase
 *     5 rebuilds it. Compare strips the `--<size>` variant suffix from
 *     formula.id before navigating so the v1 route resolves cleanly.
 */

import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, View, Text, type ViewStyle } from 'react-native';
import { Screen } from '../src/components/Screen';
import { StageTabs } from '../src/components/compare/v2/StageTabs';
import { BrandBar } from '../src/components/compare/v2/BrandBar';
import { Toolbar } from '../src/components/compare/v2/Toolbar';
import { FilterPanel } from '../src/components/compare/v2/FilterPanel';
import { GridCardV2 } from '../src/components/compare/v2/GridCard';
import { ListRowV2 } from '../src/components/compare/v2/ListRow';
import { CompareTray } from '../src/components/compare/v2/CompareTray';
import { useFormulaCompare } from '../src/contexts/FormulaCompareContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { getAllFormulas } from '../src/data/formulas';
import {
  milkSourceOf,
  specialtiesOf,
  originCountry,
} from '../src/utils/formulaClassifiers';
import type { Formula } from '../src/types/formula';
import { INITIAL_RENDER_COUNT, PAGE_SIZE } from '../src/config/constants';
import { PageMeta } from '../src/components/PageMeta';

// All 76 are static — compute once at module level.
const ALL_FORMULAS = getAllFormulas();

export default function CompareScreen() {
  const { tokens } = useTheme();
  const { stage, brand, sortKey, sortDir, view, filters, tray } =
    useFormulaCompare();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT);

  useEffect(() => {
    setVisibleCount(INITIAL_RENDER_COUNT);
  }, [stage, brand, sortKey, sortDir, view, filters]);

  // ── Filter + sort composition (ported from Compare.jsx) ─────────────
  const filtered: Formula[] = useMemo(() => {
    let f = ALL_FORMULAS.slice();

    if (stage !== 'All Stages') f = f.filter((p) => p.stage === stage);
    if (brand) f = f.filter((p) => p.brand === brand);
    if (filters.source.length)
      f = f.filter((p) => filters.source.includes(milkSourceOf(p)));
    if (filters.specialty.length)
      f = f.filter((p) => {
        const tags = specialtiesOf(p);
        return filters.specialty.some((s) => tags.has(s));
      });
    if (filters.certs.length)
      f = f.filter((p) => {
        const tags = specialtiesOf(p);
        return filters.certs.some((s) => tags.has(s));
      });
    if (filters.origin.length)
      f = f.filter((p) => {
        const c = originCountry(p.manufacturedIn || p.origin);
        return filters.origin.includes(c);
      });
    if (filters.size.length)
      f = f.filter((p) =>
        filters.size.some((s) => Math.abs(p.packSize - s) < 30),
      );

    // Sort. Match the design's comparator switch.
    const cmp: Record<string, (a: Formula, b: Formula) => number> = {
      ppg: (a, b) => a.pricePerGram - b.pricePerGram,
      pps: (a, b) => a.pricePerScoop - b.pricePerScoop,
      price: (a, b) => a.price - b.price,
      size: (a, b) => a.packSize - b.packSize,
      brand: (a, b) => a.brand.localeCompare(b.brand),
    };
    f.sort(cmp[sortKey] ?? cmp.ppg);
    if (sortDir === 'desc') f.reverse();

    return f;
  }, [stage, brand, sortKey, sortDir, filters]);

  const visibleFormulas = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );
  const hasMore = visibleCount < filtered.length;

  // CSS grid on web only — `display: grid` isn't in RN's ViewStyle but
  // RN-Web passes it through. Native: flex column (single column stack).
  const isWeb = Platform.OS === 'web';
  const gridStyle: ViewStyle = isWeb
    ? ({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 14,
      } as unknown as ViewStyle)
    : { flexDirection: 'column', gap: 14 };

  return (
    <Screen>
      <PageMeta title="Compare Formulas" description="Browse and filter 76 baby formulas sold in Singapore by stage, brand, and price per gram." />
      <StageTabs />
      <BrandBar />
      <Toolbar
        count={filtered.length}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
      />

      {filtersOpen && <FilterPanel onClose={() => setFiltersOpen(false)} />}

      {/* Results region */}
      <View
        style={{
          maxWidth: tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: 32,
          paddingTop: 16,
          // Tray (≤72px tall) sits on top of the scroll bottom — pad the
          // content so the last row stays reachable when the tray is up.
          paddingBottom: tray.length > 0 ? 110 : 32,
        }}
      >
        {view === 'grid' ? (
          <View style={gridStyle}>
            {visibleFormulas.map((p) => (
              <GridCardV2 key={p.id} p={p} />
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: 'column', gap: 8 }}>
            {visibleFormulas.map((p) => (
              <ListRowV2 key={p.id} p={p} />
            ))}
          </View>
        )}

        {hasMore && (
          <View style={{ alignItems: 'center', marginTop: 22 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Show ${Math.min(PAGE_SIZE, filtered.length - visibleCount)} more formulas`}
              onPress={() =>
                setVisibleCount((count) =>
                  Math.min(filtered.length, count + PAGE_SIZE),
                )
              }
              style={{
                borderWidth: 1,
                borderColor: tokens.colors.border,
                backgroundColor: tokens.colors.bgCard,
                borderRadius: tokens.radius.pill,
                paddingVertical: 10,
                paddingHorizontal: 18,
              }}
            >
              <Text
                style={{
                  color: tokens.colors.accentText,
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                Show more ({visibleFormulas.length} of {filtered.length})
              </Text>
            </Pressable>
          </View>
        )}

        {filtered.length === 0 && (
          <View
            style={{
              paddingVertical: 64,
              paddingHorizontal: 32,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: tokens.fonts.displaySemibold,
                fontSize: 22,
                fontWeight: '600',
                color: tokens.colors.text,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              No formulas match these filters
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: tokens.colors.textMuted,
                textAlign: 'center',
              }}
            >
              Try a different stage or clear the brand filter.
            </Text>
          </View>
        )}

        <Text
          style={{
            marginTop: 24,
            fontSize: 12,
            color: tokens.colors.textMuted,
          }}
        >
          <Text
            style={{
              color: tokens.colors.text,
              fontFamily: tokens.fonts.bodySemibold,
            }}
          >
            Disclaimer:
          </Text>{' '}
          All prices are indicative retail data sourced April 2026 from
          Singapore retailers. Always verify current prices before
          purchasing.
        </Text>
      </View>

      <CompareTray />
    </Screen>
  );
}
