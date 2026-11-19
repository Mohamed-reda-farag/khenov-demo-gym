import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Check, Dumbbell, Flame, Star, Trophy, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { WorkoutError, exerciseRepository, workoutSessionRepository } from '@/data/repository';
import { useLanguage } from '@/i18n';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, motion, radius, spacing, useTheme } from '@/theme';

import { Celebration } from './Celebration';
import { useWorkoutText } from './useWorkoutText';

async function load(sessionId: string) {
  const [summary, exercises] = await Promise.all([
    workoutSessionRepository.getSummary(sessionId),
    exerciseRepository.list(),
  ]);
  return { summary, library: new Map(exercises.map((e) => [e.id, e])) };
}

export function SummaryScreen({ sessionId, fresh }: { sessionId: string; fresh: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload } = useAsyncResource(() => load(sessionId));

  const go = (href: '/workout' | '/progress') => router.dismissTo(href);
  const close = () => go('/workout');

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.topTitle} numberOfLines={1}>
          {t('workout.summary.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={close}
          style={styles.close}
        >
          <Icon icon={X} size={24} />
        </Pressable>
      </View>
      {state.status === 'loading' ? (
        <View style={styles.content}>
          <Skeleton height={150} rounded={radius.xl} />
          <Skeleton height={120} rounded={radius.xl} />
          <Skeleton height={140} rounded={radius.xl} />
        </View>
      ) : null}
      {state.status === 'error' ? (
        state.error instanceof WorkoutError && state.error.code === 'session_not_found' ? (
          <EmptyState
            icon={Dumbbell}
            title={t('workout.summary.notFoundTitle')}
            body={t('workout.summary.notFoundBody')}
            actionLabel={t('workout.summary.done')}
            onAction={close}
          />
        ) : (
          <ErrorState onRetry={reload} />
        )
      ) : null}
      {state.status === 'success' ? (
        <SummaryBody
          data={state.data}
          fresh={fresh}
          onDone={close}
          onProgress={() => go('/progress')}
        />
      ) : null}
    </Screen>
  );
}

function SummaryBody({
  data,
  fresh,
  onDone,
  onProgress,
}: {
  data: Awaited<ReturnType<typeof load>>;
  fresh: boolean;
  onDone: () => void;
  onProgress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useLanguage();
  const format = useFormat();
  const text = useWorkoutText();
  const reduceMotion = useReducedMotion();
  const { session, prs, unlocked, streak } = data.summary;
  const partial = session.partial;

  const scale = useSharedValue(fresh && !reduceMotion ? 0.4 : 1);
  const opacity = useSharedValue(fresh && !reduceMotion ? 0 : 1);
  useEffect(() => {
    if (!fresh || reduceMotion) return;
    opacity.set(withTiming(1, { duration: motion.duration.base }));
    scale.set(withDelay(80, withSpring(1, { damping: 9, stiffness: 140 })));
    if (!partial) haptics.success();
  }, [fresh, partial, reduceMotion, opacity, scale]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const stats = [
    {
      label: t('workout.summary.duration'),
      value: text.minutes(Math.max(1, Math.round(session.durationSec / 60))),
    },
    { label: t('workout.summary.volume'), value: text.volume(session.volumeKg) },
    { label: t('workout.summary.sets'), value: format.number(session.setsCompleted) },
    { label: t('workout.summary.exercises'), value: format.number(session.exercises.length) },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.badgeArea}>
          <Celebration active={fresh && !partial} />
          <Animated.View style={[styles.badge, { backgroundColor: colors.accent }, badgeStyle]}>
            <Icon icon={partial ? Check : Trophy} size={40} color="onAccent" strokeWidth={2.5} />
          </Animated.View>
        </View>
        <Text variant="h1" align="center">
          {partial ? t('workout.summary.partialTitle') : t('workout.summary.great')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {partial ? t('workout.summary.partialBody') : t('workout.summary.greatBody')}
        </Text>
      </View>

      <View style={styles.grid}>
        {stats.map((s) => (
          <Card key={s.label} style={styles.stat}>
            <Text variant="caption" color="secondary">
              {s.label}
            </Text>
            <Text variant="title">{s.value}</Text>
          </Card>
        ))}
      </View>

      <Card style={styles.streak}>
        <Icon icon={Flame} size={24} color="accentText" />
        <Text variant="bodyStrong" style={styles.grow}>
          {t('workout.summary.streak', {
            days: t('home.streakDays', { count: streak, countText: format.number(streak) }),
          })}
        </Text>
      </Card>

      <View style={styles.section}>
        <Text variant="title">{t('workout.summary.prs')}</Text>
        {prs.length === 0 ? (
          <Text variant="small" color="secondary">
            {t('workout.summary.noPrs')}
          </Text>
        ) : (
          prs.map((hit) => {
            const ex = data.library.get(hit.exerciseId);
            return (
              <View
                key={hit.exerciseId}
                style={[
                  styles.prRow,
                  { backgroundColor: colors.accentSoft, borderColor: colors.accent },
                ]}
              >
                <Icon icon={Trophy} size={22} color="accentText" />
                <View style={styles.grow}>
                  <Text variant="bodyStrong">{ex ? text.exercise(ex) : hit.exerciseId}</Text>
                  <Text variant="small" color="secondary">
                    {t('workout.summary.prLine', {
                      previous: text.weightReps(hit.previous),
                      current: text.weightReps(hit.best),
                    })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {unlocked.length > 0 ? (
        <View style={styles.section}>
          <Text variant="title">{t('workout.summary.achievements')}</Text>
          {unlocked.map((a) => (
            <View
              key={a.id}
              style={[
                styles.prRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Icon icon={Star} size={22} color="accentText" />
              <View style={styles.grow}>
                <Text variant="bodyStrong">{a.title[language]}</Text>
                <Text variant="small" color="secondary">
                  {a.description[language]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button label={t('workout.summary.done')} onPress={onDone} />
        <Button
          label={t('workout.summary.viewProgress')}
          onPress={onProgress}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minHeight: layout.minTouchTarget + spacing.xs,
  },
  topTitle: { flex: 1 },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.xs },
  badgeArea: { width: 220, height: 160, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  stat: { flexBasis: '48%', flexGrow: 1, gap: spacing.xxs },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1, gap: spacing.xxs },
  section: { gap: spacing.xs },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  actions: { gap: spacing.xs, marginTop: spacing.xs },
});
