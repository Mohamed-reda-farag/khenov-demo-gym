import { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useDirection } from '@/i18n/direction';
import { pointer, spacing, useTheme } from '@/theme';

import { linePath, nearestIndex, niceDomain, timeFractions, xAt } from './chartMath';
import { Tooltip, useChartWidth } from './ChartParts';

export interface ChartPoint {
  time: number;
  value: number;
}

interface LineChartProps {
  points: ChartPoint[];
  height?: number;
  /** Number only, for the vertical axis labels. */
  formatAxis: (value: number) => string;
  /** Value with its unit, for the tooltip. */
  formatValue: (value: number) => string;
  formatDate: (time: number) => string;
  /** Spoken description of the whole chart: title, trend and numbers. */
  summaryLabel: string;
}

const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const PAD_START = 46;
const PAD_END = 14;

/**
 * A line chart drawn with react-native-svg. Time runs in the reading direction: oldest on the
 * left in English, oldest on the right in Arabic. Touch or drag to read a value.
 */
function LineChartBase({
  points,
  height = 190,
  formatAxis,
  formatValue,
  formatDate,
  summaryLabel,
}: LineChartProps) {
  const { colors } = useTheme();
  const { isRTL } = useDirection();
  const { width, onLayout } = useChartWidth();
  const [selected, setSelected] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const values = points.map((p) => p.value);
    const [lo, hi] = niceDomain(Math.min(...values), Math.max(...values));
    const layout = { width, padStart: PAD_START, padEnd: PAD_END, rtl: isRTL };
    const plotH = height - PAD_TOP - PAD_BOTTOM;
    const fractions = timeFractions(points.map((p) => p.time));
    const coords = points.map((p, i) => ({
      x: xAt(fractions[i] ?? 0, layout),
      y: PAD_TOP + (1 - (p.value - lo) / (hi - lo)) * plotH,
    }));
    return { lo, hi, layout, plotH, fractions, coords };
  }, [points, width, height, isRTL]);

  const select = (x: number) => {
    if (width === 0 || points.length === 0) return;
    setSelected(nearestIndex(x, geometry.fractions, geometry.layout));
  };

  const first = geometry.coords[0];
  const last = geometry.coords[geometry.coords.length - 1];
  const baseline = PAD_TOP + geometry.plotH;
  const chosen = selected !== null ? geometry.coords[selected] : undefined;
  const chosenPoint = selected !== null ? points[selected] : undefined;
  const maxValue = Math.max(...points.map((p) => p.value));
  const minValue = Math.min(...points.map((p) => p.value));

  return (
    <View
      role="img"
      aria-label={summaryLabel}
      accessible
      onLayout={onLayout}
      style={{ height }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => select(e.nativeEvent.locationX)}
      onResponderMove={(e) => select(e.nativeEvent.locationX)}
    >
      {width > 0 ? (
        <>
          <Svg width={width} height={height} style={pointer.none}>
            {[0, 0.5, 1].map((f) => (
              <Line
                key={f}
                x1={0}
                x2={width}
                y1={PAD_TOP + f * geometry.plotH}
                y2={PAD_TOP + f * geometry.plotH}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray={f === 1 ? undefined : '3 5'}
              />
            ))}
            {first && last ? (
              <Path
                d={`${linePath(geometry.coords)} L${last.x.toFixed(1)} ${baseline} L${first.x.toFixed(1)} ${baseline} Z`}
                fill={colors.accentSoft}
              />
            ) : null}
            <Path
              d={linePath(geometry.coords)}
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {geometry.coords.map((c, i) => (
              <Circle
                key={points[i]?.time ?? i}
                cx={c.x}
                cy={c.y}
                r={i === selected ? 6 : 3.5}
                fill={i === selected ? colors.accent : colors.background}
                stroke={colors.accent}
                strokeWidth={2}
              />
            ))}
            {chosen ? (
              <Line
                x1={chosen.x}
                x2={chosen.x}
                y1={PAD_TOP}
                y2={baseline}
                stroke={colors.accent}
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            ) : null}
          </Svg>

          <View style={[pointer.none, styles.yLabel, { top: PAD_TOP - 8 }]}>
            <Text variant="caption" color="muted">
              {formatAxis(maxValue)}
            </Text>
          </View>
          <View style={[pointer.none, styles.yLabel, { top: baseline - 18 }]}>
            <Text variant="caption" color="muted">
              {formatAxis(minValue)}
            </Text>
          </View>
          {first && last ? (
            <>
              <XLabel
                x={first.x}
                width={width}
                text={formatDate(points[0]?.time ?? 0)}
                top={baseline + 6}
              />
              {points.length > 1 ? (
                <XLabel
                  x={last.x}
                  width={width}
                  text={formatDate(points[points.length - 1]?.time ?? 0)}
                  top={baseline + 6}
                />
              ) : null}
            </>
          ) : null}
          {chosen && chosenPoint ? (
            <Tooltip
              x={chosen.x}
              top={chosen.y - 54}
              chartWidth={width}
              value={formatValue(chosenPoint.value)}
              caption={formatDate(chosenPoint.time)}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function XLabel({ x, width, text, top }: { x: number; width: number; text: string; top: number }) {
  const labelWidth = 72;
  const left = Math.max(0, Math.min(width - labelWidth, x - labelWidth / 2));
  return (
    <View style={[pointer.none, styles.xLabel, { left, top, width: labelWidth }]}>
      <Text variant="caption" color="muted" align="center" numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export const LineChart = memo(LineChartBase);

const styles = StyleSheet.create({
  yLabel: { position: 'absolute', start: 0, width: PAD_START - spacing.xs },
  xLabel: { position: 'absolute' },
});
