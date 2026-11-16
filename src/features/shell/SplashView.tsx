import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Logo } from '@/components/ui/Logo';
import { Text } from '@/components/ui/Text';
import { motion, spacing, useTheme } from '@/theme';

export function SplashView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const markScale = useSharedValue(reduceMotion ? 1 : 0.7);
  const markOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const textOpacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    markOpacity.value = withTiming(1, { duration: motion.duration.base });
    markScale.value = withSpring(1, { damping: 12, stiffness: 140 });
    textOpacity.value = withDelay(
      280,
      withTiming(1, { duration: motion.duration.slow, easing: Easing.out(Easing.cubic) }),
    );
  }, [reduceMotion, markOpacity, markScale, textOpacity]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View style={markStyle}>
        <Logo size={168} />
      </Animated.View>
      <Animated.View style={[styles.text, textStyle]}>
        <Text variant="display" align="center">
          {t('app.name')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('app.tagline')}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  text: { alignItems: 'center', gap: spacing.xxs },
});
