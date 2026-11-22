import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { layout, motion, pointer, radius, shadow, spacing, useTheme } from '@/theme';

import { Check, Info, TriangleAlert } from './icons';
import { Icon } from './Icon';
import { Text } from './Text';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
  /** Distance from the bottom edge of the safe area. Defaults to sitting above the tab bar. */
  bottomOffset?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastApi {
  show: (options: ToastOptions) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const nextId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    progress.set(
      withTiming(
        0,
        { duration: reduceMotion ? 0 : motion.duration.fast, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(setItem, null);
        },
      ),
    );
  }, [clearTimer, progress, reduceMotion]);

  const show = useCallback(
    (options: ToastOptions) => {
      clearTimer();
      nextId.current += 1;
      setItem({ ...options, id: nextId.current });
      if (options.tone === 'error') haptics.warning();
      progress.set(0);
      progress.set(
        withTiming(1, {
          duration: reduceMotion ? 0 : motion.duration.base,
          easing: Easing.out(Easing.cubic),
        }),
      );
      timer.current = setTimeout(dismiss, options.durationMs ?? DEFAULT_DURATION_MS);
    },
    [clearTimer, dismiss, progress, reduceMotion],
  );

  useEffect(() => clearTimer, [clearTimer]);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {item ? <ToastView item={item} progress={progress} onDismiss={dismiss} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({
  item,
  progress,
  onDismiss,
}: {
  item: ToastItem;
  progress: { value: number };
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tone = item.tone ?? 'info';
  const glyph = tone === 'success' ? Check : tone === 'error' ? TriangleAlert : Info;
  const toneColor = tone === 'success' ? 'success' : tone === 'error' ? 'danger' : 'accentText';
  const bottom = insets.bottom + (item.bottomOffset ?? layout.tabBarHeight + spacing.sm);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));

  return (
    <View style={[pointer.boxNone, styles.layer, { bottom }]}>
      <Animated.View
        aria-live={tone === 'error' ? 'assertive' : 'polite'}
        style={[
          styles.toast,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
            boxShadow: shadow.card,
          },
          animated,
        ]}
      >
        <Icon icon={glyph} size={20} color={toneColor} />
        <Text variant="small" style={styles.message}>
          {item.message}
        </Text>
        {item.actionLabel && item.onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.actionLabel}
            onPress={() => {
              item.onAction?.();
              onDismiss();
            }}
            style={styles.action}
          >
            <Text variant="label" color="accent">
              {item.actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    start: spacing.md,
    end: spacing.md,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingStart: spacing.md,
    paddingEnd: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: layout.minTouchTarget + spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 520,
    width: '100%',
  },
  message: { flex: 1 },
  action: {
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
