/**
 * CompareDrawer — fixed bottom bar shown when 1+ products are selected.
 *
 * Matches the design handoff (`CompareDrawer` in the prototype index.html).
 * Three responsibilities:
 *   1. Surface how many products are in the comparison ("3/5 selected").
 *   2. Let the user remove items one-by-one (× on each chip).
 *   3. Provide the entry point to open the full comparison modal
 *      (disabled until at least 2 products are selected).
 *
 * Position: `position: fixed` at the bottom of the viewport. On native,
 * Expo Router's stack doesn't bleed into this area — the Screen wrapper
 * already reserves bottom safe-area inset. We add 12 px extra paddingBottom
 * for visual breathing room.
 */

import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import type { Product } from '../../types/product';
import { getProductImage } from '../../data/imageMap';
import { MAX_COMPARE_SELECTION } from '../../types/filters';
import { useTheme } from '../../contexts/ThemeContext';

export interface CompareDrawerProps {
  selected: Product[];
  onClear:   () => void;
  onCompare: () => void;
  onRemove:  (id: string) => void;
}

export const CompareDrawer = ({
  selected,
  onClear,
  onCompare,
  onRemove,
}: CompareDrawerProps) => {
  // Hook must run before any early return (Rules of Hooks).
  const { tokens } = useTheme();

  // Hidden by default — only mount when the user has selected something.
  if (selected.length === 0) return null;

  const canCompare = selected.length >= 2;

  return (
    <View
      // `position: 'fixed'` is a web-only string; React Native ignores
      // unknown values, so the drawer falls back to inline flow on native.
      // For native we'd need a `Modal` or an absolutely-positioned host —
      // out of scope here since the Compare screen is the only consumer.
      style={{
        position: 'fixed' as never,
        bottom: 0, left: 0, right: 0,
        zIndex: 100,
        // Accent bar. `textInverse` rides on top — in light it's the cream
        // that reads on medium sage; in dark it's near-black on light sage.
        // White text would fail contrast on the dark-scheme light sage, so
        // every label below uses `textInverse`, not literal white.
        backgroundColor: tokens.colors.accent,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      }}
    >
      <View className="flex-row items-center gap-3 flex-wrap">
        <Text className="text-mw-text-inverse font-body-semibold text-[13px]">
          {selected.length}/{MAX_COMPARE_SELECTION} selected
        </Text>

        {/* Chip strip — horizontally scrollable on narrow screens. Each
            chip has its own remove button; tapping the chip itself does
            nothing (the design treats it as a status indicator). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {selected.map((p) => (
            <View
              key={p.id}
              className="flex-row items-center"
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 999,
                gap: 8,
              }}
            >
              <Image
                source={getProductImage(p.variants[0]?.img ?? p.img)}
                resizeMode="contain"
                style={{
                  width: 22, height: 22,
                  backgroundColor: '#fff',
                  borderRadius: 4,
                }}
                accessibilityLabel=""
                accessibilityElementsHidden
              />
              <Text
                className="text-mw-text-inverse font-body text-[12px]"
                numberOfLines={1}
                style={{ maxWidth: 140 }}
              >
                {p.name}
              </Text>
              <Pressable
                onPress={() => onRemove(p.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${p.name} from comparison`}
                // Visible "×" glyph is ~15 px; hitSlop:14 brings the
                // touch target close to WCAG's 44 px minimum.
                hitSlop={14}
              >
                <Text className="text-mw-text-inverse" style={{ fontSize: 15, lineHeight: 15 }}>
                  ×
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* Action cluster — Clear is always available, Compare is gated
            on having at least 2 products (the design's UX promise). */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Clear all selected products"
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Text className="text-mw-text-inverse font-body-semibold text-[13px]">Clear</Text>
          </Pressable>
          <Pressable
            onPress={onCompare}
            disabled={!canCompare}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCompare }}
            accessibilityLabel={
              canCompare
                ? `Compare ${selected.length} products`
                : 'Select at least 2 products to compare'
            }
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 7,
              borderRadius: 8,
              // Enabled = a lifted surface on the accent bar (card bg +
              // accent text, contrasts in both schemes). Disabled stays a
              // translucent white wash relative to the accent surface.
              backgroundColor: canCompare ? tokens.colors.bgCard : 'rgba(255,255,255,0.3)',
            }}
          >
            <Text
              className="font-body-semibold text-[13px]"
              style={{ color: canCompare ? tokens.colors.accent : 'rgba(255,255,255,0.5)' }}
            >
              Compare ({selected.length})
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
