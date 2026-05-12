/**
 * BrandPills — horizontal scroll of brand filter pills.
 *
 * Same visual pattern as `StageTabs` but the option list is dynamic (read
 * from the dataset). The "All" pill stays pinned to the left.
 */

import { View, Pressable, Text, ScrollView } from 'react-native';
import { ALL_BRANDS } from '../../data/products';

export interface BrandPillsProps {
  value:    'All' | string;
  onChange: (next: 'All' | string) => void;
}

export const BrandPills = ({ value, onChange }: BrandPillsProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}
      className="bg-surface border-b border-border"
    >
      {['All', ...ALL_BRANDS].map((brand) => {
        const isActive = brand === value;
        return (
          <Pressable
            key={brand}
            onPress={() => onChange(brand)}
            accessibilityLabel={`Filter by ${brand}`}
            accessibilityState={{ selected: isActive }}
            className={
              'px-3 py-1 rounded-full border ' +
              (isActive
                ? 'bg-green border-green'
                : 'bg-surface border-border')
            }
          >
            <Text
              className={
                'text-xs font-semibold ' +
                (isActive ? 'text-white' : 'text-text')
              }
            >
              {brand}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
