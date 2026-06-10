/**
 * app/parents.tsx — For New Parents (`/parents`). Phase 8.
 *
 * Ported 1:1 from `MilkWiseFinalDesign/ui_kits/website/Pages.jsx` →
 * `ForNewParents()`. Six sections (narrow prose width = 720px):
 *
 *   1. Intro hero (eyebrow + display h1 + 18px lede)
 *   2. "What the stages mean" + sage pullquote
 *   3. "Milk source, briefly" — 4 emoji cards (cow / goat / soy /
 *      hydrolysed)
 *   4. "What you're actually paying for" — bordered list of 5 cost
 *      drivers (label : description)
 *   5. Sage pullquote + SourceBadge
 *   6. "Green flags / Yellow flags" — two side-by-side cards
 */

import { View, Text, useWindowDimensions } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Eyebrow } from '../src/components/Section';
import { SourceBadge } from '../src/components/SourceBadge';
import { useTheme } from '../src/contexts/ThemeContext';
import { PageMeta } from '../src/components/PageMeta';

const TABLET = 768;

const MILK_SOURCES: { e: string; t: string; d: string }[] = [
  { e: '🐄', t: 'Cow milk',
    d: 'Most common globally. Well-researched. Most babies tolerate it well.' },
  { e: '🐐', t: 'Goat milk',
    d: 'Slightly different protein structure (A2). Some parents report easier digestion. Evidence growing.' },
  { e: '🌿', t: 'Soy',
    d: 'Lactose-free, plant-based. Used for galactosaemia or cultural reasons. Not first-line without medical advice.' },
  { e: '🧪', t: 'Hydrolysed / HA / Amino Acid',
    d: 'Proteins broken into smaller pieces. For suspected cow milk protein allergy. Most expensive category.' },
];

const COST_DRIVERS: [string, string][] = [
  ['Marketing & brand positioning', 'Often the largest component of premium pricing.'],
  ['Speciality ingredients (HMO, specific probiotics)', 'Some have supporting evidence; some are early-stage.'],
  ['Organic certification', 'Affects farming costs, not always nutritional outcome.'],
  ['Manufacturing region (EU vs non-EU)', 'EU-sourced formula often commands a premium.'],
  ['Proprietary blends', 'Branded ingredient names are often standard ingredients in a marketing package.'],
];

const GREEN_FLAGS = [
  'Halal-certified (if required)',
  'Age-appropriate stage',
  'No known allergen to your baby',
  'Paediatrician-recommended',
  'Within budget for sustained use',
];
const YELLOW_FLAGS = [
  '"Closest to breastmilk" claims',
  '"Brain development" headline claims',
  'Stage 3/4 necessity for healthy toddlers',
  'Extreme price premiums without clinical evidence',
];

export default function ForNewParentsScreen() {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET;

  return (
    <Screen>
      <PageMeta title="For New Parents" description="What actually matters when choosing formula: stages, milk sources, and cost drivers." />
      <View
        style={{
          maxWidth: 720,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: 32,
          paddingVertical: 40,
          paddingBottom: 80,
          gap: 20,
        }}
      >
        {/* Intro */}
        <Eyebrow>For New Parents</Eyebrow>
        <Text
          style={{
            fontFamily: tokens.fonts.displayBold,
            fontSize: 52,
            fontWeight: '400',
            letterSpacing: -1.3,
            lineHeight: 55,
            color: tokens.colors.text,
          }}
        >
          The formula aisle is overwhelming. Here's what actually matters.
        </Text>
        <Text
          style={{
            fontSize: 18,
            lineHeight: 29,
            color: tokens.colors.textMuted,
            marginBottom: 24,
          }}
        >
          As a new parent, you'll be surrounded by expensive packaging,
          latin ingredient names, and well-meaning conflicting advice. This
          page is a calm starting point — not a definitive guide, and
          definitely not medical advice.
        </Text>

        {/* Stages */}
        <Text style={h2(tokens)}>What the stages mean</Text>
        <Text
          style={{
            fontSize: 16,
            lineHeight: 27,
            color: tokens.colors.textMuted,
            marginBottom: 12,
          }}
        >
          Stage numbers are marketing conventions — not strict medical
          categories for healthy babies. The stage primarily reflects
          protein and iron adjustments for age.
        </Text>
        <PullQuote tokens={tokens}>
          Stage 3 and Stage 4 formulas are not medically required for
          healthy toddlers who eat a varied diet. They are a commercial
          product — not a necessity.
        </PullQuote>

        {/* Milk source */}
        <Text style={h2(tokens)}>Milk source, briefly</Text>
        <View
          style={{
            flexDirection: isWide ? 'row' : 'column',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          {MILK_SOURCES.map((m) => (
            <View
              key={m.t}
              style={{
                flexBasis: isWide ? '48%' : '100%',
                flexGrow: 1,
                padding: 20,
                borderRadius: tokens.radius.card,
                borderWidth: 1,
                borderColor: tokens.colors.border,
                backgroundColor: tokens.colors.bgCard,
                ...tokens.shadow.s1,
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>{m.e}</Text>
              <Text
                style={{
                  fontFamily: tokens.fonts.displaySemibold,
                  fontSize: 18,
                  fontWeight: '500',
                  letterSpacing: -0.18,
                  color: tokens.colors.text,
                  marginBottom: 6,
                }}
              >
                {m.t}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: tokens.colors.textMuted,
                }}
              >
                {m.d}
              </Text>
            </View>
          ))}
        </View>

        {/* What you're paying for */}
        <Text style={[h2(tokens), { marginTop: 32 }]}>
          What you're actually paying for
        </Text>
        <Text
          style={{
            fontSize: 16,
            lineHeight: 27,
            color: tokens.colors.textMuted,
            marginBottom: 12,
          }}
        >
          "Premium = better" is not always true for formula. Here's what
          drives price:
        </Text>
        <View style={{ gap: 0 }}>
          {COST_DRIVERS.map(([t, d], i) => (
            <View
              key={t}
              style={{
                flexDirection: isWide ? 'row' : 'column',
                paddingBottom: 12,
                paddingTop: i === 0 ? 0 : 12,
                borderBottomWidth: 1,
                borderBottomColor: tokens.colors.divider,
                gap: isWide ? 16 : 4,
                alignItems: isWide ? 'baseline' : 'flex-start',
              }}
            >
              <Text
                style={{
                  width: isWide ? 280 : undefined,
                  fontFamily: tokens.fonts.bodyMedium,
                  fontWeight: '500',
                  fontSize: 14,
                  color: tokens.colors.text,
                }}
              >
                {t}
              </Text>
              <Text
                style={{
                  flex: isWide ? 1 : undefined,
                  fontSize: 14,
                  lineHeight: 22,
                  color: tokens.colors.textMuted,
                }}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 32 }}>
          <PullQuote tokens={tokens}>
            All formula sold in Singapore must meet regulatory minimums.
            The base nutritional adequacy is guaranteed. What you pay extra
            for — and whether it's worth it — is a much harder question.
          </PullQuote>
          <SourceBadge>
            Source · HSA Singapore Infant Formula Regulations
          </SourceBadge>
        </View>

        {/* Green flags / Yellow flags */}
        <Text style={[h2(tokens), { marginTop: 32 }]}>
          Green flags / Yellow flags
        </Text>
        <View
          style={{
            flexDirection: isWide ? 'row' : 'column',
            gap: 14,
          }}
        >
          <FlagCard
            tokens={tokens}
            tone="green"
            heading="✅ Worth considering"
            items={GREEN_FLAGS}
          />
          <FlagCard
            tokens={tokens}
            tone="yellow"
            heading="⚠️ Think critically about"
            items={YELLOW_FLAGS}
          />
        </View>
      </View>
    </Screen>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function PullQuote({
  tokens,
  children,
}: {
  tokens: ReturnType<typeof useTheme>['tokens'];
  children: string;
}) {
  return (
    <Text
      style={{
        fontFamily: tokens.fonts.displaySemibold,
        fontSize: 26,
        fontWeight: '500',
        letterSpacing: -0.39,
        lineHeight: 35,
        color: tokens.colors.text,
        borderLeftWidth: 2,
        borderLeftColor: tokens.colors.accent,
        paddingLeft: 24,
        paddingVertical: 4,
        marginVertical: 16,
      }}
    >
      {children}
    </Text>
  );
}

function FlagCard({
  tokens,
  tone,
  heading,
  items,
}: {
  tokens: ReturnType<typeof useTheme>['tokens'];
  tone: 'green' | 'yellow';
  heading: string;
  items: string[];
}) {
  const accent =
    tone === 'green' ? tokens.colors.accent : tokens.colors.clay;
  const headColor =
    tone === 'green' ? tokens.colors.accentText : tokens.colors.clay;
  return (
    <View
      style={{
        flexBasis: '48%',
        flexGrow: 1,
        padding: 20,
        borderRadius: tokens.radius.card,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        borderLeftWidth: 3,
        borderLeftColor: accent,
        backgroundColor: tokens.colors.bgCard,
        ...tokens.shadow.s1,
      }}
    >
      <Text
        style={{
          fontFamily: tokens.fonts.bodySemibold,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: headColor,
          marginBottom: 10,
        }}
      >
        {heading}
      </Text>
      <View style={{ gap: 6 }}>
        {items.map((it) => (
          <View
            key={it}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
          >
            <Text style={{ color: tokens.colors.text, fontSize: 14 }}>•</Text>
            <Text
              style={{
                color: tokens.colors.text,
                fontSize: 14,
                lineHeight: 24,
                flex: 1,
              }}
            >
              {it}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const h2 = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.displaySemibold,
  fontSize: 30,
  fontWeight: '400' as const,
  letterSpacing: -0.45,
  color: tokens.colors.text,
  marginTop: 32,
  marginBottom: 8,
});
