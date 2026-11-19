import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { layout, radius, spacing, useTheme } from '@/theme';

import { Minus, Plus } from './icons';
import { Icon } from './Icon';
import { Text } from './Text';

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  /** Text shown for the value, already localized (digits and unit). */
  display: string;
  decreaseLabel: string;
  increaseLabel: string;
  /** Spoken description of the current value, e.g. "Weight: 75 kg". */
  valueLabel: string;
  large?: boolean;
}

const HOLD_DELAY_MS = 380;
const REPEAT_MS = 110;

/** Rounds away floating point noise such as 0.30000000000000004. */
const clean = (n: number) => Number(n.toFixed(4));

/**
 * Large plus and minus buttons around a value. A tap changes it by one step, holding repeats.
 * Screen readers activate the buttons with a normal tap, so every step also works without holding.
 */
export function Stepper({
  label,
  value,
  onChange,
  step,
  min,
  max,
  display,
  decreaseLabel,
  increaseLabel,
  valueLabel,
  large = false,
}: StepperProps) {
  const { colors } = useTheme();
  const latest = useRef({ value, onChange });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = { value, onChange };
  });

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const nudge = useCallback(
    (direction: 1 | -1) => {
      const current = latest.current;
      const next = Math.min(max, Math.max(min, clean(current.value + direction * step)));
      if (next !== current.value) current.onChange(next);
      return next !== current.value;
    },
    [max, min, step],
  );

  const startRepeat = useCallback(
    (direction: 1 | -1) => {
      const tick = () => {
        if (!nudge(direction)) return;
        timer.current = setTimeout(tick, REPEAT_MS);
      };
      tick();
    },
    [nudge],
  );

  const size = large ? 64 : layout.minTouchTarget + spacing.xs;

  const button = (direction: 1 | -1, accessibilityLabel: string) => {
    const disabled = direction === 1 ? value >= max : value <= min;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        delayLongPress={HOLD_DELAY_MS}
        onPress={() => {
          haptics.select();
          nudge(direction);
        }}
        onLongPress={() => startRepeat(direction)}
        onPressOut={stop}
        style={({ pressed }) => [
          styles.button,
          {
            width: size,
            height: size,
            backgroundColor: pressed ? colors.accent : colors.surfaceAlt,
            borderColor: colors.border,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        {({ pressed }) => (
          <Icon
            icon={direction === 1 ? Plus : Minus}
            size={26}
            color={pressed ? 'onAccent' : 'text'}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <Text variant="small" color="secondary">
        {label}
      </Text>
      <View style={styles.row}>
        {button(-1, decreaseLabel)}
        <View accessible accessibilityLabel={valueLabel} aria-live="polite" style={styles.value}>
          <Text variant={large ? 'display' : 'h1'} align="center" numberOfLines={1}>
            {display}
          </Text>
        </View>
        {button(1, increaseLabel)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  button: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
