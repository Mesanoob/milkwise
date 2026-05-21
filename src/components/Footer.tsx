/**
 * Footer — ported from `MilkWiseFinalDesign/ui_kits/website/Chrome.jsx`
 * and `styles.css` (`.mw-footer*`). Renders below every page (Screen mounts
 * it). 4-column grid on desktop (1.4fr / 1fr / 1fr / 1fr, 48px gap), single
 * column on phones.
 *
 * Design metrics (verbatim):
 *   • Surface : `bg-inverse` (#25241F warm near-black) — the only dark band
 *               in the whole app outside dark mode itself.
 *   • Padding : 80px top / 32px sides / 40px bottom.
 *   • Bottom strip: 56px above, 24px above the 1px rgba(255,255,255,0.08)
 *               rule, JetBrains-Mono 11px caps.
 *
 * Links route via expo-router. The design's "Data Sources" column is
 * static text (no targets) — the prototype renders them as `<a>` for
 * affordance only. We keep that intent with plain `<Text>` so screen
 * readers don't promise navigation that doesn't exist.
 */

import { Platform, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

const LogoBottle = ({ size = 28 }: { size?: number }) => (
  <Text
    accessibilityRole="image"
    accessibilityLabel="MilkWise"
    style={{
      fontSize: size,
      lineHeight: size,
      // Force the emoji-only font stack so the OS colour glyph wins over
      // Inter's text-emoji fallback (mirrors atoms.jsx LogoMark).
      fontFamily:
        Platform.OS === 'web'
          ? '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
          : undefined,
    }}
  >
    🍼
  </Text>
);

type FooterCol = {
  /** Section heading (small-caps eyebrow). `null` = brand block (no heading). */
  heading: string | null;
  items: { label: string; href?: string }[];
  /** Brand-tagline column gets the bottle + wordmark + tag instead of a list. */
  brand?: boolean;
};

const COLUMNS: FooterCol[] = [
  {
    heading: null,
    brand: true,
    items: [
      {
        label:
          'Formula facts, clearly laid out. An independent, non-sponsored resource for Singapore parents.',
      },
    ],
  },
  {
    heading: 'Tools',
    items: [
      { label: 'Compare', href: '/compare' },
      { label: 'Calculator', href: '/calculator' },
      { label: 'Nutrition Guide', href: '/nutrition' },
      // Deviation from the design (which has 3 tools): we keep Most Sold
      // per the user's "Follow design + keep Most Sold" decision in the
      // Phase-plan AskUserQuestion. The link slots in naturally here.
      { label: 'Most Sold', href: '/most-sold' },
    ],
  },
  {
    heading: 'Data Sources',
    items: [
      { label: 'FairPrice · Guardian' },
      { label: 'Watsons · Lazada' },
      { label: 'Shopee · RedMart' },
      { label: 'WHO · HPB Singapore' },
    ],
  },
  {
    heading: 'About',
    items: [
      { label: 'Our story', href: '/about' },
      { label: 'Methodology', href: '/about' },
      { label: 'Terms & Conditions', href: '/about' },
      { label: 'Contact', href: '/about' },
    ],
  },
];

export const Footer = () => {
  const { tokens } = useTheme();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  return (
    <View
      style={{
        backgroundColor: tokens.colors.bgInverse,
        paddingTop: 80,
        paddingHorizontal: 32,
        paddingBottom: 40,
      }}
    >
      <View
        // Grid on web (the design's 1.4fr / 1fr / 1fr / 1fr); flex column
        // on native so the same JSX produces a stacked layout on phones.
        style={
          isWeb
            ? ({
                maxWidth: tokens.layout.maxContent,
                width: '100%',
                marginHorizontal: 'auto',
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
                gap: 48,
              } as never)
            : {
                maxWidth: tokens.layout.maxContent,
                width: '100%',
                marginHorizontal: 'auto',
                flexDirection: 'column',
                gap: 32,
              }
        }
      >
        {COLUMNS.map((col, ci) => (
          <View key={ci}>
            {col.brand ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <LogoBottle size={28} />
                  <Text
                    style={{
                      fontFamily: tokens.fonts.displaySemibold,
                      fontSize: 26,
                      letterSpacing: -0.52, // -0.02em × 26
                      color: tokens.colors.textInverse,
                    }}
                  >
                    MilkWise
                  </Text>
                  <Text
                    style={{
                      paddingVertical: 2,
                      paddingHorizontal: 8,
                      borderRadius: 24,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.12)',
                      fontFamily: tokens.fonts.bodySemibold,
                      fontSize: 10,
                      letterSpacing: 1.2, // 0.12em × 10
                      color: 'rgba(247,243,234,0.7)',
                    }}
                  >
                    SG
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 14 * 1.6,
                    color: tokens.colors.textFaint,
                    maxWidth: 320, // ≈ 32ch
                    marginTop: 12,
                  }}
                >
                  {col.items[0].label}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: tokens.fonts.bodySemibold,
                    fontSize: 11,
                    letterSpacing: 1.32, // 0.12em × 11
                    textTransform: 'uppercase',
                    color: tokens.colors.textFaint,
                    marginBottom: 16,
                  }}
                >
                  {col.heading}
                </Text>
                <View style={{ gap: 10 }}>
                  {col.items.map((item, ii) => {
                    const tone = {
                      fontSize: 14,
                      color: tokens.colors.textInverse,
                      opacity: 0.85,
                    } as const;
                    if (item.href) {
                      const href = item.href;
                      return (
                        <Pressable
                          key={ii}
                          accessibilityRole="link"
                          accessibilityLabel={item.label}
                          onPress={() => router.push(href as never)}
                          hitSlop={6}
                        >
                          <Text style={tone}>{item.label}</Text>
                        </Pressable>
                      );
                    }
                    return (
                      <Text key={ii} style={tone}>
                        {item.label}
                      </Text>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        ))}
      </View>

      {/* Bottom strip */}
      <View
        style={{
          maxWidth: tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
          marginTop: 56,
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <Text
          style={{
            fontFamily: tokens.fonts.mono,
            fontSize: 11,
            letterSpacing: 0.44, // 0.04em × 11
            color: tokens.colors.textFaint,
            textTransform: 'uppercase',
          }}
        >
          © 2026 MILKWISE SG · BUILT FOR SINGAPORE PARENTS · NOT MEDICAL ADVICE
        </Text>
      </View>
    </View>
  );
};
