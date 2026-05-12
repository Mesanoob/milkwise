/**
 * Header — the sticky top bar shown on every screen.
 *
 * Layout:
 *   [ Logo "MilkWise SG" ]  ·  [ Compare | Calc | Top | About ]
 *
 * The nav links are hidden under 768px wide and replaced with a bottom
 * tab bar (see `BottomNav`) — that's the standard split between desktop
 * and mobile chrome on the reference design.
 *
 * `usePathname()` lets us highlight the currently active link without
 * threading the route name through props.
 */

import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { APP_NAME } from '../config/constants';

// 768px is the standard tablet/desktop breakpoint and matches the original
// CSS media query. Anything below shows the mobile chrome.
const TABLET_BREAKPOINT = 768;

// Single source of truth for the top-nav entries. Adding a screen later is
// one line here — keeps the JSX below short and declarative.
const NAV_LINKS = [
  { href: '/',           label: 'Compare'    },
  { href: '/calculator', label: 'Calculator' },
  { href: '/most-sold',  label: 'Most Sold'  },
  { href: '/about',      label: 'About'      },
] as const;

export const Header = () => {
  const { width }   = useWindowDimensions();
  const pathname    = usePathname();
  const isCompact   = width < TABLET_BREAKPOINT;

  return (
    <View
      // `sticky` does not exist in RN's flexbox but works on web. Setting
      // `position: 'sticky'` via inline style is the cross-platform escape
      // hatch — RN ignores unknown styles on native, web honours them.
      style={{ position: 'sticky' as never, top: 0, zIndex: 60 }}
      className="bg-surface border-b border-border"
    >
      <View className="max-w-[1280px] mx-auto px-4 h-[58px] flex-row items-center w-full">
        {/* Brand mark */}
        <Link href="/" asChild>
          <Pressable className="flex-row items-center gap-2">
            <Text className="text-xl font-serif text-green">{APP_NAME}</Text>
          </Pressable>
        </Link>

        {/* Desktop nav links — hidden on mobile, see BottomNav */}
        {!isCompact && (
          <View className="flex-row gap-1 ml-3">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} asChild>
                  <Pressable
                    className={
                      'px-3.5 py-1.5 rounded-lg ' +
                      (isActive
                        ? 'bg-green-light'
                        : 'hover:bg-surface2')
                    }
                  >
                    <Text
                      className={
                        'text-sm ' +
                        (isActive
                          ? 'text-green font-semibold'
                          : 'text-muted font-medium')
                      }
                    >
                      {link.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};
