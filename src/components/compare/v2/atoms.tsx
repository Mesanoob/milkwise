/**
 * Compare v2 atoms — small primitives ported from `Compare.jsx` + the
 * styles-v2 selectors (`.mw-stage-badge`, `.mw-srcchip`, `.mw-tinpicker`,
 * `.mw-metric-pill`). Used by ListRowV2, GridCardV2, FilterPanel.
 *
 * The chip palette below is **spec-exact** from styles-v2.css lines 220–230
 * — hardcoded by the design (not theme tokens). Each tag (cow/goat/soy/
 * halal/organic/lactose-free/phf/ehf/hmo/probiotic/palm-free/flag) has its
 * own border + bg + fg triple chosen for legibility at 10px on a cream
 * surface. The CLAUDE.md §7b "spec-exact palettes survive the re-skin"
 * rule covers this — don't retune.
 */

import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  milkSourceOf,
  flagFor,
  originCountry,
  SOURCE_EMOJI,
  type MilkSource,
} from '../../../utils/formulaClassifiers';
import type { Formula } from '../../../types/formula';

// ── Stage badge ─────────────────────────────────────────────────────────
// Uses the spec-exact `stageColors` palette from theme.ts (also CLAUDE.md
// §7b-frozen). Renders as a small uppercase pill.
export const StageBadge = ({ stage }: { stage: string }) => {
  const { tokens } = useTheme();
  const pair =
    tokens.stageColors[stage as keyof typeof tokens.stageColors] ??
    tokens.stageColors['Stage 1'];
  return (
    <View
      style={{
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 999,
        backgroundColor: pair.bg,
      }}
    >
      <Text
        style={{
          fontFamily: tokens.fonts.bodySemibold,
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.6,
          color: pair.fg,
        }}
      >
        {(stage || '').toUpperCase()}
      </Text>
    </View>
  );
};

// ── Source / diet chip palette (verbatim from styles-v2.css 220–230) ───
type ChipKind =
  | 'cow' | 'goat' | 'soy' | 'phf' | 'ehf'
  | 'halal' | 'organic' | 'lactose-free' | 'hmo' | 'probiotic' | 'palm-free'
  | 'flag';

const CHIP_PALETTE: Record<
  Exclude<ChipKind, 'flag'>,
  { border: string; bg: string; fg: string }
> = {
  cow:            { border: '#C9A877', bg: '#FBF6EC', fg: '#6B4F1F' },
  goat:           { border: '#C9C9C9', bg: '#F4F4F2', fg: '#4A4A48' },
  soy:            { border: '#95B27D', bg: '#EEF5E5', fg: '#3F5C2A' },
  halal:          { border: '#5F8F4D', bg: '#E8F2DC', fg: '#2F5A1E' },
  organic:        { border: '#5F8F4D', bg: '#E8F2DC', fg: '#2F5A1E' },
  'lactose-free': { border: '#6E9BC9', bg: '#E6EFF8', fg: '#1F4773' },
  phf:            { border: '#B07ABB', bg: '#F2E6F4', fg: '#5A2D69' },
  ehf:            { border: '#B07ABB', bg: '#F2E6F4', fg: '#5A2D69' },
  hmo:            { border: '#B07ABB', bg: '#F2E6F4', fg: '#5A2D69' },
  'palm-free':    { border: '#C9C9C9', bg: '#FAFAF8', fg: '#4A4A48' },
  probiotic:      { border: '#C97A77', bg: '#FBE9E8', fg: '#6B2520' },
};

const Chip = ({
  kind,
  emoji,
  label,
}: {
  kind: ChipKind;
  emoji?: string;
  label: string;
}) => {
  const { tokens } = useTheme();
  // 'flag' chips reuse the page bg + default border (no spec palette).
  const palette =
    kind === 'flag'
      ? {
          border: tokens.colors.border,
          bg: tokens.colors.bg,
          fg: tokens.colors.text,
        }
      : CHIP_PALETTE[kind];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingVertical: 2,
        paddingLeft: 5,
        paddingRight: 7,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: palette.border,
        backgroundColor: palette.bg,
      }}
    >
      {emoji && <Text style={{ fontSize: 11, lineHeight: 12 }}>{emoji}</Text>}
      <Text
        style={{
          fontFamily: tokens.fonts.bodySemibold,
          fontSize: 10,
          fontWeight: '600',
          color: palette.fg,
          lineHeight: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ── ChipRow — combined source + diet chips for a card/row ──────────────
const yes = (v: string | undefined | null): boolean =>
  !!v && v.toLowerCase().startsWith('yes');

export const ChipRow = ({ p, max = 4 }: { p: Formula; max?: number }) => {
  const source: MilkSource = milkSourceOf(p);
  const isHalal = yes(p.halal);
  const isOrganic = yes(p.organic);
  const isLactoseFree = yes(p.lactoseFree);
  const noPalm = !p.palmOil || p.palmOil.toLowerCase().startsWith('no');
  const hasHmo = !!p.hmo && p.hmo !== 'No' && p.hmo.length > 2;
  const hasProbiotic =
    !!p.probiotic && p.probiotic !== 'No' && p.probiotic.length > 2;
  const country = originCountry(p.manufacturedIn || p.origin);

  const chips: { kind: ChipKind; emoji?: string; label: string }[] = [];
  if (country)
    chips.push({ kind: 'flag', emoji: flagFor(country), label: country });
  chips.push({
    kind: source.toLowerCase().replace(/\s+/g, '-') as ChipKind,
    emoji: SOURCE_EMOJI[source],
    label: source,
  });
  if (isLactoseFree)
    chips.push({ kind: 'lactose-free', emoji: '💧', label: 'Lactose-free' });
  if (isHalal) chips.push({ kind: 'halal', emoji: '☪️', label: 'Halal' });
  if (isOrganic) chips.push({ kind: 'organic', emoji: '🌿', label: 'Organic' });
  if (hasHmo) chips.push({ kind: 'hmo', emoji: '✨', label: 'HMO' });
  if (hasProbiotic)
    chips.push({ kind: 'probiotic', emoji: '🧫', label: 'Probiotic' });
  if (noPalm)
    chips.push({ kind: 'palm-free', emoji: '🚫', label: 'Palm-free' });

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
      }}
    >
      {chips.slice(0, max).map((c, i) => (
        <Chip key={i} kind={c.kind} emoji={c.emoji} label={c.label} />
      ))}
    </View>
  );
};

// ── TinPills — pack-size pill picker (visual only) ─────────────────────
const TIN_FAMILIES: Record<string, number[]> = {
  '380':  [380],
  '400':  [400, 800],
  '800':  [400, 800, 1650],
  '820':  [820],
  '850':  [400, 850, 1700],
  '900':  [400, 900, 1800],
  '1600': [400, 1600],
  '1650': [800, 1650, 3300],
  '1700': [850, 1700],
  '1800': [400, 900, 1800],
  '3300': [800, 1650, 3300],
};
const fmtTin = (g: number): string =>
  g >= 1000 ? `${(g / 1000).toFixed(2).replace(/0$/, '')}kg` : `${g}g`;

export const TinPills = ({ size }: { size: number }) => {
  const { tokens } = useTheme();
  const fam = TIN_FAMILIES[String(size)] || [size];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
      {fam.map((g) => {
        const on = g === size;
        return (
          <View
            key={g}
            style={{
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: on ? tokens.colors.accent : tokens.colors.border,
              backgroundColor: on ? tokens.colors.accent : tokens.colors.bgCard,
            }}
          >
            <Text
              style={{
                fontFamily: tokens.fonts.mono,
                fontSize: 10,
                fontWeight: on ? '600' : '400',
                color: on ? tokens.colors.textInverse : tokens.colors.textMuted,
              }}
            >
              {fmtTin(g)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ── MetricPill — labeled mono value (price, ratio, etc.) ───────────────
export const MetricPill = ({
  label,
  value,
  highlight = false,
  style,
}: {
  label: string;
  value: string;
  /** The "hi" variant — sage-tint background + accent border. Used on
   *  the primary $/g column so it reads as the headline metric. */
  highlight?: boolean;
  style?: ViewStyle;
}) => {
  const { tokens } = useTheme();
  const fg = highlight
    ? tokens.colors.accentHover
    : { l: tokens.colors.textMuted, v: tokens.colors.text };
  const labelColor = highlight ? tokens.colors.accentHover : tokens.colors.textMuted;
  const valueColor = highlight ? tokens.colors.accentHover : tokens.colors.text;
  return (
    <View
      style={[
        {
          flexDirection: 'column',
          alignItems: 'center',
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 7,
          backgroundColor: highlight
            ? tokens.colors.accentTint
            : tokens.colors.bgPanel,
          borderWidth: highlight ? 1.5 : 1,
          borderColor: highlight ? tokens.colors.accent : tokens.colors.border,
          minWidth: 56,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: tokens.fonts.bodySemibold,
          fontSize: 8,
          fontWeight: '700',
          letterSpacing: 0.48,
          textTransform: 'uppercase',
          color: labelColor,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: tokens.fonts.monoMedium,
          fontVariant: ['tabular-nums'],
          fontSize: 12,
          fontWeight: '600',
          color: valueColor,
          marginTop: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
};

// ── Round circular check (compare-tray toggle) ─────────────────────────
export const CheckCircle = ({
  on,
  onPress,
  size = 22,
  ariaLabel,
}: {
  on: boolean;
  onPress: () => void;
  size?: number;
  ariaLabel: string;
}) => {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={ariaLabel}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: on ? tokens.colors.accent : tokens.colors.borderStrong,
        backgroundColor: on ? tokens.colors.accent : tokens.colors.bgCard,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on && (
        <Text
          style={{
            color: tokens.colors.textInverse,
            fontSize: Math.round(size * 0.55),
            lineHeight: Math.round(size * 0.55),
            fontWeight: '700',
            marginTop: -1,
          }}
        >
          ✓
        </Text>
      )}
    </Pressable>
  );
};
