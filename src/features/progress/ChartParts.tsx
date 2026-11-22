import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { pointer, radius, shadow, spacing, useTheme } from '@/theme';

/** Width of the chart area, measured after layout. */
export function useChartWidth() {
  const [width, setWidth] = useState(0);
  return {
    width,
    onLayout: (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width)),
  };
}

interface TooltipProps {
  /** Centre of the tooltip, in the same coordinates as the chart. */
  x: number;
  /** Top edge of the tooltip. */
  top: number;
  chartWidth: number;
  value: string;
  caption: string;
}

const TOOLTIP_WIDTH = 116;

/** Value bubble over the chart. It never captures touches, so dragging keeps working. */
export function Tooltip({ x, top, chartWidth, value, caption }: TooltipProps) {
  const { colors } = useTheme();
  const left = Math.max(0, Math.min(chartWidth - TOOLTIP_WIDTH, x - TOOLTIP_WIDTH / 2));
  return (
    <View
      style={[
        pointer.none,
        styles.tooltip,
        {
          left,
          top: Math.max(0, top),
          width: TOOLTIP_WIDTH,
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          boxShadow: shadow.card,
        },
      ]}
    >
      <Text variant="label" align="center" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="caption" color="secondary" align="center" numberOfLines={1}>
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
