/**
 * NavBar — the design's top chrome, ported from `Chrome.jsx` and the
 * `.mw-nav*` / `.mw-mobile-*` rules in `styles.css`.
 *
 * Layout (desktop ≥768px):
 *   🍼 MilkWise [SG]   Compare · Calculator · Most Sold · Nutrition Guide ·
 *                      For New Parents · About                   🇸🇬 SGD ☾
 *
 * Layout (mobile <768px):
 *   🍼 MilkWise [SG]                                                    ☰
 *   (☰ opens a full-screen menu with the same 6 links + theme + SGD)
 *
 * Deliberate choices documented in the Phase-2 plan:
 *   • 6 desktop links (the design ships 5; we keep `Most Sold` per the
 *     user's decision in Phase-0 AskUserQuestion).
 *   • The search field that lived here previously is GONE — the design
 *     puts search inside the Compare toolbar. The moved `compare.tsx`
 *     mounts a `<SearchBar>` in its body so search functionality survives
 *     the interim until Phase 4 puts it in its final position.
 *   • Web gets `position: sticky` + `backdrop-filter: blur(14px)
 *     saturate(140%)` for the design's signature translucent-glass nav;
 *     native falls back to opaque `bgCard` (Phase-plan: "close not exact"
 *     on native).
 *   • The file is still named `Header.tsx` and still exports `Header` for
 *     back-compat (Screen.tsx imports `{ Header }`); `NavBar` is also
 *     exported under the design's terminology for new call sites.
 *
 * Active-state and route map:
 *   The brand wordmark routes to `/` (the new Home — Phase 3 fills the
 *   page; Phase 2 only ships the route). Compare moves to `/compare` here
 *   so the design's `Home` can sit at `/`.
 */

import { useState } from 'react';
import {
  Platform,
  View,
  Text,
  Pressable,
  Modal,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Link, usePathname, useRouter } from 'expo-router';
import { useTheme, type ThemePreference } from '../contexts/ThemeContext';

const TABLET_BREAKPOINT = 768;

// 6 links — Compare lives at `/compare` now (Home took `/`).
const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/compare', label: 'Compare' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/most-sold', label: 'Most Sold' },
  { href: '/nutrition', label: 'Nutrition Guide' },
  { href: '/parents', label: 'For New Parents' },
  { href: '/about', label: 'About' },
];

// ── Wordmark (logo + "MilkWise" + SG pill) ─────────────────────────────
const Wordmark = () => {
  const { tokens } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text
        accessibilityRole="image"
        accessibilityLabel="MilkWise"
        style={{
          fontSize: 28,
          lineHeight: 28,
          // Force OS colour-emoji font on web (Inter's text-emoji fallback
          // is monochrome and visually wrong here — mirrors atoms.jsx).
          fontFamily:
            Platform.OS === 'web'
              ? '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
              : undefined,
          // Slight optical lift (atoms.jsx `transform: translateY(-1px)`).
          marginTop: -1,
        }}
      >
        🍼
      </Text>
      <Text
        style={{
          fontFamily: tokens.fonts.displaySemibold,
          fontWeight: '600',
          fontSize: 20,
          letterSpacing: -0.4, // -0.02em × 20
          color: tokens.colors.text,
        }}
      >
        MilkWise
      </Text>
      {/* `.mw-sg-pill` */}
      <Text
        style={{
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderRadius: 24,
          backgroundColor: tokens.colors.bgPanel,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          fontFamily: tokens.fonts.bodySemibold,
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1.2, // 0.12em × 10
          color: tokens.colors.textMuted,
          lineHeight: 15,
        }}
      >
        SG
      </Text>
    </View>
  );
};

// ── Country pill (SG flag emoji + "SGD") ───────────────────────────────
const RegionPill = () => {
  const { tokens } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text
        style={{
          fontSize: 14,
          fontFamily:
            Platform.OS === 'web'
              ? '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
              : undefined,
        }}
        accessibilityRole="image"
        accessibilityLabel="Singapore"
      >
        🇸🇬
      </Text>
      <Text
        style={{
          fontFamily: tokens.fonts.mono,
          fontSize: 11,
          letterSpacing: 0.55, // 0.05em × 11
          color: tokens.colors.textMuted,
        }}
      >
        SGD
      </Text>
    </View>
  );
};

// ── Theme toggle ────────────────────────────────────────────────────────
// (System mode currently disabled per ThemeContext investigation —
// preference is binary light↔dark at runtime; the unreachable 'system'
// glyph is kept so the 3-way cycle can be restored as a pure revert.)
const TOGGLE_GLYPH: Record<ThemePreference, string> = {
  system: '◐',
  light: '☀',
  dark: '☾',
};
const NEXT_LABEL: Record<ThemePreference, string> = {
  system: 'light',
  light: 'dark',
  dark: 'light',
};

const ThemeToggle = () => {
  const { preference, scheme, tokens, cyclePreference } = useTheme();
  const { colors } = tokens;
  return (
    <Pressable
      onPress={cyclePreference}
      accessibilityRole="button"
      accessibilityLabel={`Theme: ${preference}${
        preference === 'system' ? ` (currently ${scheme})` : ''
      }. Activate to switch to ${NEXT_LABEL[preference]}.`}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 18 }}>
        {TOGGLE_GLYPH[preference]}
      </Text>
    </Pressable>
  );
};

// ── Desktop link ────────────────────────────────────────────────────────
const NavLink = ({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) => {
  const { tokens } = useTheme();
  return (
    <Link href={href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
        style={{
          paddingVertical: 4,
          position: 'relative',
        }}
      >
        <Text
          style={{
            fontFamily: tokens.fonts.body,
            fontSize: 14,
            color: active ? tokens.colors.accentText : tokens.colors.text,
            // Mirror `.mw-nav-links a` transition. RN ignores `transition`;
            // colour swap is one-frame which matches the design's intent.
          }}
        >
          {label}
        </Text>
        {/* Active underline — `.mw-nav-links a.active::after` */}
        {active && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -6,
              height: 2,
              borderRadius: 1,
              backgroundColor: tokens.colors.accentText,
            }}
          />
        )}
      </Pressable>
    </Link>
  );
};

// ── Mobile fullscreen menu ─────────────────────────────────────────────
const MobileMenu = ({
  open,
  onClose,
  active,
}: {
  open: boolean;
  onClose: () => void;
  active: string;
}) => {
  const { tokens } = useTheme();
  const router = useRouter();
  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href as never);
  };

  // Mobile menu includes Home as the first item (per the design's prototype
  // mobile menu) plus all 6 desktop links.
  const mobileItems = [{ href: '/', label: 'Home' }, ...NAV_LINKS];

  const content = (
    <View
      // `position: fixed inset: 0` — web only via `as never` cast (RN-Web
      // passes the CSS through). Native renders inside a <Modal> instead
      // (see the Platform branch below).
      style={
        Platform.OS === 'web'
          ? ({
              position: 'fixed' as never,
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: 70,
              backgroundColor: tokens.colors.bg,
              padding: 24,
              paddingHorizontal: 28,
              paddingBottom: 32,
              display: 'flex',
              flexDirection: 'column',
            } as unknown as ViewStyle)
          : {
              flex: 1,
              backgroundColor: tokens.colors.bg,
              padding: 24,
              paddingHorizontal: 28,
              paddingBottom: 32,
            }
      }
    >
      {/* Close button — `.mw-mobile-close` */}
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          hitSlop={8}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: tokens.colors.text, fontSize: 22 }}>✕</Text>
        </Pressable>
      </View>

      {/* Links — `.mw-mobile-links` */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {mobileItems.map((item) => {
          const isActive = active === item.href;
          return (
            <Pressable
              key={item.href}
              accessibilityRole="link"
              accessibilityState={{ selected: isActive }}
              onPress={() => go(item.href)}
              style={{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: tokens.colors.divider,
              }}
            >
              <Text
                style={{
                  fontFamily: tokens.fonts.displaySemibold,
                  fontSize: 32,
                  fontWeight: '600',
                  letterSpacing: -0.704, // -0.022em × 32
                  color: isActive
                    ? tokens.colors.accentText
                    : tokens.colors.text,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Footer — `.mw-mobile-footer` */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: tokens.colors.border,
        }}
      >
        <RegionPill />
        <ThemeToggle />
      </View>
    </View>
  );

  // Native gets a real Modal (handles back-button + status bar correctly);
  // web uses the fixed overlay above (rendered straight into the tree).
  if (Platform.OS === 'web') return content;
  return (
    <Modal
      visible={open}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {content}
    </Modal>
  );
};

// ── NavBar ──────────────────────────────────────────────────────────────
const NavBarImpl = () => {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const { tokens } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCompact = width < TABLET_BREAKPOINT;
  const isWeb = Platform.OS === 'web';

  // Translucent-glass nav on web (`backdrop-filter: blur(14px) saturate
  // (140%)` matches `.mw-nav`). RN-Web passes unknown CSS through, but TS
  // narrows `style` strictly — hence the `as never` for `position` and the
  // unknown→ViewStyle cast at the bottom.
  const webStickyStyle: Record<string, unknown> = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(14px) saturate(140%)',
    WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  };

  return (
    <>
      <View
        style={[
          {
            height: tokens.layout.navH, // 64
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 32,
            // Web uses `--mw-nav-bg` (translucent) so the blur shows through;
            // native is solid bgCard since there's no backdrop-filter there.
            backgroundColor: isWeb
              ? (tokens.colors as { navBg?: string }).navBg ?? tokens.colors.bgCard
              : tokens.colors.bgCard,
            borderBottomWidth: 1,
            borderBottomColor: tokens.colors.border,
          },
          (isWeb ? webStickyStyle : {}) as unknown as ViewStyle,
        ]}
      >
        <View
          style={{
            width: '100%',
            maxWidth: tokens.layout.maxContent,
            marginHorizontal: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          {/* Brand → Home */}
          <Link href={'/' as never} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="MilkWise SG home"
              style={{ flexShrink: 0 }}
            >
              <Wordmark />
            </Pressable>
          </Link>

          {/* Desktop link strip */}
          {!isCompact && (
            <View style={{ flexDirection: 'row', gap: 28 }}>
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  label={l.label}
                  active={pathname === l.href}
                />
              ))}
            </View>
          )}

          {/* Right cluster */}
          {!isCompact ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <RegionPill />
              <ThemeToggle />
            </View>
          ) : (
            // Mobile: hamburger only — the menu carries SG/SGD + toggle.
            <Pressable
              onPress={() => setMobileOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              hitSlop={8}
              style={{ padding: 8 }}
            >
              <Text style={{ fontSize: 22, color: tokens.colors.text } as TextStyle}>
                ☰
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        active={pathname}
      />
    </>
  );
};

// Export under both names: `Header` for the existing Screen import path
// (no rename churn), `NavBar` for new call sites that match the design's
// vocabulary.
export const NavBar = NavBarImpl;
export const Header = NavBarImpl;
