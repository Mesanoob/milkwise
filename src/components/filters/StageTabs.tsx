/**
 * StageTabs — the horizontal pill row that filters by infant stage.
 *
 * One pill per stage plus an "All" pill. The active pill is filled green;
 * inactive pills are outlined. The pattern is reused for BrandPills and
 * SpecialtyChips but lives in its own component because the labels and
 * accessibility hints are stage-specific.
 */

import { View, Pressable, Text, ScrollView } from 'react-native';
import type { StageFilter } from '../../types/filters';
import { ALL_STAGES } from '../../data/products';

export interface StageTabsProps {
  value:    StageFilter;
  onChange: (next: StageFilter) => void;
}

// "All" first, then each canonical stage in order. Computed outside the
// component so we don't allocate a new array per render.
const OPTIONS: readonly StageFilter[] = ['All', ...ALL_STAGES];

export const StageTabs = ({ value, onChange }: StageTabsProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}
      className="bg-surface border-b border-border"
    >
      {OPTIONS.map((option) => {
        const isActive = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityLabel={`Filter by ${option}`}
            accessibilityState={{ selected: isActive }}
            className={
              'px-3 py-1.5 rounded-full border ' +
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
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
