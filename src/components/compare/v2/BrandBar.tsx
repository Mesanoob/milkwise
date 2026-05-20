/**
 * BrandBar — horizontal scrolling brand-chip strip. Tap toggles single-
 * select; tapping the active chip again clears it. Ported from
 * styles-v2.css `.mw-brandbar*`.
 *
 * On web we mirror the design's right-edge fade-out mask so the scroll
 * cue is visible; on native the mask is ignored (no `WebkitMaskImage`).
 */

import { Platform, ScrollView, View, Pressable, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useFormulaCompare } from '../../../contexts/FormulaCompareContext';
import { ALL_FORMULA_BRANDS } from '../../../data/formulas';

export const BrandBar = () => {
  const { tokens } = useTheme();
  const { brand, setBrand } = useFormulaCompare();
  const isWeb = Platform.OS === 'web';

  const webMaskStyle = isWeb
    ? ({
        WebkitMaskImage:
          'linear-gradient(90deg, #000 0, #000 calc(100% - 36px), transparent 100%)',
        maskImage:
          'linear-gradient(90deg, #000 0, #000 calc(100% - 36px), transparent 100%)',
      } as unknown as ViewStyle)
    : null;

  return (
    <View
      style={{
        maxWidth: tokens.layout.maxContent,
        width: '100%',
        marginHorizontal: 'auto',
        paddingTop: 20,
        paddingHorizontal: 32,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <Text
        style={{
          fontFamily: tokens.fonts.bodySemibold,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.54, // 0.14em × 11
          textTransform: 'uppercase',
          color: tokens.colors.textMuted,
          flexShrink: 0,
        }}
      >
        Brand
      </Text>
      <View style={[{ flex: 1, minWidth: 0 }, webMaskStyle ?? {}]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingVertical: 4,
          }}
        >
          {ALL_FORMULA_BRANDS.map((b) => {
            const on = brand === b;
            return (
              <Pressable
                key={b}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setBrand(on ? null : b)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: on ? tokens.colors.accent : tokens.colors.border,
                  backgroundColor: on
                    ? tokens.colors.accent
                    : tokens.colors.bgCard,
                }}
              >
                <Text
                  style={{
                    fontFamily: tokens.fonts.bodyMedium,
                    fontSize: 14,
                    fontWeight: '500',
                    color: on
                      ? tokens.colors.textInverse
                      : tokens.colors.text,
                  }}
                >
                  {b}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};
