import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { BookOpen, ChevronRight, Dumbbell, Moon } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import {
  onWorkoutChanged,
  progressRepository,
  workoutPlanRepository,
  workoutSessionRepository,
} from '@/data/repository';
import type { ScheduleEntry, WorkoutPlan, WorkoutSession } from '@/data/types';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

import { ResumeBanner } from './ResumeBanner';
import { useStartSession } from './useStartSession';
import { useWorkoutText } from './useWorkoutText';

interface WorkoutData {
  plans: WorkoutPlan[];
  today: WorkoutPlan | null;
  schedule: ScheduleEntry[];
  recent: WorkoutSession[];
  hasActive: boolean;
}

async function load(): Promise<WorkoutData> {
  const [plans, today, schedule, sessions, active] = await Promise.all([
    workoutPlanRepository.list(),
    workoutPlanRepository.getForToday(),
    workoutPlanRepository.getSchedule(),
    progressRepository.listSessions(),
    workoutSessionRepository.getActive(),
  ]);
  return {
    plans,
    today,
    schedule,
    recent: sessions.slice(-4).reverse(),
    hasActive: active !== null,
  };
}

export function WorkoutScreen() {
  const { t } = useTranslation();
  const { state, reload, refresh } = useAsyncResource(load);

  useEffect(() => onWorkoutChanged(refresh), [refresh]);

  return (
    <Screen scroll withTabBar>
      <View style={styles.head}>
        <Text variant="h1">{t('workout.title')}</Text>
        <Text variant="small" color="secondary">
          {t('workout.subtitle')}
        </Text>
      </View>
      <ResumeBanner />
      {state.status === 'loading' ? <WorkoutSkeleton /> : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <WorkoutContent data={state.data} /> : null}
    </Screen>
  );
}

function WorkoutContent({ data }: { data: WorkoutData }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();
  const text = useWorkoutText();
  const { start, busy } = useStartSession();

  const daysOf = (planId: string) =>
    data.schedule
      .filter((e) => e.planId === planId)
      .map((e) => format.weekdayName(e.dayOfWeek, 'short'))
      .join(format.language === 'ar' ? '، ' : ', ');

  const openPlan = (planId: string) =>
    router.push({ pathname: '/plan/[planId]', params: { planId } });

  return (
    <>
      <Card style={styles.today}>
        <View style={styles.row}>
          <View
            style={[
              styles.icon,
              { backgroundColor: data.today ? colors.accentSoft : colors.surfaceAlt },
            ]}
          >
            <Icon
              icon={data.today ? Dumbbell : Moon}
              size={26}
              color={data.today ? 'accentText' : 'textSecondary'}
            />
          </View>
          <View style={styles.grow}>
            <Text variant="caption" color="secondary">
              {t('workout.today.title')}
            </Text>
            <Text variant="title" numberOfLines={1}>
              {data.today ? text.plan(data.today) : t('workout.today.restTitle')}
            </Text>
            <Text variant="small" color="secondary">
              {data.today
                ? t('workout.plans.meta', {
                    exercises: text.exercises(data.today.exercises.length),
                    minutes: text.minutes(data.today.durationMin),
                  })
                : t('workout.today.restBody')}
            </Text>
          </View>
        </View>
        {data.today ? (
          <Button
            label={t('workout.today.start')}
            onPress={() => void start(data.today?.id ?? '')}
            loading={busy}
            disabled={data.hasActive}
          />
        ) : null}
      </Card>

      <View style={styles.section}>
        <Text variant="title">{t('workout.plans.title')}</Text>
        {data.plans.map((plan) => {
          const days = daysOf(plan.id);
          return (
            <Pressable
              key={plan.id}
              accessibilityRole="button"
              accessibilityLabel={`${text.plan(plan)}، ${days || t('workout.plans.notScheduled')}`}
              onPress={() => openPlan(plan.id)}
              style={({ pressed }) => [
                styles.planRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.grow}>
                <Text variant="title" numberOfLines={1}>
                  {text.plan(plan)}
                </Text>
                <Text variant="small" color="secondary" numberOfLines={1}>
                  {plan.focus[format.language]}
                </Text>
                <Text variant="caption" color="muted">
                  {t('workout.plans.meta', {
                    exercises: text.exercises(plan.exercises.length),
                    minutes: text.minutes(plan.durationMin),
                  })}
                  {' · '}
                  {days ? t('workout.plans.scheduled', { days }) : t('workout.plans.notScheduled')}
                </Text>
              </View>
              <Icon icon={ChevronRight} size={20} color="textMuted" directional />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('workout.library.open')}
        onPress={() => router.push('/exercises')}
        style={({ pressed }) => [
          styles.planRow,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Icon icon={BookOpen} size={24} color="accentText" />
        </View>
        <View style={styles.grow}>
          <Text variant="title">{t('workout.library.open')}</Text>
          <Text variant="small" color="secondary">
            {t('workout.library.openBody')}
          </Text>
        </View>
        <Icon icon={ChevronRight} size={20} color="textMuted" directional />
      </Pressable>

      <View style={styles.section}>
        <Text variant="title">{t('workout.recent.title')}</Text>
        {data.recent.length === 0 ? (
          <Card>
            <EmptyState
              icon={Dumbbell}
              title={t('workout.recent.emptyTitle')}
              body={t('workout.recent.emptyBody')}
            />
          </Card>
        ) : (
          data.recent.map((s) => {
            const plan = data.plans.find((p) => p.id === s.planId);
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={`${plan ? text.plan(plan) : ''}، ${format.dayMonth(new Date(s.endedAt))}`}
                onPress={() =>
                  router.push({ pathname: '/summary/[sessionId]', params: { sessionId: s.id } })
                }
                style={({ pressed }) => [
                  styles.planRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.grow}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {plan ? text.plan(plan) : ''}
                    {s.partial ? ` (${t('workout.recent.partial')})` : ''}
                  </Text>
                  <Text variant="small" color="secondary">
                    {format.weekday(new Date(s.endedAt))} {format.dayMonth(new Date(s.endedAt))}
                  </Text>
                  <Text variant="caption" color="muted">
                    {t('workout.recent.item', {
                      sets: text.sets(s.setsCompleted),
                      volume: text.volume(s.volumeKg),
                    })}
                  </Text>
                </View>
                <Icon icon={ChevronRight} size={20} color="textMuted" directional />
              </Pressable>
            );
          })
        )}
      </View>
    </>
  );
}

function WorkoutSkeleton() {
  return (
    <>
      <Skeleton height={150} rounded={radius.xl} />
      <Skeleton height={92} rounded={radius.xl} />
      <Skeleton height={92} rounded={radius.xl} />
      <Skeleton height={92} rounded={radius.xl} />
    </>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xxs },
  today: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1, gap: spacing.xxs },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: spacing.sm },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: layout.minTouchTarget + spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
});
