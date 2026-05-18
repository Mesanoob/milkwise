/**
 * DisplayToggle — segmented control for card / list / picture views.
 *
 * Visually three pills grouped in a single rounded container. The active
 * pill is filled, inactive pills are transparent over the muted background.
 */

import { View, Pressable, Text } from 'react-native';
import type { DisplayMode } from '../types/filters';

export interface DisplayToggleProps {
  value:    DisplayMode;
  onChange: (next: DisplayMode) => void;
}

// Defining the three modes as data (rather than three near-identical JSX
// blocks) keeps the component DRY and means a fourth mode would be a
// one-line addition.
const MODES: Array<{ value: DisplayMode; label: string; icon: string }> = [
  { value: 'card',    label: 'Cards',  icon: '▦' },
  { value: 'list',    label: 'List',   icon: '☰' },
  { value: 'picture', label: 'Photos', icon: '◳' },
];

export const DisplayToggle = ({ value, onChange }: DisplayToggleProps) => {
  return (
    <View className="flex-row bg-mw-bg-panel border border-mw-border rounded-full p-0.5">
      {MODES.map((mode) => {
        const isActive = mode.value === value;
        return (
          <Pressable
            key={mode.value}
            onPress={() => onChange(mode.value)}
            accessibilityRole="button"
            accessibilityLabel={`Show ${mode.label} view`}
            accessibilityState={{ selected: isActive }}
            hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
            className={
              'px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ' +
              (isActive ? 'bg-mw-accent' : '')
            }
          >
            <Text className={isActive ? 'text-mw-text-inverse text-xs' : 'text-mw-text-muted text-xs'}>
              {mode.icon}
            </Text>
            <Text
              className={
                'text-xs font-sans-semibold ' +
                (isActive ? 'text-mw-text-inverse' : 'text-mw-text-muted')
              }
            >
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
