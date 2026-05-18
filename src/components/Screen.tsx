/**
 * Screen — common wrapper for every page in the app.
 *
 * Responsibilities:
 *   • Safe-area padding (notch on iOS, status bar on Android).
 *   • Background colour from the brand palette.
 *   • Mounts the header and bottom nav so individual screens don't repeat
 *     themselves.
 *
 * Pages that need to opt out (e.g. a full-bleed image) can pass
 * `withChrome={false}` to drop the header and bottom nav.
 */

import { ReactNode } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header }    from './Header';
import { BottomNav } from './BottomNav';

export interface ScreenProps {
  children:    ReactNode;
  withChrome?: boolean;
  // When `scroll` is false the screen must manage its own scrolling
  // (e.g. if it contains a FlatList).
  scroll?:     boolean;
}

export const Screen = ({ children, withChrome = true, scroll = true }: ScreenProps) => {
  return (
    // `edges={['top']}` because the bottom inset is handled inside BottomNav.
    <SafeAreaView edges={['top']} className="flex-1 bg-mw-bg">
      {withChrome && <Header />}

      {scroll ? (
        <ScrollView
          // `contentInsetAdjustmentBehavior` makes iOS large-title navigation
          // look natural. Safe to set even on Android / web (no-op).
          contentInsetAdjustmentBehavior="automatic"
          // Bottom padding equal to the bottom-nav height (56px) so the
          // last row of content is never hidden under the tab bar on mobile.
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">{children}</View>
      )}

      {withChrome && <BottomNav />}
    </SafeAreaView>
  );
};
