import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { layout, motion, radius, spacing, useTheme } from '@/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const inactive = disabled || loading;

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const palette = {
    primary: { bg: colors.accent, fg: 'onAccent' as const, border: colors.accent },
    secondary: { bg: colors.surfaceAlt, fg: 'text' as const, border: colors.border },
    ghost: { bg: 'transparent', fg: 'text' as const, border: 'transparent' },
    danger: { bg: 'transparent', fg: 'danger' as const, border: colors.danger },
  }[variant];

  const spinnerColor = variant === 'primary' ? colors.onAccent : colors.text;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      onPressIn={() => {
        if (!reduceMotion) scale.set(withSpring(0.97, motion.spring));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, motion.spring));
      }}
      style={[
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        animated,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={spinnerColor} /> : null}
        <Text variant="label" color={palette.fg} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouchTarget + spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
