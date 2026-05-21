/**
 * StageTabs — segmented tabs above the Compare grid with the design's
 * accent-underlined active state. Ported from styles-v2.css `.mw-stage-tabs`.
 *
 * Tabs are horizontally scrollable on small viewports (matches the design's
 * `overflow-x: auto`).
 */

import { ScrollView, View, Pressable, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useFormulaCompare, type CompareStage } from '../../../contexts/FormulaCompareContext';

const TABS: CompareStage[] = ['All Stages', 'Stage 1', 'Stage 2', 'Stage 3'];

export const StageTabs = () => {
  const { tokens } = useTheme();
  const { stage, setStage } = useFormulaCompare();
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          maxWidth: tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: 32,
        }}
      >
        {TABS.map((t) => {
          const on = stage === t;
          return (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setStage(t)}
              hitSlop={6}
              style={{
                position: 'relative',
                paddingTop: 18,
                paddingBottom: 16,
                paddingHorizontal: 22,
              }}
            >
              <Text
                style={{
                  fontFamily: tokens.fonts.bodyMedium,
                  fontSize: 17,
                  fontWeight: '500',
                  letterSpacing: -0.085,
                  color: on
                    ? tokens.colors.accentText
                    : tokens.colors.textMuted,
                }}
              >
                {t}
              </Text>
              {on && (
                <View
                  // 3px underline inset 14px from each side, slightly
                  // below the border (sits over the container's
                  // border-bottom for the "tab pulls forward" effect).
                  style={{
                    position: 'absolute',
                    left: 14,
                    right: 14,
                    bottom: -1,
                    height: 3,
                    borderRadius: 2,
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
