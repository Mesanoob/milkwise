/**
 * GridCardV2 — image-rich product card for the grid view. Ported from
 * `Compare.jsx` GridCardV2 + styles-v2.css `.mw-pcardv2`.
 *
 * Tap targets:
 *   • Image + name + "View full details →" navigate to /product/[base-id]
 *     (strips the `--<size>` variant suffix until Phase 5 rebuilds the
 *     detail screen to consume Formula directly).
 *   • The check circle toggles tray membership without navigating.
 */

import { View, Pressable, Text, Image } from 'react-native';
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

export const GridCardV2 = ({ p }: { p: Formula }) => {
  const { tokens } = useTheme();
  const { tray, toggleTray } = useFormulaCompare();
  const inTray = tray.some((t) => t.id === p.id);
  const country = originCountry(p.manufacturedIn || p.origin);
  const href = `/product/${baseRouteId(p.id)}`;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.colors.bgCard,
        borderWidth: 1,
        borderColor: inTray ? tokens.colors.accent : tokens.colors.border,
        borderRadius: tokens.radius.card,
        padding: 16,
        gap: 12,
        ...tokens.shadow.s1,
      }}
    >
      {/* Top — stage badge + tray toggle */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <StageBadge stage={p.stage} />
        <CheckCircle
          on={inTray}
          onPress={() => toggleTray(p)}
          ariaLabel={inTray ? 'Remove from compare' : 'Add to compare'}
        />
      </View>

      {/* Image — tap routes to detail */}
      <Link href={href as never} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View details for ${shortName(p.product)}`}
          style={{
            width: '100%',
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Image
            source={getProductImage(p.img)}
            accessibilityIgnoresInvertColors
            // The §7c packshot halo class is web-only (rendered via
            // `.mw-packshot` in global.css). NativeWind extends RN's
            // Image with className; native ignores it harmlessly.
            className="mw-packshot"
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
        </Pressable>
      </Link>

      {/* Diet/source chips */}
      <ChipRow p={p} max={3} />

      {/* Brand + name */}
      <View>
        <Text
          style={{
            fontFamily: tokens.fonts.bodySemibold,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: tokens.colors.textMuted,
            marginBottom: 4,
          }}
        >
          {p.brand}
        </Text>
        <Link href={href as never} asChild>
          <Pressable accessibilityRole="link">
            <Text
              style={{
                fontFamily: tokens.fonts.displaySemibold,
                fontSize: 17,
                fontWeight: '600',
                letterSpacing: -0.17,
                lineHeight: 21,
                color: tokens.colors.text,
                minHeight: 42, // matches `min-height: 2.5em`
              }}
              numberOfLines={2}
            >
              {shortName(p.product)}
            </Text>
          </Pressable>
        </Link>
      </View>

      {/* Tin pickers */}
      <TinPills size={p.packSize} />

      {/* 3-col metric grid */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <MetricPill
          label="$/g"
          value={fmtPerGram(p.pricePerGram)}
          highlight
          style={{ flex: 1 }}
        />
        <MetricPill
          label="$/scoop"
          value={fmtSGD(p.pricePerScoop)}
          style={{ flex: 1 }}
        />
        <MetricPill label="Tin" value={fmtSGD(p.price)} style={{ flex: 1 }} />
      </View>

      {/* Summary line */}
      <Text
        style={{
          fontSize: 12,
          lineHeight: 18,
          color: tokens.colors.textMuted,
        }}
      >
        {p.packSize}g · {(p.scoopSize || 4.4).toFixed(1)}g scoop +{' '}
        {p.waterPerScoop || 30}mL water
      </Text>

      {/* Feature blurb (✓ prefix via Text composition) */}
      <Text
        style={{
          fontSize: 12,
          fontFamily: tokens.fonts.bodyMedium,
          fontWeight: '500',
          color: tokens.colors.accentHover,
        }}
      >
        ✓ {featureBlurb(p)}
      </Text>

      {/* Foot */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: tokens.colors.divider,
          paddingTop: 10,
        }}
      >
        <Text style={{ fontSize: 11, color: tokens.colors.textMuted }}>
          {flagFor(country)} {country || '—'}
        </Text>
        <Link href={href as never} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`View full details for ${shortName(p.product)}`}
          >
            <Text
              style={{
                color: tokens.colors.accentText,
                fontFamily: tokens.fonts.bodyMedium,
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              View full details →
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
};
