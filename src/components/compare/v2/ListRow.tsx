/**
 * ListRowV2 — multi-column list row for the wide list view. Ported from
 * `Compare.jsx` ListRowV2 + styles-v2.css `.mw-listv2 .row`.
 *
 * Responsive collapse (mirrors the design's 1180px / 820px breakpoints
 * but simplified):
 *   • ≥1180px : check · image · brand/name · tin-picker · $/g · $/scoop ·
 *               $/ml · tin · origin · Details
 *   • 768–1180: check · image · brand/name · $/g · $/scoop · tin · Details
 *               (tin-picker + $/ml + origin hidden)
 *   • <768px  : check · image · brand/name · $/g · Details
 *               (all secondary columns hidden — main info stays legible)
 */

import { View, Pressable, Text, Image, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useFormulaCompare } from '../../../contexts/FormulaCompareContext';
import { getProductImage } from '../../../data/imageMap';
import {
  shortName,
  featureBlurb,
  flagFor,
  originCountry,
} from '../../../utils/formulaClassifiers';
import { fmtSGD, fmtPerGram } from '../../../utils/formulaFormat';
import type { Formula } from '../../../types/formula';
import { ChipRow, StageBadge, TinPills, MetricPill, CheckCircle } from './atoms';

const baseRouteId = (id: string) => id.split('--')[0];

const WIDE = 1180;
const TABLET = 768;

export const ListRowV2 = ({ p }: { p: Formula }) => {
  const { tokens } = useTheme();
  const { tray, toggleTray } = useFormulaCompare();
  const { width } = useWindowDimensions();
  const inTray = tray.some((t) => t.id === p.id);
  const country = originCountry(p.manufacturedIn || p.origin);
  const isWide = width >= WIDE;
  const isMid = width >= TABLET;
  const href = `/product/${baseRouteId(p.id)}`;

  // $ / mL ≈ price-per-scoop ÷ (water + scoop powder)
  const perMl =
    (p.pricePerScoop || 0) /
    Math.max(1, (p.waterPerScoop || 30) + (p.scoopSize || 4));

  const DetailsButton = (
    <Link href={href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`View details for ${shortName(p.product)}`}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 14,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: tokens.colors.accent,
        }}
      >
        <Text
          style={{
            fontFamily: tokens.fonts.bodyMedium,
            fontSize: 12,
            fontWeight: '500',
            color: tokens.colors.accentText,
          }}
        >
          Details →
        </Text>
      </Pressable>
    </Link>
  );

  // Main row — always: check + image + brand/name/chips/feature.
  // At ≥768px (`isMid`) the metric pills + Details ride alongside in the
  // same row. Below that they get bumped to a second row (below) so the
  // info column has room to breathe.
  const MainRow = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <CheckCircle
        on={inTray}
        onPress={() => toggleTray(p)}
        size={20}
        ariaLabel={inTray ? 'Remove from compare' : 'Add to compare'}
      />

      {/* Thumb */}
      <Link href={href as never} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View details for ${shortName(p.product)}`}
          style={{
            width: 60,
            height: 60,
            backgroundColor: tokens.colors.bg,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            borderRadius: 6,
            padding: 3,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Image
            source={getProductImage(p.img)}
            accessibilityIgnoresInvertColors
            className="mw-packshot"
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
        </Pressable>
      </Link>

      {/* Head — brand / name / feature + tag row */}
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <StageBadge stage={p.stage} />
          <ChipRow p={p} max={isMid ? 3 : 2} />
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
          numberOfLines={1}
        >
          {p.brand}
        </Text>
        <Link href={href as never} asChild>
          <Pressable accessibilityRole="link">
            <Text
              style={{
                fontFamily: tokens.fonts.displaySemibold,
                fontSize: 14,
                fontWeight: '600',
                letterSpacing: -0.07,
                lineHeight: 18,
                color: tokens.colors.text,
              }}
              numberOfLines={2}
            >
              {shortName(p.product)}
            </Text>
          </Pressable>
        </Link>
        <Text
          style={{
            fontSize: 11,
            fontFamily: tokens.fonts.bodyMedium,
            fontWeight: '500',
            color: tokens.colors.accentHover,
            marginTop: 1,
          }}
          numberOfLines={1}
        >
          ✓ {featureBlurb(p)}
        </Text>
      </View>

      {/* Inline metrics + Details — only when ≥768px. At narrow widths the
          second row (below) carries them. */}
      {isMid && (
        <>
          {isWide && <TinPills size={p.packSize} />}
          <MetricPill label="$/G" value={fmtPerGram(p.pricePerGram)} highlight />
          <MetricPill label="$/SCOOP" value={fmtSGD(p.pricePerScoop)} />
          {isWide && <MetricPill label="$/ML" value={fmtPerGram(perMl)} />}
          <MetricPill label="TIN" value={fmtSGD(p.price)} />
          {isWide && (
            <View style={{ minWidth: 90, gap: 1 }}>
              <Text
                style={{
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 9,
                  fontWeight: '700',
                  letterSpacing: 0.54,
                  textTransform: 'uppercase',
                  color: tokens.colors.textMuted,
                }}
              >
                Origin
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: tokens.colors.text,
                }}
              >
                {flagFor(country)} {country || '—'}
              </Text>
            </View>
          )}
          {DetailsButton}
        </>
      )}
    </View>
  );

  return (
    <View
      style={{
        padding: 14,
        backgroundColor: inTray
          ? tokens.colors.accentTint
          : tokens.colors.bgCard,
        borderWidth: 1,
        borderColor: inTray ? tokens.colors.accent : tokens.colors.border,
        borderRadius: tokens.radius.card,
      }}
    >
      {MainRow}

      {/* Second row at narrow widths — $/G + Details, with the image
          column's worth of left-pad so it visually aligns under the
          name column rather than the thumb. */}
      {!isMid && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 12,
            paddingLeft: 90, // 20 check + 10 gap + 60 image + 10 gap-ish
          }}
        >
          <MetricPill
            label="$/G"
            value={fmtPerGram(p.pricePerGram)}
            highlight
          />
          <View style={{ flex: 1 }} />
          {DetailsButton}
        </View>
      )}
    </View>
  );
};
