/**
 * app/index.tsx — Home (`/`). Phase 3.
 *
 * Ported 1:1 from `MilkWiseFinalDesign/ui_kits/website/Home.jsx` and the
 * `.mw-hero*` / `.mw-stats*` / `.mw-features*` / `.mw-steps*` / `.mw-strip*`
 * rules in `styles.css`. Five stacked sections:
 *
 *   1. Hero        — mesh background, eyebrow w/ leading dash, 3-line
 *                    title, sub, two CTAs, scroll chevron.
 *   2. Stats band  — bg-panel, 4 mono-numeral stats, vertical dividers.
 *   3. Features    — Section (eyebrow + title) + 3 interactive cards.
 *   4. Steps       — Section bg-panel + 3 numbered steps with the
 *                    signature giant ghost numeral behind each.
 *   5. Disclaimer  — warn-bg full-bleed strip.
 *
 * Native fidelity notes (carry from the Phase-plan acceptance):
 *   • The mesh becomes a solid `cream-soft` wash on iOS/Android (see
 *     `HeroMesh.tsx`).
 *   • The scroll-chevron bounce animation is omitted — chevron is static.
 *   • Hero title uses a 2-step responsive size (72 ≥768px, 48 <768px)
 *     because RN can't compute `clamp(40px, 7vw, 84px)`.
 */

import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { Section } from '../src/components/Section';
import { HeroMesh } from '../src/components/HeroMesh';
import { useTheme } from '../src/contexts/ThemeContext';

const TABLET = 768;

// ── Reusable CTA buttons (only used inline on Home, so co-located) ────
const CTAButton = ({
  href,
  variant,
  children,
}: {
  href: string;
  variant: 'solid' | 'outline';
  children: string;
}) => {
  const { tokens } = useTheme();
  const solid = variant === 'solid';
  return (
    <Link href={href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={children}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 22,
          paddingVertical: 13,
          borderRadius: 999,
          backgroundColor: solid ? tokens.colors.accent : 'transparent',
          borderWidth: solid ? 0 : 1,
          borderColor: tokens.colors.accent,
        }}
      >
        <Text
          style={{
            fontFamily: tokens.fonts.bodySemibold,
            fontSize: 15,
            color: solid ? tokens.colors.textInverse : tokens.colors.accentText,
          }}
        >
          {children}
        </Text>
        <Text
          style={{
            fontFamily: tokens.fonts.body,
            fontSize: 15,
            color: solid ? tokens.colors.textInverse : tokens.colors.accentText,
          }}
        >
          →
        </Text>
      </Pressable>
    </Link>
  );
};

// ── Hero section ───────────────────────────────────────────────────────
const Hero = () => {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET;
  const titleSize = isWide ? 72 : 48;

  return (
    <View
      style={{
        position: 'relative',
        overflow: 'hidden',
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 120,
        // CSS uses min-height: calc(100vh - 64). On RN we just let content
        // size the hero — it naturally fills a desktop above-the-fold
        // because of the 80/120 padding + the type scale, and on phones a
        // shorter hero is preferable to wasted whitespace.
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
      }}
    >
      <HeroMesh />

      {/* Inner content — relative so it sits above the absolute mesh. */}
      <View
        style={{
          position: 'relative',
          maxWidth: tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
        }}
      >
        {/* `.mw-hero-eyebrow` — mono caps with a 24×1 leading dash. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 28,
          }}
        >
          <View
            style={{
              width: 24,
              height: 1,
              backgroundColor: tokens.colors.textMuted,
            }}
          />
          <Text
            style={{
              fontFamily: tokens.fonts.mono,
              fontSize: 12,
              letterSpacing: 1.68, // 0.14em × 12
              textTransform: 'uppercase',
              color: tokens.colors.textMuted,
            }}
          >
            Formula facts, clearly laid out
          </Text>
        </View>

        {/* `.mw-hero-title` */}
        <Text
          style={{
            fontFamily: tokens.fonts.displayBold,
            fontWeight: '700',
            fontSize: titleSize,
            letterSpacing: titleSize * -0.025,
            lineHeight: titleSize * 1.04,
            color: tokens.colors.text,
            marginBottom: 28,
            maxWidth: titleSize * 8, // ≈ 14ch at the given size
          }}
        >
          Every tin.{'\n'}Every ingredient.{'\n'}Every dollar.
        </Text>

        {/* `.mw-hero-sub` */}
        <Text
          style={{
            fontFamily: tokens.fonts.body,
            fontSize: 19,
            lineHeight: 19 * 1.55,
            color: tokens.colors.textMuted,
            maxWidth: 640,
            marginBottom: 40,
          }}
        >
          The most complete formula comparison resource for Singapore
          parents. Compare 76 products side-by-side. Calculate what you'll
          actually spend. No affiliates, no sponsored placements.
        </Text>

        {/* `.mw-hero-ctas` */}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <CTAButton href="/compare" variant="solid">
            Compare formulas
          </CTAButton>
          <CTAButton href="/calculator" variant="outline">
            Try the Calculator
          </CTAButton>
        </View>
      </View>

      {/* `.mw-scroll-chev` — static (bounce animation deferred). */}
      <View
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 32,
          marginLeft: -14, // visual centre (width 28)
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        pointerEvents="none"
      >
        <Text
          style={{
            color: tokens.colors.textMuted,
            fontSize: 14,
            lineHeight: 14,
          }}
        >
          ▾
        </Text>
      </View>
    </View>
  );
};

// ── Stats band ─────────────────────────────────────────────────────────
const STATS: { num: string; label: string }[] = [
  { num: '76', label: 'Formulas tracked' },
  { num: 'SGD', label: 'Prices updated regularly' },
  { num: '0', label: 'Sponsored listings' },
  { num: 'MY ↔ SG', label: 'Savings comparison built in' },
];

const StatsBand = () => {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET;
  return (
    <View style={{ backgroundColor: tokens.colors.bgPanel }}>
      <View
        style={{
          maxWidth: tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: 32,
          paddingVertical: 56,
          flexDirection: isWide ? 'row' : 'column',
          gap: isWide ? 32 : 28,
        }}
      >
        {STATS.map((s, i) => (
          <View
            key={s.label}
            style={{
              flex: isWide ? 1 : undefined,
              flexDirection: 'column',
              gap: 6,
              borderLeftWidth: isWide && i > 0 ? 1 : 0,
              borderLeftColor: tokens.colors.border,
              paddingLeft: isWide && i > 0 ? 24 : 0,
            }}
          >
            <Text
              style={{
                fontFamily: tokens.fonts.monoMedium,
                fontVariant: ['tabular-nums'],
                fontSize: 44,
                fontWeight: '500',
                color: tokens.colors.accentText,
                letterSpacing: 44 * -0.02,
                lineHeight: 44,
              }}
            >
              {s.num}
            </Text>
            <Text
              style={{
                fontFamily: tokens.fonts.bodySemibold,
                fontSize: 12,
                fontWeight: '600',
                letterSpacing: 1.2, // 0.1em × 12
                textTransform: 'uppercase',
                color: tokens.colors.textMuted,
                marginTop: 4,
              }}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Feature cards (Compare / Calculator / Nutrition Guide) ────────────
const FEATURES: { icon: string; title: string; desc: string; href: string; cta: string }[] = [
  {
    icon: '🔍',
    title: 'Compare',
    desc: 'Side-by-side ingredient and nutrition breakdown across any two or three formulas. Best-value cell highlighted, no marketing copy in sight.',
    href: '/compare',
    cta: 'Open comparison →',
  },
  {
    icon: '🧮',
    title: 'Calculate',
    desc: "Monthly, yearly, and total spend with savings comparison vs. Malaysia. Adjust feeds, scoop size, and feeding mode in real time.",
    href: '/calculator',
    cta: 'Open calculator →',
  },
  {
    icon: '📖',
    title: 'Nutrition Guide',
    desc: 'WHO and HPB-backed age-appropriate intake guidelines. Every figure carries a visible source. Not medical advice.',
    href: '/nutrition',
    cta: 'Read the guide →',
  },
];

const FeatureCard = ({ feature }: { feature: (typeof FEATURES)[number] }) => {
  const { tokens } = useTheme();
  return (
    <Link href={feature.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={feature.title}
        style={{
          flex: 1,
          padding: 36,
          paddingHorizontal: 32,
          gap: 18,
          minHeight: 280,
          backgroundColor: tokens.colors.bgCard,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radius.card,
          ...tokens.shadow.s1,
        }}
      >
        {/* Icon tile */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: tokens.colors.accentTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22, color: tokens.colors.accent }}>
            {feature.icon}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: tokens.fonts.displaySemibold,
            fontSize: 26,
            fontWeight: '500',
            letterSpacing: 26 * -0.015,
            color: tokens.colors.text,
          }}
        >
          {feature.title}
        </Text>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 15 * 1.6,
            color: tokens.colors.textMuted,
            flex: 1,
          }}
        >
          {feature.desc}
        </Text>
        <Text
          style={{
            color: tokens.colors.accentText,
            fontSize: 13,
            fontFamily: tokens.fonts.bodyMedium,
            fontWeight: '500',
          }}
        >
          {feature.cta}
        </Text>
      </Pressable>
    </Link>
  );
};

const Features = () => {
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET;
  return (
    <Section eyebrow="What you can do" title="Three calm tools, one decision.">
      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          gap: 24,
          marginTop: 48,
        }}
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.href} feature={f} />
        ))}
      </View>
    </Section>
  );
};

// ── How-it-works steps ─────────────────────────────────────────────────
const STEPS: { n: string; title: string; desc: string }[] = [
  {
    n: '01',
    title: 'Search or filter',
    desc: 'Narrow 76 formulas by stage, milk source, special diet, brand, and tin size.',
  },
  {
    n: '02',
    title: 'Compare side-by-side',
    desc: 'Up to three products. Price per gram, price per scoop, ingredient flags.',
  },
  {
    n: '03',
    title: 'Calculate your real cost',
    desc: "Plug in your baby's feeding pattern. See monthly, yearly, and Malaysia savings.",
  },
];

const HowItWorks = () => {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET;
  return (
    <Section
      eyebrow="How it works"
      title="From overwhelmed to informed in three steps."
      bg
    >
      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          gap: 32,
          marginTop: 56,
        }}
      >
        {STEPS.map((s) => (
          <View
            key={s.n}
            style={{
              flex: isWide ? 1 : undefined,
              position: 'relative',
              paddingTop: 32,
            }}
          >
            {/* Giant ghost numeral behind the content — `.mw-step-num`. */}
            <Text
              style={{
                position: 'absolute',
                top: -10,
                left: -4,
                fontFamily: tokens.fonts.displayBold,
                fontSize: 112,
                fontWeight: '400',
                color: tokens.colors.bgPanel,
                letterSpacing: 112 * -0.04,
                lineHeight: 112,
              }}
              // Decorative — screen reader reads the title.
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {s.n}
            </Text>
            {/* `.mw-step-content` — z above the numeral via render order. */}
            <View style={{ paddingTop: 56 }}>
              <Text
                style={{
                  fontFamily: tokens.fonts.displaySemibold,
                  fontSize: 22,
                  fontWeight: '500',
                  letterSpacing: 22 * -0.01,
                  marginBottom: 8,
                  color: tokens.colors.text,
                }}
              >
                {s.title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 14 * 1.55,
                  color: tokens.colors.textMuted,
                  maxWidth: 32 * 8, // ≈ 32ch
                }}
              >
                {s.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
};

// ── Disclaimer strip ──────────────────────────────────────────────────
const DisclaimerStrip = () => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        backgroundColor: tokens.colors.warnBg,
        paddingVertical: 40,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          maxWidth: tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
        }}
      >
        <Text
          style={{
            color: tokens.colors.warnText,
            fontSize: 14,
            lineHeight: 14 * 1.6,
          }}
        >
          <Text style={{ fontFamily: tokens.fonts.bodySemibold }}>
            MilkWise SG is an independent, non-sponsored resource.
          </Text>
          {' '}We are not affiliated with any formula brand. This site is not
          medical advice. All prices are indicative — verify with retailers
          before purchase.{' '}
          <Link href="/about" asChild>
            <Text
              style={{
                color: tokens.colors.warnText,
                fontFamily: tokens.fonts.bodySemibold,
                textDecorationLine: 'underline',
              }}
              accessibilityRole="link"
            >
              Read full Terms & Conditions →
            </Text>
          </Link>
        </Text>
      </View>
    </View>
  );
};

// ── Page ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  return (
    <Screen>
      <Hero />
      <StatsBand />
      <Features />
      <HowItWorks />
      <DisclaimerStrip />
    </Screen>
  );
}
