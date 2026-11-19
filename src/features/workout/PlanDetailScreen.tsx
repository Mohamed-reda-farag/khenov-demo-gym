import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Dumbbell, Timer, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import {
  WorkoutError,
  exerciseRepository,
  workoutPlanRepository,
  workoutSessionRepository,
} from '@/data/repository';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

import { ExerciseGlyph } from './ExerciseGlyph';
import { useStartSession } from './useStartSession';
import { useWorkoutText } from './useWorkoutText';

async function load(planId: string) {
  const [plans, exercises, schedule, active] = await Promise.all([
    workoutPlanRepository.list(),
    exerciseRepository.list(),
    workoutPlanRepository.getSchedule(),
    workoutSessionRepository.getActive(),
  ]);
  const plan = plans.find((p) => p.id === planId);
  if (!plan) throw new WorkoutError('plan_not_found');
  return {
    plan,
    exercises: new Map(exercises.map((e) => [e.id, e])),
    days: schedule.filter((e) => e.planId === planId).map((e) => e.dayOfWeek),
    active,
  };
}

export function PlanDetailScreen({ planId }: { planId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload } = useAsyncResource(() => load(planId));

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/workout');
  }

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.topTitle} numberOfLines={1}>
          {t('workout.planDetail.title')}
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
          <Skeleton width="60%" height={40} />
          <Skeleton height={120} rounded={radius.xl} />
          <Skeleton height={260} rounded={radius.xl} />
        </View>
      ) : null}
      {state.status === 'error' ? (
        state.error instanceof WorkoutError && state.error.code === 'plan_not_found' ? (
          <EmptyState
            icon={Dumbbell}
            title={t('workout.planDetail.notFoundTitle')}
            body={t('workout.planDetail.notFoundBody')}
            actionLabel={t('common.close')}
            onAction={close}
          />
        ) : (
          <ErrorState onRetry={reload} />
        )
      ) : null}
      {state.status === 'success' ? <PlanBody data={state.data} /> : null}
    </Screen>
  );
}

function PlanBody({ data }: { data: Awaited<ReturnType<typeof load>> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();
  const text = useWorkoutText();
  const { start, busy } = useStartSession();
  const { plan, exercises, days, active } = data;
  const blocked = active !== null && active.planId !== plan.id;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text variant="h1">{text.plan(plan)}</Text>
          <Text variant="body" color="secondary">
            {plan.focus[format.language]}
          </Text>
        </View>

        <Card style={styles.facts}>
          <View style={styles.fact}>
            <Icon icon={Timer} size={20} color="accentText" />
            <Text variant="small" color="secondary">
              {t('workout.planDetail.estimated')}
            </Text>
            <Text variant="bodyStrong">{text.minutes(plan.durationMin)}</Text>
          </View>
          <View style={styles.daysBlock}>
            <Text variant="small" color="secondary">
              {t('workout.planDetail.days')}
            </Text>
            {days.length === 0 ? (
              <Text variant="body" color="muted">
                {t('workout.planDetail.noDays')}
              </Text>
            ) : (
              <View style={styles.dayChips}>
                {days.map((d) => (
                  <View key={d} style={[styles.dayChip, { backgroundColor: colors.accentSoft }]}>
                    <Text variant="label" color="accent">
                      {format.weekdayName(d)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Card>

        <Text variant="title">{t('workout.planDetail.exercises')}</Text>
        {plan.exercises.map((pe) => {
          const ex = exercises.get(pe.exerciseId);
          if (!ex) return null;
          return (
            <View
              key={pe.exerciseId}
              style={[
                styles.exerciseRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ExerciseGlyph equipment={ex.equipment} size={48} />
              <View style={styles.grow}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {text.exercise(ex)}
                </Text>
                <Text variant="caption" color="muted">
                  {text.muscle(ex.muscle)} · {text.equipment(ex.equipment)}
                </Text>
              </View>
              <View style={styles.setsReps}>
                <Text variant="title">{text.setsReps(pe.sets, pe.reps)}</Text>
                <Text variant="caption" color="muted">
                  {t('workout.planDetail.rest', { time: format.countdown(pe.restSec) })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {blocked ? (
          <Text variant="small" color="secondary">
            {t('workout.planDetail.blocked')}
          </Text>
        ) : null}
        {active ? (
          <Button
            label={t('workout.resume.resume')}
            onPress={() => router.push('/session')}
            disabled={blocked}
          />
        ) : (
          <Button
            label={t('workout.planDetail.start')}
            onPress={() => void start(plan.id)}
            loading={busy}
          />
        )}
      </View>
    </>
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
  hero: { gap: spacing.xs },
  facts: { gap: spacing.md },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  daysBlock: { gap: spacing.xs },
  dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  grow: { flex: 1, gap: spacing.xxs },
  setsReps: { alignItems: 'flex-end', gap: spacing.xxs },
  bar: {
    gap: spacing.xs,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
});
