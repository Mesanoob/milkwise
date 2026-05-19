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
import { useTheme, type ThemePreference } from '../contexts/ThemeContext';

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
  const { tokens } = useTheme();

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
      className="bg-mw-bg-card border-b border-mw-border"
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
                backgroundColor: tokens.colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 17, lineHeight: 20 }}>🍼</Text>
            </View>
            <Text
              className="font-display-bold text-mw-text"
              style={{ fontSize: 20 }}
            >
              MilkWise <Text style={{ color: tokens.colors.accent }}>SG</Text>
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
                      backgroundColor: isActive ? tokens.colors.accentTint : 'transparent',
                    }}
                  >
                    <Text
                      className={isActive ? 'font-body-semibold' : 'font-body-medium'}
                      style={{
                        fontSize: 13.5,
                        color: isActive ? tokens.colors.accentText : tokens.colors.textMuted,
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

        {/* Theme toggle sits at the far right of the nav cluster on
            desktop. The 8px container gap spaces it from the search. */}
        {!isCompact && <ThemeToggle />}
      </View>

      {/* Mobile search — sits in a second row below the nav on phone
          widths because horizontally there's no room next to the logo.
          The theme toggle rides alongside it so dark mode is reachable
          without a hamburger menu. */}
      {isCompact && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 14,
            paddingBottom: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <SearchField
              value={filters.search}
              onChange={handleSearchChange}
              onClear={() => setSearch('')}
            />
          </View>
          <ThemeToggle />
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
}) => {
  const { tokens } = useTheme();
  return (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.bgPanel,
      ...style,
    }}
  >
    <Text style={{ color: tokens.colors.textMuted, fontSize: 14 }}>⌕</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Search brand or product…"
      placeholderTextColor={tokens.colors.textMuted}
      autoCorrect={false}
      autoCapitalize="none"
      accessibilityLabel="Search products"
      accessibilityHint="Filters the comparison by brand, name, or specialty"
      style={[
        { flex: 1, color: tokens.colors.text, fontSize: 13 },
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
        <Text style={{ color: tokens.colors.textMuted, fontSize: 14 }}>✕</Text>
      </Pressable>
    )}
  </View>
  );
};

/**
 * `ThemeToggle` — the sun / moon / auto control. Cycles
 * system → light → dark → system (CLAUDE.md §7b decision).
 *
 * This is intentionally styled from the LIVE v2 token set
 * (`useTheme().tokens`) rather than the v1 hex the rest of this header
 * still uses. It is net-new code (not a migration), so it may consume v2
 * directly — and doing so makes it the one on-screen proof that the
 * dark-mode mechanism actually flips before Phase 4 migrates the rest.
 */
const TOGGLE_GLYPH: Record<ThemePreference, string> = {
  system: '◐', // half-filled = "auto / follow OS"
  light: '☀',
  dark: '☾',
};
const NEXT_LABEL: Record<ThemePreference, string> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const ThemeToggle = () => {
  const { preference, scheme, tokens, cyclePreference } = useTheme();
  const { colors } = tokens;

  return (
    <Pressable
      onPress={cyclePreference}
      accessibilityRole="button"
      // Announce both the current mode and what a press will do — a
      // screen-reader user can't see the glyph change.
      accessibilityLabel={`Theme: ${preference}${
        preference === 'system' ? ` (currently ${scheme})` : ''
      }. Activate to switch to ${NEXT_LABEL[preference]}.`}
      // 36px visible box; hitSlop lifts the touch target to ≥44px (WCAG
      // 2.5.5) to match the other header controls.
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.bgPanel,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: colors.accent, fontSize: 16, lineHeight: 20 }}>
        {TOGGLE_GLYPH[preference]}
      </Text>
    </Pressable>
  );
};
