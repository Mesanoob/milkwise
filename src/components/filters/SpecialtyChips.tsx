/**
 * SpecialtyChips — filter by formula specialty (organic, gentle, soy, …).
 *
 * Labels go through `labelForSpecialty` so the storage key ("csection")
 * never appears in the UI ("C-Section"). The underlying value remains the
 * key so URL state and storage layers don't break when copy changes.
 */

import { Pressable, Text, ScrollView } from 'react-native';
import type { Specialty } from '../../types/product';
import { ALL_SPECIALTIES } from '../../data/products';
import { labelForSpecialty } from '../../utils/strings';

export interface SpecialtyChipsProps {
  value:    Specialty | 'All';
  onChange: (next: Specialty | 'All') => void;
}

export const SpecialtyChips = ({ value, onChange }: SpecialtyChipsProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}
      className="bg-surface border-b border-border"
    >
      <Chip key="All" label="All specialties" active={value === 'All'} onPress={() => onChange('All')} />
      {ALL_SPECIALTIES.map((key) => (
        <Chip
          key={key}
          label={labelForSpecialty(key)}
          active={value === key}
          onPress={() => onChange(key as Specialty)}
        />
      ))}
    </ScrollView>
  );
};

// Private sub-component — small enough to inline, but pulling it out keeps
// the JSX above readable and means we only configure className strings once.
interface ChipProps {
  label:   string;
  active:  boolean;
  onPress: () => void;
}

const Chip = ({ label, active, onPress }: ChipProps) => (
  <Pressable
    onPress={onPress}
    accessibilityState={{ selected: active }}
    className={
      'px-3 py-1.5 rounded-full border ' +
      (active ? 'bg-green border-green' : 'bg-surface border-border')
    }
  >
    <Text className={'text-xs font-medium ' + (active ? 'text-white' : 'text-text')}>
      {label}
    </Text>
  </Pressable>
);
