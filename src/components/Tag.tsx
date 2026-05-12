/**
 * Tag — a tiny coloured label used to flag product attributes.
 *
 * Examples: "HALAL", "ORGANIC", "BUDGET". Visually identical to the `.tag`
 * rule in the original CSS — uppercase, letter-spaced, brand-coloured pill.
 *
 * `variant` picks the colour scheme; defaults to the neutral muted palette.
 */

import { Text, View } from 'react-native';

export type TagVariant = 'green' | 'amber' | 'muted' | 'danger';

export interface TagProps {
  label:    string;
  variant?: TagVariant;
}

// Centralised colour table — adding a new variant is a one-place change.
// Each entry maps to NativeWind class strings rather than raw hex codes so
// dark-mode support (if we add it) only has to touch tailwind config.
const VARIANT_STYLES: Record<TagVariant, string> = {
  green:  'bg-green-light text-green',
  amber:  'bg-amber-light text-amber',
  muted:  'bg-surface2 text-muted',
  danger: 'bg-red-100 text-red-700',
};

export const Tag = ({ label, variant = 'muted' }: TagProps) => {
  // Split the merged class string at the space — bg goes on the View,
  // text on the Text. NativeWind compiles each independently.
  const [bg, text] = VARIANT_STYLES[variant].split(' ');

  return (
    <View className={`${bg} px-1.5 py-0.5 rounded`}>
      <Text className={`${text} text-[10px] font-bold tracking-wider uppercase`}>
        {label}
      </Text>
    </View>
  );
};
