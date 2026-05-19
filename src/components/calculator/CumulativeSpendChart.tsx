import Svg, {
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import type { MonthlyFormulaCost } from '../../utils/feedingCalculator';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../contexts/ThemeContext';

// Enlarged in step with SpendChart / BenchmarkChart so the three charts
// read at one scale in the wide results column. All geometry derives
// from these; `FS` scales every label off the old flat 8.
const W = 580;
const H = 280;
const PL = 64;
const PR = 14;
const PT = 16;
const PB = 34;
const IW = W - PL - PR;
const IH = H - PT - PB;
const FS = 12;

export function CumulativeSpendChart({
  monthlyData,
  babyMonths,
}: {
  monthlyData: MonthlyFormulaCost[];
  babyMonths: number;
}) {
  const { tokens } = useTheme();
  const c = tokens.colors;
  let cumulative = 0;
  const points = monthlyData.map((item, index) => {
    cumulative += item.cost;
    return { index, cumulative };
  });
  const maxValue = cumulative || 1;
  const xP = (index: number) => PL + (index / 11) * IW;
  const yP = (value: number) => PT + IH - (value / maxValue) * IH;
  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xP(point.index)} ${yP(point.cumulative)}`)
    .join(' ');
  const pastWidth = (Math.min(babyMonths, 11) / 11) * IW;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <ClipPath id="past-spend">
          <Rect x={PL} y={PT} width={pastWidth} height={IH} />
        </ClipPath>
      </Defs>
      {[25, 50, 75, 100].map((pct) => {
        const value = (pct / 100) * maxValue;
        const y = yP(value);
        return (
          <G key={pct}>
            <Line x1={PL} x2={W - PR} y1={y} y2={y} stroke={c.border} strokeWidth={1} strokeDasharray="3,3" />
            <SvgText x={PL - 6} y={y + 4} textAnchor="end" fontSize={FS} fill={c.textFaint} fontFamily="JetBrainsMono_400Regular">
              ${Math.round(value)}
            </SvgText>
          </G>
        );
      })}
      <Path d={line} fill="none" stroke={c.border} strokeWidth={2} strokeDasharray="5,3" />
      <Path d={line} fill="none" stroke={c.accent} strokeWidth={2.5} strokeLinecap="round" clipPath="url(#past-spend)" />
      {points.map((point) => (
        <SvgText key={point.index} x={xP(point.index)} y={H - 8} textAnchor="middle" fontSize={FS - 2} fill={point.index <= babyMonths ? c.accent : c.textFaint} fontFamily="JetBrainsMono_400Regular">
          {point.index}m
        </SvgText>
      ))}
      <SvgText x={W - PR} y={Math.max(16, yP(maxValue) - 6)} textAnchor="end" fontSize={FS - 1} fill={c.accent} fontFamily="JetBrainsMono_500Medium">
        Total: {formatCurrency(maxValue)}
      </SvgText>
      <SvgText x={12} y={H / 2} fontSize={FS - 1} fill={c.textFaint} textAnchor="middle" transform={`rotate(-90, 12, ${H / 2})`}>
        Cumulative SGD
      </SvgText>
    </Svg>
  );
}
