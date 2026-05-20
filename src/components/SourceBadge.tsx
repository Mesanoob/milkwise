/**
 * SourceBadge — small inline citation chip used throughout the
 * long-form content pages (Nutrition Guide / For New Parents / About) to
 * mark where a stat or table came from. Ported from `atoms.jsx` +
 * `.mw-source-badge` in styles.css.
 *
 * Tokens: info-soft background + info text — semantic blue, so it reads
 * as "data callout" not as "alert" (the warm amber band is reserved for
 * disclaimers; sage is reserved for primary actions).
 */

import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const SourceBadge = ({ children }: { children: string }) => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 4,
        backgroundColor: tokens.colors.infoSoft,
      }}
    >
      <Text
        style={{
          fontFamily: tokens.fonts.body,
          fontSize: 11,
          color: tokens.colors.info,
        }}
      >
        {children}
      </Text>
    </View>
  );
};
