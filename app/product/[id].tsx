/**
 * app/product/[id].tsx — Product Detail (`/product/[id]`). Phase 5 rebuild.
 *
 * Ported 1:1 from `MilkWiseFinalDesign/ui_kits/website/ProductDetail.jsx`
 * and the `.mw-pdp*` rules in `styles-pdp.css`. Layout:
 *
 *   1. Breadcrumb        ← All Products / Stage / Name
 *   2. Hero card         Image · badges · brand · title · desc (highlight) ·
 *                        best-for · 4 price tiles · 4 spec tiles · halal cert
 *   3. Price comparison  Same-stage ranking with $/gram bars (current row
 *                        highlighted; top-10 shown plus self if outside).
 *   4. Specifications    9-cell grid of stage / brand / origin / milk
 *                        origin / milk type / main sugar / probiotic /
 *                        hmo / specialty.
 *   5. Features & Claims ✓ list of applicable specialty / cert tags.
 *   6. Ingredients       Curated text (or synthesised fallback for the 2
 *                        design-only SKUs) with the highlight tokenizer
 *                        rendering coloured tone spans + a legend.
 *   7. Nutrition table   Bucketized per-100g/per-100mL grouped by
 *                        Macros / Vitamins / Minerals / Bioactives.
 *   8. You may also consider — 4 same-stage formulas closest by $/g.
 *   9. Disclaimer        — sourcing statement.
 *
 * Data:
 *   • `getFormulaByBaseId(id)` resolves the v1 URL slug to a Formula
 *     (single-variant: exact match; multi-variant: first variant of the
 *     same product line). Phase 4 Compare strips `--<size>` before linking.
 *   • `getFormulaNutrition(name)` reuses the prototype's fallback chain.
 *   • The hero / specs / ranking all read directly from the Formula's
 *     pre-derived numerics (no client-side recompute).
 */

import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Fragment, useMemo } from 'react';
import { View, Text, Pressable, Image, type ViewStyle } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/contexts/ThemeContext';
import {
  getAllFormulas,
  getFormulaByBaseId,
} from '../../src/data/formulas';
import { getFormulaNutrition } from '../../src/data/formulaNutrition';
import { getProductImage } from '../../src/data/imageMap';
import { fmtSGD, fmtPerGram } from '../../src/utils/formulaFormat';
import {
  shortName,
  milkSourceOf,
  specialtiesOf,
  originCountry,
  flagFor,
  bucketize,
  highlightSegments,
  ingredientsParagraph,
  SOURCE_EMOJI,
  type HighlightTone,
} from '../../src/utils/formulaClassifiers';
import type { Formula } from '../../src/types/formula';
import { PageMeta } from '../../src/components/PageMeta';

const ALL_FORMULAS = getAllFormulas();

// ── Hero badge tone palette (verbatim from styles-pdp.css 96–102) ──────
type BadgeTone =
  | 'stage' | 'budget' | 'mid' | 'premium' | 'halal' | 'organic' | 'warn';

const BADGE_PALETTE: Record<BadgeTone, { bg: string; border: string; fg: string }> = {
  stage:   { bg: '#ECF4E1', border: '#95B27D', fg: '#2F5A1E' },
  budget:  { bg: '#FBE9D9', border: '#B97742', fg: '#7A3E12' },
  mid:     { bg: '#E8F0FB', border: '#6E9BC9', fg: '#21528F' },
  premium: { bg: '#F2E6F4', border: '#B07ABB', fg: '#5A2D69' },
  halal:   { bg: '#E8F2DC', border: '#5F8F4D', fg: '#2F5A1E' },
  organic: { bg: '#E8F2DC', border: '#5F8F4D', fg: '#2F5A1E' },
  warn:    { bg: '#FCEBC0', border: '#B97742', fg: '#7A3E12' },
};

const HeroBadge = ({
  label,
  emoji,
  tone,
}: {
  label: string;
  emoji?: string;
  tone: BadgeTone;
}) => {
  const palette = BADGE_PALETTE[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: palette.border,
        backgroundColor: palette.bg,
      }}
    >
      {emoji && <Text style={{ fontSize: 12 }}>{emoji}</Text>}
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.8,
          color: palette.fg,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ── Highlight tone palette (ingredients) ───────────────────────────────
// Tone → { bg, fg } for the inline `<mark>`-style spans. Picked from the
// chip family in styles-v2.css so the ingredients legend reads coherently
// with the chips on the Compare page.
const HL_PALETTE: Record<HighlightTone, { bg: string; fg: string }> = {
  brain:    { bg: '#FBE9D9', fg: '#7A3E12' }, // amber — DHA/ARA
  gut:      { bg: '#F2E6F4', fg: '#5A2D69' }, // mauve — HMO / probiotic
  sugar:    { bg: '#FBF6EC', fg: '#6B4F1F' }, // cream — main sugars
  warn:     { bg: '#FCEBC0', fg: '#7A3E12' }, // butter — palm oil
  allergen: { bg: '#FBE9E8', fg: '#6B2520' }, // rose — allergens
  micro:    { bg: '#E8F2DC', fg: '#2F5A1E' }, // sage — vitamins/minerals
  cert:     { bg: '#E8F2DC', fg: '#2F5A1E' }, // sage — certifications
};

const HighlightedText = ({
  text,
  style,
}: {
  text: string;
  style?: { fontSize?: number; lineHeight?: number; color?: string };
}) => {
  const segs = highlightSegments(text);
  return (
    <Text style={style}>
      {segs.map((s, i) =>
        s.tone ? (
          <Text
            key={i}
            style={{
              backgroundColor: HL_PALETTE[s.tone].bg,
              color: HL_PALETTE[s.tone].fg,
              fontWeight: '600',
            }}
          >
            {s.text}
          </Text>
        ) : (
          <Text key={i}>{s.text}</Text>
        ),
      )}
    </Text>
  );
};

// ── Rank row (price comparison) ────────────────────────────────────────
const RankRow = ({
  rank,
  p,
  max,
  isCurrent,
}: {
  rank: number;
  p: Formula;
  max: number;
  isCurrent: boolean;
}) => {
  const { tokens } = useTheme();
  const pct = max > 0 ? (p.pricePerGram / max) * 100 : 0;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: isCurrent ? tokens.colors.accentTint : 'transparent',
        borderWidth: isCurrent ? 1 : 0,
        borderColor: tokens.colors.accent,
      }}
    >
      <Text
        style={{
          fontFamily: tokens.fonts.monoMedium,
          fontVariant: ['tabular-nums'],
          fontSize: 14,
          fontWeight: '500',
          color: isCurrent ? tokens.colors.accentText : tokens.colors.textMuted,
          width: 28,
        }}
      >
        {rank}
      </Text>
      <View
        style={{
          width: 32,
          height: 32,
          backgroundColor: tokens.colors.bg,
          borderRadius: 4,
          padding: 2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Image
          source={getProductImage(p.img)}
          accessibilityIgnoresInvertColors
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
        />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: tokens.fonts.body,
          fontSize: 13,
          fontWeight: isCurrent ? '600' : '500',
          color: tokens.colors.text,
        }}
        numberOfLines={1}
      >
        {shortName(p.product)}
      </Text>
      {/* Bar */}
      <View
        style={{
          flex: 1.5,
          height: 6,
          borderRadius: 3,
          backgroundColor: tokens.colors.bgPanel,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            backgroundColor: isCurrent
              ? tokens.colors.accent
              : tokens.colors.accentSoft,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: tokens.fonts.monoMedium,
          fontVariant: ['tabular-nums'],
          fontSize: 12,
          fontWeight: '500',
          color: tokens.colors.text,
          minWidth: 70,
          textAlign: 'right',
        }}
      >
        ${p.pricePerGram.toFixed(4)}/g
      </Text>
    </View>
  );
};

// ── Section card wrapper ──────────────────────────────────────────────
const PdpCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) => {
  const { tokens } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tokens.colors.bgCard,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radius.card,
          padding: 28,
          ...tokens.shadow.s1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// ── Page ──────────────────────────────────────────────────────────────
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens } = useTheme();

  const p = useMemo(() => (id ? getFormulaByBaseId(id) : undefined), [id]);

  if (!p) {
    return (
      <Screen>
        <PageMeta title="Formula not found" />
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
            Product not found
          </Text>
          <Text
            style={{
              color: tokens.colors.textMuted,
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            We couldn't find that product.
          </Text>
          <Pressable
            onPress={() => router.replace('/compare')}
            accessibilityRole="button"
            accessibilityLabel="Back to compare"
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
              Back to compare
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── Derived per-page data ─────────────────────────────────────────
  const sameStage = useMemo(
    () =>
      ALL_FORMULAS
        .filter((x) => x.stage === p.stage)
        .slice()
        .sort((a, b) => a.pricePerGram - b.pricePerGram),
    [p.stage],
  );
  const myRank = sameStage.findIndex((x) => x.id === p.id) + 1;
  const maxPpg = sameStage[sameStage.length - 1]?.pricePerGram ?? 0.1;

  // Price tier (Budget / Mid / Premium)
  const tier: 'BUDGET' | 'MID' | 'PREMIUM' =
    p.pricePerGram < 0.04
      ? 'BUDGET'
      : p.pricePerGram < 0.08
        ? 'MID'
        : 'PREMIUM';
  const tierTone: BadgeTone =
    tier === 'BUDGET' ? 'budget' : tier === 'MID' ? 'mid' : 'premium';

  const tags = specialtiesOf(p);
  const sourceKind = milkSourceOf(p);
  const sourceEmoji = SOURCE_EMOJI[sourceKind] || '🥛';
  const country = originCountry(p.manufacturedIn || p.origin);

  // Best-for blurb (matches the prototype's switch)
  const bestForLabel = (() => {
    if (sameStage[0]?.id === p.id) return 'Best for: Everyday value';
    if (myRank > 0 && myRank <= 3) return 'Best for: Affordable nutrition';
    if (tags.has('organic')) return 'Best for: Organic-first parents';
    if (tags.has('hypoallergenic')) return 'Best for: Sensitive babies';
    if (tags.has('lactose-free')) return 'Best for: Lactose intolerance';
    if (tags.has('anti-reflux')) return 'Best for: Babies with reflux';
    if (sourceKind === 'Goat') return 'Best for: Goat milk preference';
    if (sourceKind === 'Soy') return 'Best for: Soy-based diet';
    return 'Best for: Premium nutrition';
  })();

  // Cost per 180mL feed (matches design's calculation)
  const mlPerFeed = 180;
  const mlPerScoop = (p.waterPerScoop || 30) + (p.scoopSize || 4.4);
  const costPerMl = (p.pricePerScoop || 0.1) / Math.max(1, mlPerScoop);
  const costPerFeed = costPerMl * mlPerFeed;

  // Nutrition (per-100g/100mL table) — design fallback chain.
  const nutr = getFormulaNutrition(p.product);
  const buckets = bucketize(nutr);

  // Similar — different product, same stage, sorted by $/g proximity.
  const similar = useMemo(
    () =>
      ALL_FORMULAS
        .filter((x) => x.product !== p.product && x.stage === p.stage)
        .sort(
          (a, b) =>
            Math.abs(a.pricePerGram - p.pricePerGram) -
            Math.abs(b.pricePerGram - p.pricePerGram),
        )
        .slice(0, 4),
    [p],
  );

  const ingredientsText = p.ingredients ?? ingredientsParagraph(p);

  return (
    <Screen>
      <PageMeta title={p.product} description={`Prices, ingredients, and full nutrition for ${p.product} in Singapore.`} />
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
        {/* ── 1. Breadcrumb ─────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/compare" asChild>
            <Pressable accessibilityRole="link">
              <Text
                style={{
                  color: tokens.colors.accentText,
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 12.5,
                  fontWeight: '600',
                }}
              >
                ← All Products
              </Text>
            </Pressable>
          </Link>
          <Text style={{ color: tokens.colors.textFaint, fontSize: 12.5 }}>
            /
          </Text>
          <Text style={{ color: tokens.colors.textMuted, fontSize: 12.5 }}>
            {p.stage}
          </Text>
          <Text style={{ color: tokens.colors.textFaint, fontSize: 12.5 }}>
            /
          </Text>
          <Text
            style={{
              color: tokens.colors.text,
              fontFamily: tokens.fonts.bodySemibold,
              fontSize: 12.5,
              fontWeight: '500',
            }}
          >
            {shortName(p.product)}
          </Text>
        </View>

        {/* ── 2. Hero card ─────────────────────────────────── */}
        <PdpCard>
          <View
            style={{
              flexDirection: 'row',
              gap: 32,
              flexWrap: 'wrap',
            }}
          >
            {/* Image */}
            <View
              style={{
                width: 280,
                height: 320,
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Image
                source={getProductImage(p.img)}
                accessibilityLabel={p.product}
                style={{
                  width: '100%',
                  height: '100%',
                  resizeMode: 'contain',
                }}
              />
            </View>

            {/* Meta */}
            <View style={{ flex: 1, minWidth: 280, gap: 12 }}>
              {/* Badges */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <HeroBadge label={p.stage} tone="stage" />
                <HeroBadge label={tier} tone={tierTone} />
                {tags.has('halal') && (
                  <HeroBadge label="HALAL" emoji="☪️" tone="halal" />
                )}
                {tags.has('organic') && (
                  <HeroBadge label="ORGANIC" emoji="🌿" tone="organic" />
                )}
                {tags.has('hypoallergenic') && (
                  <HeroBadge label="HYPOALLERGENIC" emoji="🛡️" tone="warn" />
                )}
                {tags.has('anti-reflux') && (
                  <HeroBadge label="ANTI-REFLUX" emoji="🔄" tone="warn" />
                )}
                {tags.has('lactose-free') && (
                  <HeroBadge label="LACTOSE-FREE" emoji="🚫" tone="warn" />
                )}
              </View>

              {/* Brand */}
              <Text
                style={{
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 0.88,
                  textTransform: 'uppercase',
                  color: tokens.colors.textMuted,
                }}
              >
                {p.brand.toUpperCase()}
              </Text>

              {/* Title */}
              <Text
                style={{
                  fontFamily: tokens.fonts.displayBold,
                  fontSize: 28,
                  fontWeight: '700',
                  letterSpacing: -0.616,
                  lineHeight: 32,
                  color: tokens.colors.text,
                }}
              >
                {shortName(p.product)}
              </Text>

              {/* Desc with inline highlights */}
              <HighlightedText
                text={`Nutritionally complete and ${
                  tier === 'BUDGET'
                    ? 'affordable'
                    : tier === 'MID'
                      ? 'well-balanced'
                      : 'premium'
                } formula backed by decades of infant nutrition research. Contains DHA, ARA, vitamins and minerals for healthy growth.`}
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: tokens.colors.textMuted,
                }}
              />

              {/* Best-for callout */}
              <View
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor: tokens.colors.accentTint,
                  borderWidth: 1,
                  borderColor: tokens.colors.accent,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: tokens.fonts.bodyMedium,
                    fontWeight: '500',
                    color: tokens.colors.accentText,
                  }}
                >
                  ✓ {bestForLabel}
                </Text>
              </View>

              {/* Pricing label */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: tokens.fonts.bodySemibold,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.88,
                    textTransform: 'uppercase',
                    color: tokens.colors.textMuted,
                  }}
                >
                  PRICING
                </Text>
                <Text
                  style={{
                    fontFamily: tokens.fonts.monoMedium,
                    fontSize: 11,
                    letterSpacing: 0.66,
                    color: tokens.colors.textMuted,
                  }}
                >
                  {p.packSize} G TIN
                </Text>
              </View>

              {/* 4 price tiles */}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { v: fmtSGD(p.price), l: '1 tin' },
                  { v: `$${p.pricePerGram.toFixed(4)}`, l: '$ / gram' },
                  { v: `$${(p.pricePerScoop || 0).toFixed(3)}`, l: '$ / scoop' },
                  { v: `$${costPerFeed.toFixed(3)}`, l: '$ / feed' },
                ].map((t, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      minWidth: 90,
                      backgroundColor: tokens.colors.bgPanel,
                      borderWidth: 1,
                      borderColor: tokens.colors.border,
                      borderRadius: 8,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: tokens.fonts.monoMedium,
                        fontVariant: ['tabular-nums'],
                        fontSize: 18,
                        fontWeight: '600',
                        color: tokens.colors.text,
                      }}
                    >
                      {t.v}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        letterSpacing: 0.6,
                        color: tokens.colors.textMuted,
                        textTransform: 'uppercase',
                        marginTop: 2,
                      }}
                    >
                      {t.l}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 4 spec tiles */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 0,
                  marginTop: 4,
                  backgroundColor: tokens.colors.bgPanel,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: tokens.colors.border,
                }}
              >
                {[
                  { l: 'SCOOP SIZE', v: `${(p.scoopSize || 4.4).toFixed(1)}g` },
                  { l: 'WATER PER SCOOP', v: `${p.waterPerScoop || 30}mL` },
                  {
                    l: 'SCOOPS PER TIN',
                    v: `${Math.round(p.scoopsPerTin || 0)}`,
                  },
                  { l: 'TIN SIZE', v: `${p.packSize} g` },
                ].map((t, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderLeftWidth: i > 0 ? 1 : 0,
                      borderLeftColor: tokens.colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '700',
                        letterSpacing: 0.54,
                        color: tokens.colors.textMuted,
                        textTransform: 'uppercase',
                      }}
                    >
                      {t.l}
                    </Text>
                    <Text
                      style={{
                        fontFamily: tokens.fonts.monoMedium,
                        fontVariant: ['tabular-nums'],
                        fontSize: 14,
                        fontWeight: '600',
                        color: tokens.colors.text,
                        marginTop: 2,
                      }}
                    >
                      {t.v}
                    </Text>
                  </View>
                ))}
              </View>

              {tags.has('halal') && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: '#E8F2DC',
                    alignSelf: 'flex-start',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: '#2F5A1E', fontSize: 12 }}>✓</Text>
                  <Text
                    style={{
                      color: '#2F5A1E',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    Halal Certified
                  </Text>
                </View>
              )}
            </View>
          </View>
        </PdpCard>

        {/* ── 3. Price comparison ──────────────────────────── */}
        <PdpCard>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 18,
              fontWeight: '600',
              color: tokens.colors.text,
              marginBottom: 4,
            }}
          >
            💰 Price comparison — {p.stage} ($ per gram, low to high)
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: tokens.colors.textMuted,
              marginBottom: 16,
            }}
          >
            Ranked #{myRank} of {sameStage.length} products by $/gram.
            Default tin size shown.
          </Text>
          <View style={{ gap: 2 }}>
            {sameStage.slice(0, 10).map((x, i) => (
              <RankRow
                key={x.id}
                rank={i + 1}
                p={x}
                max={maxPpg}
                isCurrent={x.id === p.id}
              />
            ))}
            {myRank > 10 && (
              <RankRow rank={myRank} p={p} max={maxPpg} isCurrent />
            )}
          </View>
        </PdpCard>

        {/* ── 4. Specifications ────────────────────────────── */}
        <PdpCard>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 18,
              fontWeight: '600',
              color: tokens.colors.text,
              marginBottom: 16,
            }}
          >
            📋 Product Specifications
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {[
              { l: 'STAGE', v: p.stage },
              { l: 'BRAND', v: p.brand },
              {
                l: 'COUNTRY OF MFG.',
                v: `${flagFor(country)} ${country || '—'}`,
              },
              {
                l: 'MILK ORIGIN',
                v:
                  p.milkOrigin && !p.milkOrigin.startsWith('Not specified')
                    ? p.milkOrigin
                    : '—',
              },
              { l: 'MILK TYPE', v: `${sourceEmoji} ${sourceKind}` },
              { l: 'MAIN SUGAR SOURCE', v: p.mainSugar || '—' },
              {
                l: 'PROBIOTIC',
                v:
                  p.probiotic &&
                  p.probiotic.length > 2 &&
                  !p.probiotic.toLowerCase().startsWith('no')
                    ? p.probiotic
                    : 'None',
              },
              {
                l: 'HMO / PREBIOTICS',
                v:
                  p.hmo &&
                  p.hmo.length > 2 &&
                  !p.hmo.toLowerCase().startsWith('no')
                    ? p.hmo
                    : 'None',
              },
              {
                l: 'SPECIALTY',
                v:
                  tier === 'BUDGET'
                    ? 'Budget'
                    : tier === 'MID'
                      ? 'Mid-range'
                      : 'Premium',
              },
            ].map((s, i) => (
              <View
                key={i}
                style={{
                  width: '50%',
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.colors.divider,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 0.6,
                    color: tokens.colors.textMuted,
                    textTransform: 'uppercase',
                  }}
                >
                  {s.l}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: tokens.colors.text,
                    marginTop: 4,
                  }}
                >
                  {s.v}
                </Text>
              </View>
            ))}
          </View>
        </PdpCard>

        {/* ── 5. Features & Claims ─────────────────────────── */}
        <PdpCard>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 18,
              fontWeight: '600',
              color: tokens.colors.text,
              marginBottom: 16,
            }}
          >
            ⭐ Features & Claims
          </Text>
          {(() => {
            const claims: string[] = [];
            if (tags.has('halal')) claims.push('Halal Certified');
            if (tags.has('organic')) claims.push('Certified Organic');
            if (tags.has('hypoallergenic')) claims.push('Hypoallergenic (HA)');
            if (tags.has('anti-reflux')) claims.push('Anti-Reflux (AR)');
            if (tags.has('lactose-free')) claims.push('Lactose-Free');
            if (tags.has('hmo')) claims.push('Contains HMO');
            if (tags.has('probiotic')) claims.push('Probiotic added');
            if (tags.has('palm-free')) claims.push('No palm oil');
            if (tags.has('phf'))
              claims.push('Partially hydrolyzed (pHF)');
            if (tags.has('ehf'))
              claims.push('Extensively hydrolyzed (eHF)');
            if (tags.has('premature'))
              claims.push('For premature / low birth weight');
            if (claims.length === 0) {
              return (
                <Text
                  style={{
                    color: tokens.colors.textMuted,
                    fontSize: 14,
                    fontStyle: 'italic',
                  }}
                >
                  No additional claims listed for this product.
                </Text>
              );
            }
            return (
              <View style={{ gap: 10 }}>
                {claims.map((c, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{ color: tokens.colors.accentText, fontSize: 14 }}
                    >
                      ✓
                    </Text>
                    <Text style={{ color: tokens.colors.text, fontSize: 14 }}>
                      {c}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })()}
        </PdpCard>

        {/* ── 6. Ingredients ───────────────────────────────── */}
        <PdpCard>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 18,
              fontWeight: '600',
              color: tokens.colors.text,
              marginBottom: 12,
            }}
          >
            🌿 Full Ingredients List
          </Text>
          {p.allergens && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                padding: 12,
                borderRadius: 8,
                backgroundColor: tokens.colors.warnBg,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text
                style={{
                  color: tokens.colors.warnText,
                  fontSize: 13,
                  flex: 1,
                  lineHeight: 19,
                }}
              >
                <Text style={{ fontFamily: tokens.fonts.bodySemibold }}>
                  Allergen info:{' '}
                </Text>
                {p.allergens.replace(/^Contains:\s*/i, '')}
              </Text>
            </View>
          )}
          <HighlightedText
            text={ingredientsText}
            style={{
              fontSize: 13,
              lineHeight: 22,
              color: tokens.colors.text,
            }}
          />
          {/* Legend */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 14,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: tokens.fonts.bodySemibold,
                color: tokens.colors.textMuted,
              }}
            >
              Highlights:
            </Text>
            {[
              { tone: 'brain' as const, label: 'DHA / ARA brain & eye' },
              { tone: 'gut' as const, label: 'HMO / probiotic gut' },
              { tone: 'micro' as const, label: 'vitamins & minerals' },
              { tone: 'sugar' as const, label: 'main sugars' },
              { tone: 'allergen' as const, label: 'allergens' },
              { tone: 'warn' as const, label: 'palm oil' },
            ].map((l) => (
              <View
                key={l.tone}
                style={{
                  paddingVertical: 2,
                  paddingHorizontal: 7,
                  borderRadius: 4,
                  backgroundColor: HL_PALETTE[l.tone].bg,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: HL_PALETTE[l.tone].fg,
                    fontWeight: '600',
                  }}
                >
                  {l.label}
                </Text>
              </View>
            ))}
          </View>
          <Text
            style={{
              fontSize: 11,
              color: tokens.colors.textFaint,
              marginTop: 10,
              fontStyle: 'italic',
            }}
          >
            Ingredients listed in descending order by weight as declared on
            product label.
          </Text>
        </PdpCard>

        {/* ── 7. Nutrition table ───────────────────────────── */}
        <PdpCard>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 18,
              fontWeight: '600',
              color: tokens.colors.text,
              marginBottom: 16,
            }}
          >
            📊 Nutritional Information (per 100g powder)
          </Text>
          {buckets.length > 0 ? (
            <View>
              {/* Header row */}
              <View
                style={{
                  flexDirection: 'row',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.colors.borderStrong,
                }}
              >
                <Text style={[nutHeader(tokens), { flex: 2 }]}>Nutrient</Text>
                <Text style={[nutHeader(tokens), { width: 60 }]}>Unit</Text>
                <Text
                  style={[nutHeader(tokens), { width: 80, textAlign: 'right' }]}
                >
                  Per 100g
                </Text>
                <Text
                  style={[nutHeader(tokens), { width: 80, textAlign: 'right' }]}
                >
                  Per 100mL
                </Text>
              </View>
              {buckets.map((b) => (
                <Fragment key={b.name}>
                  <View
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 0,
                      backgroundColor: tokens.colors.bgPanel,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: tokens.fonts.bodySemibold,
                        fontSize: 10,
                        fontWeight: '700',
                        letterSpacing: 0.8,
                        color: tokens.colors.textMuted,
                        textTransform: 'uppercase',
                        paddingHorizontal: 8,
                      }}
                    >
                      {b.name.toUpperCase()}
                    </Text>
                  </View>
                  {b.rows.map(([k, v], i) => (
                    <View
                      key={k}
                      style={{
                        flexDirection: 'row',
                        paddingVertical: 6,
                        paddingHorizontal: 0,
                        backgroundColor:
                          i % 2 === 0 ? 'transparent' : tokens.colors.bg,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={[nutCell(tokens), { flex: 2 }]}>{k}</Text>
                      <Text style={[nutCell(tokens), { width: 60 }]}>
                        {v.unit || ''}
                      </Text>
                      <Text
                        style={[
                          nutNum(tokens),
                          { width: 80, textAlign: 'right' },
                        ]}
                      >
                        {v.per100g != null
                          ? Number(v.per100g).toLocaleString()
                          : '—'}
                      </Text>
                      <Text
                        style={[
                          nutNum(tokens),
                          { width: 80, textAlign: 'right' },
                        ]}
                      >
                        {v.per100ml != null
                          ? Number(v.per100ml).toLocaleString()
                          : '—'}
                      </Text>
                    </View>
                  ))}
                </Fragment>
              ))}
            </View>
          ) : (
            <Text
              style={{
                color: tokens.colors.textMuted,
                fontSize: 14,
                fontStyle: 'italic',
              }}
            >
              Nutritional breakdown not yet available for this product.
            </Text>
          )}
          <Text
            style={{
              fontSize: 11,
              color: tokens.colors.textFaint,
              marginTop: 14,
              fontStyle: 'italic',
            }}
          >
            * Values per 100g of powder unless otherwise stated. Source:
            product label.
          </Text>
        </PdpCard>

        {/* ── 8. Similar ──────────────────────────────────── */}
        <PdpCard>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 18,
              fontWeight: '600',
              color: tokens.colors.text,
              marginBottom: 16,
            }}
          >
            🔗 You may also consider
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {similar.map((x) => {
              const baseId = x.id.split('--')[0];
              return (
                <Link
                  key={x.id}
                  href={`/product/${baseId}` as never}
                  asChild
                >
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`View ${shortName(x.product)}`}
                    style={{
                      flexBasis: '23%',
                      minWidth: 180,
                      flexGrow: 1,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: tokens.colors.border,
                      backgroundColor: tokens.colors.bgPanel,
                    }}
                  >
                    <View
                      style={{
                        width: '100%',
                        aspectRatio: 1,
                        backgroundColor: tokens.colors.bg,
                        borderRadius: 6,
                        padding: 8,
                        marginBottom: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={getProductImage(x.img)}
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
                        fontFamily: tokens.fonts.bodySemibold,
                        fontSize: 10,
                        fontWeight: '700',
                        letterSpacing: 0.6,
                        textTransform: 'uppercase',
                        color: tokens.colors.textMuted,
                      }}
                    >
                      {x.brand.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        fontFamily: tokens.fonts.displaySemibold,
                        fontSize: 13,
                        fontWeight: '600',
                        color: tokens.colors.text,
                        marginTop: 2,
                        lineHeight: 17,
                      }}
                      numberOfLines={2}
                    >
                      {shortName(x.product)}
                    </Text>
                    <Text
                      style={{
                        fontFamily: tokens.fonts.monoMedium,
                        fontVariant: ['tabular-nums'],
                        fontSize: 12,
                        color: tokens.colors.accentText,
                        marginTop: 6,
                      }}
                    >
                      {fmtSGD(x.price)} / {x.packSize}g
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </PdpCard>

        {/* ── 9. Disclaimer ───────────────────────────────── */}
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
              Disclaimer:{' '}
            </Text>
            All product data, prices, and nutrient information were sourced
            from publicly available product labels and major Singapore
            retailers. Always verify current pricing and check the actual
            product label for the most up-to-date ingredient and nutrient
            details.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

// ── Small style helpers (nutrition table cells) ───────────────────────
const nutHeader = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.bodySemibold,
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 0.66,
  color: tokens.colors.textMuted,
  textTransform: 'uppercase' as const,
  paddingHorizontal: 8,
});
const nutCell = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontSize: 13,
  color: tokens.colors.text,
  paddingHorizontal: 8,
});
const nutNum = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.monoMedium,
  // No `as const` — RN's TextStyle.fontVariant is mutable, and a readonly
  // tuple isn't assignable to it. The array is locally allocated, so
  // mutability isn't a real risk.
  fontVariant: ['tabular-nums'] as ['tabular-nums'],
  fontSize: 13,
  color: tokens.colors.text,
  paddingHorizontal: 8,
});
