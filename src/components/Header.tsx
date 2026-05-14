/**
 * Header — the sticky top bar shown on every screen.
 *
 * Layout matches the design handoff `.nav` rule:
 *
 *   [🍼 MilkWise SG]  [Compare | Most Sold | Calc | About]   [🔎 Search…]
 *
 *   - Green 32×32 rounded-square holds the bottle emoji (echoes the splash
 *     icon and the favicon).
 *   - Wordmark is serif. "MilkWise" stays text-default; "SG" is brand-green
 *     so the locale reads as a visual anchor.
 *   - Nav links are hidden under 768px wide and replaced with a bottom tab
 *     bar (see `BottomNav`) — matches the original design's CSS.
 *   - Search input sits at the right of the nav row on desktop, pulled from
 *     the global ProductsContext so the filter state survives navigation.
 *     On non-Compare screens the input still works — typing routes the user
 *     back to "/" so the result is immediately visible.
 *
 * `usePathname()` highlights the currently active link without threading
 * the route name through props.
 */

import { Platform, View, Text, TextInput, Pressable, useWindowDimensions, type TextStyle } from 'react-native';
import { Link, usePathname, useRouter } from 'expo-router';
import { useProductsContext } from '../contexts/ProductsContext';

const TABLET_BREAKPOINT = 768;

const NAV_LINKS = [
  { href: '/',           label: 'Compare'    },
  { href: '/most-sold',  label: 'Most Sold'  },
  { href: '/calculator', label: 'Calculator' },
  { href: '/about',      label: 'About'      },
] as const;

export const Header = () => {
  const { width }   = useWindowDimensions();
  const pathname    = usePathname();
  const router      = useRouter();
  const isCompact   = width < TABLET_BREAKPOINT;
  const { filters, setSearch } = useProductsContext();

  // When the user types in the nav search while on a non-Compare screen,
  // route them back to "/" so they immediately see the filtered results.
  // We `router.replace` rather than `push` so the back button doesn't
  // walk through every keystroke.
  const handleSearchChange = (next: string) => {
    setSearch(next);
    if (next.length > 0 && pathname !== '/') {
      router.replace('/');
    }
  };

  return (
    <View
      // `position: 'sticky'` is web-only — RN ignores it on native. The
      // `as never` cast satisfies RN's type narrowing.
      style={{ position: 'sticky' as never, top: 0, zIndex: 60 }}
      className="bg-surface border-b border-border"
    >
      <View
        className="flex-row items-center"
        style={{
          maxWidth: 1280,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: 16,
          height: 58,
          // 8px gap (was 12) tightens the rhythm between logo, nav links,
          // and search so the items read as one cluster rather than a
          // logo + a floating search island.
          gap: 8,
        }}
      >
        {/* Brand mark */}
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="MilkWise SG home"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#1B5E3B',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 17, lineHeight: 20 }}>🍼</Text>
            </View>
            <Text
              className="font-serif text-text"
              style={{ fontSize: 20 }}
            >
              MilkWise <Text style={{ color: '#1B5E3B' }}>SG</Text>
            </Text>
          </Pressable>
        </Link>

        {/* Desktop nav links. Tighter `gap: 2` between individual links so
            the four items group as one block. The outer `gap: 8` from the
            nav-inner spaces this block from the logo and the search slot. */}
        {!isCompact && (
          <View className="flex-row" style={{ gap: 2 }}>
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityState={{ selected: isActive }}
                    // Nav row is 58 px tall; the link's visible padding is
                    // smaller for design density. hitSlop expands the touch
                    // target vertically to fill that header height.
                    hitSlop={{ top: 14, bottom: 14, left: 4, right: 4 }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: isActive ? '#EBF5EE' : 'transparent',
                    }}
                  >
                    <Text
                      className={isActive ? 'font-sans-semibold' : 'font-sans-medium'}
                      style={{
                        fontSize: 13.5,
                        color: isActive ? '#1B5E3B' : '#6B7280',
                      }}
                    >
                      {link.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        )}

        {/* Search slot — desktop only.
            We deliberately drop the design's `margin-left: auto` here. On
            wide viewports the auto-margin pushed the search to the far
            right of the 1280-wide nav-inner, leaving a big empty band
            between the nav links and the search field. The user reads
            that gap as "things floating apart". A compact `marginLeft: 16`
            sits the search 16px after the last nav link with no float,
            so logo + links + search read as one tight cluster.
            `flex: 1, maxWidth: 280` still lets the field grow on roomy
            viewports but caps it before it sprawls. */}
        {!isCompact && (
          <SearchField
            value={filters.search}
            onChange={handleSearchChange}
            onClear={() => setSearch('')}
            style={{ marginLeft: 16, flex: 1, maxWidth: 280 }}
          />
        )}
      </View>

      {/* Mobile search — sits in a second row below the nav on phone
          widths because horizontally there's no room next to the logo. */}
      {isCompact && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <SearchField
            value={filters.search}
            onChange={handleSearchChange}
            onClear={() => setSearch('')}
          />
        </View>
      )}
    </View>
  );
};

/**
 * `SearchField` — the rounded pill input used in both desktop and mobile
 * positions. Kept inside this file because it has no consumers elsewhere
 * (the generic `SearchBar` component is preserved for in-screen use).
 */
const SearchField = ({
  value,
  onChange,
  onClear,
  style,
}: {
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
  style?: object;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: '#E0D9CC',
      backgroundColor: '#F9F7F2',
      ...style,
    }}
  >
    <Text style={{ color: '#6B7280', fontSize: 14 }}>⌕</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Search brand or product…"
      placeholderTextColor="#6B7280"
      autoCorrect={false}
      autoCapitalize="none"
      accessibilityLabel="Search products"
      accessibilityHint="Filters the comparison by brand, name, or specialty"
      style={[
        { flex: 1, color: '#1A1A1A', fontSize: 13 },
        Platform.OS === 'web' ? ({ outlineWidth: 0 } as TextStyle) : null,
      ]}
    />
    {value.length > 0 && (
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="Clear search"
        hitSlop={6}
      >
        <Text style={{ color: '#6B7280', fontSize: 14 }}>✕</Text>
      </Pressable>
    )}
  </View>
);
