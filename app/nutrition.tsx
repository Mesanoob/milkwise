/**
 * app/nutrition.tsx — Nutrition Guide (`/nutrition`). Phase 8.
 *
 * Ported 1:1 from `MilkWiseFinalDesign/ui_kits/website/Pages.jsx` →
 * `NutritionGuide()`. Five sections:
 *
 *   1. Intro (eyebrow + display h1 + sub) + butter "population averages"
 *      warning band.
 *   2. Feeding-guide-by-age table — 7 rows, WHO + HPB-sourced.
 *   3. Safe preparation — 6 numbered step cards (3-col on desktop,
 *      stacked on mobile).
 *   4. pHF vs eHF explainer — 2 side-by-side cards + paragraph about AAF.
 *   5. "Key nutrients, plainly" — 8 nutrient pairs in a card list.
 *
 * Reuses `Section`/`Eyebrow` from Phase 3 + `SourceBadge`/`StageBadge`.
 */

import { Fragment } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Eyebrow } from '../src/components/Section';
import { SourceBadge } from '../src/components/SourceBadge';
import { StageBadge } from '../src/components/compare/v2/atoms';
import { useTheme } from '../src/contexts/ThemeContext';
import { PageMeta } from '../src/components/PageMeta';

const TABLET = 768;

const FEEDING_ROWS: [string, string, string, string, string][] = [
  ['0–1 month',   '8–12', '45–90ml',  '400–600ml',  'Stage 1'],
  ['1–3 months',  '6–8',  '90–150ml', '600–900ml',  'Stage 1'],
  ['3–6 months',  '5–6',  '150–210ml','800–1000ml', 'Stage 1'],
  ['6–9 months',  '3–5',  '180–240ml','600–900ml',  'Stage 2'],
  ['9–12 months', '3–4',  '180–240ml','500–700ml',  'Stage 2'],
  ['1–2 years',   '2–3',  '200–240ml','350–500ml',  'Stage 3'],
  ['2–3 years',   '1–2',  '200–250ml','200–400ml',  'Stage 3'],
];

const STEPS: { n: string; t: string; d: string }[] = [
  { n: '01', t: 'Boil & cool water to ~70°C', d: 'or use cooled boiled water per tin instructions' },
  { n: '02', t: 'Measure water into sterilised bottle', d: 'always water first, then powder' },
  { n: '03', t: 'Add level scoops', d: 'do not pack or heap; follow tin ratio exactly' },
  { n: '04', t: 'Cap and gently swirl', d: 'do not shake vigorously' },
  { n: '05', t: 'Cool to feeding temp, test on wrist', d: 'should feel warm, not hot' },
  { n: '06', t: 'Discard unused', d: 'within 2h at room temp / 24h refrigerated' },
];

const NUTRIENTS: [string, string][] = [
  ['DHA & ARA', 'Brain and eye development. All formulas sold in Singapore must include minimum DHA — premium claims are mostly marketing.'],
  ['Iron', 'Cognitive development and anaemia prevention. Particularly important from 6 months on.'],
  ['Calcium & Vitamin D', 'Bone development. Singapore’s indoor lifestyle makes Vit D supplementation common.'],
  ['Prebiotics (GOS / FOS)', 'Feed beneficial gut bacteria. Sometimes called scGOS / lcFOS on labels.'],
  ['Probiotics', 'Live strains — B. lactis BB-12, B. breve M-16V are common. Evidence varies by strain.'],
  ['HMO (Human Milk Oligosaccharides)', 'Synthetic 2′-FL most common. Evidence is early but growing.'],
  ['Partially hydrolysed protein', 'Easier digestion for sensitive babies; reduced (not eliminated) allergy risk.'],
  ['Palm olein oil', 'Energy source. Some concern about calcium absorption — neither uniformly bad nor good.'],
];

export default function NutritionGuideScreen() {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET;

  return (
    <Screen>
      <PageMeta title="Nutrition Guide" description="Plain-English guide to formula stages, key nutrients, and safe preparation." />
      <View
        style={{
          maxWidth: tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: 32,
          paddingVertical: 40,
          paddingBottom: 80,
          gap: 16,
        }}
      >
        <Eyebrow>Nutrition Guide</Eyebrow>
        <Text
          style={{
            fontFamily: tokens.fonts.displayBold,
            fontSize: 52,
            fontWeight: '400',
            letterSpacing: -1.3,
            lineHeight: 55,
            color: tokens.colors.text,
            maxWidth: 600,
          }}
        >
          How much formula does your baby need?
        </Text>
        <Text
          style={{
            fontSize: 18,
            lineHeight: 29,
            color: tokens.colors.textMuted,
            maxWidth: 560,
            marginBottom: 16,
          }}
        >
          Age-based guidelines drawn from WHO recommendations and Singapore
          HPB. Always consult your paediatrician for personalised advice.
        </Text>

        {/* Butter warning band */}
        <View
          style={{
            padding: 14,
            borderRadius: 8,
            backgroundColor: tokens.colors.warnBg,
            borderWidth: 1,
            borderColor: tokens.colors.border,
          }}
        >
          <Text
            style={{
              color: tokens.colors.warnText,
              fontSize: 14,
              lineHeight: 22,
            }}
          >
            <Text style={{ fontFamily: tokens.fonts.bodySemibold }}>
              ⚠️ Population averages — not individual prescriptions.
            </Text>{' '}
            Every baby is different. Appetite varies daily. Never force-feed
            or restrict based on these numbers without medical guidance.
          </Text>
        </View>

        {/* ── Feeding guide by age ─────────────────────── */}
        <Text style={h2(tokens)}>Feeding guide by age</Text>
        <SourceBadge>
          Source · WHO Infant Feeding Guidelines · HPB Singapore
        </SourceBadge>

        <View
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radius.card,
            overflow: 'hidden',
            backgroundColor: tokens.colors.bgCard,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: tokens.colors.bgPanel,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: tokens.colors.borderStrong,
            }}
          >
            <Text style={[tableHeader(tokens), { flex: 1.4 }]}>Age</Text>
            <Text style={[tableHeader(tokens), { width: 80, textAlign: 'right' }]}>
              Feeds / day
            </Text>
            <Text style={[tableHeader(tokens), { width: 100, textAlign: 'right' }]}>
              ml / feed
            </Text>
            <Text style={[tableHeader(tokens), { width: 100, textAlign: 'right' }]}>
              Daily total
            </Text>
            <Text style={[tableHeader(tokens), { width: 90, textAlign: 'right' }]}>
              Stage
            </Text>
          </View>
          {FEEDING_ROWS.map((row, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderBottomWidth: i < FEEDING_ROWS.length - 1 ? 1 : 0,
                borderBottomColor: tokens.colors.divider,
                alignItems: 'center',
              }}
            >
              <Text style={[tableCell(tokens), { flex: 1.4 }]}>{row[0]}</Text>
              <Text style={[tableNum(tokens), { width: 80, textAlign: 'right' }]}>
                {row[1]}
              </Text>
              <Text style={[tableNum(tokens), { width: 100, textAlign: 'right' }]}>
                {row[2]}
              </Text>
              <Text
                style={[
                  tableNum(tokens),
                  { width: 100, textAlign: 'right', fontWeight: '500' },
                ]}
              >
                {row[3]}
              </Text>
              <View style={{ width: 90, alignItems: 'flex-end' }}>
                <StageBadge stage={row[4]} />
              </View>
            </View>
          ))}
        </View>
        <Text
          style={{
            fontSize: 13,
            color: tokens.colors.textMuted,
            lineHeight: 20,
            marginTop: 4,
          }}
        >
          Ranges are population averages. Introduce solids as directed by
          your paediatrician from ~6 months.
        </Text>

        {/* ── Safe preparation ─────────────────────────── */}
        <Text style={[h2(tokens), { marginTop: 48 }]}>Safe preparation</Text>
        <View
          style={{
            flexDirection: isWide ? 'row' : 'column',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {STEPS.map((s) => (
            <View
              key={s.n}
              style={{
                flexBasis: isWide ? '31%' : '100%',
                flexGrow: 1,
                padding: 20,
                borderRadius: tokens.radius.card,
                borderWidth: 1,
                borderColor: tokens.colors.border,
                backgroundColor: tokens.colors.bgCard,
                ...tokens.shadow.s1,
              }}
            >
              <Text
                style={{
                  fontFamily: tokens.fonts.mono,
                  fontSize: 11,
                  color: tokens.colors.accentText,
                  letterSpacing: 1.1,
                  fontWeight: '600',
                }}
              >
                STEP {s.n}
              </Text>
              <Text
                style={{
                  fontFamily: tokens.fonts.displaySemibold,
                  fontSize: 18,
                  fontWeight: '500',
                  letterSpacing: -0.18,
                  color: tokens.colors.text,
                  marginTop: 6,
                  marginBottom: 8,
                }}
              >
                {s.t}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 20,
                  color: tokens.colors.textMuted,
                }}
              >
                {s.d}
              </Text>
            </View>
          ))}
        </View>
        <SourceBadge>
          Source · WHO/UNICEF Safe Preparation of Infant Formula
        </SourceBadge>

        {/* ── pHF vs eHF ──────────────────────────────── */}
        <Text
          style={[
            h2(tokens),
            { marginTop: 48, fontWeight: '600', letterSpacing: -0.54 },
          ]}
        >
          pHF vs eHF — understanding "hydrolysed"
        </Text>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 25,
            color: tokens.colors.textMuted,
            marginBottom: 8,
          }}
        >
          "Hydrolysed" means the protein has been chemically broken down into
          smaller pieces, making it easier to digest. There are two grades,
          and the distinction matters:
        </Text>
        <View
          style={{
            flexDirection: isWide ? 'row' : 'column',
            gap: 14,
          }}
        >
          {[
            {
              kicker: 'pHF · PARTIALLY HYDROLYSED',
              tone: tokens.colors.accentText,
              title: 'For comfort & easier digestion',
              body:
                'Protein chains are broken into smaller pieces — large enough that some intact protein remains. Often labelled "Gentle", "Comfort", or "HA" (hypoallergenic). Marketed for general gut comfort and (with limited evidence) for reducing allergy risk in family-history infants. Available over the counter.',
            },
            {
              kicker: 'eHF · EXTENSIVELY HYDROLYSED',
              tone: tokens.colors.clay,
              title: 'For confirmed milk protein allergy',
              body:
                "Protein is broken down so thoroughly that the immune system typically does not recognise it as cow's milk protein. Prescribed (or recommended by a paediatrician) for confirmed cow's milk protein allergy (CMPA). More expensive; specific brands like Nutramigen LGG fall here.",
            },
          ].map((c) => (
            <View
              key={c.kicker}
              style={{
                flexBasis: isWide ? '49%' : '100%',
                flexGrow: 1,
                padding: 22,
                borderRadius: tokens.radius.card,
                borderWidth: 1,
                borderColor: tokens.colors.border,
                backgroundColor: tokens.colors.bgCard,
                borderLeftWidth: 3,
                borderLeftColor: c.tone,
                ...tokens.shadow.s1,
              }}
            >
              <Text
                style={{
                  fontFamily: tokens.fonts.mono,
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 1.1,
                  color: c.tone,
                  marginBottom: 8,
                }}
              >
                {c.kicker}
              </Text>
              <Text
                style={{
                  fontFamily: tokens.fonts.displaySemibold,
                  fontSize: 18,
                  fontWeight: '600',
                  letterSpacing: -0.18,
                  color: tokens.colors.text,
                  marginBottom: 8,
                }}
              >
                {c.title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: tokens.colors.textMuted,
                }}
              >
                {c.body}
              </Text>
            </View>
          ))}
        </View>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 21,
            color: tokens.colors.textMuted,
          }}
        >
          Beyond eHF sits{' '}
          <Text
            style={{
              color: tokens.colors.text,
              fontFamily: tokens.fonts.bodySemibold,
            }}
          >
            amino acid formula (AAF)
          </Text>{' '}
          — proteins fully broken into individual amino acids, used for
          severe allergy when even eHF triggers a reaction. AAFs are
          specialist products and require medical supervision.
        </Text>
        <SourceBadge>
          Source · HSA Singapore · AAP Clinical Report on Hydrolysed Formula
        </SourceBadge>

        {/* ── Key nutrients, plainly ───────────────────── */}
        <Text style={[h2(tokens), { marginTop: 48 }]}>Key nutrients, plainly</Text>
        <View
          style={{
            backgroundColor: tokens.colors.bgCard,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radius.card,
            overflow: 'hidden',
          }}
        >
          {NUTRIENTS.map(([t, d], i) => (
            <View
              key={t}
              style={{
                flexDirection: isWide ? 'row' : 'column',
                paddingVertical: 18,
                paddingHorizontal: 22,
                borderBottomWidth: i < NUTRIENTS.length - 1 ? 1 : 0,
                borderBottomColor: tokens.colors.divider,
                gap: isWide ? 24 : 6,
                alignItems: isWide ? 'baseline' : 'flex-start',
              }}
            >
              <Text
                style={{
                  width: isWide ? 220 : undefined,
                  fontFamily: tokens.fonts.displaySemibold,
                  fontSize: 17,
                  fontWeight: '500',
                  letterSpacing: -0.17,
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
      </View>
    </Screen>
  );
}

// ── Small style helpers ───────────────────────────────────────────────
const h2 = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.displaySemibold,
  fontSize: 30,
  fontWeight: '400' as const,
  letterSpacing: -0.45,
  color: tokens.colors.text,
  marginTop: 16,
  marginBottom: 4,
});
const tableHeader = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.bodySemibold,
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 0.66,
  textTransform: 'uppercase' as const,
  color: tokens.colors.textMuted,
});
const tableCell = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontSize: 14,
  color: tokens.colors.text,
});
const tableNum = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.monoMedium,
  fontVariant: ['tabular-nums'] as ['tabular-nums'],
  fontSize: 13,
  color: tokens.colors.text,
});
