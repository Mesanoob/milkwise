/**
 * StageTabs — top tab bar that filters by infant stage.
 *
 * Multi-select: each stage can be toggled independently, matching the
 * design handoff behaviour. "All Stages" clears the filter array. A small
 * green dot appears on tabs that are active in multi-select mode so the
 * user sees at a glance which stages are on.
 *
 * Horizontally scrollable on narrow screens (the design overflow-wraps
 * to the right rather than stacking, so the row never grows vertically).
 */

import { Pressable, Text, ScrollView, View } from 'react-native';
import type { Stage } from '../../types/product';
import type { StageFilter } from '../../types/filters';
import { ALL_STAGES } from '../../data/products';

export interface StageTabsProps {
  value:       StageFilter;
  onToggle:    (stage: Stage) => void;
  onClearAll:  () => void;
}

export const StageTabs = ({ value, onToggle, onClearAll }: StageTabsProps) => {
  const noneSelected = value.length === 0;

  return (
    <View className="bg-surface border-b border-border">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        // ARIA `tablist` parent — required for the `tab` role on each
        // child Pressable below. Without it the role binding is invalid
        // and screen readers ignore the tab semantics.
        accessibilityRole="tablist"
      >
        {/* "All Stages" tab — active when the multi-select array is empty.
            Tapping it clears any current selection. */}
        <Pressable
          onPress={onClearAll}
          accessibilityRole="tab"
          accessibilityState={{ selected: noneSelected }}
          accessibilityLabel="Show all stages"
          style={{
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderBottomWidth: 2,
            borderBottomColor: noneSelected ? '#1B5E3B' : 'transparent',
          }}
        >
          <Text
            className="text-[13.5px] font-sans-semibold"
            style={{ color: noneSelected ? '#1B5E3B' : '#6B7280' }}
          >
            All Stages
          </Text>
        </Pressable>

        {ALL_STAGES.map((stage) => {
          const isActive = value.includes(stage);
          return (
            <Pressable
              key={stage}
              onPress={() => onToggle(stage)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Toggle filter ${stage}`}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderBottomWidth: 2,
                borderBottomColor: isActive ? '#1B5E3B' : 'transparent',
                position: 'relative',
              }}
            >
              <Text
                className="text-[13.5px] font-sans-semibold"
                style={{ color: isActive ? '#1B5E3B' : '#6B7280' }}
              >
                {stage}
              </Text>
              {/* Tiny dot — visual cue that the tab is "on" in a multi-
                  select context (the underline alone could be mistaken
                  for the hover state). */}
              {isActive && (
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 6,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#1B5E3B',
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
