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
import { useTheme } from '../../contexts/ThemeContext';

export interface StageTabsProps {
  value:       StageFilter;
  onToggle:    (stage: Stage) => void;
  onClearAll:  () => void;
}

export const StageTabs = ({ value, onToggle, onClearAll }: StageTabsProps) => {
  const noneSelected = value.length === 0;
  const { tokens } = useTheme();

  return (
    <View className="bg-mw-bg-card border-b border-mw-border">
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
            borderBottomColor: noneSelected ? tokens.colors.accent : 'transparent',
          }}
        >
          <Text
            className="text-[13.5px] font-body-semibold"
            style={{ color: noneSelected ? tokens.colors.accentText : tokens.colors.textMuted }}
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
                borderBottomColor: isActive ? tokens.colors.accent : 'transparent',
                position: 'relative',
              }}
            >
              <Text
                className="text-[13.5px] font-body-semibold"
                style={{ color: isActive ? tokens.colors.accentText : tokens.colors.textMuted }}
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
                    backgroundColor: tokens.colors.accent,
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
