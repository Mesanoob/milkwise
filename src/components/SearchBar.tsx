/**
 * SearchBar — text input for product search.
 *
 * Visually a rounded pill. Behaviour-wise, the input is *controlled* — the
 * parent owns the value, the input only renders it. That keeps the search
 * filter logic in `useProducts` and out of the component tree.
 *
 * Debouncing is intentionally NOT done here. The dataset is small (61
 * products) and filtering on every keystroke is imperceptible. Debouncing
 * would only add latency. If the catalogue ever grows past a few thousand
 * items, we can revisit using `SEARCH_DEBOUNCE_MS` from constants.
 */

import { Platform, TextInput, View, Pressable, Text, type TextStyle } from 'react-native';
import { colors } from '../config/theme';

export interface SearchBarProps {
  value:    string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder }: SearchBarProps) => {
  // Show a clear button only when there is text to clear — avoids visual
  // clutter when the field is empty.
  const showClear = value.length > 0;

  return (
    <View className="flex-row items-center bg-surface border border-border rounded-full px-4 py-2 gap-2 w-full">
      <Text className="text-muted">⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? 'Search formulas, brands, specialty…'}
        placeholderTextColor={colors.muted}
        // Disable auto-correct: brand names ("Aptamil") are not in the
        // dictionary and getting auto-corrected to "Aptitude" is worse than
        // typing the full name yourself.
        autoCorrect={false}
        autoCapitalize="none"
        // `style` instead of className for `flex: 1` because some NativeWind
        // versions on web compile `flex-1` to `flex: 1 1 0%` which collapses
        // the TextInput inside a flex-row. The numeric value is stable.
        // `outline: none` removes the blue browser focus ring — web only;
        // RN ignores unknown style keys but TypeScript needs the cast.
        style={[
          { flex: 1, color: colors.text, fontSize: 14 },
          // `outlineWidth: 0` is the cross-platform-safe way to remove the
          // browser's blue focus ring without tripping RN's stricter typing.
          Platform.OS === 'web' ? ({ outlineWidth: 0 } as TextStyle) : null,
        ]}
        // ARIA / a11y — screen readers describe this as "Search products".
        accessibilityLabel="Search products"
        accessibilityHint="Filters the product list by name, brand, or specialty"
      />
      {showClear && (
        <Pressable
          onPress={() => onChange('')}
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Text className="text-muted text-base">✕</Text>
        </Pressable>
      )}
    </View>
  );
};
