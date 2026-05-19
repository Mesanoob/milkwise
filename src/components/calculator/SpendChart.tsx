import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import type { MonthlyFormulaCost } from '../../utils/feedingCalculator';
import { useTheme } from '../../contexts/ThemeContext';

// Enlarged to match the design-reference chart (its bar area is ~200px;
// the old 340×180 read tiny in the new wide results column). All
// geometry derives from these, so bumping the box + paddings rescales
// everything; SVG label fonts are bumped in proportion below.
const W = 580;
const H = 300;
const PL = 56;
const PR = 14;
const PT = 16;
const PB = 38;
const IW = W - PL - PR;
const IH = H - PT - PB;
// Single knob for label sizing so axis / value / month text stays
// legible at the larger viewBox (was a flat 8 at 340×180).
const FS = 12;

export function SpendChart({
  monthlyData,
  babyMonths,
}: {
  monthlyData: MonthlyFormulaCost[];
  babyMonths: number;
}) {
  const { tokens } = useTheme();
  const c = tokens.colors;
  const maxCost = Math.max(...monthlyData.map((item) => item.cost), 1);
  const slot = IW / monthlyData.length;
  const barW = slot * 0.68;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {[0, 25, 50, 75, 100].map((pct) => {
        const value = (pct / 100) * maxCost;
        const y = PT + IH - (value / maxCost) * IH;
        return (
          <G key={pct}>
            <Line x1={PL} x2={W - PR} y1={y} y2={y} stroke={c.border} strokeWidth={1} strokeDasharray="4,3" />
            <SvgText x={PL - 6} y={y + 4} textAnchor="end" fontSize={FS} fill={c.textFaint} fontFamily="JetBrainsMono_400Regular">
              ${Math.round(value)}
            </SvgText>
          </G>
        );
      })}

      {monthlyData.map((item, index) => {
        const x = PL + index * slot + slot / 2 - barW / 2;
        const height = Math.max((item.cost / maxCost) * IH, item.cost > 0 ? 2 : 0);
        const y = PT + IH - height;
        const isPast = index < babyMonths;
        const isCurrent = index === babyMonths;
        // current = solid accent · past = soft accent · future = inert border
        const fill = isCurrent ? c.accent : isPast ? c.accentSoft : c.border;

        return (
          <G key={item.month}>
            <Rect x={x} y={y} width={barW} height={height} rx={3} fill={fill} opacity={isCurrent ? 1 : isPast ? 0.85 : 0.5} />
            {item.cost > 0 && height > FS * 2 ? (
              <SvgText x={x + barW / 2} y={y + FS + 4} textAnchor="middle" fontSize={FS} fill={isCurrent ? c.textInverse : isPast ? c.text : c.textMuted} fontFamily="JetBrainsMono_500Medium">
                ${Math.round(item.cost)}
              </SvgText>
            ) : null}
            <SvgText x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={FS - 2} fill={isCurrent ? c.accent : c.textFaint} fontFamily={isCurrent ? 'JetBrainsMono_500Medium' : 'JetBrainsMono_400Regular'}>
              {index}m
            </SvgText>
          </G>
        );
      })}

      <SvgText x={12} y={H / 2} fontSize={FS - 1} fill={c.textFaint} textAnchor="middle" transform={`rotate(-90, 12, ${H / 2})`}>
        SGD/month
      </SvgText>
    </Svg>
  );
}
