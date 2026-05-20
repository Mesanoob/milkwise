/**
 * Screen — common wrapper for every page in the app.
 *
 * Chrome stack (top → bottom):
 *   DisclaimerBanner  · 36 px amber band, dismissible (persisted)
 *   Header (NavBar)   · 64 px sticky glass bar (web) / opaque (native)
 *   ScrollView        · page content
 *     {children}
 *     Footer          · 4-column dark band, scrolls into view at page end
 *
 * Phase 2 changes from the v1 chrome:
 *   • BottomNav removed entirely. The design has no bottom-tab bar; mobile
 *     navigation lives in the hamburger flyout inside NavBar.
 *   • Footer mounted inside the scroll so it sits naturally at the bottom
 *     of the page (matches the design's layered site layout).
 *   • `paddingBottom: 80` (the old BottomNav clearance) removed — there's
 *     no fixed bar to clear anymore.
 *
 * Pages can still opt out of the full chrome via `withChrome={false}`
 * (e.g. for a future full-bleed onboarding screen).
 */

import { ReactNode } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './Header';
import { DisclaimerBanner } from './DisclaimerBanner';
import { Footer } from './Footer';

export interface ScreenProps {
  children: ReactNode;
  /** Drop the whole chrome (banner + nav + footer). Default: render it. */
  withChrome?: boolean;
  /** When false the screen manages its own scrolling (e.g. it owns a
   *  FlatList). The Footer then becomes the page's responsibility too — it
   *  won't be auto-appended below the children. */
  scroll?: boolean;
}

export const Screen = ({
  children,
  withChrome = true,
  scroll = true,
}: ScreenProps) => {
  return (
    // `edges={['top']}` — top notch only; no bottom bar to inset around
    // anymore. The Footer's own padding provides bottom breathing room.
    <SafeAreaView edges={['top']} className="flex-1 bg-mw-bg">
      {withChrome && <DisclaimerBanner />}
      {withChrome && <Header />}

      {scroll ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          {children}
          {/* Footer rides inside the scroll so it appears at the end of
              the page rather than floating fixed — same as the design
              prototype's layered marketing-site flow. */}
          {withChrome && <Footer />}
        </ScrollView>
      ) : (
        // Non-scrolling pages (e.g. ones owning a FlatList) handle their
        // own Footer placement. We deliberately do NOT auto-append it here
        // because doing so under a FlatList would break the list's virt.
        <View className="flex-1">{children}</View>
      )}
    </SafeAreaView>
  );
};
