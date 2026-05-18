/**
 * ProductCard — the tile shown in the "Cards" view of the Compare screen.
 *
 * Layout matches the design handoff (`design_handoff_milkwise_sg/index.html`):
 *
 *   ┌────────────────────────────┐
 *   │ [STAGE pill]     [✓ select]│  ← image well, 72% aspect, white bg
 *   │       <product image>      │
 *   ├────────────────────────────┤
 *   │ [SPECIALTY] 🇸🇬 🐄 [HALAL]   │
 *   │ BRAND                      │
 *   │ Product name (bold, 13px)  │
 *   │ [400g] [800g] [1.6kg]      │  ← variant pills (LOCAL state; do NOT navigate)
 *   │ ┌─────┐ ┌────┐ ┌────┐      │
 *   │ │ $/g │ │/sc │ │tin │      │  ← 3-metric row, $/g highlighted green
 *   │ └─────┘ └────┘ └────┘      │
 *   │ 800g · 4.4g scoop + 30mL   │
 *   │ ✓ Best for daycare backup  │
 *   │ [HMO][PROBIOTIC][PALM-FREE]│
 *   ├────────────────────────────┤
 *   │ View full details        → │  ← footer CTA
 *   └────────────────────────────┘
 *
 * ── IMPORTANT navigation contract ──────────────────────────────────────────
 * Earlier versions wrapped the entire card in `<Link asChild><Pressable>`.
 * On `react-native-web` that renders an `<a>` that captures clicks *after*
 * the inner Pressables fire — so tapping a variant pill silently triggered
 * navigation to the detail screen.
 *
 * The fix used here:
 *   1. NO `<Link>` wrapper on the card.
 *   2. The outer container is a plain `View` — it never navigates.
 *   3. Three explicit "click target" Pressables: the image well, the body
 *      block, and the footer CTA. Each calls `router.push()` directly.
 *   4. Interactive controls (variant pills, select dot) live OUTSIDE those
 *      click targets in the JSX tree. There is no propagation to fight.
 *
 * Tradeoff: right-click "open in new tab" no longer works on web because
 * there is no `<a href>`. If we need that back, a tiny `RouterLink` wrapper
 * that emits a real `<a>` for the navigation surfaces only is the next step.
 */

import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import type { Product, ProductVariant } from '../../types/product';
import { getProductImage } from '../../data/imageMap';
import { formatWeight } from '../../utils/format';
import { labelForSpecialty } from '../../utils/strings';
import { getOriginFlag, getMilkTypeIcon } from '../../utils/icons';
import { Tag } from '../Tag';
import { useTheme } from '../../contexts/ThemeContext';

export interface ProductCardProps {
  product:    Product;
  selected:   boolean;
  canSelect:  boolean;
  onToggleSelect: (id: string) => void;
}

export const ProductCard = ({
  product,
  selected,
  canSelect,
  onToggleSelect,
}: ProductCardProps) => {
  const router = useRouter();
  // Inline styles can't take Tailwind classes; theme-reactive colour
  // values come from the context (CSS-var classes for the rest).
  const { tokens } = useTheme();

  // Variant index lives on the card — design spec swaps the price metrics
  // in-place when the user taps a pack size. Critically, this state is
  // LOCAL to the card and must not trigger navigation.
  const [variantIndex, setVariantIndex] = useState(0);
  const variant: ProductVariant = product.variants[variantIndex] ?? product.variants[0];

  const pricePerGram  = variant?.pricePerGram  ?? 0;
  const pricePerScoop = variant?.pricePerScoop ?? 0;
  const price         = variant?.price         ?? 0;

  // Centralised navigation helper. Each click-target Pressable below calls
  // this — keeps the route string in one place.
  const goToDetail = () => router.push(`/product/${product.id}`);

  return (
    <View
      accessibilityLabel={`${product.brand} ${product.name}, ${product.stage}`}
      className="bg-mw-bg-card overflow-hidden flex-1 min-w-[200px]"
      // 14px corner radius matches the design's `--radius` token. Tailwind's
      // `rounded-lg` is only 8px, so we set it inline. `overflow-hidden`
      // above clips the image at the rounded corner.
      style={{
        // Spec radius. Tailwind's `rounded-lg` is only 8px; the design
        // ships every card at 14px.
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 1,
        // Green outline when this card is in the compare selection.
        outlineStyle: 'solid' as never,
        outlineWidth: selected ? 2.5 : 0,
        outlineColor: tokens.colors.accent,
        outlineOffset: 2,
      }}
    >
      {/* ── Image well (click target → detail) ─────────────────────────── */}
      <Pressable
        onPress={goToDetail}
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${product.name}`}
        className="w-full bg-mw-bg-card relative"
        style={{ aspectRatio: 100 / 72 }}
      >
        <Image
          source={getProductImage(variant?.img ?? product.img)}
          resizeMode="contain"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: '100%', padding: 8,
          }}
          accessibilityLabel=""
          accessibilityElementsHidden
        />

        {/* Stage pill — top-left overlay. Scrim AND text are intentionally
            theme-independent: the chip floats over the (always-light)
            product photo, so a flipping token would turn the text light
            on a white scrim in dark mode. Fixed dark-grey on fixed white
            keeps it legible in both themes — same rationale as the scrim. */}
        <View
          pointerEvents="none"
          className="absolute top-2 left-2 rounded px-1.5 py-0.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        >
          <Text
            className="text-[10px] font-sans-semibold"
            style={{ color: '#6E6A60' }}
          >
            {product.stage}
          </Text>
        </View>
      </Pressable>

      {/* ── Select dot ─────────────────────────────────────────────────── */}
      {/* Lives OUTSIDE the image Pressable in the JSX tree but positioned
          absolutely over it. Has its own `onPress` — no propagation issue.
          Greyed when limit hit AND not currently selected. */}
      <Pressable
        onPress={() => onToggleSelect(product.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={
          selected
            ? `Remove ${product.name} from comparison`
            : canSelect
              ? `Add ${product.name} to comparison`
              : 'Comparison limit reached'
        }
        // Visible dot stays 24×24 for design parity; hitSlop expands the
        // touch area to ~44×44 to meet WCAG 2.5.5 minimum target size.
        hitSlop={10}
        disabled={!selected && !canSelect}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          // Unselected fill stays a translucent white (it's a checkbox
          // floating over the product photo — theme-independent, like the
          // stage scrim). Selected fill/outline + the border use accent /
          // border tokens so they flip with the theme.
          borderColor: selected ? tokens.colors.accent : tokens.colors.border,
          backgroundColor: selected ? tokens.colors.accent : 'rgba(255,255,255,0.9)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          opacity: !selected && !canSelect ? 0.4 : 1,
        }}
      >
        {selected && (
          <Text className="text-mw-text-inverse font-sans-bold" style={{ fontSize: 12, lineHeight: 14 }}>
            ✓
          </Text>
        )}
      </Pressable>

      {/* ── Body (click target → detail) ───────────────────────────────── */}
      {/* Wraps every non-interactive cell + interactive variant pills are
          NESTED PRESSABLES which the runtime treats as separate touch
          targets — no propagation conflict. */}
      <View className="px-3.5 py-3 gap-2 flex-1">
        {/* Attribute row + Identity — both navigate on tap */}
        <Pressable onPress={goToDetail} accessibilityLabel="">
          <View className="flex-row flex-wrap items-center gap-1.5" style={{ minHeight: 18 }}>
            {product.specialty && (
              <Tag
                label={labelForSpecialty(product.specialty)}
                specialty={product.specialty}
              />
            )}
            <Text className="text-[10px] text-mw-text-muted font-sans-medium">
              {getOriginFlag(product.origin)} {getMilkTypeIcon(product.milkType)}
            </Text>
            {product.halal && (
              <View
                className="rounded px-1.5 py-0.5"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <Text
                  className="text-[9px] font-sans-bold uppercase tracking-wider"
                  style={{ color: '#065F46' }}
                >
                  Halal
                </Text>
              </View>
            )}
          </View>

          <Text
            className="text-[10px] text-mw-text-muted font-sans-semibold uppercase tracking-wider mt-1.5"
            numberOfLines={1}
          >
            {product.brand}
          </Text>
          <Text
            className="text-[13px] font-sans-bold text-mw-text leading-tight mt-0.5"
            numberOfLines={2}
          >
            {product.name}
          </Text>
        </Pressable>

        {/* Variant pills — LOCAL state only. Each pill is its own Pressable
            with no `onPress` propagation to the card-level click targets.
            The outer wrapper is a plain View — does not navigate.
            `radiogroup` semantics let screen readers announce "Pack size,
            3 options" so users understand the pills are a single choice. */}
        {product.variants.length > 1 && (
          <View
            className="flex-row flex-wrap gap-1"
            accessibilityRole="radiogroup"
            accessibilityLabel="Pack size"
          >
            {product.variants.map((v, i) => {
              const isActive = i === variantIndex;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Select ${formatWeight(v.weightG)} variant`}
                  onPress={() => setVariantIndex(i)}
                  // Pills are ~18 px tall by design; hitSlop pushes the
                  // touch target to ~44 px without changing the visual.
                  hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                  className="rounded-md px-2 py-0.5"
                  style={{
                    backgroundColor: isActive ? tokens.colors.accent : tokens.colors.bgPanel,
                    borderColor:     isActive ? tokens.colors.accent : tokens.colors.border,
                    borderWidth: 1.5,
                  }}
                >
                  <Text
                    className="text-[10.5px] font-sans-bold"
                    style={{ color: isActive ? tokens.colors.textInverse : tokens.colors.textMuted }}
                  >
                    {formatWeight(v.weightG)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Click-target wrapper for the rest of the body */}
        <Pressable onPress={goToDetail} accessibilityLabel="" className="gap-2">
          {/* 3-metric row — $/g highlighted green, others neutral. */}
          <View className="flex-row gap-1.5">
            <MetricTile label="$ / g"     value={`$${pricePerGram.toFixed(3)}`}  accent />
            <MetricTile label="$ / scoop" value={`$${pricePerScoop.toFixed(3)}`} />
            <MetricTile label="Tin"       value={`$${price.toFixed(2)}`} />
          </View>

          {/* Size + scoop dose */}
          <Text className="text-[11px] text-mw-text-muted font-sans" numberOfLines={1}>
            {formatWeight(variant?.weightG ?? 0)} · {variant?.scoopG ?? 0}g scoop + {variant?.waterMl ?? 0}mL water
          </Text>

          {/* Best-for line */}
          {product.bestFor ? (
            <Text className="text-[11px] text-mw-accent font-sans-semibold" numberOfLines={1}>
              ✓ {product.bestFor}
            </Text>
          ) : null}

          {/* Feature chips */}
          <View className="flex-row flex-wrap gap-1">
            {product.hmo && product.hmo !== 'None' && (
              <FeatureChip label="HMO" bg="#EDE9FE" fg="#6D28D9" />
            )}
            {product.probiotic && product.probiotic !== 'None' && (
              <FeatureChip label="PROBIOTIC" bg="#FEF9C3" fg="#713F12" />
            )}
            {product.palmFree && (
              <FeatureChip label="PALM FREE" bg="#ECFDF5" fg="#065F46" />
            )}
            {product.organic && (
              <FeatureChip label="ORGANIC" bg="#DCFCE7" fg="#166534" />
            )}
          </View>
        </Pressable>
      </View>

      {/* ── Footer CTA (click target → detail) ─────────────────────────── */}
      <Pressable
        onPress={goToDetail}
        accessibilityRole="button"
        accessibilityLabel={`View full details for ${product.name}`}
        className="px-3.5 py-2 flex-row items-center justify-between border-t border-mw-border"
        style={{ backgroundColor: tokens.colors.bgPanel }}
      >
        <Text className="text-[11.5px] text-mw-accent font-sans-semibold">
          View full details
        </Text>
        <Text className="text-sm text-mw-accent font-sans-bold">→</Text>
      </Pressable>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Local presentational helpers                                                */
/* -------------------------------------------------------------------------- */

const MetricTile = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => {
  const { tokens } = useTheme();
  return (
    <View
      className="flex-1 rounded-lg items-center py-1.5"
      style={{ backgroundColor: accent ? tokens.colors.accentTint : tokens.colors.bgPanel }}
    >
      <Text
        className="text-[9.5px] font-sans-bold uppercase tracking-wider"
        style={{ color: accent ? tokens.colors.accent : tokens.colors.textMuted }}
      >
        {label}
      </Text>
      <Text
        className="text-[13px] font-sans-bold mt-0.5"
        style={{ color: accent ? tokens.colors.accent : tokens.colors.text }}
      >
        {value}
      </Text>
    </View>
  );
};

const FeatureChip = ({
  label,
  bg,
  fg,
}: {
  label: string;
  bg: string;
  fg: string;
}) => (
  <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: bg }}>
    <Text
      className="text-[9px] font-sans-bold uppercase tracking-wider"
      style={{ color: fg }}
    >
      {label}
    </Text>
  </View>
);
