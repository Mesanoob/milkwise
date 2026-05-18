/**
 * BrandPills — horizontal scroll of brand filter pills (multi-select).
 *
 * Empty selection array = "all brands". Each tap toggles one brand in/out
 * of the array. Visual style matches the design's `.brand-pill` rule.
 */

import { Pressable, Text, ScrollView, View } from 'react-native';
import type { BrandFilter } from '../../types/filters';
import { ALL_BRANDS } from '../../data/products';
import { useTheme } from '../../contexts/ThemeContext';

export interface BrandPillsProps {
  value:    BrandFilter;
  onToggle: (brand: string) => void;
}

export const BrandPills = ({ value, onToggle }: BrandPillsProps) => {
  const { tokens } = useTheme();
  return (
  <View
    className="bg-mw-bg-card border-b border-mw-border flex-row items-center"
    style={{ paddingHorizontal: 16, paddingVertical: 8 }}
  >
    {/* Section kicker — matches the design's "BRAND" caption. */}
    <Text
      className="text-[11px] font-sans-bold uppercase tracking-wider text-mw-text-muted"
      style={{ marginRight: 8 }}
    >
      Brand
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingRight: 16 }}
    >
      {ALL_BRANDS.map((brand) => {
        const isActive = value.includes(brand);
        return (
          <Pressable
            key={brand}
            onPress={() => onToggle(brand)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Toggle filter ${brand}`}
            // Pill is ~24 px tall by design; hitSlop:10 takes the touch
            // target to ~44 px without visually inflating the row.
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              borderWidth: 1.5,
              backgroundColor: isActive ? tokens.colors.accent : tokens.colors.bgCard,
              borderColor:     isActive ? tokens.colors.accent : tokens.colors.border,
            }}
          >
            <Text
              className="text-[12px] font-sans-semibold"
              style={{ color: isActive ? tokens.colors.textInverse : tokens.colors.text }}
            >
              {brand}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
  );
};
