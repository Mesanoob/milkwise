/**
 * SortDropdown — choose the sort field, plus a direction toggle.
 *
 * On native we use a simple cycling Pressable (tap to cycle through fields)
 * because RN does not ship a real `<select>`. On web a real `<select>`
 * dropdown is more accessible — we render it via a platform-conditional
 * branch. Either way the parent only sees `onChange(field, direction)`.
 */

import { Platform, Pressable, Text, View } from 'react-native';
import type { SortField, SortState } from '../types/filters';

export interface SortDropdownProps {
  value:    SortState;
  onChange: (field: SortField, direction?: 'asc' | 'desc') => void;
}

// User-facing labels separate from `SortField` keys so we can localise
// the labels later without touching the sort logic.
const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'pricePerGram',  label: '$ / gram' },
  { value: 'pricePerScoop', label: '$ / scoop' },
  { value: 'pricePerMl',    label: '$ / mL' },
  { value: 'price',         label: 'Tin price' },
  { value: 'protein',       label: 'Protein' },
  { value: 'dha',           label: 'DHA' },
  { value: 'name',          label: 'Name (A→Z)' },
  { value: 'brand',         label: 'Brand (A→Z)' },
];

export const SortDropdown = ({ value, onChange }: SortDropdownProps) => {
  // Direction arrow flips on every press of the small button to the right
  // of the field selector.
  const directionIcon = value.direction === 'asc' ? '↑' : '↓';
  const flipDirection = () =>
    onChange(value.field, value.direction === 'asc' ? 'desc' : 'asc');

  return (
    <View className="flex-row items-center gap-1.5">
      {Platform.OS === 'web'
        ? <WebSelect value={value.field} onChange={(field) => onChange(field)} />
        : <NativeCycler value={value.field} onChange={(field) => onChange(field)} />}

      <Pressable
        onPress={flipDirection}
        accessibilityRole="button"
        accessibilityLabel={`Sort direction, currently ${value.direction === 'asc' ? 'ascending' : 'descending'}, tap to flip`}
        hitSlop={6}
        className="w-9 h-9 rounded-lg border border-border bg-surface items-center justify-center"
      >
        <Text className="text-base text-text">{directionIcon}</Text>
      </Pressable>
    </View>
  );
};

// ── Web: a real <select> for accessibility ──────────────────────────────────
// We render a native HTML element styled with NativeWind. RN web ignores
// unknown JSX so we drop down to a one-off React.createElement call.
const WebSelect = ({ value, onChange }: { value: SortField; onChange: (f: SortField) => void }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Select: any = 'select' as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Option: any = 'option' as any;

  return (
    <Select
      value={value}
      onChange={(e: { target: { value: string } }) => onChange(e.target.value as SortField)}
      style={{
        height: 36,
        paddingLeft: 12,
        paddingRight: 28,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0D9CC',
        background: '#FFFFFF',
        fontSize: 13,
        fontFamily: 'inherit',
      }}
      aria-label="Sort by"
    >
      {SORT_OPTIONS.map((option) => (
        <Option key={option.value} value={option.value}>{option.label}</Option>
      ))}
    </Select>
  );
};

// ── Native: cycling button (tap to advance to next sort field) ──────────────
const NativeCycler = ({ value, onChange }: { value: SortField; onChange: (f: SortField) => void }) => {
  const currentIndex = SORT_OPTIONS.findIndex((option) => option.value === value);
  const currentLabel = SORT_OPTIONS[currentIndex]?.label ?? 'Sort';

  const cycle = () => {
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
    onChange(SORT_OPTIONS[nextIndex].value);
  };

  return (
    <Pressable
      onPress={cycle}
      accessibilityLabel={`Sort by ${currentLabel}, tap to change`}
      className="h-9 px-3 rounded-lg border border-border bg-surface flex-row items-center"
    >
      <Text className="text-xs text-text font-sans-medium">{currentLabel}</Text>
    </Pressable>
  );
};
