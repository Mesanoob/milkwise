/**
 * CompareTray — bottom-fixed bar showing the (≤5) formulas the user has
 * picked. Ported from `Compare.jsx` CompareTray + the `.mw-tray*` rules.
 *
 * Phase 6 wiring: "Compare Now" navigates to `/head-to-head`, which reads
 * the same tray from `FormulaCompareContext` (mounted above the Stack so
 * the selection survives navigation). The route shows N=1 as a single-
 * product spec view and N=2/3 as a side-by-side comparison.
 */

import { Platform, View, Pressable, Text, Image, ScrollView, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useFormulaCompare } from '../../../contexts/FormulaCompareContext';
import { getProductImage } from '../../../data/imageMap';

export const CompareTray = () => {
  const { tokens } = useTheme();
  const router = useRouter();
  const { tray, removeFromTray, clearTray } = useFormulaCompare();
  if (tray.length === 0) return null;

  // Web `position: fixed`; native uses `absolute` (the parent Screen
  // doesn't scroll the tray because we render it at the page level).
  const positionStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({ position: 'fixed' as never, bottom: 0, left: 0, right: 0 } as ViewStyle)
      : { position: 'absolute', bottom: 0, left: 0, right: 0 };

  return (
    <View
      style={[
        positionStyle,
        {
          zIndex: 40,
          backgroundColor: tokens.colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: tokens.colors.border,
          ...tokens.shadow.s3,
        },
      ]}
    >
      <View
        style={{
          maxWidth: tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
          paddingVertical: 14,
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
            letterSpacing: 1.54,
            textTransform: 'uppercase',
            color: tokens.colors.textMuted,
            flexShrink: 0,
          }}
        >
          Compare ({tray.length}/5)
        </Text>

        {/* Chip strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: 'center' }}
          style={{ flex: 1, minWidth: 0 }}
        >
          {tray.map((p) => (
            <View
              key={p.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 5,
                paddingLeft: 5,
                paddingRight: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: tokens.colors.border,
                backgroundColor: tokens.colors.bgPanel,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  backgroundColor: tokens.colors.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={getProductImage(p.img)}
                  accessibilityIgnoresInvertColors
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: tokens.fonts.bodyMedium,
                  color: tokens.colors.text,
                  maxWidth: 110,
                }}
                numberOfLines={1}
              >
                {p.brand}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${p.brand}`}
                onPress={() => removeFromTray(p.id)}
                hitSlop={6}
                style={{ paddingHorizontal: 4 }}
              >
                <Text style={{ color: tokens.colors.textFaint, fontSize: 14 }}>
                  ×
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear compare"
          onPress={clearTray}
          style={{ paddingVertical: 6, paddingHorizontal: 10 }}
        >
          <Text
            style={{
              color: tokens.colors.textFaint,
              fontSize: 13,
              fontFamily: tokens.fonts.bodyMedium,
            }}
          >
            Clear
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open comparison"
          // Phase 6: navigate to /head-to-head; the page reads the same
          // tray from FormulaCompareContext, so the selection rides the
          // route change without extra props or query params.
          onPress={() => router.push('/head-to-head' as never)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 999,
            backgroundColor: tokens.colors.accent,
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              color: tokens.colors.textInverse,
              fontFamily: tokens.fonts.bodySemibold,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            Compare Now
          </Text>
          <Text style={{ color: tokens.colors.textInverse, fontSize: 14 }}>
            →
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
