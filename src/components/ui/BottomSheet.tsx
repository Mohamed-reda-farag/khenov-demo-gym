import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useDirection } from '@/i18n/direction';
import { motion, radius, shadow, spacing, useTheme } from '@/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  /** When false the sheet ignores backdrop taps and swipe-down (e.g. while a request runs). */
  dismissible?: boolean;
  /** Set to false when the content scrolls: only the handle at the top then drags the sheet. */
  dragFromAnywhere?: boolean;
}

const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 900;

export function BottomSheet({
  visible,
  onClose,
  accessibilityLabel,
  children,
  dismissible = true,
  dragFromAnywhere = true,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const { dir } = useDirection();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    const duration = reduceMotion ? 0 : motion.duration.base;
    if (visible) {
      drag.set(0);
      progress.set(withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
    } else {
      progress.set(
        withTiming(0, { duration, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, reduceMotion, progress, drag]);

  const pan = Gesture.Pan()
    .enabled(dismissible)
    .onUpdate((event) => {
      drag.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (event.translationY > CLOSE_DISTANCE || event.velocityY > CLOSE_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        drag.set(withTiming(0, { duration: motion.duration.fast }));
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * (1 - Math.min(drag.value / height, 1)),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height + drag.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={[styles.root, { direction: dir }]}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissible ? onClose : undefined}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
          />
        </Animated.View>
        {(() => {
          const sheet = (
            <Animated.View
              accessibilityViewIsModal
              accessibilityLabel={accessibilityLabel}
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  paddingBottom: insets.bottom + spacing.lg,
                  boxShadow: shadow.sheet,
                },
                sheetStyle,
              ]}
            >
              {dragFromAnywhere ? (
                <View style={[styles.grabber, { backgroundColor: colors.border }]} />
              ) : (
                <GestureDetector gesture={pan}>
                  <View style={styles.handleArea}>
                    <View style={[styles.grabber, { backgroundColor: colors.border }]} />
                  </View>
                </GestureDetector>
              )}
              {children}
            </Animated.View>
          );
          return dragFromAnywhere ? (
            <GestureDetector gesture={pan}>{sheet}</GestureDetector>
          ) : (
            sheet
          );
        })()}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  handleArea: {
    alignSelf: 'stretch',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: -spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
});
