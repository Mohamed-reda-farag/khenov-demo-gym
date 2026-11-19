import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Dumbbell, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { WorkoutError, exerciseRepository, progressRepository } from '@/data/repository';
import { bestOf } from '@/data/rules/workout';
import type { BestSet, LoggedSet } from '@/data/types';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { LineChart } from '@/features/progress/LineChart';
import { useChartText } from '@/features/progress/useChartText';
import { layout, radius, spacing, useTheme } from '@/theme';

import { ExerciseGlyph } from './ExerciseGlyph';
import { useWorkoutText } from './useWorkoutText';

async function load(exerciseId: string) {
  const [exercises, sessions] = await Promise.all([
    exerciseRepository.list(),
    progressRepository.listSessions(),
  ]);
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!exercise) throw new WorkoutError('plan_not_found');
  const history = sessions.flatMap((s) => {
    const sets = s.exercises.find((e) => e.exerciseId === exerciseId)?.sets;
    const best = sets ? bestOf(sets) : null;
    return sets && best ? [{ time: Date.parse(s.endedAt), best, sets }] : [];
  });
  return { exercise, history };
}

export function ExerciseDetailScreen({ exerciseId }: { exerciseId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload } = useAsyncResource(() => load(exerciseId));

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/exercises');
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.topTitle} numberOfLines={1}>
          {t('workout.exercise.title')}
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
          <Skeleton height={80} rounded={radius.xl} />
          <Skeleton height={220} rounded={radius.xl} />
        </View>
      ) : null}
      {state.status === 'error' ? (
        state.error instanceof WorkoutError ? (
          <EmptyState
            icon={Dumbbell}
            title={t('workout.exercise.notFoundTitle')}
            body={t('workout.exercise.notFoundBody')}
            actionLabel={t('common.close')}
            onAction={close}
          />
        ) : (
          <ErrorState onRetry={reload} />
        )
      ) : null}
      {state.status === 'success' ? <Body data={state.data} /> : null}
    </Screen>
  );
}

function Body({ data }: { data: Awaited<ReturnType<typeof load>> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const text = useWorkoutText();
  const describe = useChartText();
  const { exercise, history } = data;

  const record: BestSet | null = bestOf(history.map((h) => h.best));
  const lastSession = history[history.length - 1];
  const chartTitle = t('workout.exercise.chartTitle');
  const chartText = describe(
    chartTitle,
    history.map((h) => h.best.weightKg),
    (v) => text.weight(v),
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <ExerciseGlyph equipment={exercise.equipment} size={72} />
        <View style={styles.grow}>
          <Text variant="h1">{text.exercise(exercise)}</Text>
          <Text variant="small" color="secondary">
            {text.muscle(exercise.muscle)} · {text.equipment(exercise.equipment)}
          </Text>
        </View>
      </View>

      {history.length === 0 ? (
        <Card>
          <EmptyState
            icon={Dumbbell}
            title={t('workout.exercise.emptyTitle')}
            body={t('workout.exercise.emptyBody')}
          />
        </Card>
      ) : (
        <>
          <View style={styles.grid}>
            <Card style={styles.stat}>
              <Text variant="caption" color="secondary">
                {t('workout.exercise.heaviest')}
              </Text>
              <Text variant="title">{record ? text.weightReps(record) : ''}</Text>
            </Card>
            <Card style={styles.stat}>
              <Text variant="caption" color="secondary">
                {t('workout.exercise.lastTime')}
              </Text>
              <Text variant="title">{lastSession ? text.weightReps(lastSession.best) : ''}</Text>
            </Card>
          </View>

          {history.length > 1 && chartText ? (
            <Card style={styles.chartCard}>
              <Text variant="title">{chartTitle}</Text>
              <Text variant="small" color="secondary">
                {chartText.trend}
              </Text>
              <LineChart
                height={150}
                points={history.map((h) => ({ time: h.time, value: h.best.weightKg }))}
                formatAxis={(v) => format.number(v, 1)}
                formatValue={(v) => text.weight(v)}
                formatDate={(time) => format.dayMonth(new Date(time))}
                summaryLabel={chartText.label}
              />
              <Text variant="caption" color="muted">
                {chartText.summary}
              </Text>
            </Card>
          ) : null}

          {lastSession ? (
            <View style={styles.section}>
              <Text variant="title">{t('workout.exercise.history')}</Text>
              {lastSession.sets.map((set: LoggedSet, i) => (
                <View
                  key={`${i}-${set.weightKg}-${set.reps}`}
                  style={[
                    styles.setRow,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Text variant="small" color="secondary">
                    {t('workout.session.setN', {
                      current: format.number(i + 1),
                      total: format.number(lastSession.sets.length),
                    })}
                  </Text>
                  <Text variant="bodyStrong">{text.weightReps(set)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
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
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1, gap: spacing.xxs },
  grid: { flexDirection: 'row', gap: spacing.xs },
  stat: { flex: 1, gap: spacing.xxs },
  chartCard: { gap: spacing.xs },
  section: { gap: spacing.xs },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    minHeight: layout.minTouchTarget,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
