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
    <View className="flex-row bg-surface2 border border-border rounded-full p-0.5">
      {MODES.map((mode) => {
        const isActive = mode.value === value;
        return (
          <Pressable
            key={mode.value}
            onPress={() => onChange(mode.value)}
            accessibilityLabel={`Show ${mode.label} view`}
            accessibilityState={{ selected: isActive }}
            className={
              'px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ' +
              (isActive ? 'bg-green' : '')
            }
          >
            <Text className={isActive ? 'text-white text-xs' : 'text-muted text-xs'}>
              {mode.icon}
            </Text>
            <Text
              className={
                'text-xs font-semibold ' +
                (isActive ? 'text-white' : 'text-muted')
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
