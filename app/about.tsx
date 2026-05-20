/**
 * app/about.tsx — About (`/about`). Phase 8 rebuild.
 *
 * Replaces the v1 "Helping Singapore Mums" hero + 4-pillar grid with the
 * design's calmer prose layout from
 * `MilkWiseFinalDesign/ui_kits/website/Pages.jsx` → `About()`:
 *
 *   1. Intro hero  Eyebrow + h1 + sage-left-border mission quote card.
 *   2. Two short paragraphs (no affiliate links · formula is personal).
 *   3. Data methodology  two cards (Prices from · Nutrition from).
 *   4. Terms & Conditions  six numbered items.
 *
 * Narrow prose width = 720px (matches the design's `For New Parents`).
 */

import { View, Text, useWindowDimensions } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Eyebrow } from '../src/components/Section';
import { useTheme } from '../src/contexts/ThemeContext';

const TABLET = 768;

const METHODOLOGY: { kicker: string; body: string }[] = [
  {
    kicker: 'Prices from',
    body:
      'NTUC FairPrice, Guardian, Watsons, Lazada SG, Shopee SG, RedMart, plus monthly physical-store checks. Malaysia: Watsons MY, Guardian MY, Shopee MY, JB store visits.',
  },
  {
    kicker: 'Nutrition from',
    body:
      'Product packaging (primary), brand official websites, all at standard dilution unless stated otherwise.',
  },
];

const TERMS: [string, string][] = [
  ['1. Purpose and Scope',
    'MilkWise SG is an independent, non-commercial information resource. Not affiliated with, sponsored by, or endorsed by any formula brand, retailer, or healthcare institution.'],
  ['2. Not Medical Advice',
    'All content is for general informational purposes only. Nothing on this Site constitutes medical advice. Always consult a qualified healthcare professional.'],
  ['3. Pricing Accuracy',
    'Prices are indicative and may have changed since last update. Always verify with retailers before purchase.'],
  ['4. Cross-Border Purchasing',
    'Cross-border purchase of infant formula for personal consumption is generally permitted but subject to Singapore customs regulations.'],
  ['5. No Endorsement',
    'Inclusion of a product on this Site does not constitute an endorsement. Exclusion does not imply inferiority.'],
  ['6. Limitation of Liability',
    'MilkWise SG shall not be held liable for any loss, damage, or harm arising from reliance on information presented on this Site.'],
];

export default function AboutScreen() {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET;

  return (
    <Screen>
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
        <Eyebrow>About</Eyebrow>
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
          Built by a parent, for parents.
        </Text>

        {/* Mission quote card — sage left border, italic display */}
        <View
          style={{
            padding: 28,
            borderRadius: tokens.radius.card,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            borderLeftWidth: 3,
            borderLeftColor: tokens.colors.accent,
            backgroundColor: tokens.colors.bgCard,
            marginTop: 16,
            marginBottom: 24,
            ...tokens.shadow.s1,
          }}
        >
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 29,
              color: tokens.colors.text,
              fontWeight: '400',
            }}
          >
            MilkWise SG was created out of a personal experience: standing
            in the formula aisle at FairPrice with a newborn at home,
            completely overwhelmed by 40+ products and no clear way to
            compare them. The goal was simple — build the comparison tool
            that didn't exist.
          </Text>
        </View>

        <Text style={para(tokens)}>
          No affiliate links. No brand partnerships. No sponsored
          placements. Just clean data.
        </Text>
        <Text style={[para(tokens), { marginBottom: 24 }]}>
          Formula feeding is a deeply personal choice — and it should be an
          informed one. Whether you're formula-feeding by necessity or by
          choice, you deserve a clear, trustworthy resource.
        </Text>

        {/* Data methodology */}
        <Text style={h2(tokens)}>Data methodology</Text>
        <View
          style={{
            flexDirection: isWide ? 'row' : 'column',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {METHODOLOGY.map((m) => (
            <View
              key={m.kicker}
              style={{
                flexBasis: '48%',
                flexGrow: 1,
                padding: 18,
                borderRadius: tokens.radius.card,
                borderWidth: 1,
                borderColor: tokens.colors.border,
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
                  color: tokens.colors.textMuted,
                  marginBottom: 8,
                }}
              >
                {m.kicker}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 20,
                  color: tokens.colors.text,
                }}
              >
                {m.body}
              </Text>
            </View>
          ))}
        </View>

        {/* Terms & Conditions */}
        <Text style={h2(tokens)}>Terms & Conditions</Text>
        <View style={{ gap: 16 }}>
          {TERMS.map(([t, d]) => (
            <View key={t}>
              <Text
                style={{
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 14,
                  fontWeight: '600',
                  color: tokens.colors.text,
                  marginBottom: 4,
                }}
              >
                {t}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 24,
                  color: tokens.colors.textMuted,
                }}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

// ── helpers ───────────────────────────────────────────────────────────
const para = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontSize: 16,
  lineHeight: 27,
  color: tokens.colors.textMuted,
});
const h2 = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.displaySemibold,
  fontSize: 30,
  fontWeight: '400' as const,
  letterSpacing: -0.45,
  color: tokens.colors.text,
  marginTop: 24,
  marginBottom: 8,
});
