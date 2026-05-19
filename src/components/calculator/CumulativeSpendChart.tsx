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

const W = 340;
const H = 158;
const PL = 52;
const PR = 10;
const PT = 12;
const PB = 24;
const IW = W - PL - PR;
const IH = H - PT - PB;

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
            <SvgText x={PL - 4} y={y + 3} textAnchor="end" fontSize={8} fill={c.textFaint} fontFamily="JetBrainsMono_400Regular">
              ${Math.round(value)}
            </SvgText>
          </G>
        );
      })}
      <Path d={line} fill="none" stroke={c.border} strokeWidth={2} strokeDasharray="5,3" />
      <Path d={line} fill="none" stroke={c.accent} strokeWidth={2.5} strokeLinecap="round" clipPath="url(#past-spend)" />
      {points.map((point) => (
        <SvgText key={point.index} x={xP(point.index)} y={H - 4} textAnchor="middle" fontSize={8} fill={point.index <= babyMonths ? c.accent : c.textFaint} fontFamily="JetBrainsMono_400Regular">
          {point.index}m
        </SvgText>
      ))}
      <SvgText x={W - PR} y={Math.max(12, yP(maxValue) - 5)} textAnchor="end" fontSize={9} fill={c.accent} fontFamily="JetBrainsMono_500Medium">
        Total: {formatCurrency(maxValue)}
      </SvgText>
      <SvgText x={8} y={H / 2} fontSize={8} fill={c.textFaint} textAnchor="middle" transform={`rotate(-90, 8, ${H / 2})`}>
        Cumulative SGD
      </SvgText>
    </Svg>
  );
}
