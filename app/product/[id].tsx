/**
 * app/product/[id].tsx — product detail screen.
 *
 * Reached by tapping any ProductCard / ProductListRow / ProductPicture.
 * The `[id]` segment in the filename is a *dynamic route* — Expo Router
 * passes the URL parameter to `useLocalSearchParams()`.
 *
 * Three things happen on mount:
 *   1. Read the id from the URL.
 *   2. Resolve it against the repository (handles "id not found").
 *   3. Lazily fetch the verbose detail record (ingredients, full nutrition).
 *
 * If either fetch fails we render a friendly "not found" state with a link
 * back to the list — never a blank screen and never a thrown error.
 */

import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Tag } from '../../src/components/Tag';
import { EmptyState } from '../../src/components/EmptyState';
import type { Product, ProductDetail } from '../../src/types/product';
import { getProductRepository } from '../../src/services/productRepository';
import { getProductImage } from '../../src/data/imageMap';
import { formatCurrency, formatNutrient, formatWeight, formatUnitPrice, MISSING_VALUE }
  from '../../src/utils/format';
import { labelForSpecialty } from '../../src/utils/strings';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [detail,  setDetail]  = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Variant selector — most products have a single variant, but some come
  // in multiple pack sizes (e.g. 400g / 800g / 1.65kg). Default to index 0.
  const [variantIndex, setVariantIndex] = useState(0);

  // Load product + detail in parallel. Cancellation flag protects against
  // the user navigating away mid-fetch.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const repo = await getProductRepository();
        const [productResult, detailResult] = await Promise.all([
          repo.getProductById(id),
          repo.getProductDetail(id),
        ]);
        if (cancelled) return;

        if (!productResult) {
          setError(`No product found with id "${id}".`);
        } else {
          setProduct(productResult);
          setDetail(detailResult ?? null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  // ── Loading / error / not-found states ─────────────────────────────────
  if (loading) {
    return (
      <Screen>
        <View className="px-4 py-12 items-center">
          <Text className="text-muted text-sm">Loading product…</Text>
        </View>
      </Screen>
    );
  }

  if (error || !product) {
    return (
      <Screen>
        <EmptyState
          title="Product not found"
          description={error ?? 'We couldn\'t find that product. It may have been removed.'}
          actionLabel="Back to compare"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  // Variant guard — defensive in case the dataset ever has zero variants.
  const variant = product.variants[variantIndex] ?? product.variants[0];

  return (
    <Screen>
      {/* ── Breadcrumb / back link ───────────────────────────────────── */}
      <View className="px-4 pt-3">
        <Link href="/" asChild>
          <Pressable accessibilityLabel="Back to compare">
            <Text className="text-xs text-green font-semibold">← Back to compare</Text>
          </Pressable>
        </Link>
      </View>

      {/* ── Hero: image + headline ───────────────────────────────────── */}
      <View className="px-4 pt-3 flex-row gap-4 flex-wrap">
        <View className="w-full md:w-1/2 bg-surface rounded-lg border border-border items-center justify-center p-4 aspect-square max-w-[400px]">
          <Image
            source={getProductImage(variant?.img ?? product.img)}
            resizeMode="contain"
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel={product.fullName}
          />
        </View>

        <View className="flex-1 min-w-[260px] gap-2">
          <Text className="text-[11px] uppercase tracking-wider text-muted font-semibold">
            {product.brand} · {product.stage}
          </Text>
          <Text className="text-2xl font-serif text-text">{product.name}</Text>
          <Text className="text-sm text-muted">{product.fullName}</Text>

          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="text-3xl font-bold text-text">
              {formatCurrency(variant?.price)}
            </Text>
            {variant?.weightG && (
              <Text className="text-sm text-muted">{formatWeight(variant.weightG)}</Text>
            )}
          </View>

          {/* Pack-size selector — only shown when there's more than one */}
          {product.variants.length > 1 && (
            <View className="flex-row flex-wrap gap-1.5 mt-1">
              {product.variants.map((v, idx) => {
                const isActive = idx === variantIndex;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => setVariantIndex(idx)}
                    accessibilityLabel={`Select ${formatWeight(v.weightG)} variant`}
                    accessibilityState={{ selected: isActive }}
                    className={
                      'px-2 py-1 rounded-md border ' +
                      (isActive
                        ? 'bg-green border-green'
                        : 'bg-surface2 border-border')
                    }
                  >
                    <Text className={'text-[11px] font-bold ' + (isActive ? 'text-white' : 'text-muted')}>
                      {formatWeight(v.weightG)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Attribute tags */}
          <View className="flex-row flex-wrap gap-1 mt-2">
            {product.organic     && <Tag label="Organic"      variant="green" />}
            {product.halal       && <Tag label="Halal"        variant="muted" />}
            {product.lactoseFree && <Tag label="Lactose-Free" variant="muted" />}
            {product.soyBased    && <Tag label="Soy-Based"    variant="muted" />}
            {product.palmFree    && <Tag label="Palm-Free"    variant="muted" />}
            {product.ha          && <Tag label="HA"           variant="muted" />}
            {product.ar          && <Tag label="AR"           variant="muted" />}
            {product.specialty   && (
              <Tag label={labelForSpecialty(product.specialty)} variant="amber" />
            )}
          </View>
        </View>
      </View>

      {/* ── Description ─────────────────────────────────────────────── */}
      <View className="px-4 py-5">
        <Text className="text-sm text-text leading-relaxed">{product.desc}</Text>
        {product.bestFor && (
          <View className="mt-3 bg-green-light rounded-lg px-3 py-2">
            <Text className="text-[11px] uppercase tracking-wider text-green font-bold">Best for</Text>
            <Text className="text-sm text-text mt-0.5">{product.bestFor}</Text>
          </View>
        )}
      </View>

      {/* ── Quick stats grid ────────────────────────────────────────── */}
      <View className="px-4">
        <Text className="text-xs uppercase tracking-wider text-muted font-bold mb-2">
          At a glance
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Stat label="Origin"        value={product.origin || MISSING_VALUE} />
          <Stat label="Milk origin"   value={product.milkOrigin || MISSING_VALUE} />
          <Stat label="Milk type"     value={product.milkType} />
          <Stat label="Main sugar"    value={product.mainSugar} />
          <Stat label="Probiotic"     value={product.probiotic} />
          <Stat label="HMO"           value={product.hmo} />
          <Stat label="Price / 100g"  value={formatUnitPrice(variant?.pricePerGram)} />
          <Stat label="Price / scoop" value={formatUnitPrice(variant?.pricePerScoop)} />
        </View>
      </View>

      {/* ── Nutrition summary ───────────────────────────────────────── */}
      <View className="px-4 mt-5">
        <Text className="text-xs uppercase tracking-wider text-muted font-bold mb-2">
          Nutrition (per 100g powder)
        </Text>
        <View className="bg-surface rounded-lg border border-border overflow-hidden">
          <NutritionRow label="Energy"  value={formatNutrient(product.nutrition.energy,  'kcal')} />
          <NutritionRow label="Protein" value={formatNutrient(product.nutrition.protein, 'g')} />
          <NutritionRow label="Fat"     value={formatNutrient(product.nutrition.fat,     'g')} />
          <NutritionRow label="Carbs"   value={formatNutrient(product.nutrition.carbs,   'g')} />
          <NutritionRow label="DHA"     value={formatNutrient(product.nutrition.dha,     'mg')} last />
        </View>
      </View>

      {/* ── Full nutrition table (only if we have detail data) ───────── */}
      {detail && detail.fullNutrition.length > 0 && (
        <View className="px-4 mt-5">
          <Text className="text-xs uppercase tracking-wider text-muted font-bold mb-2">
            Full nutrition panel
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="bg-surface rounded-lg border border-border min-w-full">
              {/* Header row */}
              <View className="flex-row bg-surface2 px-3 py-2">
                <Text className="flex-1 text-[10px] uppercase tracking-wider text-muted font-bold">Nutrient</Text>
                <Text className="w-24 text-[10px] uppercase tracking-wider text-muted font-bold text-right">per 100g</Text>
                <Text className="w-24 text-[10px] uppercase tracking-wider text-muted font-bold text-right">per 100ml</Text>
              </View>
              {detail.fullNutrition.map((row, idx) => (
                <View
                  key={`${row.nutrient}-${idx}`}
                  className={
                    'flex-row px-3 py-2 ' +
                    (idx < detail.fullNutrition.length - 1 ? 'border-b border-border' : '')
                  }
                >
                  <Text className="flex-1 text-xs text-text">{row.nutrient}</Text>
                  <Text className="w-24 text-xs text-text text-right">{formatNutrient(row.per100g, row.unit)}</Text>
                  <Text className="w-24 text-xs text-muted text-right">{formatNutrient(row.per100ml, row.unit)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Ingredients & allergens ─────────────────────────────────── */}
      {detail?.ingredients && (
        <View className="px-4 mt-5 mb-8">
          <Text className="text-xs uppercase tracking-wider text-muted font-bold mb-2">Ingredients</Text>
          <Text className="text-xs text-text leading-relaxed">{detail.ingredients}</Text>
          {detail.allergen && (
            <View className="mt-3 bg-amber-light rounded-lg px-3 py-2">
              <Text className="text-[11px] uppercase tracking-wider text-amber font-bold">Allergens</Text>
              <Text className="text-xs text-text mt-0.5">{detail.allergen}</Text>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

// ── Local presentational helpers ────────────────────────────────────────────

/**
 * `Stat` — small fixed-width tile used inside "At a glance".
 * Kept private to this screen because it's not used anywhere else.
 */
const Stat = ({ label, value }: { label: string; value: string }) => (
  <View className="bg-surface rounded-lg border border-border px-3 py-2 min-w-[140px] flex-1 max-w-[220px]">
    <Text className="text-[10px] uppercase tracking-wider text-muted font-bold">{label}</Text>
    <Text className="text-xs text-text font-medium mt-0.5" numberOfLines={2}>{value}</Text>
  </View>
);

/**
 * `NutritionRow` — single row in the at-a-glance nutrition card.
 * `last` removes the bottom border on the final row for a clean edge.
 */
const NutritionRow = ({ label, value, last }: { label: string; value: string; last?: boolean }) => (
  <View className={'flex-row justify-between px-3 py-2 ' + (last ? '' : 'border-b border-border')}>
    <Text className="text-xs text-muted">{label}</Text>
    <Text className="text-xs text-text font-medium">{value}</Text>
  </View>
);
