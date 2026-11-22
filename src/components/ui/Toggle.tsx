import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useDirection } from '@/i18n/direction';
import { haptics } from '@/lib/haptics';
import { layout, motion, radius, spacing, useTheme } from '@/theme';

import { Text } from './Text';

const TRACK_WIDTH = 52;
const THUMB = 24;
const INSET = 4;
const TRAVEL = TRACK_WIDTH - THUMB - INSET * 2;

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Shown beside the switch so the state never depends on colour alone, for example "On". */
  stateLabel: string;
  disabled?: boolean;
}

/** A settings row. The whole row is the touch target. */
export function Toggle({ label, value, onValueChange, stateLabel, disabled = false }: ToggleProps) {
  const { colors } = useTheme();
  const { isRTL } = useDirection();
  const reduceMotion = useReducedMotion();
  const position = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    position.set(
      reduceMotion
        ? value
          ? 1
          : 0
        : withTiming(value ? 1 : 0, { duration: motion.duration.fast }),
    );
  }, [value, reduceMotion, position]);

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * TRAVEL * (isRTL ? -1 : 1) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.select();
        onValueChange(!value);
      }}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      <Text variant="caption" color="secondary">
        {stateLabel}
      </Text>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? colors.accent : colors.surfaceAlt,
            borderColor: colors.textMuted,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: value ? colors.onAccent : colors.textMuted },
            thumb,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.minTouchTarget + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: { flex: 1 },
  track: {
    width: TRACK_WIDTH,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 2,
    padding: INSET - 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.pill },
});
