/**
 * app/calculator.tsx — Calculator (`/calculator`). Phase 10 rebuild.
 *
 * Ported 1:1 from `MilkWiseFinalDesign/ui_kits/website/Calculator.jsx`
 * ("What you'll actually spend." layout). Replaces the §9c "Baby Feeding
 * Calculator" sage-hero version — the underlying design has moved on.
 *
 * Top section (2-col on ≥960px):
 *   • LEFT — DOB (+ age card) · formula picker · feeding-mode toggle ·
 *            paired feeds/ml steppers · paired scoop/tin · price · solids
 *            card (≥6mo).
 *   • RIGHT — INTAKE BENCHMARK card (status + ml/day count + bar) · 2×2
 *            ResultCard grid (Daily · Monthly · Spent so far · Projected)
 *            · Singapore Feeding Benchmark line chart.
 *
 * Below (full-width):
 *   • Formula Usage & Cost — 5 metric tiles + Monthly Formula Cost bars.
 *   • Estimated Lifetime Formula Spend — 3 colored cells + cumulative
 *     curve + Causeway saving card + methodology.
 *   • Singapore Infant Feeding Guidelines — 12-row HPB table, baby's age
 *     row highlighted.
 *
 * Math is inline (matches the design's own calc — simpler than the v1
 * feedingCalculator engine, which is now unreferenced and can be removed
 * in a follow-up cleanup). Reads Formula directly — no Phase-7
 * formulaToProductLike adapter needed; design code already reads
 * scoopSize/packSize/price/pricePerGram which are Formula fields.
 *
 * Charts use `react-native-svg` (already in the dep tree from the old
 * v1 charts; those files are now unused and can be deleted next pass).
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Screen } from '../src/components/Screen';
import { useTheme } from '../src/contexts/ThemeContext';
import { getAllFormulas } from '../src/data/formulas';
import { fmtSGD, fmtPerGram } from '../src/utils/formulaFormat';
import { shortName } from '../src/utils/formulaClassifiers';
import type { Formula } from '../src/types/formula';

// Persisted DOB key. Versioned so the schema can evolve without
// silently mis-reading an old value.
const DOB_STORAGE_KEY = 'milkwise.calculator.dob.v1';

// ── WHO/HPB feeding guidelines (verbatim from design) ─────────────────
type Guideline = {
  maxMo: number;
  feeds: [number, number];
  mlPerFeed: [number, number];
  dailyMl: [number, number];
  stage: string;
};
const GUIDELINES: Guideline[] = [
  { maxMo:  1, feeds: [ 8, 12], mlPerFeed: [ 45,  90], dailyMl: [400,  600], stage: 'Stage 1' },
  { maxMo:  3, feeds: [ 6,  8], mlPerFeed: [ 90, 150], dailyMl: [600,  900], stage: 'Stage 1' },
  { maxMo:  6, feeds: [ 5,  6], mlPerFeed: [150, 210], dailyMl: [800, 1000], stage: 'Stage 1' },
  { maxMo:  9, feeds: [ 3,  5], mlPerFeed: [180, 240], dailyMl: [600,  900], stage: 'Stage 2' },
  { maxMo: 12, feeds: [ 3,  4], mlPerFeed: [180, 240], dailyMl: [500,  700], stage: 'Stage 2' },
  { maxMo: 24, feeds: [ 2,  3], mlPerFeed: [200, 240], dailyMl: [350,  500], stage: 'Stage 3' },
  { maxMo: 36, feeds: [ 1,  2], mlPerFeed: [200, 250], dailyMl: [200,  400], stage: 'Stage 3/4' },
  { maxMo: 999, feeds: [0,  1], mlPerFeed: [200, 250], dailyMl: [  0,  250], stage: 'Stage 4' },
];
const SOLIDS = [
  { maxMo:  6, mealsPerDay: 0, calsFromSolids: 0 },
  { maxMo:  8, mealsPerDay: 2, calsFromSolids: 200 },
  { maxMo: 12, mealsPerDay: 3, calsFromSolids: 300 },
  { maxMo: 24, mealsPerDay: 4, calsFromSolids: 550 },
  { maxMo: 36, mealsPerDay: 4, calsFromSolids: 750 },
  { maxMo: 999, mealsPerDay: 3, calsFromSolids: 950 },
];
const guidelineForAge = (months: number): Guideline =>
  GUIDELINES.find((g) => months <= g.maxMo) ?? GUIDELINES[GUIDELINES.length - 1];
const solidsForAge = (months: number) =>
  SOLIDS.find((s) => months <= s.maxMo) ?? SOLIDS[SOLIDS.length - 1];

const calcAge = (dobIso: string, asOf = new Date()) => {
  if (!dobIso) return null;
  const b = new Date(dobIso);
  if (Number.isNaN(b.getTime())) return null;
  let years = asOf.getFullYear() - b.getFullYear();
  let months = asOf.getMonth() - b.getMonth();
  let days = asOf.getDate() - b.getDate();
  if (days < 0) {
    months--;
    days += new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  const totalMonths = years * 12 + months + days / 30;
  return { years, months, days, totalMonths };
};

// ── HPB feeding guidelines table data (12 rows, full year) ────────────
const HPB_ROWS: { age: string; ml: string; feeds: string; daily: string; note: string }[] = [
  { age: 'Birth',     ml: '60–90ml',   feeds: '8–12×', daily: '480–1080ml', note: 'Very frequent feeds; stomach is tiny (~5–7ml at day 1, ~45ml by week 1)' },
  { age: '1 month',   ml: '90–120ml',  feeds: '7–9×',  daily: '630–1080ml', note: 'Growth spurt often around 3 weeks' },
  { age: '2 months',  ml: '120–150ml', feeds: '6–8×',  daily: '720–1200ml', note: 'Feeds becoming more predictable' },
  { age: '3 months',  ml: '150–180ml', feeds: '5–7×',  daily: '750–1260ml', note: 'Many babies begin stretching feeds at night' },
  { age: '4 months',  ml: '150–200ml', feeds: '5–6×',  daily: '750–1200ml', note: '4-month sleep regression is common' },
  { age: '5 months',  ml: '180–210ml', feeds: '4–6×',  daily: '720–1260ml', note: 'Watch for signs of readiness for solids' },
  { age: '6 months',  ml: '180–210ml', feeds: '4–5×',  daily: '720–1050ml', note: 'HPB recommends introducing solids at 6 months' },
  { age: '7 months',  ml: '180–210ml', feeds: '3–5×',  daily: '540–1050ml', note: 'Milk remains primary nutrition; solids are complementary' },
  { age: '8 months',  ml: '170–210ml', feeds: '3–4×',  daily: '510–840ml',  note: 'Texture progression in solids — lumpy/mashed' },
  { age: '9 months',  ml: '170–200ml', feeds: '3–4×',  daily: '510–800ml',  note: 'Finger foods can be introduced' },
  { age: '10 months', ml: '150–200ml', feeds: '3–4×',  daily: '450–800ml',  note: 'Milk intake naturally begins to decrease' },
  { age: '11 months', ml: '150–180ml', feeds: '3–3×',  daily: '450–540ml',  note: 'Approaching transition to cow’s milk at 12 months' },
];
const ageRowKey = (ageMo: number): string => {
  const m = Math.max(0, Math.min(11, Math.round(ageMo)));
  return m === 0 ? 'Birth' : `${m} month${m > 1 ? 's' : ''}`;
};

// ── Stepper (used 5x in form; small enough to inline) ─────────────────
// Flex layout: `flexShrink: 0` on buttons + `minWidth: 0` on the TextInput
// stops a side-by-side stepper column from eating its sibling's "+" off
// the right edge.
//
// 2026-05-21 bug fix — typing was clamped per-keystroke, so typing "180"
// for ml/feed (min=30) hit "1" → clamped to 30 → user could never get
// below 30 by typing. Fix: drop the clamp from `onChangeText` entirely;
// the +/- buttons still enforce min/max, and the field commits whatever
// the user types. Out-of-range typed values are clamped only on blur
// (intermediate values during typing are allowed to pass through).
const Stepper = ({
  value, onChange, step = 1, min = 0, max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number; min?: number; max?: number;
}) => {
  const { tokens } = useTheme();
  const btn = {
    width: 36, height: 36, flexShrink: 0,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: tokens.colors.bgPanel,
    borderWidth: 1, borderColor: tokens.colors.border,
    borderRadius: 8,
  };
  const txt = { color: tokens.colors.text, fontSize: 17, fontWeight: '600' as const };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <Pressable
        accessibilityRole="button" accessibilityLabel="Decrement"
        onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        style={btn}>
        <Text style={txt}>−</Text>
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={(s) => {
          // Don't clamp during typing — let intermediate values pass
          // through (typing "180" must briefly be "1" and "18"). The
          // +/- buttons enforce min/max; blur clamps to range.
          if (s === '') { onChange(0); return; }
          const n = Number(s);
          if (Number.isFinite(n) && n >= 0) onChange(n);
        }}
        onBlur={() => {
          if (value < min) onChange(min);
          else if (value > max) onChange(max);
        }}
        keyboardType="numeric"
        style={{
          flex: 1, minWidth: 0, height: 36, textAlign: 'center',
          fontFamily: tokens.fonts.monoMedium,
          fontVariant: ['tabular-nums'] as ['tabular-nums'],
          fontSize: 15, color: tokens.colors.text,
          backgroundColor: tokens.colors.bgPanel,
          borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 8,
          paddingHorizontal: 8,
        }}
      />
      <Pressable
        accessibilityRole="button" accessibilityLabel="Increment"
        onPress={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        style={btn}>
        <Text style={txt}>+</Text>
      </Pressable>
    </View>
  );
};

// Display-only spec value (used when scoop is locked by formula choice).
const SpecDisplay = ({ value, unit }: { value: string; unit: string }) => {
  const { tokens } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      height: 36, paddingHorizontal: 12, borderRadius: 8,
      borderWidth: 1, borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.bgPanel,
    }}>
      <Text style={{
        fontFamily: tokens.fonts.monoMedium,
        fontVariant: ['tabular-nums'] as ['tabular-nums'],
        fontSize: 15, color: tokens.colors.text,
      }}>{value}</Text>
      <Text style={{
        fontSize: 12, color: tokens.colors.textMuted,
        fontFamily: tokens.fonts.mono,
      }}>{unit}</Text>
    </View>
  );
};

// ── Label + small-hint helper (matches `.mw-label small` pattern) ─────
const Label = ({ children, hint }: { children: string; hint?: string }) => {
  const { tokens } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
      <Text style={{
        fontFamily: tokens.fonts.bodySemibold,
        fontSize: 13, fontWeight: '600',
        color: tokens.colors.text,
      }}>{children}</Text>
      {hint ? (
        <Text style={{
          fontSize: 11, color: tokens.colors.textMuted,
          fontFamily: tokens.fonts.mono, fontVariant: ['tabular-nums'] as ['tabular-nums'],
        }}>{hint}</Text>
      ) : null}
    </View>
  );
};

// ── Card wrapper ──────────────────────────────────────────────────────
const Card = ({
  children, style,
}: { children: React.ReactNode; style?: object }) => {
  const { tokens } = useTheme();
  return (
    <View
      style={[{
        backgroundColor: tokens.colors.bgCard,
        borderWidth: 1, borderColor: tokens.colors.border,
        borderRadius: tokens.radius.card,
        padding: 20,
        ...tokens.shadow.s1,
      }, style]}>
      {children}
    </View>
  );
};

// ── BenchmarkBar — horizontal value-vs-range track ────────────────────
const BenchmarkBar = ({ value, low, high }: { value: number; low: number; high: number }) => {
  const { tokens } = useTheme();
  const maxScale = Math.max(high * 1.5, value * 1.1, 1500);
  const valPct = Math.min(100, (value / maxScale) * 100);
  const loPct = (low / maxScale) * 100;
  const hiPct = (high / maxScale) * 100;
  return (
    <View style={{ height: 14, borderRadius: 7, backgroundColor: tokens.colors.bgPanel, position: 'relative', marginTop: 12 }}>
      <View style={{
        position: 'absolute',
        left: `${loPct}%`, width: `${Math.max(0, hiPct - loPct)}%`,
        top: 0, bottom: 0,
        backgroundColor: tokens.colors.accentSoft,
        borderRadius: 7,
      }} />
      <View style={{
        position: 'absolute',
        left: `${valPct}%`, marginLeft: -7,
        top: -3, width: 14, height: 20,
        backgroundColor: tokens.colors.text,
        borderRadius: 4,
      }} />
    </View>
  );
};

// ── BenchmarkLine — 12mo HPB midpoint + shaded band + current dot ─────
const BenchmarkLine = ({
  current, currentMl, inRange, monthMidpoints,
}: {
  current: number; currentMl: number; inRange: boolean;
  monthMidpoints: { mo: number; lo: number; mid: number; hi: number }[];
}) => {
  const { tokens } = useTheme();
  const W = 760, H = 280, PAD_L = 56, PAD_R = 28, PAD_T = 20, PAD_B = 44;
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
  const maxY = 1300, minY = 200;
  const xScale = (mo: number) => PAD_L + (mo / 11) * innerW;
  const yScale = (v: number) => PAD_T + innerH - ((v - minY) / (maxY - minY)) * innerH;
  const top = monthMidpoints.map((d) => `${xScale(d.mo).toFixed(1)},${yScale(d.hi).toFixed(1)}`);
  const bot = monthMidpoints.slice().reverse().map((d) => `${xScale(d.mo).toFixed(1)},${yScale(d.lo).toFixed(1)}`);
  const bandPath = 'M' + [...top, ...bot].join('L') + 'Z';
  const linePath = 'M' + monthMidpoints.map((d) => `${xScale(d.mo).toFixed(1)},${yScale(d.mid).toFixed(1)}`).join('L');
  const yTicks = [200, 400, 700, 900, 1000, 1200];
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ aspectRatio: W / H, maxHeight: 340 }}>
      {yTicks.map((t) => (
        <Line key={t} x1={PAD_L} y1={yScale(t)} x2={W - PAD_R} y2={yScale(t)} stroke={tokens.colors.divider} strokeWidth={1} />
      ))}
      {yTicks.map((t) => (
        <SvgText key={`l${t}`} x={PAD_L - 10} y={yScale(t) + 4} fontSize={12} fill={tokens.colors.textMuted} textAnchor="end" fontFamily={tokens.fonts.mono}>{t}</SvgText>
      ))}
      <Path d={bandPath} fill={tokens.colors.accent} fillOpacity={0.16} />
      <Path d={linePath} fill="none" stroke={tokens.colors.accentText} strokeWidth={3} />
      <Line x1={xScale(current)} y1={PAD_T} x2={xScale(current)} y2={H - PAD_B}
        stroke={tokens.colors.textFaint} strokeWidth={1.25} strokeDasharray="4 5" />
      {monthMidpoints.map((d) => (
        <SvgText key={`x${d.mo}`} x={xScale(d.mo)} y={H - PAD_B + 22} fontSize={12}
          fill={d.mo === current ? tokens.colors.accentText : tokens.colors.textMuted}
          fontWeight={d.mo === current ? '700' : '400'}
          textAnchor="middle" fontFamily={tokens.fonts.mono}>{d.mo}m</SvgText>
      ))}
      <Circle cx={xScale(current)} cy={yScale(currentMl)} r={9}
        fill={inRange ? '#2563EB' : '#DC2626'} stroke="white" strokeWidth={3} />
    </Svg>
  );
};

// ── MonthlyBars — 12 bars colored past/now/projected ──────────────────
type ProjRow = {
  month: number; isPast: boolean; isNow: boolean; stage: string;
  expectedMl: number; adjustedMl: number; solidsCut: number;
  cost: number; tinsThisMonth: number;
};
const MonthlyBars = ({ rows }: { rows: ProjRow[] }) => {
  const { tokens } = useTheme();
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.cost), 1);
  const W = 760, H = 220, PAD_L = 44, PAD_R = 16, PAD_T = 18, PAD_B = 30;
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
  const slotW = innerW / rows.length;
  const yScale = (v: number) => PAD_T + innerH - (v / max) * innerH;
  const yTicks = [0, max * 0.25, max * 0.5, max * 0.75, max];
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ aspectRatio: W / H, maxHeight: 240 }}>
      {yTicks.map((t, i) => (
        <Line key={i} x1={PAD_L} y1={yScale(t)} x2={W - PAD_R} y2={yScale(t)}
          stroke={i === 0 ? tokens.colors.border : tokens.colors.divider} strokeWidth={1} />
      ))}
      {yTicks.map((t, i) => (
        <SvgText key={`l${i}`} x={PAD_L - 6} y={yScale(t) + 4} fontSize={10}
          fill={tokens.colors.textMuted} textAnchor="end" fontFamily={tokens.fonts.mono}>
          ${Math.round(t)}
        </SvgText>
      ))}
      {rows.map((r, i) => {
        const x = PAD_L + slotW * i + slotW * 0.18;
        const w = slotW * 0.64;
        const h = (r.cost / max) * innerH;
        const y = yScale(r.cost);
        const fill = r.isNow ? tokens.colors.accentText : r.isPast ? tokens.colors.accentSoft : tokens.colors.border;
        return (
          <Fragment key={r.month}>
            <Rect x={x} y={y} width={w} height={h} fill={fill} rx={2} />
            <SvgText x={x + w / 2} y={y - 5} fontSize={9} fill={tokens.colors.textMuted}
              textAnchor="middle" fontFamily={tokens.fonts.mono}>
              ${Math.round(r.cost)}
            </SvgText>
            <SvgText x={x + w / 2} y={H - PAD_B + 14} fontSize={10}
              fill={r.isNow ? tokens.colors.accentText : tokens.colors.textMuted}
              fontWeight={r.isNow ? '700' : '400'}
              textAnchor="middle" fontFamily={tokens.fonts.mono}>{r.month}m</SvgText>
          </Fragment>
        );
      })}
    </Svg>
  );
};

// ── CumulativeCurve — past area + projected dashed ────────────────────
const CumulativeCurve = ({ rows, total }: { rows: ProjRow[]; total: number }) => {
  const { tokens } = useTheme();
  if (!rows.length) return null;
  const W = 760, H = 220, PAD_L = 50, PAD_R = 80, PAD_T = 18, PAD_B = 34;
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
  let runningPast = 0, runningProj = 0, foundNow = false;
  const cumPast: { mo: number; v: number }[] = [];
  const cumProj: { mo: number; v: number }[] = [];
  rows.forEach((r) => {
    if (!foundNow) {
      runningPast += r.cost;
      cumPast.push({ mo: r.month, v: runningPast });
      if (r.isNow) { foundNow = true; runningProj = runningPast; }
    } else {
      runningProj += r.cost;
      cumProj.push({ mo: r.month, v: runningProj });
    }
  });
  const allMo = rows.map((r) => r.month);
  const minMo = Math.min(...allMo), maxMo = Math.max(...allMo);
  const maxY = Math.max(total, runningProj, runningPast) * 1.05 || 100;
  const xScale = (mo: number) => PAD_L + ((mo - minMo) / Math.max(1, maxMo - minMo)) * innerW;
  const yScale = (v: number) => PAD_T + innerH - (v / maxY) * innerH;
  const buildPath = (pts: { mo: number; v: number }[]) =>
    'M' + pts.map((p) => `${xScale(p.mo).toFixed(1)},${yScale(p.v).toFixed(1)}`).join('L');
  const areaPath = cumPast.length
    ? `M${xScale(cumPast[0].mo).toFixed(1)},${yScale(0).toFixed(1)}L` +
      cumPast.map((p) => `${xScale(p.mo).toFixed(1)},${yScale(p.v).toFixed(1)}`).join('L') +
      `L${xScale(cumPast[cumPast.length - 1].mo).toFixed(1)},${yScale(0).toFixed(1)}Z`
    : '';
  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY];
  const projWithBridge = cumPast.length && cumProj.length
    ? [cumPast[cumPast.length - 1], ...cumProj]
    : cumProj;
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ aspectRatio: W / H, maxHeight: 240 }}>
      {yTicks.map((t, i) => (
        <Line key={i} x1={PAD_L} y1={yScale(t)} x2={W - PAD_R} y2={yScale(t)}
          stroke={i === 0 ? tokens.colors.border : tokens.colors.divider} strokeWidth={1} />
      ))}
      {yTicks.map((t, i) => (
        <SvgText key={`l${i}`} x={PAD_L - 6} y={yScale(t) + 4} fontSize={10}
          fill={tokens.colors.textMuted} textAnchor="end" fontFamily={tokens.fonts.mono}>
          ${Math.round(t)}
        </SvgText>
      ))}
      {areaPath ? <Path d={areaPath} fill={tokens.colors.accent} fillOpacity={0.16} /> : null}
      {cumPast.length > 1 ? <Path d={buildPath(cumPast)} fill="none" stroke={tokens.colors.accentText} strokeWidth={2.5} /> : null}
      {projWithBridge.length > 1 ? <Path d={buildPath(projWithBridge)} fill="none" stroke={tokens.colors.accentText} strokeWidth={2.5} strokeDasharray="5 4" /> : null}
      <SvgText x={W - PAD_R + 6} y={yScale(total) + 4} fontSize={11}
        fill={tokens.colors.accentText} fontWeight="700" fontFamily={tokens.fonts.mono}>
        total: ${total.toFixed(2)}
      </SvgText>
      {Array.from({ length: maxMo - minMo + 1 }, (_, i) => minMo + i).map((t) => (
        <SvgText key={t} x={xScale(t)} y={H - PAD_B + 16} fontSize={9}
          fill={tokens.colors.textMuted} textAnchor="middle" fontFamily={tokens.fonts.mono}>{t}m</SvgText>
      ))}
    </Svg>
  );
};

// ── CountUp — animates from previous → next value (eased) ─────────────
// Ported from `Calculator.jsx` CountUp. Ease-out cubic over `duration` ms.
// Uses `Date.now()` rather than `performance.now()` for native parity.
// `format` receives the interpolated float so callers can render the
// in-flight value with their own precision (e.g. fmtSGD vs round vs 2dp).
const CountUp = ({
  value,
  format = (n: number) => n.toFixed(2),
  duration = 500,
  style,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  style?: object;
}) => {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = Number.isFinite(value) ? value : 0;
    const t0 = Date.now();
    let raf: number;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(start + (end - start) * eased);
      if (k < 1) raf = requestAnimationFrame(step);
      else prev.current = end;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <Text style={style}>{format(v)}</Text>;
};

// ── Page ──────────────────────────────────────────────────────────────

export default function CalculatorScreen() {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const twoCol = width >= 960;
  const today = useRef(new Date());
  const todayStr = today.current.toLocaleDateString('en-SG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Formula dataset (76 SKUs from Phase 1).
  const formulas = useMemo<Formula[]>(() => getAllFormulas(), []);

  // Unique product LINES (one entry per p.product name). Multi-variant
  // products collapse to a single row in the picker; the user then picks
  // a specific pack size from the constrained Tin Size dropdown.
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    const out: Formula[] = [];
    for (const f of formulas) {
      if (seen.has(f.product)) continue;
      seen.add(f.product);
      out.push(f);
    }
    return out.sort(
      (a, b) =>
        a.brand.localeCompare(b.brand) || a.product.localeCompare(b.product),
    );
  }, [formulas]);

  // ── State: ALL defaults are 0 / empty for first-visit "show zeros" UX.
  // DOB hydrates from AsyncStorage if present. Picking a formula and/or
  // entering a DOB triggers the age + variant auto-fills below.
  const [dob, setDobState] = useState('');
  const [productName, setProductName] = useState('');
  const [feedsPerDay, setFeedsPerDay] = useState(0);
  const [mlPerFeed, setMlPerFeed] = useState(0);
  const [scoopSize, setScoopSize] = useState(0);
  const [tinSize, setTinSize] = useState(0);
  const [pricePerTin, setPricePerTin] = useState(0);
  const [feedingMode, setFeedingMode] = useState<'formula' | 'mixed'>('formula');
  const [breastFeedsShare, setBreastFeedsShare] = useState(0);
  const [solidsMeals, setSolidsMeals] = useState(0);

  // Hydrate persisted DOB on mount. Best-effort — storage failures (private
  // mode, quota) fall through to the empty default.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(DOB_STORAGE_KEY)
      .then((saved) => {
        if (alive && typeof saved === 'string' && saved.length === 10) {
          setDobState(saved);
        }
      })
      .catch(() => {
        /* storage unreadable — keep empty default */
      });
    return () => { alive = false };
  }, []);

  // Persist on every change. `''` clears the cached value too.
  const setDob = (next: string) => {
    setDobState(next);
    if (next) AsyncStorage.setItem(DOB_STORAGE_KEY, next).catch(() => {});
    else AsyncStorage.removeItem(DOB_STORAGE_KEY).catch(() => {});
  };

  // Derived age / guideline.
  const age = useMemo(() => calcAge(dob, today.current), [dob]);
  const ageMo = age ? age.totalMonths : 0;
  const guideline = guidelineForAge(ageMo);
  const solidsRec = solidsForAge(ageMo);

  // Derived product/variant state — drives the constrained Tin Size
  // dropdown and the formula-driven auto-fills below.
  const productVariants = useMemo(
    () =>
      productName
        ? formulas
            .filter((f) => f.product === productName)
            .sort((a, b) => a.packSize - b.packSize)
        : [],
    [formulas, productName],
  );
  const availableSizes = useMemo(
    () => productVariants.map((v) => v.packSize),
    [productVariants],
  );
  const selectedVariant = useMemo(
    () =>
      productName ? productVariants.find((v) => v.packSize === tinSize) ?? null : null,
    [productName, productVariants, tinSize],
  );
  // The currently active "product" reference for downstream UI labels
  // (Formula Usage & Cost sub-heading, Causeway saving copy).
  const product = selectedVariant;

  // Age-driven auto-fill: when DOB is set (or changed), seed feeds + ml
  // from the age-appropriate guideline midpoint. Skips when no DOB so the
  // first-visit "all zeros" state holds.
  useEffect(() => {
    if (!age) return;
    const g = guidelineForAge(age.totalMonths);
    setFeedsPerDay(Math.round((g.feeds[0] + g.feeds[1]) / 2));
    setMlPerFeed(Math.round((g.mlPerFeed[0] + g.mlPerFeed[1]) / 2));
    setSolidsMeals(solidsForAge(age.totalMonths).mealsPerDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dob]);

  // Product-change auto-fill: when the user picks a new formula, default
  // to its smallest variant and pre-fill scoop + price. Clearing the
  // picker (back to "Manual entry") zeros the spec fields so the manual
  // entries start fresh.
  useEffect(() => {
    if (!productName) {
      setTinSize(0);
      setScoopSize(0);
      setPricePerTin(0);
      return;
    }
    const v = productVariants[0]; // smallest
    if (!v) return;
    setTinSize(v.packSize);
    if (v.scoopSize) setScoopSize(v.scoopSize);
    if (v.price) setPricePerTin(v.price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productName]);

  // Tin-size-change auto-fill (within a product): swapping to a different
  // pack size for the same product re-fills scoop + price from that
  // variant. No-op for manual entry (selectedVariant is null).
  useEffect(() => {
    if (!selectedVariant) return;
    if (selectedVariant.scoopSize) setScoopSize(selectedVariant.scoopSize);
    if (selectedVariant.price) setPricePerTin(selectedVariant.price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.id]);

  // ── Calculations (inline; matches design's math exactly) ─────────
  const calc = useMemo(() => {
    const formulaFeeds = feedsPerDay;
    const breastFeeds = feedingMode === 'mixed' ? breastFeedsShare : 0;
    const totalFeeds = formulaFeeds + breastFeeds;
    const dailyMlTotal = totalFeeds * mlPerFeed;
    const dailyMlFormula = formulaFeeds * mlPerFeed;
    const gramsPerMl = scoopSize / 30;
    const dailyGrams = dailyMlFormula * gramsPerMl;
    const monthlyGrams = dailyGrams * 30;
    const dailyCost = (dailyGrams / Math.max(1, tinSize)) * pricePerTin;
    const monthlyCost = dailyCost * 30;
    const tinsPerMonth = (dailyGrams * 30) / Math.max(1, tinSize);
    const yearlyCost = dailyCost * 365;
    return { dailyMlTotal, dailyMlFormula, dailyGrams, monthlyGrams,
      dailyCost, monthlyCost, yearlyCost, tinsPerMonth,
      formulaFeeds, breastFeeds, totalFeeds };
  }, [feedsPerDay, mlPerFeed, breastFeedsShare, scoopSize, tinSize, pricePerTin, feedingMode]);

  const inRangeStatus = useMemo(() => {
    // First-visit / no DOB: show a neutral CTA instead of "Below typical
    // range" — there's no age guideline to compare to yet.
    if (!age) {
      return { label: 'Enter date of birth to compare', tone: 'muted' as const, delta: '' };
    }
    const intake = calc.dailyMlTotal;
    const [lo, hi] = guideline.dailyMl;
    if (lo === 0 && hi === 0) return { label: 'No specific guideline for this age', tone: 'muted' as const, delta: '' };
    if (intake < lo * 0.85) return { label: 'Below typical range', tone: 'low' as const, delta: `${Math.round(lo - intake)} ml/day under` };
    if (intake > hi * 1.15) return { label: 'Above typical range', tone: 'high' as const, delta: `${Math.round(intake - hi)} ml/day over` };
    return { label: 'Within typical range', tone: 'in' as const, delta: `${lo}–${hi} ml/day` };
  }, [age, calc.dailyMlTotal, guideline]);

  // 12-month projection (months 0..11).
  //
  // Per-month rate sourcing:
  //   • Past months (mo < current) — HPB median (user wasn't tracking
  //     back then; we're estimating retrospectively).
  //   • Current month (mo === current) — USER'S ACTUAL feeds × ml × spec,
  //     so the highlighted dark-green "now" bar matches the headline
  //     Monthly Cost (NOW) and the Formula Usage & Cost section. Bug
  //     fix 2026-05-21: previously this used median, which produced a
  //     bar that disagreed with the headline (e.g. $171 bar vs $270
  //     headline) and confused users.
  //   • Future months (mo > current) — HPB median with solids cut
  //     (typical tapering pattern, not an extrapolation of the user's
  //     current rate which would over-project once solids take over).
  const projection: ProjRow[] = useMemo(() => {
    const ageInt = Math.max(0, Math.min(11, Math.floor(ageMo)));
    const userDailyMl = feedsPerDay * mlPerFeed;
    return Array.from({ length: 12 }, (_, mo) => {
      const g = guidelineForAge(mo);
      const isNow = mo === ageInt;
      const expectedMl = (g.dailyMl[0] + g.dailyMl[1]) / 2;
      const solidsCut = mo >= 6 ? Math.min(0.5, (mo - 6) * 0.06) : 0;
      const adjustedMl = isNow && userDailyMl > 0
        ? userDailyMl
        : expectedMl * (1 - solidsCut);
      const grams = adjustedMl * (scoopSize / 30);
      const tinsThisMonth = (grams * 30) / Math.max(1, tinSize);
      const cost = tinsThisMonth * pricePerTin;
      return { month: mo, isPast: mo < ageInt, isNow, stage: g.stage,
        expectedMl, adjustedMl, solidsCut, cost, tinsThisMonth };
    });
  }, [ageMo, feedsPerDay, mlPerFeed, scoopSize, tinSize, pricePerTin]);
  const pastSpend = projection.filter((r) => r.isPast).reduce((s, r) => s + r.cost, 0);
  const futureSpend = projection.filter((r) => !r.isPast).reduce((s, r) => s + r.cost, 0);
  const totalSpend = pastSpend + futureSpend;

  const monthMidpoints = useMemo(
    () => Array.from({ length: 12 }, (_, mo) => {
      const g = guidelineForAge(mo);
      return { mo, lo: g.dailyMl[0], mid: (g.dailyMl[0] + g.dailyMl[1]) / 2, hi: g.dailyMl[1] };
    }),
    [],
  );
  const currentMonthInt = Math.max(0, Math.min(11, Math.round(ageMo)));
  const benchmarkInRange = calc.dailyMlTotal >= guideline.dailyMl[0] * 0.85
                        && calc.dailyMlTotal <= guideline.dailyMl[1] * 1.15;
  const ageMonthInt = age ? Math.floor(age.totalMonths) : 0;
  const currentRowKey = ageRowKey(ageMo);

  return (
    <Screen>
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={{
        maxWidth: tokens.layout.maxContent, width: '100%',
        marginHorizontal: 'auto',
        paddingHorizontal: 32, paddingTop: 32, paddingBottom: 16,
      }}>
        <Text style={{
          fontFamily: tokens.fonts.bodySemibold,
          fontSize: 11, fontWeight: '600',
          letterSpacing: 1.32, textTransform: 'uppercase',
          color: tokens.colors.textMuted, marginBottom: 8,
        }}>Calculator</Text>
        <Text style={{
          fontFamily: tokens.fonts.displayBold,
          fontSize: width < 768 ? 28 : 40, fontWeight: '700',
          letterSpacing: -(width < 768 ? 0.62 : 0.88),
          lineHeight: width < 768 ? 32 : 44,
          color: tokens.colors.text, marginBottom: 8,
        }}>What you&apos;ll actually spend.</Text>
        <Text style={{
          fontSize: 15, lineHeight: 23,
          color: tokens.colors.textMuted, maxWidth: 720,
        }}>
          Enter your baby&apos;s date of birth — we use today&apos;s date (
          <Text style={{ fontFamily: tokens.fonts.bodySemibold, color: tokens.colors.text }}>
            {todayStr}
          </Text>
          ) to estimate spend so far and project forward, accounting for
          the transition to solids.
        </Text>
      </View>

      {/* ── PART 1: Inputs + Results ────────────────────────── */}
      <View style={{
        maxWidth: tokens.layout.maxContent, width: '100%',
        marginHorizontal: 'auto', paddingHorizontal: 32, paddingBottom: 16,
      }}>
        <View style={{
          flexDirection: twoCol ? 'row' : 'column',
          alignItems: twoCol ? 'flex-start' : 'stretch',
          gap: twoCol ? 32 : 20,
        }}>
          {/* LEFT inputs panel */}
          <View style={{ width: twoCol ? 420 : '100%' }}>
            <Card>
              <View style={{ gap: 18 }}>
                {/* DOB */}
                <View>
                  <Label hint="cannot be in the future">Baby&apos;s date of birth</Label>
                  <DateField
                    value={dob}
                    max={today.current.toISOString().slice(0, 10)}
                    onChange={setDob}
                  />
                  {age ? <AgeCard age={age} guideline={guideline} /> : null}
                </View>

                {/* Formula picker — one entry per product line; choosing
                    a product unlocks the constrained Tin Size dropdown
                    with only that product's available pack sizes. */}
                <View>
                  <Label hint="auto-fills scoop, tin size, price">Pick a formula</Label>
                  <FormulaSelect
                    products={uniqueProducts}
                    value={productName}
                    onChange={setProductName}
                  />
                </View>

                {/* Feeding mode segmented toggle */}
                <View>
                  <Label>Feeding mode</Label>
                  <View style={{
                    flexDirection: 'row', gap: 0,
                    borderWidth: 1, borderColor: tokens.colors.border,
                    borderRadius: 999, backgroundColor: tokens.colors.bgPanel,
                    padding: 4,
                  }}>
                    {(['formula', 'mixed'] as const).map((k) => {
                      const label = k === 'formula' ? 'Formula only' : 'Formula + breast milk';
                      const on = feedingMode === k;
                      return (
                        <Pressable
                          key={k}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          onPress={() => setFeedingMode(k)}
                          style={{
                            flex: 1, paddingVertical: 8, paddingHorizontal: 14,
                            borderRadius: 999,
                            backgroundColor: on ? tokens.colors.bgCard : 'transparent',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{
                            fontFamily: on ? tokens.fonts.bodySemibold : tokens.fonts.body,
                            fontSize: 13, fontWeight: on ? '600' : '500',
                            color: on ? tokens.colors.text : tokens.colors.textMuted,
                          }}>{label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Feeds + ml/feed paired */}
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Label hint={`${guideline.feeds[0]}–${guideline.feeds[1]} typical`}>
                      {feedingMode === 'mixed' ? 'Formula feeds/day' : 'Total feeds/day'}
                    </Label>
                    <Stepper value={feedsPerDay} onChange={setFeedsPerDay} min={0} max={14} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Label hint={`${guideline.mlPerFeed[0]}–${guideline.mlPerFeed[1]} typical`}>
                      ml/feed
                    </Label>
                    <Stepper value={mlPerFeed} onChange={setMlPerFeed} step={10} min={30} max={300} />
                  </View>
                </View>

                {feedingMode === 'mixed' ? (
                  <View>
                    <Label hint="adds to total feeds">Breast feeds per day</Label>
                    <Stepper value={breastFeedsShare} onChange={setBreastFeedsShare} min={0} max={14} />
                    <Text style={{
                      fontSize: 12, marginTop: 6,
                      color: tokens.colors.textMuted, fontFamily: tokens.fonts.mono,
                      fontVariant: ['tabular-nums'] as ['tabular-nums'],
                    }}>
                      {feedsPerDay} formula + {breastFeedsShare} breast = {feedsPerDay + breastFeedsShare} feeds/day · {(feedsPerDay + breastFeedsShare) * mlPerFeed}ml total
                    </Text>
                  </View>
                ) : null}

                {/* Scoop + Tin paired. Scoop is editable only in Manual
                    Entry mode; when a formula is picked the scoop size is
                    fixed by the product spec — show it read-only so users
                    can't accidentally override the manufacturer's value. */}
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Label hint={productName ? 'from product spec' : 'grams'}>
                      Scoop size
                    </Label>
                    {productName ? (
                      <SpecDisplay value={String(scoopSize)} unit="g" />
                    ) : (
                      <Stepper value={scoopSize} onChange={setScoopSize} step={0.1} min={3} max={12} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Label hint="grams">Tin size</Label>
                    <TinSelect
                      value={tinSize}
                      onChange={setTinSize}
                      sizes={productName ? availableSizes : undefined}
                    />
                  </View>
                </View>

                {/* Price */}
                <View>
                  <Label hint="SGD">Price per tin</Label>
                  <PriceField value={pricePerTin} onChange={setPricePerTin} />
                </View>

                {/* Solids (≥6mo) */}
                {ageMo >= 6 ? (
                  <View style={{
                    padding: 16, borderRadius: 8,
                    backgroundColor: tokens.colors.creamTint,
                    borderWidth: 1, borderColor: tokens.colors.creamSoft,
                  }}>
                    <Label hint={`${solidsRec.mealsPerDay} typical at this age`}>
                      Solid food meals/day
                    </Label>
                    <Stepper value={solidsMeals} onChange={setSolidsMeals} min={0} max={6} />
                  </View>
                ) : null}
              </View>
            </Card>
          </View>

          {/* RIGHT results column */}
          <View style={{ flex: 1, gap: 16 }}>
            {/* INTAKE BENCHMARK */}
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: tokens.fonts.bodySemibold,
                    fontSize: 11, fontWeight: '600',
                    letterSpacing: 1.32, textTransform: 'uppercase',
                    color: tokens.colors.textMuted, marginBottom: 4,
                  }}>Intake benchmark</Text>
                  <Text style={{
                    fontFamily: tokens.fonts.displaySemibold,
                    fontSize: 22, fontWeight: '600',
                    color: inRangeStatus.tone === 'low' ? tokens.colors.danger
                          : inRangeStatus.tone === 'high' ? tokens.colors.danger
                          : inRangeStatus.tone === 'in' ? tokens.colors.accentText
                          : tokens.colors.textMuted,
                  }}>{inRangeStatus.label}</Text>
                  {inRangeStatus.delta ? (
                    <Text style={{ fontSize: 13, color: tokens.colors.textMuted, marginTop: 2 }}>
                      {inRangeStatus.delta}
                    </Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <CountUp
                    value={calc.dailyMlTotal}
                    duration={400}
                    format={(n) => Math.round(n).toLocaleString()}
                    style={{
                      fontFamily: tokens.fonts.monoMedium,
                      fontVariant: ['tabular-nums'] as ['tabular-nums'],
                      fontSize: 36, fontWeight: '500',
                      color: tokens.colors.text, letterSpacing: -0.72,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: tokens.colors.textMuted, fontFamily: tokens.fonts.mono }}>
                    ml/day
                  </Text>
                </View>
              </View>
              <BenchmarkBar value={calc.dailyMlTotal} low={guideline.dailyMl[0]} high={guideline.dailyMl[1]} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: tokens.colors.textMuted, fontFamily: tokens.fonts.mono }}>0</Text>
                <Text style={{ fontSize: 11, color: tokens.colors.accentText, fontWeight: '600', fontFamily: tokens.fonts.mono }}>
                  Typical {guideline.dailyMl[0]}–{guideline.dailyMl[1]} ml
                </Text>
                <Text style={{ fontSize: 11, color: tokens.colors.textMuted, fontFamily: tokens.fonts.mono }}>
                  {Math.max(Math.round(guideline.dailyMl[1] * 1.5), 1500)}
                </Text>
              </View>
            </Card>

            {/* 2×2 result grid — all four values animate via CountUp. */}
            <View style={{ flexDirection: twoCol ? 'row' : 'column', gap: 12 }}>
              <View style={{ flex: 1, gap: 12 }}>
                <ResultCard
                  label="Daily formula cost"
                  value={calc.dailyCost}
                  format={(n) => `$${n.toFixed(2)}`}
                  sub={`~${calc.tinsPerMonth.toFixed(1)} tins / month`}
                />
                <ResultCard emphatic
                  label="Spent so far"
                  value={pastSpend}
                  format={(n) => fmtSGD(n)}
                  sub={`retroactive · ${projection.filter((r) => r.isPast).length} months`}
                />
              </View>
              <View style={{ flex: 1, gap: 12 }}>
                <ResultCard
                  label="Monthly cost (now)"
                  value={calc.monthlyCost}
                  format={(n) => `$${Math.round(n)}`}
                  sub="at current feeding pattern"
                />
                <ResultCard emphatic
                  label="Projected (next 12 mo)"
                  value={futureSpend}
                  format={(n) => fmtSGD(n)}
                  sub="factors in transition to solids"
                />
              </View>
            </View>

            {/* Singapore Feeding Benchmark */}
            <Card>
              <DeepHead emoji="📊" title="Singapore Feeding Benchmark"
                sub="Recommended daily milk intake (ml) by month · HPB/KKH guidelines · Shaded band = normal range" />
              <BenchmarkLine
                current={currentMonthInt}
                currentMl={calc.dailyMlTotal}
                inRange={benchmarkInRange}
                monthMidpoints={monthMidpoints}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
                <Legend swatch={tokens.colors.accentSoft} label="Recommended range" />
                <Legend bar swatch={tokens.colors.accentText} label="Benchmark midpoint" />
                <Legend dot swatch={benchmarkInRange ? '#2563EB' : '#DC2626'}
                  label={`Your baby ${benchmarkInRange ? '(in range)' : '(out of range)'}`} />
              </View>
            </Card>
          </View>
        </View>
      </View>

      {/* ── PART 2: Deeper-dive cards (full-width below) ─────── */}
      <View style={{
        maxWidth: tokens.layout.maxContent, width: '100%',
        marginHorizontal: 'auto',
        paddingHorizontal: 32, paddingTop: 8, paddingBottom: 80, gap: 16,
      }}>
        {/* Formula Usage & Cost */}
        <Card>
          <DeepHead emoji="📦" title="Formula Usage & Cost"
            sub={product
              ? `${shortName(product.product)} · ${product.brand} · ${product.packSize}g · ${fmtSGD(product.price)} · ${fmtPerGram(product.pricePerGram)}/g`
              : `Manual entry · ${tinSize}g tin · ${fmtSGD(pricePerTin)} · ${fmtPerGram(pricePerTin / Math.max(1, tinSize))}/g`} />
          <View style={{ flexDirection: twoCol ? 'row' : 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <Tile emoji="🥄" value={`${Math.round(calc.dailyGrams)}g`} label="Powder / day" />
            <Tile emoji="📦" value={`${Math.round(calc.monthlyGrams)}g`} label="Powder / month" />
            <Tile emoji="🥫" value={calc.tinsPerMonth.toFixed(1)} label="Tins / month" />
            <Tile emoji="💰" value={fmtSGD(calc.monthlyCost)} label="Cost / month" />
            <Tile emoji="📅" value={fmtSGD(calc.yearlyCost)} label="Est. / year" />
          </View>
          <Text style={{
            fontFamily: tokens.fonts.displaySemibold, fontSize: 15, fontWeight: '600',
            color: tokens.colors.text, marginTop: 18,
          }}>Monthly Formula Cost — 0 to 12 months</Text>
          <Text style={{ fontSize: 12, color: tokens.colors.textMuted, marginTop: 4, marginBottom: 6 }}>
            Past (light green) · Current month (dark green) · Projected (grey) · Solids reduction applied from 6m
          </Text>
          <MonthlyBars rows={projection} />
        </Card>

        {/* Estimated Lifetime Formula Spend */}
        <Card>
          <DeepHead emoji="🧾" title="Estimated Lifetime Formula Spend"
            sub={`You're entering data at ${ageMonthInt} months. Past spend estimated from HPB benchmark. Projected remaining covers months ${ageMonthInt}–11: your actual rate this month, HPB benchmark (tapered for solids) for months after.`} />
          <View style={{ flexDirection: twoCol ? 'row' : 'column', gap: 10, marginTop: 8 }}>
            <LifeCell tone="past"
              label={`Est. already spent · months 0–${Math.max(0, ageMonthInt - 1)}`}
              value={fmtSGD(pastSpend)} sub="HPB benchmark estimate" />
            <LifeCell tone="future"
              label={`Projected remaining · months ${ageMonthInt}–11 (${12 - ageMonthInt}mo)`}
              value={fmtSGD(futureSpend)} sub="Your rate now · HPB benchmark after" />
            <LifeCell tone="total"
              label="Stage 1 total · birth → 12 months"
              value={fmtSGD(totalSpend)} sub="Formula cost only" />
          </View>
          <Text style={{
            fontFamily: tokens.fonts.displaySemibold, fontSize: 15, fontWeight: '600',
            color: tokens.colors.text, marginTop: 18,
          }}>Cumulative Spend Curve</Text>
          <Text style={{ fontSize: 12, color: tokens.colors.textMuted, marginTop: 4, marginBottom: 6 }}>
            Solid = estimated actual · Dashed = projected · Flattens as solids reduce formula from 6m
          </Text>
          <CumulativeCurve rows={projection} total={totalSpend} />

          {/* Causeway saving */}
          <View style={{
            marginTop: 16, padding: 14, borderRadius: tokens.radius.card,
            backgroundColor: tokens.colors.accentTint,
            borderWidth: 1, borderColor: tokens.colors.accent,
            flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <View style={{ flex: 1, minWidth: 240 }}>
              <Text style={{
                fontFamily: tokens.fonts.bodySemibold, fontSize: 14, fontWeight: '600',
                color: tokens.colors.accentText, marginBottom: 4,
              }}>🇲🇾 Potential Causeway Saving</Text>
              <Text style={{ fontSize: 13, lineHeight: 20, color: tokens.colors.text }}>
                {product ? shortName(product.product) : 'This formula'} is estimated ~28% cheaper in Malaysia.
                Over Stage 1 you could save approx{' '}
                <Text style={{ fontFamily: tokens.fonts.bodySemibold }}>{fmtSGD(totalSpend * 0.28)}</Text>{' '}
                — equivalent to {Math.round((totalSpend * 0.28) / Math.max(1, pricePerTin))} free tins.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button" accessibilityLabel="See Malaysia prices"
              style={{
                paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
                backgroundColor: tokens.colors.accent,
              }}
            >
              <Text style={{
                color: tokens.colors.textInverse,
                fontFamily: tokens.fonts.bodySemibold, fontSize: 13,
              }}>See prices →</Text>
            </Pressable>
          </View>

          <Text style={{
            fontSize: 12, lineHeight: 19, color: tokens.colors.textMuted,
            marginTop: 14,
          }}>
            <Text style={{ color: tokens.colors.text, fontFamily: tokens.fonts.bodySemibold }}>
              Methodology:
            </Text>{' '}
            Past spend uses HPB mid-range benchmark ml × formula price/g. Projected remaining = your actual feeds for the current month + HPB benchmark (tapered for solids from 6m) for months after — so the total covers more than one month when you have time remaining in Stage 1. Breastmilk cost = $0. Malaysia savings are indicative estimates only.
          </Text>
        </Card>

        {/* Singapore Infant Feeding Guidelines */}
        <Card>
          <DeepHead emoji="💡" title="Singapore Infant Feeding Guidelines"
            sub="How your baby's daily intake should evolve in the first year — highlighted row matches their current age." />
          <View style={{ marginTop: 8 }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6,
              borderBottomWidth: 1, borderBottomColor: tokens.colors.borderStrong,
            }}>
              <TblHead flex={1.1}>Age</TblHead>
              <TblHead flex={1} align="right">ml / feed</TblHead>
              <TblHead flex={0.9} align="right">Feeds / day</TblHead>
              <TblHead flex={1.1} align="right">Daily total</TblHead>
              <TblHead flex={2.6}>HPB notes</TblHead>
            </View>
            {HPB_ROWS.map((r) => {
              const on = r.age === currentRowKey;
              return (
                <View key={r.age}
                  style={{
                    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6,
                    borderBottomWidth: 1, borderBottomColor: tokens.colors.divider,
                    backgroundColor: on ? tokens.colors.accentTint : 'transparent',
                  }}>
                  <TblCell flex={1.1} bold={on}>{r.age}</TblCell>
                  <TblNum flex={1}>{r.ml}</TblNum>
                  <TblNum flex={0.9}>{r.feeds}</TblNum>
                  <TblNum flex={1.1}>{r.daily}</TblNum>
                  <TblCell flex={2.6}>{r.note}</TblCell>
                </View>
              );
            })}
          </View>
          <Text style={{
            fontSize: 12, lineHeight: 19, color: tokens.colors.textMuted,
            marginTop: 12,
          }}>
            Source: Health Promotion Board Singapore (HPB) &amp; KK Women&apos;s and Children&apos;s Hospital (KKH) infant feeding guidelines.
            Highlighted row = your baby&apos;s current age. Always follow your paediatrician&apos;s specific advice.
          </Text>
        </Card>

        <Text style={{
          fontSize: 12, lineHeight: 19, color: tokens.colors.textMuted,
        }}>
          All calculations are estimates based on typical usage. Actual
          consumption varies significantly by baby, growth spurts, and feeding
          schedules. This calculator is a planning tool only, not a prescription.
        </Text>
      </View>
    </Screen>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────

const DeepHead = ({ emoji, title, sub }: { emoji: string; title: string; sub: string }) => {
  const { tokens } = useTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
        <Text style={{
          fontFamily: tokens.fonts.displaySemibold,
          fontSize: 18, fontWeight: '600',
          color: tokens.colors.text, letterSpacing: -0.18,
        }}>{title}</Text>
      </View>
      <Text style={{ fontSize: 13, lineHeight: 20, color: tokens.colors.textMuted, marginTop: 4 }}>
        {sub}
      </Text>
    </View>
  );
};

const AgeCard = ({
  age, guideline,
}: {
  age: { years: number; months: number; days: number };
  guideline: Guideline;
}) => {
  const { tokens } = useTheme();
  return (
    <View style={{
      marginTop: 10, padding: 14, borderRadius: 8,
      backgroundColor: tokens.colors.accentTint,
      borderWidth: 1, borderColor: tokens.colors.accent,
      flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between',
    }}>
      <View>
        <Text style={{
          fontFamily: tokens.fonts.monoMedium,
          fontVariant: ['tabular-nums'] as ['tabular-nums'],
          fontSize: 22, color: tokens.colors.text, fontWeight: '500',
        }}>
          {age.years > 0 ? `${age.years}y ` : ''}{age.months}mo{' '}
          <Text style={{ fontSize: 14, color: tokens.colors.textMuted }}>{age.days}d</Text>
        </Text>
        <Text style={{
          fontSize: 12, color: tokens.colors.accentText,
          fontFamily: tokens.fonts.bodySemibold, marginTop: 2,
        }}>Suggested {guideline.stage}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={metaTxt(tokens)}><Text style={metaBold(tokens)}>{guideline.feeds[0]}–{guideline.feeds[1]}</Text> feeds/day</Text>
        <Text style={metaTxt(tokens)}><Text style={metaBold(tokens)}>{guideline.mlPerFeed[0]}–{guideline.mlPerFeed[1]} ml</Text> per feed</Text>
        <Text style={metaTxt(tokens)}><Text style={metaBold(tokens)}>{guideline.dailyMl[0]}–{guideline.dailyMl[1]} ml</Text> daily total</Text>
      </View>
    </View>
  );
};
const metaTxt = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontSize: 12, color: tokens.colors.text,
  fontFamily: tokens.fonts.mono, fontVariant: ['tabular-nums'] as ['tabular-nums'],
});
const metaBold = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.monoMedium, fontWeight: '600' as const,
  color: tokens.colors.text,
});

const DateField = ({ value, max, onChange }: { value: string; max: string; onChange: (v: string) => void }) => {
  const { tokens, scheme } = useTheme();
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Input: any = 'input';
    return (
      <Input
        type="date" value={value} max={max}
        onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        aria-label="Baby's date of birth"
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '12px 14px', borderRadius: 10,
          border: `1.5px solid ${tokens.colors.border}`,
          background: tokens.colors.bgPanel,
          color: tokens.colors.text, fontSize: 15,
          fontFamily: tokens.fonts.mono,
          colorScheme: scheme, outline: 'none',
        }}
      />
    );
  }
  return (
    <TextInput
      value={value} onChangeText={onChange}
      placeholder="YYYY-MM-DD" placeholderTextColor={tokens.colors.textFaint}
      style={{
        padding: 12, borderRadius: 10,
        borderWidth: 1.5, borderColor: tokens.colors.border,
        backgroundColor: tokens.colors.bgPanel,
        color: tokens.colors.text, fontSize: 15,
        fontFamily: tokens.fonts.mono,
      }}
    />
  );
};

// Formula picker — one entry per PRODUCT LINE (not per variant). Value
// is `p.product` (the name string). Pack-size is no longer in the label
// because it's now chosen via the constrained Tin Size dropdown.
const FormulaSelect = ({
  products, value, onChange,
}: {
  products: Formula[]; value: string; onChange: (v: string) => void;
}) => {
  const { tokens } = useTheme();
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const S: any = 'select';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const O: any = 'option';
    return (
      <S value={value}
        onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 10,
          border: `1.5px solid ${tokens.colors.border}`,
          background: tokens.colors.bgPanel, color: tokens.colors.text,
          fontSize: 14, fontFamily: tokens.fonts.body, outline: 'none',
        }}>
        <O value="">— Manual entry —</O>
        {products.map((p) => (
          <O key={p.product} value={p.product}>
            {p.brand} · {shortName(p.product)}
          </O>
        ))}
      </S>
    );
  }
  // Native fallback — horizontal scroll chip strip (first 30 to keep
  // the row scannable on small screens).
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      <Chip on={value === ''} label="— Manual —" onPress={() => onChange('')} />
      {products.slice(0, 30).map((p) => (
        <Chip
          key={p.product}
          on={value === p.product}
          label={`${p.brand} ${shortName(p.product)}`}
          onPress={() => onChange(p.product)}
        />
      ))}
    </ScrollView>
  );
};

// Tin Size — when `sizes` is passed (formula picked), shows ONLY that
// product's available pack sizes. When `sizes` is undefined (manual
// entry), shows a numeric input for free entry. This is the bug-fix
// requested 2026-05-21: previously a single hardcoded size list let the
// user pick "1650g" with a 400g product selected (which auto-fill then
// silently overwrote back to 400g — the "stuck on smallest variant" bug).
const TinSelect = ({
  value, onChange, sizes,
}: {
  value: number;
  onChange: (v: number) => void;
  sizes?: number[];
}) => {
  const { tokens } = useTheme();
  // Manual entry — numeric input.
  if (!sizes || sizes.length === 0) {
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: tokens.colors.border,
        borderRadius: 8, backgroundColor: tokens.colors.bgPanel,
        paddingHorizontal: 10,
      }}>
        <TextInput
          value={value === 0 ? '' : String(value)}
          placeholder="grams" placeholderTextColor={tokens.colors.textFaint}
          keyboardType="numeric"
          onChangeText={(s) => {
            const n = Number(s);
            if (Number.isFinite(n) && n >= 0) onChange(n);
            else if (s === '') onChange(0);
          }}
          style={{
            flex: 1, paddingVertical: 9, color: tokens.colors.text, fontSize: 15,
            fontFamily: tokens.fonts.monoMedium,
            fontVariant: ['tabular-nums'] as ['tabular-nums'],
          }}
        />
        <Text style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.mono, marginLeft: 6 }}>g</Text>
      </View>
    );
  }
  // Formula picked — constrained dropdown of that product's variants.
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const S: any = 'select';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const O: any = 'option';
    return (
      <S value={String(value)}
        onChange={(e: { target: { value: string } }) => onChange(+e.target.value)}
        style={{
          width: '100%', height: 38, padding: '0 12px', borderRadius: 8,
          border: `1px solid ${tokens.colors.border}`,
          background: tokens.colors.bgPanel, color: tokens.colors.text,
          fontSize: 14, fontFamily: tokens.fonts.body, outline: 'none',
        }}>
        {sizes.map((s) => <O key={s} value={s}>{s}g</O>)}
      </S>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {sizes.map((s) => (
        <Chip key={s} on={value === s} label={`${s}g`} onPress={() => onChange(s)} />
      ))}
    </ScrollView>
  );
};

const PriceField = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const { tokens } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1, borderColor: tokens.colors.border,
      borderRadius: 8, backgroundColor: tokens.colors.bgPanel,
      paddingLeft: 12, paddingRight: 4,
    }}>
      <Text style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.mono, marginRight: 4 }}>$</Text>
      <TextInput
        value={String(value)} keyboardType="numeric"
        onChangeText={(s) => {
          const n = Number(s);
          if (Number.isFinite(n) && n >= 0) onChange(n);
        }}
        style={{
          flex: 1, paddingVertical: 9, color: tokens.colors.text, fontSize: 15,
          fontFamily: tokens.fonts.monoMedium,
          fontVariant: ['tabular-nums'] as ['tabular-nums'],
        }}
      />
    </View>
  );
};

const Chip = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
        borderWidth: 1.5,
        borderColor: on ? tokens.colors.accent : tokens.colors.border,
        backgroundColor: on ? tokens.colors.accent : tokens.colors.bgCard,
      }}
    >
      <Text style={{
        fontSize: 12, fontFamily: tokens.fonts.bodyMedium, fontWeight: '500',
        color: on ? tokens.colors.textInverse : tokens.colors.text,
      }}>{label}</Text>
    </Pressable>
  );
};

// ResultCard — big mono number + label + sub. `value` always animates via
// CountUp with the supplied `format` so the four cards "count up" together
// when DOB or the picker changes. Matches the design's CountUp behaviour.
const ResultCard = ({
  label, value, format, sub, emphatic,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  sub: string;
  emphatic?: boolean;
}) => {
  const { tokens } = useTheme();
  return (
    <View style={{
      padding: 18, borderRadius: tokens.radius.card,
      backgroundColor: emphatic ? tokens.colors.accentTint : tokens.colors.bgCard,
      borderWidth: 1,
      borderColor: emphatic ? tokens.colors.accent : tokens.colors.border,
      ...tokens.shadow.s1,
    }}>
      <Text style={{
        fontFamily: tokens.fonts.bodySemibold, fontSize: 11, fontWeight: '600',
        letterSpacing: 1.32, textTransform: 'uppercase',
        color: emphatic ? tokens.colors.accentText : tokens.colors.textMuted,
      }}>{label}</Text>
      <CountUp
        value={value}
        format={format}
        style={{
          fontFamily: tokens.fonts.monoMedium,
          fontVariant: ['tabular-nums'] as ['tabular-nums'],
          fontSize: 32, fontWeight: '500',
          color: emphatic ? tokens.colors.accentText : tokens.colors.text,
          letterSpacing: -0.64, marginTop: 4,
        }}
      />
      <Text style={{ fontSize: 12, color: tokens.colors.textMuted, marginTop: 2, fontFamily: tokens.fonts.mono }}>
        {sub}
      </Text>
    </View>
  );
};

const LifeCell = ({
  tone, label, value, sub,
}: {
  tone: 'past' | 'future' | 'total';
  label: string; value: string; sub: string;
}) => {
  const { tokens } = useTheme();
  // Tone-specific palette (spec-exact from styles-v2 .mw-life-cell).
  const PAL = {
    past:   { bg: tokens.colors.warnBg,    border: tokens.colors.border, fg: tokens.colors.warnText },
    future: { bg: tokens.colors.accentTint, border: tokens.colors.accent, fg: tokens.colors.accentText },
    total:  { bg: '#2A4A26', border: '#2A4A26', fg: '#FBFAF6' },
  }[tone];
  return (
    <View style={{
      flex: 1, padding: 16, borderRadius: tokens.radius.card,
      backgroundColor: PAL.bg, borderWidth: 1, borderColor: PAL.border,
    }}>
      <Text style={{
        fontFamily: tokens.fonts.bodySemibold, fontSize: 11, fontWeight: '600',
        letterSpacing: 1.1, textTransform: 'uppercase',
        color: PAL.fg, marginBottom: 4,
      }}>{label}</Text>
      <Text style={{
        fontFamily: tokens.fonts.monoMedium,
        fontVariant: ['tabular-nums'] as ['tabular-nums'],
        fontSize: 28, fontWeight: '500',
        color: PAL.fg, letterSpacing: -0.56,
      }}>{value}</Text>
      <Text style={{ fontSize: 12, color: PAL.fg, opacity: 0.85, marginTop: 4, fontFamily: tokens.fonts.mono }}>
        {sub}
      </Text>
    </View>
  );
};

const Tile = ({ emoji, value, label }: { emoji: string; value: string; label: string }) => {
  const { tokens } = useTheme();
  return (
    <View style={{
      flexBasis: '18%', flexGrow: 1, minWidth: 110,
      padding: 12, alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, backgroundColor: tokens.colors.bgPanel,
      borderWidth: 1, borderColor: tokens.colors.border, gap: 2,
    }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{
        fontFamily: tokens.fonts.monoMedium,
        fontVariant: ['tabular-nums'] as ['tabular-nums'],
        fontSize: 18, fontWeight: '500', color: tokens.colors.text,
      }}>{value}</Text>
      <Text style={{
        fontFamily: tokens.fonts.bodySemibold, fontSize: 10, fontWeight: '600',
        letterSpacing: 0.8, textTransform: 'uppercase',
        color: tokens.colors.textMuted,
      }}>{label}</Text>
    </View>
  );
};

const Legend = ({ swatch, label, bar, dot }: { swatch: string; label: string; bar?: boolean; dot?: boolean }) => {
  const { tokens } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{
        width: dot ? 10 : 14, height: dot ? 10 : bar ? 2 : 10,
        borderRadius: dot ? 5 : 2,
        backgroundColor: swatch,
      }} />
      <Text style={{ fontSize: 11, color: tokens.colors.textMuted, fontFamily: tokens.fonts.mono }}>{label}</Text>
    </View>
  );
};

const TblHead = ({ children, flex, align = 'left' }: { children: string; flex: number; align?: 'left' | 'right' }) => {
  const { tokens } = useTheme();
  return (
    <Text style={{
      flex, paddingHorizontal: 6, fontSize: 10, fontWeight: '700',
      letterSpacing: 0.6, textTransform: 'uppercase',
      color: tokens.colors.textMuted, textAlign: align,
      fontFamily: tokens.fonts.bodySemibold,
    }}>{children}</Text>
  );
};
const TblCell = ({ children, flex, bold }: { children: string; flex: number; bold?: boolean }) => {
  const { tokens } = useTheme();
  return (
    <Text style={{
      flex, paddingHorizontal: 6, fontSize: 12, lineHeight: 18,
      color: tokens.colors.text,
      fontFamily: bold ? tokens.fonts.bodySemibold : tokens.fonts.body,
      fontWeight: bold ? '600' : '400',
    }}>{children}</Text>
  );
};
const TblNum = ({ children, flex }: { children: string; flex: number }) => {
  const { tokens } = useTheme();
  return (
    <Text style={{
      flex, paddingHorizontal: 6, fontSize: 12,
      color: tokens.colors.text,
      fontFamily: tokens.fonts.monoMedium,
      fontVariant: ['tabular-nums'] as ['tabular-nums'],
      textAlign: 'right',
    }}>{children}</Text>
  );
};
