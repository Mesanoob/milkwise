/**
 * app/product/[id].tsx — product detail screen.
 *
 * Layout (matches design handoff `product.html`):
 *
 *   1. Breadcrumb        "← All Products / Stage X / Name"
 *   2. Hero card         left: image + variant cards
 *                        right: badges, name, desc, "best for", pricing grid,
 *                               scoop info, feature pills
 *   3. Price comparison  same-stage products ranked by $/g with bar fills
 *   4. Specs table       2-col grid of attribute key→value rows
 *   5. All-sizes table   pricing breakdown across every variant (this product)
 *   6. Features & claims grid of green-light feature cards
 *   7. Nutrition summary 5 stat cards (energy/protein/fat/carbs/DHA)
 *   8. Ingredients       allergen warning + ingredient text
 *   9. Full nutrition    categorised table (macros / vitamins / minerals / bioactives)
 *  10. Similar products  4 same-stage / same-specialty cards
 *  11. Disclaimer
 *
 * The screen reads filter state via the ProductsContext so navigating back
 * via "← All Products" preserves the user's filter intent (bug fix from
 * Session 2).
 *
 * v2 re-skin (CLAUDE.md §9b Phase 4): all structural colour comes from
 * `useTheme().tokens` so light/dark flips with no per-component hex. The
 * specialty/stage/macro hue pairs are spec-exact per the design handoff and
 * deliberately survive the re-skin unchanged (§7b) — they do NOT theme.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { EmptyState } from '../../src/components/EmptyState';
import type { Product, ProductDetail, NutrientRow } from '../../src/types/product';
import { getProductRepository } from '../../src/services/productRepository';
import { getProductImage } from '../../src/data/imageMap';
import { getAllProducts } from '../../src/data/products';
import { formatWeight } from '../../src/utils/format';
import { labelForSpecialty } from '../../src/utils/strings';
import { getOriginFlag, getMilkTypeIcon } from '../../src/utils/icons';
import { specialtyColors, type SpecialtyKey } from '../../src/config/theme';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens } = useTheme();

  const [product, setProduct] = useState<Product | null>(null);
  const [detail,  setDetail]  = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Variant selector — clicking a variant card swaps the displayed metrics.
  const [variantIndex, setVariantIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const repo = await getProductRepository();
        const [p, d] = await Promise.all([
          repo.getProductById(id),
          repo.getProductDetail(id),
        ]);
        if (cancelled) return;
        if (!p) {
          setError(`No product found with id "${id}".`);
        } else {
          setProduct(p);
          setDetail(d ?? null);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Same-stage list for the price comparison block — sorted ascending by
  // $/g so the cheapest is at the top. We compute this once per product
  // change rather than on every render.
  const stageProducts = useMemo(() => {
    if (!product) return [] as Product[];
    return getAllProducts()
      .filter((q) => q.stage === product.stage)
      .sort((a, b) => (a.pricePerGram ?? Infinity) - (b.pricePerGram ?? Infinity));
  }, [product]);

  // Similar products — same stage OR same specialty OR same non-cow milk
  // type. Excludes the current product and caps at 4.
  const similarProducts = useMemo(() => {
    if (!product) return [] as Product[];
    return getAllProducts()
      .filter((q) => q.id !== product.id && (
        q.stage === product.stage ||
        (q.specialty && q.specialty === product.specialty) ||
        (q.milkType === product.milkType && q.milkType !== 'cow')
      ))
      .slice(0, 4);
  }, [product]);

  if (loading) {
    return (
      <Screen>
        <View className="px-4 py-12 items-center">
          <Text className="text-mw-text-muted text-sm font-body">Loading product…</Text>
        </View>
      </Screen>
    );
  }

  if (error || !product) {
    return (
      <Screen>
        <EmptyState
          title="Product not found"
          description={error ?? "We couldn't find that product."}
          actionLabel="Back to compare"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const variant = product.variants[variantIndex] ?? product.variants[0];
  const maxPpg = stageProducts.length
    ? (stageProducts[stageProducts.length - 1].pricePerGram ?? 1)
    : 1;
  const rankInStage = stageProducts.findIndex((q) => q.id === product.id) + 1;

  const features: Array<{ key: string; label: string; icon: string }> = [
    product.halal       && { key: 'halal',       label: 'Halal Certified',         icon: '✅' },
    product.organic     && { key: 'organic',     label: 'Certified Organic',       icon: '🌿' },
    product.palmFree    && { key: 'palmFree',    label: 'Palm Oil-Free',           icon: '🌴' },
    product.lactoseFree && { key: 'lactoseFree', label: 'Lactose-Free',            icon: '🚫' },
    product.ar          && { key: 'ar',          label: 'Anti-Reflux Formula',     icon: '🛡️' },
    product.ha          && { key: 'ha',          label: 'Hydrolysed Protein (HA)', icon: '🧬' },
    product.soyBased    && { key: 'soyBased',    label: 'Soy-Based (No Cow Milk)', icon: '🌱' },
    product.partialHydro && { key: 'phf',        label: 'Partially Hydrolysed',    icon: '⚗️' },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: string }>;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View
          className="w-full"
          style={{ maxWidth: 1100, marginHorizontal: 'auto', paddingHorizontal: 16, paddingTop: 28 }}
        >
          {/* ── Breadcrumb ─────────────────────────────────────────────── */}
          <View className="flex-row items-center flex-wrap gap-1.5 mb-5">
            <Link href="/" asChild>
              <Pressable accessibilityRole="link">
                <Text className="text-[12.5px] text-mw-accent font-body-semibold">
                  ← All Products
                </Text>
              </Pressable>
            </Link>
            <Text className="text-[12.5px] text-mw-text-muted font-body">/</Text>
            <Text className="text-[12.5px] text-mw-text-muted font-body">{product.stage}</Text>
            <Text className="text-[12.5px] text-mw-text-muted font-body">/</Text>
            <Text className="text-[12.5px] text-mw-text font-body-medium">{product.name}</Text>
          </View>

          {/* ── Hero card ──────────────────────────────────────────────── */}
          <Card>
            <View className="flex-row flex-wrap gap-8">
              {/* LEFT: image + variant cards */}
              <View
                className="gap-4"
                style={{ flexBasis: 320, flexGrow: 0, flexShrink: 1, minWidth: 280 }}
              >
                {/* Product-tin photography is shot on white; the hero plate
                    stays a fixed white in BOTH themes for image legibility
                    (theme-independent backdrop per CLAUDE.md §9b). Only the
                    hairline border flips. */}
                <View
                  className="rounded-2xl items-center justify-center overflow-hidden"
                  style={{ aspectRatio: 1, padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: tokens.colors.border }}
                >
                  <Image
                    source={getProductImage(variant?.img ?? product.img)}
                    resizeMode="contain"
                    style={{ width: '100%', height: '100%' }}
                    accessibilityLabel={product.fullName}
                  />
                </View>

                {product.variants.length > 1 && (
                  <View>
                    <Text className="text-[11px] font-body-semibold text-mw-text-muted uppercase tracking-wider mb-2.5">
                      Available Sizes
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {product.variants.map((vt, i) => {
                        const isActive = i === variantIndex;
                        return (
                          <Pressable
                            key={i}
                            onPress={() => setVariantIndex(i)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: isActive }}
                            accessibilityLabel={`Select ${formatWeight(vt.weightG)} variant`}
                            style={{
                              flex: 1,
                              flexBasis: 80,
                              minWidth: 80,
                              alignItems: 'center',
                              borderRadius: 12,
                              borderWidth: 2,
                              borderColor: isActive ? tokens.colors.accent : tokens.colors.border,
                              backgroundColor: isActive ? tokens.colors.accentTint : tokens.colors.bgCard,
                              padding: 14,
                            }}
                          >
                            <View
                              style={{
                                width: 48, height: 48,
                                backgroundColor: isActive ? tokens.colors.bgCard : tokens.colors.bgPanel,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                marginBottom: 6,
                              }}
                            >
                              <Image
                                source={getProductImage(vt.img)}
                                resizeMode="contain"
                                style={{ width: 42, height: 42 }}
                                accessibilityLabel=""
                                accessibilityElementsHidden
                              />
                            </View>
                            <Text
                              className="font-body-semibold text-[12px]"
                              style={{ color: isActive ? tokens.colors.accent : tokens.colors.text }}
                            >
                              {formatWeight(vt.weightG)}
                            </Text>
                            <Text
                              className="font-body-semibold text-[11px] mt-0.5"
                              style={{ color: isActive ? tokens.colors.accentHover : tokens.colors.textMuted }}
                            >
                              ${vt.price.toFixed(2)}
                            </Text>
                            <Text
                              className="font-body text-[10px] mt-0.5"
                              style={{ color: isActive ? tokens.colors.accentHover : tokens.colors.textMuted }}
                            >
                              ${(vt.pricePerGram ?? 0).toFixed(4)}/g
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* RIGHT: identity + price + scoop info + features */}
              <View className="flex-1 gap-5" style={{ minWidth: 280 }}>
                {/* Badges row */}
                <View className="flex-row flex-wrap items-center gap-2">
                  <Badge bg={tokens.colors.accent} fg={tokens.colors.textInverse} label={product.stage} />
                  {product.specialty && (
                    <SpecialtyBadge specialty={product.specialty as SpecialtyKey} />
                  )}
                  {product.halal && (
                    <Badge bg="#D1FAE5" fg="#065F46" label="Halal" />
                  )}
                  {product.organic && (
                    <Badge bg="#DCFCE7" fg="#166534" label="🌿 Organic" />
                  )}
                </View>

                {/* Brand kicker + name */}
                <View>
                  <Text className="text-[12px] font-body-semibold text-mw-text-muted uppercase tracking-wider mb-1.5">
                    {product.brand}
                  </Text>
                  <Text
                    className="font-display-bold text-mw-text leading-tight"
                    style={{ fontSize: 28 }}
                  >
                    {product.fullName}
                  </Text>
                </View>

                {/* Description */}
                <Text className="text-[14.5px] text-mw-text-muted font-body" style={{ lineHeight: 24 }}>
                  {product.desc}
                </Text>

                {/* Best-for */}
                {product.bestFor && (
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: tokens.colors.accentTint,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: tokens.colors.accentSoft,
                    }}
                  >
                    <Text className="text-[13px] font-body">
                      <Text className="font-body-semibold" style={{ color: tokens.colors.accent }}>✓ Best for: </Text>
                      <Text style={{ color: tokens.colors.accentHover }}>{product.bestFor}</Text>
                    </Text>
                  </View>
                )}

                {/* Pricing grid */}
                <View>
                  <Text className="text-[11px] font-body-semibold text-mw-text-muted uppercase tracking-wider mb-2.5">
                    Pricing — {formatWeight(variant?.weightG ?? 0)} tin
                  </Text>
                  <View className="flex-row flex-wrap gap-2.5">
                    <StatBox label="Tin Price"    value={`$${(variant?.price ?? 0).toFixed(2)}`} />
                    <StatBox label="$ / gram"    value={`$${(variant?.pricePerGram ?? 0).toFixed(4)}`} highlight />
                    <StatBox label="$ / scoop"   value={`$${(variant?.pricePerScoop ?? 0).toFixed(3)}`} />
                    <StatBox label="$ / mL prep" value={`$${(variant?.pricePerMl ?? 0).toFixed(4)}`} />
                  </View>
                </View>

                {/* Scoop info strip */}
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: tokens.colors.bgPanel,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: tokens.colors.border,
                  }}
                >
                  <View className="flex-row flex-wrap gap-6">
                    <ScoopFact label="Scoop size"      value={`${variant?.scoopG ?? 0}g`} />
                    <ScoopFact label="Water per scoop" value={`${variant?.waterMl ?? 0}mL`} />
                    <ScoopFact label="Scoops per tin"  value={`${(variant?.scoopsPerTin ?? 0).toFixed(0)}`} />
                    <ScoopFact label="Tin weight"      value={formatWeight(variant?.weightG ?? 0)} />
                  </View>
                </View>

                {/* Feature pills */}
                {features.length > 0 && (
                  <View className="flex-row flex-wrap gap-1.5">
                    {features.map((f) => (
                      <InfoPill key={f.key} icon={f.icon} label={f.label} />
                    ))}
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* ── Price comparison in stage ──────────────────────────────── */}
          <Card style={{ marginTop: 24 }}>
            <SectionHead icon="💰" title={`Price comparison — ${product.stage} ($ per gram, low to high)`} />
            <Text className="text-[12px] text-mw-text-muted font-body mb-4">
              Ranked #{rankInStage} of {stageProducts.length} products by $/gram · Default size shown
            </Text>
            <View className="gap-2">
              {stageProducts.slice(0, 10).map((q, i) => {
                const isThis = q.id === product.id;
                const ppg = q.pricePerGram ?? 0;
                const pct = Math.min(100, Math.round((ppg / maxPpg) * 100));
                return (
                  <Pressable
                    key={q.id}
                    onPress={() => router.push(`/product/${q.id}`)}
                    accessibilityRole="link"
                    accessibilityLabel={`View ${q.name}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: isThis ? tokens.colors.accentTint : tokens.colors.bgPanel,
                      borderWidth: 1.5,
                      borderColor: isThis ? tokens.colors.accent : tokens.colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: isThis ? tokens.colors.accent : tokens.colors.border,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text
                        className="font-body-semibold text-[10px]"
                        style={{ color: isThis ? tokens.colors.textInverse : tokens.colors.textMuted }}
                      >
                        {i + 1}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 32, height: 32,
                        backgroundColor: tokens.colors.bgCard,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: tokens.colors.border,
                        alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={getProductImage(q.variants[0]?.img ?? q.img)}
                        resizeMode="contain"
                        style={{ width: 28, height: 28 }}
                        accessibilityLabel=""
                        accessibilityElementsHidden
                      />
                    </View>
                    <View className="flex-1 min-w-0 gap-1">
                      <Text
                        className="font-body text-[12.5px]"
                        numberOfLines={1}
                        style={{
                          fontWeight: isThis ? '700' : '500',
                          color: isThis ? tokens.colors.accent : tokens.colors.text,
                        }}
                      >
                        {q.name}
                      </Text>
                      <View
                        style={{
                          width: `${pct}%`,
                          height: 6,
                          backgroundColor: isThis ? tokens.colors.accent : tokens.colors.border,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    <Text
                      className="font-body-semibold text-[13px]"
                      style={{ color: isThis ? tokens.colors.accent : tokens.colors.text }}
                    >
                      ${ppg.toFixed(4)}/g
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* ── Specs table ────────────────────────────────────────────── */}
          <Card style={{ marginTop: 24 }}>
            <SectionHead icon="📋" title="Product Specifications" />
            <View>
              {(() => {
                const specs: Array<{ l: string; v: string }> = [
                  { l: 'Stage',             v: product.stage },
                  { l: 'Brand',             v: product.brand },
                  { l: 'Country of Mfg.',   v: `${getOriginFlag(product.origin)} ${product.origin}` },
                  { l: 'Milk Origin',       v: product.milkOrigin || '—' },
                  { l: 'Milk Type',         v: `${getMilkTypeIcon(product.milkType)} ${product.milkType.charAt(0).toUpperCase()}${product.milkType.slice(1)}` },
                  { l: 'Main Sugar Source', v: product.mainSugar || '—' },
                  { l: 'Probiotic',         v: product.probiotic || 'None' },
                  { l: 'HMO / Prebiotics',  v: product.hmo || 'None' },
                ];
                if (product.specialty) {
                  specs.push({ l: 'Specialty', v: labelForSpecialty(product.specialty) });
                }
                // Render in pairs (2 columns) — wrap automatically on narrow screens.
                return (
                  <View className="flex-row flex-wrap">
                    {specs.map((s, i) => (
                      <View
                        key={s.l}
                        style={{
                          flexBasis: '50%',
                          flexGrow: 1,
                          flexShrink: 0,
                          minWidth: 240,
                          paddingVertical: 10,
                          paddingRight: i % 2 === 0 ? 24 : 0,
                          paddingLeft:  i % 2 === 1 ? 24 : 0,
                          borderRightWidth: i % 2 === 0 ? 1 : 0,
                          borderRightColor: tokens.colors.border,
                          borderBottomWidth: 1,
                          borderBottomColor: tokens.colors.border,
                          flexDirection: 'row',
                          gap: 10,
                          alignItems: 'flex-start',
                        }}
                      >
                        <Text
                          className="font-body-semibold text-[12px] text-mw-text-muted uppercase tracking-wider"
                          style={{ minWidth: 130 }}
                        >
                          {s.l}
                        </Text>
                        <Text className="font-body-medium text-[13.5px] text-mw-text flex-1">
                          {s.v}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </View>
          </Card>

          {/* ── All-sizes table ────────────────────────────────────────── */}
          {product.variants.length > 1 && (
            <Card style={{ marginTop: 24 }}>
              <SectionHead icon="📦" title="All Available Sizes" />
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  {/* Header row */}
                  <View
                    className="flex-row"
                    style={{ backgroundColor: tokens.colors.bgPanel, borderBottomWidth: 1, borderBottomColor: tokens.colors.border }}
                  >
                    {['Size', 'Tin Price', '$ / gram', '$ / scoop', '$ / mL', 'Scoops', 'Scoop', 'Water'].map((h) => (
                      <View key={h} style={{ width: 96, paddingHorizontal: 14, paddingVertical: 10 }}>
                        <Text className="font-body-semibold text-[10.5px] uppercase tracking-wider text-mw-text-muted">{h}</Text>
                      </View>
                    ))}
                  </View>
                  {(() => {
                    const minPpg = Math.min(...product.variants.map((x) => x.pricePerGram ?? Infinity));
                    return product.variants.map((vt, i) => {
                      const isSelected = i === variantIndex;
                      const isBest = (vt.pricePerGram ?? 0) === minPpg;
                      const ppg = vt.pricePerGram ?? 0;
                      const pps = vt.pricePerScoop ?? 0;
                      const ppm = vt.pricePerMl ?? 0;
                      return (
                        <Pressable
                          key={i}
                          onPress={() => setVariantIndex(i)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                          accessibilityLabel={`Select ${formatWeight(vt.weightG)} variant`}
                          className="flex-row"
                          style={{
                            backgroundColor: isSelected ? tokens.colors.accentTint : 'transparent',
                          }}
                        >
                          <Cell width={96} bold color={isSelected ? tokens.colors.accent : tokens.colors.text}>
                            {formatWeight(vt.weightG)}
                            {isSelected && (
                              <Text className="font-body-semibold text-[10px]" style={{ color: tokens.colors.textInverse, backgroundColor: tokens.colors.accent, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 6 }}>
                                {' selected'}
                              </Text>
                            )}
                          </Cell>
                          <Cell width={96} bold size={15} color={isSelected ? tokens.colors.accent : tokens.colors.text}>
                            ${vt.price.toFixed(2)}
                          </Cell>
                          <Cell width={96} bold color={isBest ? tokens.colors.accent : tokens.colors.text}>
                            ${ppg.toFixed(4)}
                            {isBest && (
                              <Text className="font-body-semibold text-[10px]" style={{ color: '#065F46', backgroundColor: '#D1FAE5', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 5 }}>
                                {' ✓ best'}
                              </Text>
                            )}
                          </Cell>
                          <Cell width={96}>${pps.toFixed(3)}</Cell>
                          <Cell width={96}>${ppm.toFixed(4)}</Cell>
                          <Cell width={96}>{(vt.scoopsPerTin ?? 0).toFixed(0)}</Cell>
                          <Cell width={96}>{vt.scoopG}g</Cell>
                          <Cell width={96}>{vt.waterMl}mL</Cell>
                        </Pressable>
                      );
                    });
                  })()}
                </View>
              </ScrollView>
              <Text className="text-[12px] text-mw-text-muted font-body mt-3">
                💡 Tap a row to view that size. "Best" = lowest price per gram across all sizes of this product.
              </Text>
            </Card>
          )}

          {/* ── Features & claims ──────────────────────────────────────── */}
          {features.length > 0 && (
            <Card style={{ marginTop: 24 }}>
              <SectionHead icon="⭐" title="Features & Claims" />
              <View className="flex-row flex-wrap gap-2.5">
                {features.map((f) => (
                  <View
                    key={f.key}
                    style={{
                      flex: 1,
                      flexBasis: 200,
                      minWidth: 200,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      backgroundColor: tokens.colors.accentTint,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: tokens.colors.accentSoft,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{f.icon}</Text>
                    <Text className="font-body-semibold text-[13px]" style={{ color: tokens.colors.accent }}>
                      {f.label}
                    </Text>
                  </View>
                ))}
                {product.probiotic && product.probiotic !== 'None' && (
                  <FeatureBlock
                    bg="#FEF9C3" border="#FCD34D"
                    labelColor="#713F12" valueColor="#451A03"
                    icon="🦠" label="Probiotic Strain" value={product.probiotic}
                  />
                )}
                {product.hmo && product.hmo !== 'None' && (
                  <FeatureBlock
                    bg="#EDE9FE" border="#C4B5FD"
                    labelColor="#4C1D95" valueColor="#2E1065"
                    icon="🧫" label="HMO / Prebiotic Blend" value={product.hmo}
                  />
                )}
              </View>
            </Card>
          )}

          {/* ── Nutrition summary (top-level stats) ────────────────────── */}
          {(product.nutrition.energy || product.nutrition.protein) && (
            <Card style={{ marginTop: 24 }}>
              <SectionHead icon="🧪" title="Nutrition (per 100g powder)" />
              <View className="flex-row flex-wrap gap-3">
                {product.nutrition.energy != null && (
                  <NutBlock value={`${product.nutrition.energy} kcal`} label="Energy"  bg="#FEF9C3" fg="#713F12" />
                )}
                {product.nutrition.protein != null && (
                  <NutBlock value={`${product.nutrition.protein}g`}    label="Protein" bg="#D1FAE5" fg="#065F46" />
                )}
                {product.nutrition.fat != null && (
                  <NutBlock value={`${product.nutrition.fat}g`}        label="Fat"     bg="#FEF3C7" fg="#92400E" />
                )}
                {product.nutrition.carbs != null && (
                  <NutBlock value={`${product.nutrition.carbs}g`}      label="Carbs"   bg="#EDE9FE" fg="#6D28D9" />
                )}
                {product.nutrition.dha != null && (
                  <NutBlock value={`${product.nutrition.dha} µg`}      label="DHA"     bg="#E0F2FE" fg="#0369A1" />
                )}
              </View>
            </Card>
          )}

          {/* ── Ingredients + allergens ────────────────────────────────── */}
          {detail?.ingredients && (
            <Card style={{ marginTop: 24 }}>
              <SectionHead icon="🧪" title="Full Ingredients List" />
              {detail.allergen && (
                // Allergen notice is a semantic warning (not a specialty tag),
                // so it uses the themed warn tokens — it must stay legible in
                // dark mode rather than freezing as a raw amber chip.
                <View
                  style={{
                    marginBottom: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: tokens.colors.warnBg,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: tokens.colors.border,
                  }}
                >
                  <Text className="font-body-semibold text-[12.5px]" style={{ color: tokens.colors.warnText }}>
                    ⚠️ {detail.allergen}
                  </Text>
                </View>
              )}
              <View
                style={{
                  backgroundColor: tokens.colors.bgPanel,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: tokens.colors.border,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                }}
              >
                <Text className="text-[13.5px] text-mw-text font-body" style={{ lineHeight: 25 }}>
                  {detail.ingredients.split(',').map((item, i, arr) => (
                    <Text key={i}>
                      <Text
                        style={{
                          color: tokens.colors.text,
                          fontWeight: i === 0 ? '700' : '400',
                        }}
                      >
                        {item.trim()}
                      </Text>
                      {i < arr.length - 1 && (
                        <Text style={{ color: tokens.colors.textMuted }}>, </Text>
                      )}
                    </Text>
                  ))}
                </Text>
              </View>
              <Text className="text-[11.5px] text-mw-text-muted font-body mt-2.5">
                Ingredients listed in descending order by weight as declared on product label.
              </Text>
            </Card>
          )}

          {/* ── Full nutrition table (categorised) ─────────────────────── */}
          {detail?.fullNutrition && detail.fullNutrition.length > 0 && (
            <Card style={{ marginTop: 24 }}>
              <SectionHead icon="📊" title="Nutritional Information (per 100g powder)" />
              <NutritionTable rows={detail.fullNutrition} />
              <Text className="text-[11.5px] text-mw-text-muted font-body mt-2.5">
                💡 Values per 100g of powder unless stated. Source: product label.
              </Text>
            </Card>
          )}

          {/* ── Similar products ───────────────────────────────────────── */}
          {similarProducts.length > 0 && (
            <Card style={{ marginTop: 24 }}>
              <SectionHead icon="🔗" title="You may also consider" />
              <View className="flex-row flex-wrap gap-3">
                {similarProducts.map((q) => (
                  <Pressable
                    key={q.id}
                    onPress={() => router.push(`/product/${q.id}`)}
                    accessibilityRole="link"
                    accessibilityLabel={`View ${q.name}`}
                    style={{
                      flex: 1,
                      flexBasis: 200,
                      minWidth: 200,
                      flexDirection: 'row',
                      gap: 12,
                      padding: 12,
                      backgroundColor: tokens.colors.bgPanel,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: tokens.colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 52, height: 52,
                        backgroundColor: tokens.colors.bgCard,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: tokens.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={getProductImage(q.variants[0]?.img ?? q.img)}
                        resizeMode="contain"
                        style={{ width: 44, height: 44 }}
                        accessibilityLabel=""
                        accessibilityElementsHidden
                      />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-[10px] font-body-semibold text-mw-text-muted uppercase tracking-wider">
                        {q.brand}
                      </Text>
                      <Text className="text-[12.5px] font-body-semibold text-mw-text mt-0.5" numberOfLines={2}>
                        {q.name}
                      </Text>
                      <Text className="text-[11.5px] font-body-semibold text-mw-accent mt-1">
                        ${(q.pricePerGram ?? 0).toFixed(4)}/g
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          {/* ── Disclaimer ─────────────────────────────────────────────── */}
          <View
            className="rounded-xl mt-6"
            style={{
              backgroundColor: tokens.colors.bgCard,
              paddingHorizontal: 18,
              paddingVertical: 16,
            }}
          >
            <Text className="text-[11.5px] text-mw-text-muted font-body" style={{ lineHeight: 18 }}>
              <Text className="font-body-semibold text-mw-text">Disclaimer: </Text>
              All product data, prices, and nutritional information are sourced
              from Singapore retail channels and product labels. Always check
              the actual product label and consult your paediatrician before
              making feeding decisions. Prices are indicative and may vary by
              retailer and promotion.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Local presentational helpers                                                */
/* -------------------------------------------------------------------------- */

/** Card surface with brand-spec radius + shadow + 24px padding. */
const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        backgroundColor: tokens.colors.bgCard,
        borderRadius: 14,
        padding: 24,
        // shadowColor stays #000 until Phase 6 reworks elevation onto the
        // theme-keyed `tokens.shadow` 2-step scale.
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 1,
        ...style,
      }}
    >
      {children}
    </View>
  );
};

const SectionHead = ({ icon, title }: { icon: string; title: string }) => (
  <View className="flex-row items-center gap-2.5 mb-4">
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text className="font-display-bold text-mw-text" style={{ fontSize: 20 }}>{title}</Text>
  </View>
);

/**
 * Simple coloured pill — used for the stage badge (themed accent, passed
 * from the call site) and the spec-exact halal/organic chips (raw handoff
 * hues, intentionally NOT themed).
 */
const Badge = ({ bg, fg, label }: { bg: string; fg: string; label: string }) => (
  <View
    style={{
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: bg,
    }}
  >
    <Text
      className="font-body-semibold text-[12px] uppercase tracking-wider"
      style={{ color: fg }}
    >
      {label}
    </Text>
  </View>
);

/** Specialty-themed badge — reads its spec-exact colour pair from the theme. */
const SpecialtyBadge = ({ specialty }: { specialty: SpecialtyKey }) => {
  const { bg, fg } = specialtyColors[specialty];
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: bg,
      }}
    >
      <Text
        className="font-body-semibold text-[12px] uppercase tracking-wider"
        style={{ color: fg }}
      >
        {labelForSpecialty(specialty)}
      </Text>
    </View>
  );
};

/** Pricing stat tile — `highlight` paints the brand-accent variant. */
const StatBox = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        flexBasis: 120,
        minWidth: 110,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: highlight ? tokens.colors.accentTint : tokens.colors.bgPanel,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: highlight ? tokens.colors.accentSoft : tokens.colors.border,
        alignItems: 'center',
      }}
    >
      <Text
        className="font-display-bold"
        style={{ fontSize: 20, color: highlight ? tokens.colors.accent : tokens.colors.text, lineHeight: 22 }}
      >
        {value}
      </Text>
      <Text className="font-body-medium text-[11px] text-mw-text-muted mt-1.5">{label}</Text>
    </View>
  );
};

/** Scoop info fact — small label/value pair used in the scoop strip. */
const ScoopFact = ({ label, value }: { label: string; value: string }) => (
  <View className="items-center">
    <Text className="font-body-semibold text-[10px] uppercase tracking-wider text-mw-text-muted mb-0.5">
      {label}
    </Text>
    <Text className="font-body-semibold text-mw-text" style={{ fontSize: 16 }}>
      {value}
    </Text>
  </View>
);

/** Green-light feature pill — icon + label. */
const InfoPill = ({ icon, label }: { icon: string; label: string }) => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: tokens.colors.accentTint,
        borderWidth: 1,
        borderColor: tokens.colors.accentSoft,
      }}
    >
      <Text className="text-[14px]">{icon}</Text>
      <Text className="font-body-semibold text-[12px]" style={{ color: tokens.colors.accent }}>
        {label}
      </Text>
    </View>
  );
};

/**
 * Highlighted feature block — used for Probiotic and HMO callouts. Colours
 * are passed in from the call site as spec-exact handoff hues (the goat /
 * HA palette pairs), so this stays prop-driven and is intentionally NOT
 * themed — same contract as the specialty badges.
 */
const FeatureBlock = ({
  bg, border, labelColor, valueColor, icon, label, value,
}: {
  bg: string; border: string; labelColor: string; valueColor: string;
  icon: string; label: string; value: string;
}) => (
  <View
    style={{
      flexBasis: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: border,
    }}
  >
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <View className="flex-1">
      <Text
        className="font-body-semibold text-[12px] uppercase tracking-wider"
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      <Text
        className="font-body-semibold text-[13.5px] mt-1"
        style={{ color: valueColor }}
      >
        {value}
      </Text>
    </View>
  </View>
);

/**
 * Nutrition macro tile — bg-tinted card with stat-style value + label.
 * The bg/fg pair is the spec-exact macro palette from the design handoff
 * (energy=mustard, protein=emerald, …), intentionally NOT themed.
 */
const NutBlock = ({
  value, label, bg, fg,
}: {
  value: string; label: string; bg: string; fg: string;
}) => (
  <View
    style={{
      flex: 1,
      flexBasis: 120,
      minWidth: 110,
      padding: 14,
      borderRadius: 12,
      backgroundColor: bg,
      alignItems: 'center',
    }}
  >
    <Text className="font-body-semibold" style={{ fontSize: 20, color: fg }}>
      {value}
    </Text>
    <Text
      className="font-body-semibold text-[11px] uppercase tracking-wider mt-1"
      style={{ color: fg }}
    >
      {label}
    </Text>
  </View>
);

/** Plain text-cell helper for the all-sizes table. */
const Cell = ({
  children,
  width,
  bold,
  size,
  color,
}: {
  children: React.ReactNode;
  width: number;
  bold?: boolean;
  size?: number;
  color?: string;
}) => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        width,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
      }}
    >
      <Text
        className="font-body"
        style={{
          fontSize: size ?? 13.5,
          fontWeight: bold ? '700' : '400',
          color: color ?? tokens.colors.text,
        }}
      >
        {children}
      </Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* NutritionTable — categorises rows into Macros / Vitamins / Minerals / etc. */
/* -------------------------------------------------------------------------- */

const NUT_CATEGORIES: Readonly<Record<string, readonly string[]>> = {
  Macronutrients: [
    'Energy', 'Protein', 'Fat', 'Carbohydrate', 'Linoleic Acid', 'Alpha-Linolenic',
    'ARA', 'DHA', 'FOS',
  ],
  Vitamins: [
    'Vitamin A', 'Vitamin D3', 'Vitamin D', 'Vitamin E', 'Vitamin K1', 'Vitamin K',
    'Vitamin C', 'Thiamin', 'Riboflavin', 'Niacin', 'Folic', 'Vitamin B12',
    'Biotin', 'Pantothenic',
  ],
  Minerals: [
    'Calcium', 'Phosphorus', 'Magnesium', 'Sodium', 'Potassium', 'Chloride',
    'Iron', 'Zinc', 'Copper', 'Manganese', 'Iodine', 'Selenium', 'Minerals',
  ],
  Bioactives: [
    'Choline', 'Taurine', 'Inositol', 'Carnitine', 'L-Carnitine',
  ],
};

const NutritionTable = ({ rows }: { rows: readonly NutrientRow[] }) => {
  const { tokens } = useTheme();

  // Bucket rows by category — first match wins. Anything unmatched goes
  // into "Other" at the end so we never silently drop data.
  const buckets = useMemo(() => {
    const result: Record<string, NutrientRow[]> = {};
    const used = new Set<string>();
    for (const [cat, keys] of Object.entries(NUT_CATEGORIES)) {
      const matched = rows.filter((r) =>
        keys.some((k) => r.nutrient.toLowerCase().includes(k.toLowerCase())),
      );
      if (matched.length) {
        result[cat] = matched;
        matched.forEach((r) => used.add(r.nutrient));
      }
    }
    const other = rows.filter((r) => !used.has(r.nutrient));
    if (other.length) result.Other = other;
    return result;
  }, [rows]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={{ minWidth: 540 }}>
        {/* Header row */}
        <View
          className="flex-row"
          style={{ backgroundColor: tokens.colors.accent }}
        >
          <TableHeader text="Nutrient" width={240} />
          <TableHeader text="Unit"     width={80} />
          <TableHeader text="Per 100g" width={110} align="right" />
          <TableHeader text="Per 100mL" width={110} align="right" />
        </View>

        {Object.entries(buckets).map(([cat, catRows]) => (
          <View key={cat}>
            {/* Category divider */}
            <View
              className="flex-row"
              style={{ backgroundColor: tokens.colors.accentTint }}
            >
              <View style={{ paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text
                  className="font-body-semibold text-[11px] uppercase tracking-wider"
                  style={{ color: tokens.colors.accent }}
                >
                  {cat}
                </Text>
              </View>
            </View>

            {catRows.map((r, i) => (
              <View
                key={`${cat}-${r.nutrient}-${i}`}
                className="flex-row"
                style={{
                  backgroundColor: i % 2 === 1 ? tokens.colors.bgPanel : 'transparent',
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.colors.border,
                }}
              >
                <TableCell text={r.nutrient}                               width={240} />
                <TableCell text={r.unit}                                   width={80} muted size={12} />
                <TableCell text={r.per100g != null ? String(r.per100g) : '—'}   width={110} align="right" bold />
                <TableCell text={r.per100ml != null ? String(r.per100ml) : '—'} width={110} align="right" bold color={tokens.colors.accent} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const TableHeader = ({
  text,
  width,
  align,
}: {
  text: string;
  width: number;
  align?: 'right';
}) => {
  const { tokens } = useTheme();
  return (
    <View style={{ width, paddingHorizontal: 14, paddingVertical: 9 }}>
      <Text
        className="font-body-semibold text-[11px] uppercase tracking-wider"
        style={{ color: tokens.colors.textInverse, textAlign: align ?? 'left' }}
      >
        {text}
      </Text>
    </View>
  );
};

const TableCell = ({
  text,
  width,
  muted,
  bold,
  size,
  color,
  align,
}: {
  text: string;
  width: number;
  muted?: boolean;
  bold?: boolean;
  size?: number;
  color?: string;
  align?: 'right';
}) => {
  const { tokens } = useTheme();
  return (
    <View style={{ width, paddingHorizontal: 14, paddingVertical: 9 }}>
      <Text
        className="font-body"
        style={{
          fontSize: size ?? 13,
          fontWeight: bold ? '600' : '500',
          color: color ?? (muted ? tokens.colors.textMuted : tokens.colors.text),
          textAlign: align ?? 'left',
        }}
      >
        {text}
      </Text>
    </View>
  );
};
