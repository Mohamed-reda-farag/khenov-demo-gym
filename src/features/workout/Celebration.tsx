import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, pointer, useTheme } from '@/theme';

const PARTICLES = 14;

/** A short burst of dots from the centre. Moves with transform and fades with opacity only. */
export function Celebration({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active || reduceMotion) return;
    progress.set(
      withTiming(1, { duration: motion.duration.celebrate, easing: Easing.out(Easing.cubic) }),
    );
  }, [active, reduceMotion, progress]);

  if (!active || reduceMotion) return null;

  return (
    <View aria-hidden style={[pointer.none, styles.layer]}>
      {Array.from({ length: PARTICLES }, (_, i) => (
        <Particle key={i} index={i} progress={progress} />
      ))}
    </View>
  );
}

function Particle({ index, progress }: { index: number; progress: { value: number } }) {
  const { colors } = useTheme();
  const angle = (index / PARTICLES) * Math.PI * 2;
  const distance = 84 + (index % 3) * 28;
  const color = [colors.accent, colors.success, colors.warning][index % 3] ?? colors.accent;

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 1], [0, 1, 0]),
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - 0.5 * progress.value },
    ],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
});
