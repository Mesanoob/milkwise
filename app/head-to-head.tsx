/**
 * app/head-to-head.tsx — Head-to-Head comparison (`/head-to-head`).
 * Phase 6 of the rebuild.
 *
 * Ported from `MilkWiseFinalDesign/ui_kits/website/HeadToHead.jsx`.
 *
 * Reads the picked formulas from `FormulaCompareContext.tray` (mounted in
 * _layout.tsx; survives Compare → product detail → back navigation). The
 * page renders the same row-label + N-value-column table the prototype
 * does, with the best value per row highlighted in sage.
 *
 * Sections (verbatim from the prototype):
 *   1. Price data        accent header; lowest $/g wins, etc.
 *   2. Formula details   stage / milk source / origin / halal / organic
 *   3. Ingredient flags  HMO / probiotic / palm oil / pHF / lactose-free /
 *                        main sugar
 *   4. Nutrition         per-100mL via `nutrition.json`; only renders if
 *                        at least one selected formula has a record.
 *
 * Modes:
 *   • 0 picked → empty CTA → "Pick formulas to compare" → /compare
 *   • 1 picked → "Product detail" single-column spec; lowBetter highlighting
 *                disabled (no peer to compare against)
 *   • 2 or 3   → standard side-by-side comparison
 *
 * Phase-6 deferments:
 *   • Download-PDF action is a stub (button is rendered but does nothing).
 *     A future phase can wire `expo-print` or a web-only `window.print()`.
 *   • Page is horizontally scrollable when N=3 on narrow viewports; sticky
 *     first column / header row are Phase-9 polish.
 */

import { Fragment, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { useTheme } from '../src/contexts/ThemeContext';
import { useFormulaCompare } from '../src/contexts/FormulaCompareContext';
import { getFormulaNutrition } from '../src/data/formulaNutrition';
import { getProductImage } from '../src/data/imageMap';
import { fmtSGD, fmtPerGram } from '../src/utils/formulaFormat';
import {
  shortName,
  milkSourceOf,
} from '../src/utils/formulaClassifiers';
import type { Formula, NutrientValue } from '../src/types/formula';

// ── Best-cell index resolver ──────────────────────────────────────────
// `vals` may be numbers or strings; only numeric rows can pick a best.
// `lowBetter` null → no best; true → min wins; false → max wins.
const bestIdx = (
  vals: Array<number | string>,
  lowBetter: boolean | null,
): number => {
  if (lowBetter === null) return -1;
  const numeric = vals.map((v) => (typeof v === 'number' ? v : NaN));
  if (numeric.every((v) => Number.isNaN(v))) return -1;
  const ranked = numeric
    .map((v, i) => [v, i] as const)
    .filter(([v]) => !Number.isNaN(v))
    .sort((a, b) => (lowBetter ? a[0] - b[0] : b[0] - a[0]));
  return ranked[0][1];
};

// ── Nutrient pick helper (matches the prototype's chain) ──────────────
const pickKey = (
  nutr: Record<string, NutrientValue> | null,
  candidates: string[],
): string | null => {
  if (!nutr) return null;
  for (const c of candidates) if (nutr[c]) return c;
  return null;
};

// ── Row definition ─────────────────────────────────────────────────────
type Row = {
  label: string;
  /** Raw values per product (numbers for comparable rows, strings for
   *  enum-like cells). */
  values: Array<number | string>;
  /** How to render each cell. */
  fmt: (v: number | string) => string;
  /** `null` = no best highlighted; `true` = low wins; `false` = high wins. */
  lowBetter: boolean | null;
};
type Section = { name: string; accent?: boolean; rows: Row[] };

// ── Row label / data cell shared style helpers ────────────────────────
const labelStyle = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  flex: 0 as const,
  flexBasis: 180,
  paddingVertical: 10,
  paddingHorizontal: 12,
  fontFamily: tokens.fonts.bodySemibold,
  fontSize: 12,
  fontWeight: '600' as const,
  color: tokens.colors.textMuted,
});
const dataStyle = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  flex: 1 as const,
  paddingVertical: 10,
  paddingHorizontal: 12,
  fontFamily: tokens.fonts.monoMedium,
  fontVariant: ['tabular-nums'] as ['tabular-nums'],
  fontSize: 13,
  color: tokens.colors.text,
  textAlign: 'right' as const,
});

// ── Page ──────────────────────────────────────────────────────────────
export default function HeadToHeadScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const { tray, clearTray } = useFormulaCompare();

  // 0-product empty state.
  if (tray.length === 0) {
    return (
      <Screen>
        <View style={{ padding: 64, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 22,
              fontWeight: '600',
              color: tokens.colors.text,
              marginBottom: 8,
            }}
          >
            Nothing to compare yet
          </Text>
          <Text
            style={{
              color: tokens.colors.textMuted,
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Tap the circle on any product card to add it to the compare
            tray, then come back.
          </Text>
          <Pressable
            onPress={() => router.replace('/compare')}
            accessibilityRole="button"
            accessibilityLabel="Browse formulas"
            style={{
              paddingVertical: 10,
              paddingHorizontal: 22,
              borderRadius: 999,
              backgroundColor: tokens.colors.accent,
            }}
          >
            <Text
              style={{
                color: tokens.colors.textInverse,
                fontFamily: tokens.fonts.bodySemibold,
                fontSize: 14,
              }}
            >
              Browse formulas
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <H2HBody products={tray} clearTray={clearTray} />
    </Screen>
  );
}

// ── Body (extracted so we can call hooks inside conditional render) ──
function H2HBody({
  products,
  clearTray,
}: {
  products: Formula[];
  clearTray: () => void;
}) {
  const { tokens } = useTheme();
  const router = useRouter();
  const isSingle = products.length === 1;

  // Resolve nutrition once per product (each is a cheap object lookup).
  const productNutr = useMemo(
    () => products.map((p) => getFormulaNutrition(p.product)),
    [products],
  );
  const hasNutrition = productNutr.some((n) => n);

  // ── Build the row tree ────────────────────────────────────────────
  const sections: Section[] = useMemo(() => {
    const out: Section[] = [];

    out.push({
      name: 'Price data',
      accent: true,
      rows: [
        {
          label: 'Retail price',
          values: products.map((p) => p.price),
          fmt: (v) => (typeof v === 'number' ? fmtSGD(v) : String(v)),
          lowBetter: true,
        },
        {
          label: 'Tin size',
          values: products.map((p) => `${p.packSize}g`),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: '$ / gram',
          values: products.map((p) => p.pricePerGram),
          fmt: (v) =>
            typeof v === 'number' ? fmtPerGram(v) : String(v),
          lowBetter: true,
        },
        {
          label: '$ / scoop',
          values: products.map((p) => p.pricePerScoop),
          fmt: (v) => (typeof v === 'number' ? fmtSGD(v) : String(v)),
          lowBetter: true,
        },
        {
          label: 'Scoops / tin',
          values: products.map((p) => p.scoopsPerTin),
          fmt: (v) =>
            typeof v === 'number' ? `~${Math.round(v)}` : String(v),
          lowBetter: false,
        },
        {
          label: 'Malaysia (est. MYR)',
          values: products.map((p) => Math.round(p.price * 3.05)),
          fmt: (v) => `RM ${v}`,
          lowBetter: null,
        },
        {
          label: 'Est. SG savings / tin',
          values: products.map((p) => p.price * 0.28),
          fmt: (v) =>
            typeof v === 'number' ? `${fmtSGD(v)} / tin` : String(v),
          lowBetter: false,
        },
      ],
    });

    out.push({
      name: 'Formula details',
      rows: [
        {
          label: 'Stage',
          values: products.map((p) => p.stage),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Milk source',
          values: products.map((p) => milkSourceOf(p)),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Manufactured in',
          values: products.map((p) => p.manufacturedIn || '—'),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Halal certified',
          values: products.map((p) => p.halal || 'No'),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Organic',
          values: products.map((p) => p.organic || 'No'),
          fmt: (v) => String(v),
          lowBetter: null,
        },
      ],
    });

    out.push({
      name: 'Ingredient highlights',
      rows: [
        {
          label: 'HMO / 2′-FL',
          values: products.map((p) =>
            p.hmo && p.hmo !== 'No' ? '✓' : '—',
          ),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Probiotic strain',
          values: products.map((p) =>
            p.probiotic && p.probiotic !== 'No'
              ? p.probiotic.slice(0, 22)
              : '—',
          ),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Palm oil',
          values: products.map((p) =>
            p.palmOil && p.palmOil.toLowerCase().startsWith('yes')
              ? '✓'
              : '—',
          ),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Partially hydrolysed (pHF)',
          values: products.map((p) =>
            p.partiallyHydrolyzed &&
            p.partiallyHydrolyzed.toLowerCase().startsWith('yes')
              ? '✓'
              : '—',
          ),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Lactose-free',
          values: products.map((p) =>
            p.lactoseFree && p.lactoseFree.toLowerCase().startsWith('yes')
              ? '✓'
              : '—',
          ),
          fmt: (v) => String(v),
          lowBetter: null,
        },
        {
          label: 'Main sugar',
          values: products.map((p) => p.mainSugar || '—'),
          fmt: (v) => String(v),
          lowBetter: null,
        },
      ],
    });

    if (hasNutrition) {
      const nutrientRow = (
        label: string,
        candidates: string[],
      ): Row | null => {
        const cells = productNutr.map((n) => {
          const key = pickKey(n, candidates);
          return key && n ? n[key] : null;
        });
        if (cells.every((c) => !c)) return null;
        const unit = cells.find((c) => c)?.unit || '';
        const values: Array<number | string> = cells.map((c) =>
          c?.per100ml != null ? c.per100ml : NaN,
        );
        return {
          label,
          values,
          fmt: (v) =>
            typeof v === 'number' && !Number.isNaN(v)
              ? `${v} ${unit}`
              : '—',
          lowBetter: false, // generally higher is better for nutrients
        };
      };

      const rows = [
        nutrientRow('Energy', ['Energy']),
        nutrientRow('Protein', ['Protein']),
        nutrientRow('Fat', ['Fat', 'Total Fat']),
        nutrientRow('Carbohydrate', [
          'Carbohydrate',
          'Total carbohydrate',
          'Total Carbohydrates',
        ]),
        nutrientRow('DHA', [
          'DHA (Docosahexaenoic Acid)',
          'DHA',
          'Docosahexaenoic Acid (DHA)',
          'Docosahexaenoic acid (DHA)',
        ]),
        nutrientRow('ARA', [
          'ARA (Arachidonic Acid)',
          'Arachidonic Acid (ARA)',
          'ARA',
        ]),
        nutrientRow('Calcium', ['Calcium']),
        nutrientRow('Iron', ['Iron']),
        nutrientRow('Vitamin D', [
          'Vitamin D3',
          'Vitamin D',
          'Vitamin D (Vitamin D3)',
        ]),
        nutrientRow('Vitamin C', ['Vitamin C']),
        nutrientRow('Choline', ['Choline', 'Choline chloride']),
        nutrientRow('Taurine', ['Taurine']),
      ].filter((r): r is Row => r !== null);

      if (rows.length > 0) {
        out.push({
          name: 'Nutritional values · per 100ml prepared',
          rows,
        });
      }
    }
    return out;
  }, [products, productNutr, hasNutrition]);

  // ── Layout ────────────────────────────────────────────────────────
  return (
    <View
      style={{
        maxWidth: 1100,
        width: '100%',
        marginHorizontal: 'auto',
        paddingHorizontal: 32,
        paddingTop: 28,
        paddingBottom: 80,
        gap: 24,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: tokens.fonts.bodySemibold,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.32,
              textTransform: 'uppercase',
              color: tokens.colors.textMuted,
            }}
          >
            Head-to-head
          </Text>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 32,
              fontWeight: '600',
              letterSpacing: -0.704,
              color: tokens.colors.text,
              marginTop: 4,
            }}
          >
            {isSingle ? 'Product detail' : `${products.length}-way comparison`}
          </Text>
          <Text
            style={{
              color: tokens.colors.textMuted,
              fontSize: 13,
              marginTop: 2,
            }}
          >
            {isSingle
              ? 'Full technical spec — nutrition values are per 100ml of prepared formula.'
              : 'Best value in each row highlighted.'}
          </Text>
        </View>
        <View
          style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to results"
            onPress={() => router.replace('/compare')}
            style={ghostBtn(tokens)}
          >
            <Text style={ghostText(tokens)}>← Back to results</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear comparison"
            onPress={() => {
              clearTray();
              router.replace('/compare');
            }}
            style={ghostBtn(tokens)}
          >
            <Text style={ghostText(tokens)}>Clear</Text>
          </Pressable>
          <Link href="/calculator" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open Calculator"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 9,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: tokens.colors.accent,
              }}
            >
              <Text
                style={{
                  color: tokens.colors.textInverse,
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                Open Calculator →
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Horizontal scroll for ≥3 products on narrow viewports */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          style={{
            minWidth: 180 + products.length * 220,
          }}
        >
          {/* Product header row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              paddingVertical: 16,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: tokens.colors.border,
              gap: 0,
            }}
          >
            <View style={{ flexBasis: 180, flexShrink: 0 }}>
              <Text
                style={{
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.32,
                  textTransform: 'uppercase',
                  color: tokens.colors.textMuted,
                }}
              >
                Comparing
              </Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={{ flex: 1, paddingHorizontal: 12 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: tokens.colors.bg,
                    borderRadius: 6,
                    padding: 4,
                    marginBottom: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={getProductImage(p.img)}
                    accessibilityIgnoresInvertColors
                    style={{
                      width: '100%',
                      height: '100%',
                      resizeMode: 'contain',
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: tokens.fonts.displaySemibold,
                    fontSize: 14,
                    fontWeight: '600',
                    letterSpacing: -0.07,
                    color: tokens.colors.text,
                    lineHeight: 18,
                  }}
                  numberOfLines={2}
                >
                  {shortName(p.product)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: tokens.colors.textMuted,
                    marginTop: 2,
                  }}
                >
                  {p.brand} · {p.stage} · {p.packSize}g
                </Text>
              </View>
            ))}
          </View>

          {/* Section + row tree */}
          {sections.map((section) => (
            <Fragment key={section.name}>
              <View
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: section.accent
                    ? tokens.colors.accentTint
                    : tokens.colors.bgPanel,
                }}
              >
                <Text
                  style={{
                    fontFamily: tokens.fonts.bodySemibold,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.88,
                    textTransform: 'uppercase',
                    color: section.accent
                      ? tokens.colors.accentText
                      : tokens.colors.textMuted,
                  }}
                >
                  {section.name}
                </Text>
              </View>
              {section.rows.map((row, ri) => {
                const best = isSingle
                  ? -1
                  : bestIdx(row.values, row.lowBetter);
                return (
                  <View
                    key={row.label + ri}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderBottomColor: tokens.colors.divider,
                      backgroundColor:
                        ri % 2 === 0 ? 'transparent' : tokens.colors.bg,
                    }}
                  >
                    <Text
                      style={[
                        labelStyle(tokens),
                        { flexBasis: 180, flexShrink: 0 },
                      ]}
                    >
                      {row.label}
                    </Text>
                    {row.values.map((v, i) => {
                      const isBest = i === best;
                      return (
                        <View
                          key={i}
                          style={{
                            flex: 1,
                            backgroundColor: isBest
                              ? tokens.colors.accentTint
                              : 'transparent',
                          }}
                        >
                          <Text
                            style={[
                              dataStyle(tokens),
                              isBest && {
                                color: tokens.colors.accentText,
                                fontWeight: '600' as const,
                              },
                            ]}
                          >
                            {isBest ? '✓ ' : ''}
                            {row.fmt(v)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Disclaimer */}
      <View
        style={{
          padding: 16,
          borderRadius: 8,
          backgroundColor: tokens.colors.bgPanel,
          borderWidth: 1,
          borderColor: tokens.colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            lineHeight: 18,
            color: tokens.colors.textMuted,
          }}
        >
          <Text
            style={{
              color: tokens.colors.text,
              fontFamily: tokens.fonts.bodySemibold,
            }}
          >
            Nutritional values
          </Text>{' '}
          are based on prepared formula at standard dilution as stated on
          packaging. Values may differ by batch.
          {!hasNutrition && ' Nutrition data is not available for the selected product(s).'}{' '}
          This comparison is for informational purposes only and is not
          medical advice.
        </Text>
      </View>
    </View>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────
const ghostBtn = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  paddingVertical: 9,
  paddingHorizontal: 14,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: tokens.colors.border,
  backgroundColor: tokens.colors.bgCard,
});
const ghostText = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.bodyMedium,
  fontSize: 13,
  fontWeight: '500' as const,
  color: tokens.colors.text,
});
