/**
 * BenchmarkChart — SVG area chart of Singapore HPB recommended daily ml intake.
 *
 * Renders a green shaded band (normal range) + midpoint line for months 0–11,
 * with the user's baby highlighted at their current age. A colored dot shows
 * their current daily ml vs the guideline (blue = in range, red = below, amber = above).
 *
 * Uses react-native-svg so the same component works on web and native.
 */

import Svg, {
  Path, Line, Rect, Circle, Defs, LinearGradient, Stop, G,
  Text as SvgText,
} from 'react-native-svg';
import { SG_GUIDELINES } from '../../data/feedingGuidelines';
import { useTheme } from '../../contexts/ThemeContext';

const W = 340, H = 160, PL = 40, PR = 10, PT = 12, PB = 28;
const IW = W - PL - PR, IH = H - PT - PB, MAX_Y = 1400;

const xP = (i: number) => PL + (i / 11) * IW;
const yP = (v: number) => PT + IH - (v / MAX_Y) * IH;

interface Props {
  babyMonths: number;       // 0–11, clamped
  currentDailyMl: number;  // ml per day entered by user
}

export function BenchmarkChart({ babyMonths, currentDailyMl }: Props) {
  const { tokens } = useTheme();
  const c = tokens.colors;
  const bm = Math.min(babyMonths, 11);
  const gRef = SG_GUIDELINES[bm];
  const bx = xP(bm);

  // Range shaded area: top edge (max) → bottom edge (min), closed polygon
  const topEdge = SG_GUIDELINES.map((g, i) => `${xP(i)},${yP(g.dMax)}`).join(' L ');
  const botEdge = [...SG_GUIDELINES].reverse().map((g, i) => `${xP(11 - i)},${yP(g.dMin)}`).join(' L ');
  const rangeD = `M ${topEdge} L ${botEdge} Z`;

  const midD = SG_GUIDELINES.map((g, i) => `${i === 0 ? 'M' : 'L'} ${xP(i)},${yP((g.dMin + g.dMax) / 2)}`).join(' ');

  const benchY = yP((gRef.dMin + gRef.dMax) / 2);
  const userY = currentDailyMl > 0 ? yP(Math.min(currentDailyMl, MAX_Y)) : null;
  const userColor =
    !currentDailyMl ? null
    : currentDailyMl < gRef.dMin ? c.danger    // below → danger
    : currentDailyMl > gRef.dMax ? c.warnText  // above → warn (amber successor)
    : c.info;                                   // in range → info

  const gridLines = [200, 400, 600, 800, 1000, 1200];

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c.accent} stopOpacity={0.18} />
          <Stop offset="100%" stopColor={c.accent} stopOpacity={0.03} />
        </LinearGradient>
      </Defs>

      {/* Grid lines + y-axis labels */}
      {gridLines.map((v) => (
        <G key={v}>
          <Line x1={PL} x2={W - PR} y1={yP(v)} y2={yP(v)} stroke={c.border} strokeWidth={1} strokeDasharray="4,3" />
          <SvgText x={PL - 3} y={yP(v) + 3} textAnchor="end" fontSize={8} fill={c.textFaint} fontFamily="JetBrainsMono_400Regular">{v}</SvgText>
        </G>
      ))}

      {/* Shaded range area */}
      <Path d={rangeD} fill="url(#rg)" />

      {/* Midpoint line */}
      <Path d={midD} fill="none" stroke={c.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* X-axis month labels */}
      {SG_GUIDELINES.map((g, i) => (
        <SvgText
          key={i}
          x={xP(i)}
          y={H - 4}
          textAnchor="middle"
          fontSize={8}
          fill={i === bm ? c.accent : c.textFaint}
          fontFamily={i === bm ? 'JetBrainsMono_500Medium' : 'JetBrainsMono_400Regular'}
        >
          {i}m
        </SvgText>
      ))}

      {/* Baby's current age marker */}
      <Line x1={bx} x2={bx} y1={PT} y2={H - PB} stroke={c.accent} strokeWidth={1.5} strokeDasharray="3,3" opacity={0.5} />
      <Circle cx={bx} cy={benchY} r={4} fill={c.accent} />
      <SvgText x={bx + 5} y={benchY + 3} fontSize={8} fill={c.accent} fontFamily="JetBrainsMono_500Medium">
        {Math.round((gRef.dMin + gRef.dMax) / 2)}ml
      </SvgText>

      {/* User's actual daily intake */}
      {userY !== null && userColor && (
        <G>
          <Circle cx={bx} cy={userY} r={4} fill={userColor} stroke={c.bgCard} strokeWidth={2} />
          <SvgText x={bx + 5} y={userY - 4} fontSize={8} fill={userColor} fontFamily="JetBrainsMono_500Medium">
            {currentDailyMl}ml yours
          </SvgText>
        </G>
      )}

      {/* Y-axis label */}
      <SvgText
        x={8}
        y={H / 2}
        fontSize={8}
        fill={c.textFaint}
        textAnchor="middle"
        transform={`rotate(-90, 8, ${H / 2})`}
      >
        ml/day
      </SvgText>
    </Svg>
  );
}
