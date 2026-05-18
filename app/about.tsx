/**
 * app/about.tsx — about page.
 *
 * Layout matches the design handoff (`about.html`):
 *   1. Full-bleed green hero — circular icon, serif headline with italic
 *      emphasis, white tagline, "Start Comparing" pill
 *   2. Mission pillars — 4-card grid (Transparency, Cross-Border, Nutrition, Rankings)
 *   3. How We Compare — 5 numbered steps with circular green badges
 *   4. Important Notice — amber-light paediatrician callout
 *   5. FAQ — accordion of 8 questions
 *   6. Team / Contact — copy, CTA buttons, 4-stat row
 *   7. Footer — green strip with copyright + nav
 *
 * The page uses a single shared `Animated.Value` for entrance fade-up
 * across all blocks — cheaper than per-block animations and produces a
 * synchronised entry rather than a popcorn cascade.
 */

import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { APP_NAME } from '../src/config/constants';
import { useTheme } from '../src/contexts/ThemeContext';

export default function AboutScreen() {
  const { tokens } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const animatedStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  return (
    <Screen>
      {/* ── HERO — full-bleed green ────────────────────────────────────── */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: tokens.colors.accent,
            paddingHorizontal: 24,
            paddingTop: 56,
            paddingBottom: 56,
            alignItems: 'center',
          }}
        >
          <View style={{ maxWidth: 640, width: '100%', alignItems: 'center' }}>
            {/* Glass-effect icon container — translucent white wash over the
                accent band; theme-independent (sits on a non-flipping surface
                relative to its parent, holds an emoji that renders anyway). */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 32 }}>🍼</Text>
            </View>

            {/* Two-line headline — second line italic-emphasized.
                React Native's `fontStyle: 'italic'` only works on fonts that
                have an italic face shipped; DM Serif Display has one in the
                @expo-google-fonts package but we load the regular variant.
                We fake the italic emphasis by using a different colour tint —
                the design uses `<em>` which is italic but here we lean on
                the off-white tint to read as visual emphasis. */}
            <Text
              className="font-serif text-mw-text-inverse"
              style={{
                fontSize: 38,
                lineHeight: 42,
                textAlign: 'center',
              }}
            >
              Helping Singapore Mums
            </Text>
            <Text
              className="font-serif"
              style={{
                fontSize: 38,
                lineHeight: 42,
                textAlign: 'center',
                color: tokens.colors.textInverse,
                fontStyle: 'italic',
              }}
            >
              Choose with Confidence
            </Text>

            <Text
              className="font-sans"
              style={{
                fontSize: 15,
                color: tokens.colors.textInverse,
                marginTop: 20,
                lineHeight: 26,
                maxWidth: 520,
                textAlign: 'center',
              }}
            >
              {APP_NAME} is a free, independent comparison tool built by
              parents, for parents. We track prices, nutrients and rankings
              so you don't have to.
            </Text>

            <Link href="/" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Open compare screen"
                style={{
                  marginTop: 28,
                  paddingHorizontal: 28,
                  paddingVertical: 12,
                  backgroundColor: tokens.colors.bgCard,
                  borderRadius: 999,
                }}
              >
                <Text
                  className="font-sans-bold"
                  style={{ color: tokens.colors.accent, fontSize: 14 }}
                >
                  Start Comparing →
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </Animated.View>

      {/* ── MISSION PILLARS ──────────────────────────────────────────── */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: tokens.colors.bgCard,
            paddingHorizontal: 24,
            paddingVertical: 56,
            alignItems: 'center',
          }}
        >
          <View style={{ maxWidth: 860, width: '100%' }}>
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <Text
                className="font-serif text-mw-text"
                style={{ fontSize: 30, textAlign: 'center' }}
              >
                Why We Built This
              </Text>
              <Text
                className="font-sans"
                style={{
                  fontSize: 14,
                  color: tokens.colors.textMuted,
                  marginTop: 10,
                  maxWidth: 500,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                Formula milk is one of the most important — and confusing —
                purchases a new parent makes. We simplify it.
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              <Pillar
                icon="🔍"
                title="Full Transparency"
                body="We show you the real cost — price per gram, price per scoop — not just the headline tin price. No hidden mark-ups, no sponsored rankings."
              />
              <Pillar
                icon="🇲🇾"
                title="Cross-Border Savings"
                body="Singapore formula can cost up to 40% more than Malaysia. We flag every product's estimated cross-Causeway saving so you can plan smarter shopping trips."
              />
              <Pillar
                icon="🧬"
                title="Nutrition at a Glance"
                body="DHA, protein, sugar, and more — side by side, in plain language. Compare up to 5 products at once on desktop, 2 on mobile."
              />
              <Pillar
                icon="📊"
                title="Real Rankings"
                body="Sales data from major Singapore retailers — FairPrice, Guardian, Watsons, Shopee, Lazada — to surface what real parents are actually buying."
              />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── HOW WE COMPARE — numbered steps ─────────────────────────── */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: tokens.colors.bg,
            paddingHorizontal: 24,
            paddingVertical: 56,
            alignItems: 'center',
          }}
        >
          <View style={{ maxWidth: 860, width: '100%' }}>
            <Text
              className="font-serif text-mw-text"
              style={{ fontSize: 30, marginBottom: 10 }}
            >
              How We Compare Products
            </Text>
            <Text
              className="font-sans"
              style={{
                fontSize: 14,
                color: tokens.colors.textMuted,
                marginBottom: 36,
                lineHeight: 22,
              }}
            >
              Our methodology is straightforward and consistent across all 60+ products.
            </Text>

            <View style={{ gap: 16 }}>
              <Step
                number={1}
                title="Price Collection"
                body="We collect retail prices from FairPrice, Cold Storage, Guardian, Watsons, Shopee and Lazada. Where prices differ, we use the mid-market price. Prices are updated monthly."
              />
              <Step
                number={2}
                title="Cost Normalisation"
                body="We calculate $ per gram and $ per scoop for every product so you can compare a 400g tin against an 800g tin on equal terms. This is the most honest price comparison metric."
              />
              <Step
                number={3}
                title="Nutritional Data"
                body="Protein, DHA, sugar and other key nutrients are taken directly from product packaging and official brand websites. We do not modify or interpret nutritional claims — we report what is on the label."
              />
              <Step
                number={4}
                title="Malaysia Benchmark"
                body="Malaysia retail prices are sourced from Shopee MY, Lazada MY, and Guardian MY. These are estimates — actual prices vary by seller and promotion. Always verify before making a trip."
              />
              <Step
                number={5}
                title="Sales Rankings"
                body="Rankings are based on aggregated sales volume data from major retailers. They reflect overall popularity — not our recommendation. A highly ranked formula may not be right for every baby."
              />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── IMPORTANT NOTICE — amber paediatrician callout ──────────── */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            // Medical-notice callout → the v2 warn pair (amber has no v2
            // token; warn is its semantic successor and holds AA contrast).
            backgroundColor: tokens.colors.warnBg,
            paddingHorizontal: 24,
            paddingVertical: 40,
            alignItems: 'center',
          }}
        >
          <View style={{ maxWidth: 860, width: '100%' }}>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 28 }}>⚕️</Text>
              <View style={{ flex: 1 }}>
                <Text
                  className="font-serif"
                  style={{ fontSize: 18, color: tokens.colors.warnText, marginBottom: 8 }}
                >
                  Always Consult Your Paediatrician
                </Text>
                <Text
                  className="font-sans"
                  style={{
                    fontSize: 13.5,
                    color: tokens.colors.warnText,
                    lineHeight: 24,
                  }}
                >
                  <Text>{APP_NAME} is a </Text>
                  <Text className="font-sans-bold">price and information tool</Text>
                  <Text>, not a medical guide. Every baby is different. Specialised formulas (hypoallergenic, anti-reflux, soy, premature) should only be used on medical advice. If your baby has feeding difficulties, colic, allergies or poor weight gain — please consult a paediatrician or lactation consultant before switching formula.</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: tokens.colors.bgCard,
            paddingHorizontal: 24,
            paddingVertical: 56,
            alignItems: 'center',
          }}
        >
          <View style={{ maxWidth: 860, width: '100%' }}>
            <Text
              className="font-serif text-mw-text"
              style={{ fontSize: 30, marginBottom: 10 }}
            >
              Frequently Asked Questions
            </Text>
            <Text
              className="font-sans"
              style={{
                fontSize: 14,
                color: tokens.colors.textMuted,
                marginBottom: 32,
                lineHeight: 22,
              }}
            >
              Questions we hear from Singapore mothers every day.
            </Text>

            <View style={{ gap: 8 }}>
              {FAQS.map((faq, idx) => (
                <FaqRow key={idx} q={faq.q} a={faq.a} />
              ))}
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── TEAM / CONTACT ───────────────────────────────────────────── */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: tokens.colors.bg,
            paddingHorizontal: 24,
            paddingVertical: 56,
            alignItems: 'center',
          }}
        >
          <View style={{ maxWidth: 860, width: '100%', alignItems: 'center' }}>
            <Text
              className="font-serif text-mw-text"
              style={{ fontSize: 30, marginBottom: 12, textAlign: 'center' }}
            >
              Built by Parents, for Parents
            </Text>
            <Text
              className="font-sans"
              style={{
                fontSize: 14,
                color: tokens.colors.textMuted,
                maxWidth: 540,
                textAlign: 'center',
                lineHeight: 26,
                marginBottom: 36,
              }}
            >
              {APP_NAME} was started by a group of Singapore parents tired
              of spending hours Googling formula prices. We update the data
              monthly and are always looking to improve.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                gap: 16,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Link href="/" asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open compare screen"
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    backgroundColor: tokens.colors.accent,
                    borderRadius: 999,
                  }}
                >
                  <Text className="font-sans-semibold" style={{ color: tokens.colors.textInverse, fontSize: 14 }}>
                    🍼 Start Comparing
                  </Text>
                </Pressable>
              </Link>
              {/* Note: mailto: links work on web but no-op on native without
                  Linking.openURL. Wrap in a Pressable that uses RN Linking
                  when we ship native — for now web is the primary surface. */}
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Contact us via email"
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: tokens.colors.bgCard,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: tokens.colors.border,
                }}
              >
                <Text className="font-sans-semibold" style={{ color: tokens.colors.text, fontSize: 14 }}>
                  ✉️ hello@milkwisesg.com
                </Text>
              </Pressable>
            </View>

            {/* Stats row — 4 cells, divided by vertical borders. Equal-flex
                children + borderRightWidth on all but the last gives the
                design's segmented look without measuring widths manually. */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 48,
                backgroundColor: tokens.colors.bgCard,
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: tokens.colors.border,
                width: '100%',
                maxWidth: 720,
              }}
            >
              <StatCell value="61" label="Products tracked" divider />
              <StatCell value="6"  label="Metrics compared" divider />
              <StatCell value="5"  label="Origins covered"  divider />
              <StatCell value="Free" label="Always free to use" />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: tokens.colors.accent,
            paddingHorizontal: 24,
            paddingVertical: 28,
            alignItems: 'center',
          }}
        >
          <Text
            className="font-serif"
            style={{ fontSize: 18, color: tokens.colors.textInverse, marginBottom: 6 }}
          >
            {APP_NAME}
          </Text>
          <Text
            className="font-sans"
            style={{
              fontSize: 12,
              color: tokens.colors.textInverse,
              textAlign: 'center',
              maxWidth: 540,
            }}
          >
            © 2026 {APP_NAME} · Independent price comparison · Not affiliated
            with any formula brand · Data: April 2026
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
            <Link href="/" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="Compare">
                <Text className="font-sans" style={{ fontSize: 12.5, color: tokens.colors.textInverse }}>
                  Compare
                </Text>
              </Pressable>
            </Link>
            <Link href="/most-sold" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="Most Sold">
                <Text className="font-sans" style={{ fontSize: 12.5, color: tokens.colors.textInverse }}>
                  Most Sold
                </Text>
              </Pressable>
            </Link>
            <Link href="/about" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="About">
                <Text className="font-sans" style={{ fontSize: 12.5, color: tokens.colors.textInverse }}>
                  About
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </Animated.View>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Local presentational helpers                                                */
/* -------------------------------------------------------------------------- */

/**
 * `Pillar` — one card in the mission grid.
 * `min-w-[220px]` + `flex: 1` lets the row reflow from 4-up on desktop down
 * to 1-up on phone without media queries.
 */
const Pillar = ({
  icon, title, body,
}: { icon: string; title: string; body: string }) => {
  const { tokens } = useTheme();
  return (
  <View
    style={{
      flex: 1,
      flexBasis: 220,
      minWidth: 220,
      backgroundColor: tokens.colors.bgPanel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      paddingHorizontal: 24,
      paddingVertical: 28,
    }}
  >
    <Text style={{ fontSize: 36, marginBottom: 14 }}>{icon}</Text>
    <Text
      className="font-serif text-mw-text"
      style={{ fontSize: 17, marginBottom: 8, lineHeight: 22 }}
    >
      {title}
    </Text>
    <Text
      className="font-sans"
      style={{ fontSize: 13.5, color: tokens.colors.textMuted, lineHeight: 22 }}
    >
      {body}
    </Text>
  </View>
  );
};

/**
 * `Step` — one numbered methodology step. Circular green badge with the
 * step number sits to the left of a heading + body block.
 */
const Step = ({
  number, title, body,
}: { number: number; title: string; body: string }) => {
  const { tokens } = useTheme();
  return (
  <View
    style={{
      flexDirection: 'row',
      gap: 18,
      alignItems: 'flex-start',
      backgroundColor: tokens.colors.bgCard,
      borderRadius: 14,
      paddingHorizontal: 22,
      paddingVertical: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 1,
    }}
  >
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: tokens.colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text className="font-sans-bold text-mw-text-inverse" style={{ fontSize: 17 }}>
        {number}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text
        className="font-serif text-mw-text"
        style={{ fontSize: 16, marginBottom: 6, lineHeight: 22 }}
      >
        {title}
      </Text>
      <Text
        className="font-sans"
        style={{ fontSize: 13.5, color: tokens.colors.textMuted, lineHeight: 22 }}
      >
        {body}
      </Text>
    </View>
  </View>
  );
};

/**
 * `FaqRow` — a single accordion row. Uses local `open` state because the
 * questions are independent — opening one shouldn't close another.
 * Chevron rotates 180° when open.
 */
const FaqRow = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  const { tokens } = useTheme();
  return (
    <View
      style={{
        backgroundColor: tokens.colors.bgPanel,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={q}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text
          className="font-sans-semibold"
          style={{ flex: 1, fontSize: 14, color: tokens.colors.text }}
        >
          {q}
        </Text>
        {/* Plain text chevron — RN doesn't load inline SVG easily without
            extra deps. The unicode arrow rotates via its container's
            rendered position. */}
        <Text
          className="font-sans-bold"
          style={{
            fontSize: 16,
            color: tokens.colors.textMuted,
            transform: [{ rotate: open ? '180deg' : '0deg' }],
          }}
        >
          ⌄
        </Text>
      </Pressable>
      {open && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text
            className="font-sans"
            style={{ fontSize: 13.5, color: tokens.colors.textMuted, lineHeight: 24 }}
          >
            {a}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * `StatCell` — one cell in the segmented stats row at the bottom of the
 * Team section. `divider` paints a right border so the four cells read as
 * a single connected strip.
 */
const StatCell = ({
  value, label, divider,
}: { value: string; label: string; divider?: boolean }) => {
  const { tokens } = useTheme();
  return (
  <View
    style={{
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 24,
      alignItems: 'center',
      borderRightWidth: divider ? 1 : 0,
      borderRightColor: tokens.colors.border,
    }}
  >
    <Text
      className="font-serif"
      style={{ fontSize: 32, color: tokens.colors.accent, lineHeight: 36 }}
    >
      {value}
    </Text>
    <Text
      className="font-sans"
      style={{ fontSize: 12, color: tokens.colors.textMuted, marginTop: 4, textAlign: 'center' }}
    >
      {label}
    </Text>
  </View>
  );
};

/* -------------------------------------------------------------------------- */
/* FAQ content — kept at module scope so it isn't reallocated each render     */
/* -------------------------------------------------------------------------- */

const FAQS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: 'What does $ per gram actually mean?',
    a: "It's the price you pay for each gram of formula powder. A 400g tin at $45 costs $0.1125/g, while an 800g tin at $80 costs $0.1000/g — the bigger tin is cheaper per gram. This metric lets you compare tins of different sizes on equal footing.",
  },
  {
    q: 'Is $ per scoop more useful than $ per gram?',
    a: 'Both matter. $ per gram tells you the true bulk cost. $ per scoop is more practical — it tells you what each prepared bottle costs day-to-day. Scoop sizes vary between brands (typically 4.2–4.6g), so identical-looking prices can differ.',
  },
  {
    q: 'Are the Malaysia price comparisons accurate?',
    a: 'They are estimates based on mid-market prices from Malaysian online platforms. Actual prices vary by retailer, promotion, and whether you buy in-store vs. online. Always check current prices before making a Johor Bahru trip. Also factor in travel costs and personal import limits.',
  },
  {
    q: 'How often is the data updated?',
    a: 'We aim to update retail prices monthly. Nutritional data changes less frequently and is updated when product reformulations are announced. The data displayed includes the last update date.',
  },
  {
    q: 'Which formula is best for my baby?',
    a: "We can't answer that — and neither should any website. Every baby has unique needs. Standard formulas are fine for most healthy, full-term infants. If your baby has reflux, allergies, is premature, or has specific medical needs, your paediatrician is the right person to advise you.",
  },
  {
    q: 'How do I use the comparison tool?',
    a: 'Select up to 5 products (2 on mobile) by clicking any card — a tick will appear. Then tap the green Compare button in the bar that appears at the bottom. A full side-by-side table will pop up showing all metrics, best-value highlights, and the SG vs MY price bar.',
  },
  {
    q: 'Does MilkWise accept advertising or sponsored listings?',
    a: 'No. All rankings are based solely on estimated sales volume data. No brand pays to appear higher in our list or to have their product featured. We do not receive commission from any retailer or brand.',
  },
  {
    q: 'Why does the same brand appear multiple times?',
    a: 'Many brands sell multiple products for different needs — e.g. Nestlé NAN has standard, HA (hypoallergenic), lactose-free, and anti-reflux variants. Each is a distinct product with different ingredients and pricing, so we list them separately.',
  },
];
