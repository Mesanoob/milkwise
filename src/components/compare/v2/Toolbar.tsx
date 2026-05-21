/**
 * Compare toolbar — sort pill, sort-direction toggle, filters CTA,
 * "Clear all" pill (conditional), result count, view toggle. Ported from
 * `Compare.jsx` toolbar block + styles-v2.css `.mw-toolbar*`/`.mw-vt`.
 *
 * Two cross-platform compromises (call-site swaps planned for Phase 9):
 *   • The design's sort `<select>` becomes a tap-to-cycle button on RN —
 *     same five options (ppg → pps → price → size → brand → ppg), label
 *     updates so the current key is always visible. A proper dropdown
 *     overlay would work but doesn't ship with RN cross-platform.
 *   • Lucide icons → emoji / unicode glyphs ($, ↑/↓, ☰, ✕, ▦, ☷) so we
 *     don't pull in `lucide-react-native` for Phase 4 alone.
 */

import { View, Pressable, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useFormulaCompare,
  type CompareSortKey,
} from '../../../contexts/FormulaCompareContext';

const SORT_LABELS: Record<CompareSortKey, string> = {
  ppg: '$ / gram',
  pps: '$ / scoop',
  price: 'Tin price',
  size: 'Tin size',
  brand: 'Brand A→Z',
};
const SORT_ORDER: CompareSortKey[] = ['ppg', 'pps', 'price', 'size', 'brand'];

export const Toolbar = ({
  count,
  filtersOpen,
  onToggleFilters,
}: {
  count: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}) => {
  const { tokens } = useTheme();
  const {
    stage, brand,
    sortKey, sortDir, view,
    setSortKey, setSortDir, setView,
    clearAll,
    activeFilterCount,
  } = useFormulaCompare();

  const cycleSort = () => {
    const i = SORT_ORDER.indexOf(sortKey);
    setSortKey(SORT_ORDER[(i + 1) % SORT_ORDER.length]);
  };

  const showClear =
    brand !== null || activeFilterCount > 0 || stage !== 'Stage 1';

  return (
    <View
      style={{
        maxWidth: tokens.layout.maxContent,
        width: '100%',
        marginHorizontal: 'auto',
        paddingTop: 20,
        paddingHorizontal: 32,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      {/* Sort pill — tap to cycle. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${SORT_LABELS[sortKey]}. Tap to cycle.`}
        onPress={cycleSort}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 9,
          paddingHorizontal: 14,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          backgroundColor: tokens.colors.bgCard,
        }}
      >
        <Text style={{ color: tokens.colors.textMuted, fontSize: 14 }}>$</Text>
        <Text
          style={{
            fontFamily: tokens.fonts.body,
            fontSize: 14,
            color: tokens.colors.text,
          }}
        >
          {SORT_LABELS[sortKey]}
        </Text>
      </Pressable>

      {/* Sort direction toggle */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle sort direction"
        onPress={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: tokens.colors.accent,
          backgroundColor: tokens.colors.accentTint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: tokens.colors.accentText,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {sortDir === 'asc' ? '↑' : '↓'}
        </Text>
      </Pressable>

      <Text
        style={{
          marginLeft: 4,
          fontSize: 14,
          color: tokens.colors.textMuted,
        }}
      >
        {sortDir === 'asc' ? 'cheapest first' : 'most expensive first'}
      </Text>

      {/* Filters pill with active-count badge. */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: filtersOpen }}
        onPress={onToggleFilters}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 9,
          paddingHorizontal: 16,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          backgroundColor: tokens.colors.bgCard,
        }}
      >
        <Text style={{ fontSize: 14 }}>☰</Text>
        <Text
          style={{
            fontFamily: tokens.fonts.body,
            fontSize: 14,
            color: tokens.colors.text,
          }}
        >
          Filters
        </Text>
        <View
          style={{
            paddingVertical: 1,
            paddingHorizontal: 7,
            borderRadius: 999,
            backgroundColor:
              activeFilterCount > 0
                ? tokens.colors.clay
                : tokens.colors.textFaint,
          }}
        >
          <Text
            style={{
              fontFamily: tokens.fonts.mono,
              fontSize: 11,
              fontWeight: '600',
              color: tokens.colors.textInverse,
            }}
          >
            {activeFilterCount}
          </Text>
        </View>
      </Pressable>

      {/* Clear all — only when something is set off-default. */}
      {showClear && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          onPress={clearAll}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 9,
            paddingHorizontal: 16,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: tokens.colors.clay, fontSize: 14 }}>✕</Text>
          <Text
            style={{
              fontFamily: tokens.fonts.body,
              fontSize: 14,
              color: tokens.colors.clay,
            }}
          >
            Clear all
          </Text>
        </Pressable>
      )}

      <View style={{ flex: 1 }} />

      {/* Result count */}
      <Text
        style={{
          fontFamily: tokens.fonts.body,
          fontSize: 14,
          color: tokens.colors.textMuted,
        }}
      >
        <Text style={{ color: tokens.colors.text, fontWeight: '600' }}>
          {count}
        </Text>{' '}
        products
      </Text>

      {/* View toggle — pill with two segments */}
      <View
        style={{
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: tokens.colors.border,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: tokens.colors.bgCard,
        }}
      >
        {(['grid', 'list'] as const).map((v) => {
          const on = view === v;
          const glyph = v === 'grid' ? '▦' : '☷';
          const label = v === 'grid' ? 'Card' : 'List';
          return (
            <Pressable
              key={v}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label} view`}
              onPress={() => setView(v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: on ? tokens.colors.accent : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: on
                    ? tokens.colors.textInverse
                    : tokens.colors.textMuted,
                }}
              >
                {glyph}
              </Text>
              <Text
                style={{
                  fontFamily: tokens.fonts.body,
                  fontSize: 13,
                  color: on
                    ? tokens.colors.textInverse
                    : tokens.colors.textMuted,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
