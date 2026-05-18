/**
 * BottomNav — mobile bottom navigation bar.
 *
 * Mirrors `NAV_LINKS` in `Header.tsx`. The two are kept separate (rather
 * than rendering one and hiding it with CSS) because they have different
 * affordances: the desktop nav is a horizontal list with hover states; the
 * mobile bar is a fixed-bottom tab strip with icons.
 *
 * Visibility is decided here using window width — this component returns
 * `null` on tablet and wider so it can be unconditionally mounted from
 * the root layout.
 */

import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Link, usePathname } from 'expo-router';

const TABLET_BREAKPOINT = 768;

// Emoji is a placeholder for icon font. Swap for `@expo/vector-icons` in
// Session 2 — emoji renders differently per platform and is a known
// accessibility weak spot.
const TABS = [
  { href: '/',           label: 'Compare', icon: '☷' },
  { href: '/calculator', label: 'Calc',    icon: '☰' },
  { href: '/most-sold',  label: 'Top',     icon: '★' },
  { href: '/about',      label: 'Info',    icon: 'i' },
] as const;

export const BottomNav = () => {
  const { width } = useWindowDimensions();
  const pathname  = usePathname();

  if (width >= TABLET_BREAKPOINT) return null;

  return (
    <View
      // `position: 'absolute'` on RN web becomes `fixed`-equivalent when
      // combined with bottom/left/right. On native we get the safe-area
      // padding from the parent SafeAreaView.
      style={{ position: 'fixed' as never, bottom: 0, left: 0, right: 0 }}
      className="bg-mw-bg-card border-t border-mw-border z-50 flex-row py-1.5"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Go to ${tab.label}`}
              accessibilityState={{ selected: isActive }}
              className="flex-1 items-center justify-center py-1.5"
            >
              <Text className={isActive ? 'text-mw-accent text-lg' : 'text-mw-text-muted text-lg'}>
                {tab.icon}
              </Text>
              <Text
                className={
                  'text-[10px] font-sans-semibold ' +
                  (isActive ? 'text-mw-accent' : 'text-mw-text-muted')
                }
              >
                {tab.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
};
