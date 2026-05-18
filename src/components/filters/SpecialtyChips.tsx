/**
 * SpecialtyChips — filter by formula specialty (multi-select).
 *
 * Empty selection array = "all specialties". Visual idiom matches
 * BrandPills so users build one mental model for both rows.
 *
 * Labels go through `labelForSpecialty` so the storage key ("csection")
 * never appears in the UI ("C-Section Recovery"). The underlying value
 * remains the key.
 */

import { Pressable, Text, ScrollView, View } from 'react-native';
import type { Specialty } from '../../types/product';
import type { SpecialtyFilter } from '../../types/filters';
import { ALL_SPECIALTIES } from '../../data/products';
import { labelForSpecialty } from '../../utils/strings';
import { useTheme } from '../../contexts/ThemeContext';

type SpecialtyKey = Exclude<Specialty, null>;

export interface SpecialtyChipsProps {
  value:    SpecialtyFilter;
  onToggle: (key: SpecialtyKey) => void;
}

export const SpecialtyChips = ({ value, onToggle }: SpecialtyChipsProps) => (
  <View
    className="bg-mw-bg-card border-b border-mw-border flex-row items-center"
    style={{ paddingHorizontal: 16, paddingVertical: 8 }}
  >
    <Text
      className="text-[11px] font-sans-bold uppercase tracking-wider text-mw-text-muted"
      style={{ marginRight: 8 }}
    >
      Type
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 16 }}
    >
      {ALL_SPECIALTIES.map((key) => {
        const isActive = value.includes(key as SpecialtyKey);
        return (
          <Chip
            key={key}
            label={labelForSpecialty(key)}
            active={isActive}
            onPress={() => onToggle(key as SpecialtyKey)}
          />
        );
      })}
    </ScrollView>
  </View>
);

/* -------------------------------------------------------------------------- */
/* Chip — design's `.chip` style                                              */
/* -------------------------------------------------------------------------- */

interface ChipProps {
  label:   string;
  active:  boolean;
  onPress: () => void;
}

const Chip = ({ label, active, onPress }: ChipProps) => {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Toggle filter ${label}`}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1.5,
        backgroundColor: active ? tokens.colors.accent : tokens.colors.bgCard,
        borderColor:     active ? tokens.colors.accent : tokens.colors.border,
      }}
    >
      <Text
        className="text-[12.5px] font-sans-medium"
        style={{ color: active ? tokens.colors.textInverse : tokens.colors.text }}
      >
        {label}
      </Text>
    </Pressable>
  );
};
