/**
 * DisclaimerBanner — ported from `Chrome.jsx` / `.mw-banner` in styles.css.
 *
 * Renders above the NavBar; dismiss persists in AsyncStorage so it does
 * not reappear on reload (mirrors the prototype's
 * `localStorage.getItem('mw_banner_dismissed') === '1'`). The storage key
 * is intentionally identical to the design so users moving between the
 * prototype and the app don't re-see the banner.
 *
 * Behaviour notes:
 *   • Default-visible while storage is hydrating. A returning user who
 *     already dismissed it will see a 1-frame flash on cold load — same
 *     trade-off ThemeContext makes for the theme glyph and acceptable for
 *     a one-time element. The alternative (hide-by-default) would deny
 *     first-time users the disclaimer until storage answered.
 *   • Height + amber palette come from design tokens (`bannerH`, `warnBg`,
 *     `warnText`), so a dark-mode reader gets the deep-amber pair
 *     automatically (theme.ts `warnBg` flips to `#443D24`).
 */

import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

// Versioned key — bump suffix if we ever change the banner's meaning so a
// previously-dismissed flag can't silently suppress a different message.
const STORAGE_KEY = 'mw_banner_dismissed';

export const DisclaimerBanner = () => {
  const { tokens } = useTheme();
  const [dismissed, setDismissed] = useState(false);

  // Hydrate once. Failures (private mode, quota) fall through to "show" —
  // the disclaimer is the higher-safety default for a health-adjacent app.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (alive && v === '1') setDismissed(true);
      })
      .catch(() => {
        /* storage unreadable — show the banner */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    // Best-effort persistence; the in-memory dismissal still applies even
    // if the write fails.
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  };

  return (
    <View
      // Match the design: `.mw-banner` is the row above the sticky nav.
      // Position is `relative` (not sticky) so it scrolls away with the page.
      style={{
        height: tokens.layout.bannerH, // 36
        backgroundColor: tokens.colors.warnBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        position: 'relative',
      }}
    >
      <Text
        style={{
          color: tokens.colors.warnText,
          fontSize: 13,
          fontFamily: tokens.fonts.body,
        }}
        accessibilityRole="alert"
      >
        ⚠️  MilkWise SG is not a medical advice platform. Always consult your
        paediatrician.
      </Text>

      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss disclaimer"
        // Design positions the close button at right:14 top:50% transform
        // translateY(-50%). Absolute + vertical-centre via inset gives the
        // same result without RN's missing `translateY` percentage support.
        style={{
          position: 'absolute',
          right: 14,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          paddingHorizontal: 4,
        }}
        hitSlop={8}
      >
        <Text
          style={{
            color: tokens.colors.warnText,
            fontSize: 16,
            lineHeight: 16,
          }}
        >
          ×
        </Text>
      </Pressable>
    </View>
  );
};
