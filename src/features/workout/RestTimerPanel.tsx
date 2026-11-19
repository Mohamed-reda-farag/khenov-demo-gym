import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, Timer } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { REST_STEP_SEC } from '@/data/rules/activeSession';
import { isPaused, remainingMs, timerProgress } from '@/data/rules/timer';
import type { RestTimer } from '@/data/types';
import { useDirection } from '@/i18n/direction';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { radius, spacing, useTheme } from '@/theme';

import { useNow } from './useNow';

interface RestTimerPanelProps {
  timer: RestTimer;
  onAdjust: (deltaSec: number) => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
}

const TEN_SECONDS = 10_000;

/**
 * The rest countdown. It owns its own clock, so the rest of the session screen does not
 * re-render while it ticks. The time shown is always `endsAt - now`, never a counter, so it is
 * exact after time in the background. State is told with words and numbers, not color alone:
 * "Rest", "Paused" or "Rest is over", plus the time and a shrinking bar.
 * The parent gives it a new `key` for every rest, so it announces the start once per rest.
 */
export function RestTimerPanel({
  timer,
  onAdjust,
  onPause,
  onResume,
  onSkip,
}: RestTimerPanelProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { sign } = useDirection();
  const format = useFormat();
  const reduceMotion = useReducedMotion();
  const paused = isPaused(timer);
  const now = useNow(250, !paused);
  const remaining = remainingMs(timer, now);
  const over = remaining <= 0;

  const announcedStart = useRef(false);
  const announcedTen = useRef(false);
  const wasRunning = useRef(remaining > 0);
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);

  // Spoken and felt at key moments only: the start, ten seconds left, and the end.
  useEffect(() => {
    if (announcedStart.current || remaining <= 0) return;
    announcedStart.current = true;
    AccessibilityInfo.announceForAccessibility(
      t('workout.session.rest.announceStart', { time: format.countdown(remaining / 1000) }),
    );
  }, [remaining, t, format]);

  useEffect(() => {
    if (!over && !paused && remaining <= TEN_SECONDS && !announcedTen.current) {
      announcedTen.current = true;
      AccessibilityInfo.announceForAccessibility(t('workout.session.rest.announceTen'));
    }
    if (over && wasRunning.current) {
      wasRunning.current = false;
      haptics.success();
      AccessibilityInfo.announceForAccessibility(t('workout.session.rest.announceDone'));
    }
    if (!over) wasRunning.current = true;
  }, [over, remaining, paused, t]);

  // The bar runs on the UI thread for exactly the time left, then stops.
  useEffect(() => {
    const at = Date.now();
    const left = remainingMs(timer, at);
    progress.set(timerProgress(timer, at));
    if (!paused && left > 0 && !reduceMotion) {
      progress.set(withTiming(1, { duration: left, easing: Easing.linear }));
    }
  }, [timer, paused, reduceMotion, progress]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sign * -progress.value * trackWidth }],
  }));

  const time = format.countdown(remaining / 1000);
  const title = over
    ? t('workout.session.rest.over')
    : paused
      ? t('workout.session.rest.paused')
      : t('workout.session.rest.title');

  return (
    <Card
      style={styles.card}
      aria-label={`${title}. ${t('workout.session.rest.timeLabel', { time })}`}
    >
      <View style={styles.head}>
        <Icon icon={over ? Check : Timer} size={22} color={over ? 'success' : 'accentText'} />
        <Text variant="label" color={over ? 'success' : 'accent'}>
          {title}
        </Text>
      </View>

      <Text variant="display" align="center">
        {time}
      </Text>

      <View
        aria-hidden
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
      >
        <Animated.View style={[styles.fill, { backgroundColor: colors.accent }, barStyle]} />
      </View>

      <View style={styles.row}>
        <View style={styles.cell}>
          <Button
            label={t('workout.session.rest.sub')}
            accessibilityLabel={t('workout.session.rest.subLabel')}
            onPress={() => onAdjust(-REST_STEP_SEC)}
            variant="secondary"
            disabled={over}
          />
        </View>
        <View style={styles.cell}>
          <Button
            label={paused ? t('workout.session.rest.resume') : t('workout.session.rest.pause')}
            onPress={paused ? onResume : onPause}
            variant="secondary"
            disabled={over}
          />
        </View>
        <View style={styles.cell}>
          <Button
            label={t('workout.session.rest.add')}
            accessibilityLabel={t('workout.session.rest.addLabel')}
            onPress={() => onAdjust(REST_STEP_SEC)}
            variant="secondary"
          />
        </View>
      </View>
      <Button
        label={over ? t('common.next') : t('workout.session.rest.skip')}
        onPress={onSkip}
        variant={over ? 'primary' : 'ghost'}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', width: '100%', borderRadius: radius.pill },
  row: { flexDirection: 'row', gap: spacing.xs },
  cell: { flex: 1 },
});
