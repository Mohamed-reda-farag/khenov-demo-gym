import { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useDirection } from '@/i18n/direction';
import { radius, spacing, useTheme } from '@/theme';

import { nearestIndex, xAt } from './chartMath';
import { Tooltip, useChartWidth } from './ChartParts';

export interface Bar {
  key: string;
  value: number;
}

interface BarChartProps {
  bars: Bar[];
  height?: number;
  formatAxis: (value: number) => string;
  formatValue: (value: number) => string;
  /** Caption under a bar and in its tooltip, for example the week it starts. */
  formatLabel: (key: string) => string;
  summaryLabel: string;
}

const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const PAD_START = 46;
const PAD_END = 8;

/** Vertical bars drawn with react-native-svg. Oldest week first in the reading direction. */
function BarChartBase({
  bars,
  height = 190,
  formatAxis,
  formatValue,
  formatLabel,
  summaryLabel,
}: BarChartProps) {
  const { colors } = useTheme();
  const { isRTL } = useDirection();
  const { width, onLayout } = useChartWidth();
  const [selected, setSelected] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const layout = { width, padStart: PAD_START, padEnd: PAD_END, rtl: isRTL };
    const plot = Math.max(0, width - PAD_START - PAD_END);
    const slot = bars.length === 0 ? 0 : plot / bars.length;
    const barWidth = Math.max(4, slot * 0.6);
    const plotH = height - PAD_TOP - PAD_BOTTOM;
    const max = Math.max(1, ...bars.map((b) => b.value));
    // Centres of the slots, as fractions of the usable span, so touch maps to the nearest bar.
    const fractions = bars.map((_, i) =>
      bars.length <= 1 ? 0.5 : (i + 0.5 - 0.5) / (bars.length - 1),
    );
    const spanLayout = { ...layout, padStart: PAD_START + slot / 2, padEnd: PAD_END + slot / 2 };
    const rects = bars.map((b, i) => {
      const h = (b.value / max) * plotH;
      const centre = xAt(fractions[i] ?? 0.5, spanLayout);
      return { x: centre - barWidth / 2, y: PAD_TOP + plotH - h, w: barWidth, h, centre };
    });
    return { spanLayout, fractions, rects, plotH, max };
  }, [bars, width, height, isRTL]);

  const baseline = PAD_TOP + geometry.plotH;
  const chosen = selected !== null ? geometry.rects[selected] : undefined;
  const chosenBar = selected !== null ? bars[selected] : undefined;

  return (
    <View
      role="img"
      aria-label={summaryLabel}
      accessible
      onLayout={onLayout}
      style={{ height }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) =>
        width > 0 &&
        setSelected(nearestIndex(e.nativeEvent.locationX, geometry.fractions, geometry.spanLayout))
      }
      onResponderMove={(e) =>
        width > 0 &&
        setSelected(nearestIndex(e.nativeEvent.locationX, geometry.fractions, geometry.spanLayout))
      }
    >
      {width > 0 ? (
        <>
          <Svg width={width} height={height} pointerEvents="none">
            <Line
              x1={0}
              x2={width}
              y1={baseline}
              y2={baseline}
              stroke={colors.border}
              strokeWidth={1}
            />
            <Line
              x1={0}
              x2={width}
              y1={PAD_TOP}
              y2={PAD_TOP}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="3 5"
            />
            {geometry.rects.map((r, i) => (
              <Rect
                key={bars[i]?.key ?? i}
                x={r.x}
                y={r.y}
                width={r.w}
                height={Math.max(2, r.h)}
                rx={radius.sm / 2}
                fill={i === selected ? colors.accent : colors.accentText}
                fillOpacity={i === selected ? 1 : 0.55}
              />
            ))}
          </Svg>
          <View pointerEvents="none" style={[styles.yLabel, { top: PAD_TOP - 8 }]}>
            <Text variant="caption" color="muted">
              {formatAxis(geometry.max)}
            </Text>
          </View>
          <View pointerEvents="none" style={[styles.yLabel, { top: baseline - 18 }]}>
            <Text variant="caption" color="muted">
              {formatAxis(0)}
            </Text>
          </View>
          {bars.length > 0 ? (
            <>
              <BarLabel
                centre={geometry.rects[0]?.centre ?? 0}
                width={width}
                text={formatLabel(bars[0]?.key ?? '')}
                top={baseline + 6}
              />
              {bars.length > 1 ? (
                <BarLabel
                  centre={geometry.rects[bars.length - 1]?.centre ?? 0}
                  width={width}
                  text={formatLabel(bars[bars.length - 1]?.key ?? '')}
                  top={baseline + 6}
                />
              ) : null}
            </>
          ) : null}
          {chosen && chosenBar ? (
            <Tooltip
              x={chosen.centre}
              top={chosen.y - 52}
              chartWidth={width}
              value={formatValue(chosenBar.value)}
              caption={formatLabel(chosenBar.key)}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function BarLabel({
  centre,
  width,
  text,
  top,
}: {
  centre: number;
  width: number;
  text: string;
  top: number;
}) {
  const labelWidth = 72;
  const left = Math.max(0, Math.min(width - labelWidth, centre - labelWidth / 2));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top, width: labelWidth }}>
      <Text variant="caption" color="muted" align="center" numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export const BarChart = memo(BarChartBase);

const styles = StyleSheet.create({
  yLabel: { position: 'absolute', start: 0, width: PAD_START - spacing.xs },
});
