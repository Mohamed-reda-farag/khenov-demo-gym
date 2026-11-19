import { useRouter } from 'expo-router';
import { CalendarCheck, Dumbbell, TrendingUp } from '@/components/ui/icons';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useSession } from '@/features/shell/SessionProvider';
import { useDirection } from '@/i18n/direction';
import { haptics } from '@/lib/haptics';
import { layout, motion, radius, spacing, useTheme } from '@/theme';

import { SlideArt } from './SlideArt';

const SLIDES = [
  { key: 'slide1', icon: CalendarCheck, orbit: [-50, 150, 230] },
  { key: 'slide2', icon: Dumbbell, orbit: [-20, 120, 200] },
  { key: 'slide3', icon: TrendingUp, orbit: [-80, 40, 190] },
] as const;

const SWIPE_FRACTION = 0.18;
const SWIPE_VELOCITY = 600;

export function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { sign } = useDirection();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { completeOnboarding } = useSession();
  const reduceMotion = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const position = useSharedValue(0);
  const drag = useSharedValue(0);
  const last = index === SLIDES.length - 1;

  const goTo = useCallback(
    (target: number) => {
      const next = Math.max(0, Math.min(SLIDES.length - 1, target));
      setIndex(next);
      position.set(
        withTiming(next, {
          duration: reduceMotion ? 0 : motion.duration.base,
          easing: Easing.out(Easing.cubic),
        }),
      );
      haptics.select();
    },
    [position, reduceMotion],
  );

  const finish = useCallback(async () => {
    setFinishing(true);
    await completeOnboarding();
    router.replace('/login');
  }, [completeOnboarding, router]);

  const pan = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .onUpdate((event) => {
      drag.set(event.translationX);
    })
    .onEnd((event) => {
      const current = Math.round(position.value);
      const along = event.translationX * sign;
      const velocityAlong = event.velocityX * sign;
      if (along < -width * SWIPE_FRACTION || velocityAlong < -SWIPE_VELOCITY) {
        scheduleOnRN(goTo, current + 1);
      } else if (along > width * SWIPE_FRACTION || velocityAlong > SWIPE_VELOCITY) {
        scheduleOnRN(goTo, current - 1);
      }
      drag.set(withTiming(0, { duration: motion.duration.base }));
    });

  return (
    <Screen>
      <View style={styles.top}>
        <DemoBadge />
        {!last ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.skip')}
            onPress={finish}
            style={styles.skip}
          >
            <Text variant="label" color="secondary">
              {t('common.skip')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <GestureDetector gesture={pan}>
        <View style={styles.stage} aria-live="polite">
          {SLIDES.map((slide, i) => (
            <Slide
              key={slide.key}
              i={i}
              width={width}
              sign={sign}
              position={position}
              drag={drag}
              title={t(`onboarding.${slide.key}.title`)}
              body={t(`onboarding.${slide.key}.body`)}
              icon={slide.icon}
              orbit={slide.orbit}
            />
          ))}
        </View>
      </GestureDetector>

      <View
        accessibilityLabel={t('onboarding.pageOf', { current: index + 1, total: SLIDES.length })}
        style={styles.dots}
      >
        {SLIDES.map((slide, i) => (
          <View
            key={slide.key}
            style={[
              styles.dot,
              i === index
                ? { width: 28, backgroundColor: colors.accent }
                : { width: 8, backgroundColor: colors.border },
            ]}
          />
        ))}
      </View>

      <Button
        label={last ? t('common.start') : t('common.next')}
        onPress={last ? finish : () => goTo(index + 1)}
        loading={finishing}
      />
    </Screen>
  );
}

interface SlideProps {
  i: number;
  width: number;
  sign: 1 | -1;
  position: { value: number };
  drag: { value: number };
  title: string;
  body: string;
  icon: (typeof SLIDES)[number]['icon'];
  orbit: readonly number[];
}

function Slide({ i, width, sign, position, drag, title, body, icon, orbit }: SlideProps) {
  const style = useAnimatedStyle(() => {
    const offset = i - position.value;
    return {
      opacity: 1 - Math.min(Math.abs(offset), 1) * 0.85,
      transform: [{ translateX: offset * width * sign + drag.value }],
    };
  });

  return (
    <Animated.View style={[styles.slide, style]}>
      <SlideArt icon={icon} orbit={orbit} />
      <View style={styles.copy}>
        <Text variant="h1" align="center">
          {title}
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.body}>
          {body}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: {
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  stage: { flex: 1, overflow: 'hidden' },
  slide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  copy: { gap: spacing.xs, alignItems: 'center' },
  body: { maxWidth: 340 },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dot: { height: 8, borderRadius: radius.pill },
});
