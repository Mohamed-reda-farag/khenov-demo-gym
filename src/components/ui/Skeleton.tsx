import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { radius, useTheme } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = radius.sm,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      aria-hidden
      style={[
        { width, height, borderRadius: rounded, backgroundColor: colors.surfaceAlt },
        animated,
        style,
      ]}
    />
  );
}
