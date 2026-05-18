/**
 * ProductListRow — dense row layout for the "List" view.
 *
 * Same navigation contract as `ProductCard`: NO outer `<Link>` wrapper.
 * Click-target Pressables (image, identity, details CTA) navigate via
 * `router.push()`. Variant pills and the select dot live OUTSIDE those
 * click targets in the JSX tree — they own their own touches and never
 * propagate. See the long comment block atop `ProductCard.tsx` for the
 * full rationale behind this pattern.
 *
 * ── Responsive behaviour ───────────────────────────────────────────────
 * Below 768px we collapse the row to a two-tier stack:
 *
 *   ┌─[●] [img] STAGE  · BRAND ────────[Details →]┐
 *   │            Product name                     │
 *   │            ✓ Best for...                    │
 *   ├─────────────────────────────────────────────┤
 *   │  [400g][800g]  ← variant pills              │
 *   │  [$/gram][Tin]   ← only the two headline    │
 *   └─────────────────────────────────────────────┘
 *
 * Secondary metrics ($/scoop, $/mL, Size, Origin) and feature chips are
 * hidden because the row otherwise wraps into an unusable column of pills
 * on phone widths (the bug the user flagged).
 */

import { useState } from 'react';
import { View, Text, Pressable, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { Product, ProductVariant } from '../../types/product';
import { getProductImage } from '../../data/imageMap';
import { formatWeight } from '../../utils/format';
import { labelForSpecialty } from '../../utils/strings';
import { getOriginFlag, getMilkTypeIcon } from '../../utils/icons';
import { Tag } from '../Tag';
import { useTheme } from '../../contexts/ThemeContext';

// Matches the design handoff's `@media(max-width:768px)` rule.
const MOBILE_BREAKPOINT = 768;

export interface ProductListRowProps {
  product:        Product;
  selected:       boolean;
  canSelect:      boolean;
  onToggleSelect: (id: string) => void;
}

export const ProductListRow = ({
  product,
  selected,
  canSelect,
  onToggleSelect,
}: ProductListRowProps) => {
  const router = useRouter();
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  // `useWindowDimensions` re-renders the component when the window
  // resizes or the device rotates — the layout reflows live across the
  // breakpoint without a manual listener.
  const isMobile = width < MOBILE_BREAKPOINT;

  const [variantIndex, setVariantIndex] = useState(0);
  const variant: ProductVariant = product.variants[variantIndex] ?? product.variants[0];

  const pricePerGram  = variant?.pricePerGram  ?? 0;
  const pricePerScoop = variant?.pricePerScoop ?? 0;
  const pricePerMl    = variant?.pricePerMl    ?? 0;
  const price         = variant?.price         ?? 0;

  const goToDetail = () => router.push(`/product/${product.id}`);

  return (
    <View
      style={{
        backgroundColor: tokens.colors.bgCard,
        borderRadius: 14,
        // Mobile: stack the header strip and the metrics column.
        // Desktop: dense single row across.
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        gap: isMobile ? 10 : 16,
        padding: isMobile ? 12 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 1,
        outlineStyle: 'solid' as never,
        outlineWidth: selected ? 2 : 0,
        outlineColor: tokens.colors.accent,
        outlineOffset: 2,
      }}
    >
      {/* ── Header strip: dot + image + identity + (mobile only) Details ──
          On mobile this is one horizontal row. On desktop it's three
          separate flex children of the outer row container — so we render
          them as siblings in both cases, just wrapped in a Fragment so
          the layout primitive is the outer View. The mobile/desktop
          decision is purely a style switch on the outer container. */}
      <View
        style={{
          flexDirection: 'row',
          gap: isMobile ? 10 : 16,
          alignItems: 'flex-start',
          // On mobile we want the strip to take the full row width so
          // the Details CTA can sit on the right edge. On desktop we
          // let it size to content (children take their own widths).
          width: isMobile ? '100%' : undefined,
        }}
      >
        {/* Select dot */}
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
          // Visible 22×22 dot; hitSlop bumps the touch target to ~44 px
          // (WCAG 2.5.5).
          hitSlop={11}
          disabled={!selected && !canSelect}
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: tokens.colors.border,
            backgroundColor: selected ? tokens.colors.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 4,
            opacity: !selected && !canSelect ? 0.4 : 1,
          }}
        >
          {selected && (
            <Text className="text-mw-text-inverse font-body-semibold" style={{ fontSize: 11, lineHeight: 13 }}>
              ✓
            </Text>
          )}
        </Pressable>

        {/* Image — click target → detail */}
        <Pressable
          onPress={goToDetail}
          accessibilityRole="button"
          accessibilityLabel={`Open details for ${product.name}`}
          style={{
            width: isMobile ? 64 : 72,
            height: isMobile ? 64 : 72,
            backgroundColor: tokens.colors.bgCard,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Image
            source={getProductImage(variant?.img ?? product.img)}
            resizeMode="contain"
            style={{ width: isMobile ? 56 : 64, height: isMobile ? 56 : 64 }}
            accessibilityLabel=""
            accessibilityElementsHidden
          />
        </Pressable>

        {/* Identity — click target → detail */}
        <Pressable
          onPress={goToDetail}
          accessibilityLabel=""
          style={{
            // Desktop: fixed-ish basis to leave room for metrics column.
            // Mobile: take all remaining space in the header strip.
            flex: isMobile ? 1 : 0,
            flexBasis: isMobile ? undefined : 200,
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <View
              className="rounded px-1.5 py-0.5 border border-mw-border"
              style={{ backgroundColor: tokens.colors.bgPanel }}
            >
              <Text className="text-[9.5px] font-body-semibold uppercase tracking-wider text-mw-text-muted">
                {product.stage}
              </Text>
            </View>
            {product.specialty && (
              <Tag
                label={labelForSpecialty(product.specialty)}
                specialty={product.specialty}
              />
            )}
            {product.halal && (
              <View
                className="rounded px-1.5 py-0.5"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <Text
                  className="text-[9px] font-body-semibold uppercase tracking-wider"
                  style={{ color: '#065F46' }}
                >
                  Halal
                </Text>
              </View>
            )}
          </View>

          <Text className="text-[10.5px] text-mw-text-muted font-body-semibold uppercase tracking-wider mt-1">
            {product.brand}
          </Text>
          <Text
            className="text-[13.5px] font-body-semibold text-mw-text leading-tight mt-0.5"
            numberOfLines={2}
          >
            {product.name}
          </Text>
          {product.bestFor ? (
            <Text className="text-[11px] text-mw-accent font-body-semibold mt-1" numberOfLines={1}>
              ✓ {product.bestFor}
            </Text>
          ) : null}
        </Pressable>

        {/* Mobile-only "Details" pill — anchored to the right of the
            header strip so the user can drill in without scrolling past
            the metrics. Desktop renders the same CTA at the far right of
            the row (rendered below outside this strip). */}
        {isMobile && (
          <Pressable
            onPress={goToDetail}
            accessibilityRole="button"
            accessibilityLabel={`View full details for ${product.name}`}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: tokens.colors.accentTint,
            }}
          >
            <Text className="text-[11px] font-body-semibold" style={{ color: tokens.colors.accent }}>
              Details →
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Variants + metrics column ──────────────────────────────────
          Desktop: takes the remaining flex space in the outer row.
          Mobile: full-width band underneath the header strip. */}
      <View
        style={{
          flex: isMobile ? 0 : 1,
          width: isMobile ? '100%' : undefined,
          gap: 8,
        }}
      >
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
                  hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                  className="rounded-md px-2 py-0.5"
                  style={{
                    backgroundColor: isActive ? tokens.colors.accent : tokens.colors.bgPanel,
                    borderColor:     isActive ? tokens.colors.accent : tokens.colors.border,
                    borderWidth: 1.5,
                  }}
                >
                  <Text
                    className="text-[10.5px] font-body-semibold"
                    style={{ color: isActive ? tokens.colors.textInverse : tokens.colors.textMuted }}
                  >
                    {formatWeight(v.weightG)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View className="flex-row flex-wrap gap-1.5 items-center">
          {/* On mobile we show 3 fixed-share tiles ($/gram, Tin, Size) so
              the row fills the card width edge-to-edge. The `flex: 1`
              prop on each tile makes them split the available width
              equally regardless of content. On desktop the tiles size
              to content (minWidth 58) and the row scrolls horizontally
              if it overflows — that's the dense-table behaviour the
              design calls for at >768px. */}
          <MetricTile
            label="$/gram"
            value={`$${pricePerGram.toFixed(4)}`}
            accent
            grow={isMobile}
          />
          <MetricTile
            label="Tin"
            value={`$${price.toFixed(2)}`}
            grow={isMobile}
          />
          {isMobile ? (
            <MetricTile
              label="Size"
              value={formatWeight(variant?.weightG ?? 0)}
              grow
            />
          ) : (
            <>
              <MetricTile label="$/scoop" value={`$${pricePerScoop.toFixed(3)}`} />
              <MetricTile label="$/mL"    value={`$${pricePerMl.toFixed(4)}`} />
              <MetricTile label="Size"    value={formatWeight(variant?.weightG ?? 0)} />
              <MetricTile
                label="Origin"
                value={`${getOriginFlag(product.origin)} ${product.origin}`}
              />

              {product.hmo && product.hmo !== 'None' && (
                <FeatureChip label="HMO" bg="#EDE9FE" fg="#6D28D9" />
              )}
              {product.probiotic && product.probiotic !== 'None' && (
                <FeatureChip label="PROB" bg="#FEF9C3" fg="#713F12" />
              )}
              {product.palmFree && (
                <FeatureChip label="PALM FREE" bg="#ECFDF5" fg="#065F46" />
              )}
              {product.organic && (
                <FeatureChip label="ORGANIC" bg="#DCFCE7" fg="#166534" />
              )}
              <Text className="text-[10px] text-mw-text-muted font-body">
                {getMilkTypeIcon(product.milkType)} {product.milkType}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── Desktop-only Details CTA ─────────────────────────────────── */}
      {!isMobile && (
        <Pressable
          onPress={goToDetail}
          accessibilityRole="button"
          accessibilityLabel={`View full details for ${product.name}`}
          className="rounded-lg px-3.5 py-2 self-center"
          style={{ backgroundColor: tokens.colors.accentTint }}
        >
          <Text className="text-xs font-body-semibold" style={{ color: tokens.colors.accent }}>
            Details →
          </Text>
        </Pressable>
      )}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Local presentational helpers                                                */
/* -------------------------------------------------------------------------- */

/**
 * `MetricTile` — one of the small price/size pills in the list row.
 *
 * `grow` makes the tile claim a 1-fr slice of the parent row. We use it on
 * mobile so 2-3 tiles span the full card width edge-to-edge instead of
 * sitting in a left-aligned cluster with empty space on the right.
 *
 * Without `grow`, tiles stay content-sized (`minWidth: 58`) — the design's
 * desktop dense-row layout where many tiles + chips share the row.
 */
const MetricTile = ({
  label,
  value,
  accent,
  grow,
}: {
  label: string;
  value: string;
  accent?: boolean;
  grow?: boolean;
}) => {
  const { tokens } = useTheme();
  return (
  <View
    className="rounded-lg items-center px-2 py-1.5"
    style={{
      backgroundColor: accent ? tokens.colors.accentTint : tokens.colors.bgPanel,
      minWidth: 58,
      // `flex: 1` lets the tile fill its share of the parent's main-axis
      // width. We also set `flexBasis: 0` implicitly via `flex: 1`, which
      // means siblings without `grow` won't be squeezed.
      ...(grow ? { flex: 1 } : {}),
    }}
  >
    <Text
      className="text-[9px] font-body-semibold uppercase tracking-wider"
      style={{ color: accent ? tokens.colors.accent : tokens.colors.textMuted }}
    >
      {label}
    </Text>
    <Text
      className="text-[12.5px] font-body-semibold mt-0.5"
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
  <View className="rounded px-1.5 py-1" style={{ backgroundColor: bg }}>
    <Text
      className="text-[9px] font-body-semibold uppercase tracking-wider"
      style={{ color: fg }}
    >
      {label}
    </Text>
  </View>
);
