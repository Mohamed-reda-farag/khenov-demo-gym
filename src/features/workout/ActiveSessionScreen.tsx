import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Check, ChevronLeft, ChevronRight, Dumbbell, List, Undo2, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import {
  exerciseRepository,
  progressRepository,
  workoutSessionRepository,
} from '@/data/repository';
import {
  addSet,
  adjustRest,
  clearRest,
  completedSets,
  goTo,
  isSessionComplete,
  logSet,
  pauseRest,
  resumeRest,
  skipSet,
  totalTargetSets,
  undoLastSet,
} from '@/data/rules/activeSession';
import { lastPerformance } from '@/data/rules/workout';
import type { ActiveSession, BestSet, Exercise, LoggedSet } from '@/data/types';
import { useLanguage } from '@/i18n';
import { useDirection } from '@/i18n/direction';
import { errorMessage } from '@/lib/errorText';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

import { ElapsedTime } from './ElapsedTime';
import { ExerciseGlyph } from './ExerciseGlyph';
import { RestTimerPanel } from './RestTimerPanel';
import { SetLogger } from './SetLogger';
import { ExerciseListSheet, QuitSheet } from './SessionSheets';
import { useActiveSession } from './useActiveSession';
import { useWorkoutText } from './useWorkoutText';

async function load() {
  const [active, exercises, sessions] = await Promise.all([
    workoutSessionRepository.getActive(),
    exerciseRepository.list(),
    progressRepository.listSessions(),
  ]);
  return {
    active,
    library: new Map(exercises.map((e) => [e.id, e])),
    last: lastPerformance(sessions),
  };
}

const SWIPE_DISTANCE = 70;

export function ActiveSessionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload } = useAsyncResource(load);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/workout');
  };

  return (
    <Screen padded={false}>
      {state.status === 'loading' ? (
        <View style={styles.padded}>
          <Skeleton height={48} rounded={radius.lg} />
          <Skeleton height={180} rounded={radius.xl} />
          <Skeleton height={260} rounded={radius.xl} />
        </View>
      ) : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' && !state.data.active ? (
        <EmptyState
          icon={Dumbbell}
          title={t('workout.session.emptyTitle')}
          body={t('workout.session.emptyBody')}
          actionLabel={t('workout.session.emptyCta')}
          onAction={leave}
        />
      ) : null}
      {state.status === 'success' && state.data.active ? (
        <SessionBody
          initial={state.data.active}
          library={state.data.library}
          last={state.data.last}
          onLeave={leave}
        />
      ) : null}
    </Screen>
  );
}

interface BodyProps {
  initial: ActiveSession;
  library: Map<string, Exercise>;
  last: Map<string, BestSet>;
  onLeave: () => void;
}

function SessionBody({ initial, library, last, onLeave }: BodyProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const format = useFormat();
  const text = useWorkoutText();
  const language = useLanguage();
  const { sign } = useDirection();
  const insets = useSafeAreaInsets();
  const { session, apply, getLatest } = useActiveSession(initial);
  const [quitOpen, setQuitOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = session.exercises[session.currentIndex];
  const exercise = current ? library.get(current.exerciseId) : undefined;
  const complete = isSessionComplete(session);
  const exerciseDone = current ? current.sets.length >= current.targetSets : false;
  const isLast = session.currentIndex === session.exercises.length - 1;
  const doneSets = completedSets(session);
  const totalSets = totalTargetSets(session);

  // Android back opens the exit sheet instead of leaving a half finished session.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setQuitOpen(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  const run = useCallback(
    (change: (s: ActiveSession, nowMs: number) => ActiveSession): boolean => {
      try {
        apply(change);
        return true;
      } catch (error) {
        toast.show({ tone: 'error', message: errorMessage(t, error) });
        return false;
      }
    },
    [apply, t, toast],
  );

  const move = useCallback(
    (delta: number) => {
      haptics.select();
      run((s) => goTo(s, s.currentIndex + delta));
    },
    [run],
  );

  /** After finishing an exercise: the next one with sets left, wrapping around to the start. */
  const jumpToNextIncomplete = () => {
    const open = session.exercises
      .map((e, i) => (e.sets.length < e.targetSets ? i : -1))
      .filter((i) => i >= 0);
    const target = open.find((i) => i > session.currentIndex) ?? open[0];
    haptics.select();
    if (target !== undefined) run((s) => goTo(s, target));
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-14, 14])
    .onEnd((event) => {
      const along = event.translationX * sign;
      if (along < -SWIPE_DISTANCE) scheduleOnRN(move, 1);
      else if (along > SWIPE_DISTANCE) scheduleOnRN(move, -1);
    });

  async function finish() {
    setBusy(true);
    try {
      const result = await workoutSessionRepository.finish(getLatest());
      haptics.success();
      if (result.newlyUnlocked.length > 0) {
        toast.show({
          tone: 'success',
          message: t('toast.achievement', {
            title: result.newlyUnlocked
              .map((a) => a.title[language])
              .join(language === 'ar' ? '، ' : ', '),
          }),
          durationMs: 6500,
          bottomOffset: spacing.lg,
        });
      }
      router.replace({
        pathname: '/summary/[sessionId]',
        params: { sessionId: result.session.id, fresh: '1' },
      });
    } catch (error) {
      toast.show({ tone: 'error', message: errorMessage(t, error) });
      setBusy(false);
    }
  }

  async function discard() {
    setBusy(true);
    await workoutSessionRepository.discardActive();
    onLeave();
  }

  const onComplete = (set: LoggedSet) => {
    if (run((s, now) => logSet(s, set, now))) haptics.success();
  };

  const rest = session.rest;
  const loggedChips = useMemo(() => current?.sets ?? [], [current]);

  if (!current || !exercise) return null;

  const lastTime = last.get(current.exerciseId);
  const remainingSets = Math.max(0, current.targetSets - current.sets.length);

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { borderColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.session.close')}
          onPress={() => setQuitOpen(true)}
          style={styles.iconButton}
        >
          <Icon icon={X} size={24} />
        </Pressable>
        <View style={styles.topCenter}>
          <ElapsedTime session={session} />
          <Text variant="caption" color="muted">
            {t('workout.session.progress', {
              done: format.number(doneSets),
              total: format.number(totalSets),
            })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.session.listLabel')}
          onPress={() => setListOpen(true)}
          style={styles.iconButton}
        >
          <Icon icon={List} size={24} />
        </Pressable>
      </View>

      <GestureDetector gesture={pan}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('workout.session.previous')}
              accessibilityState={{ disabled: session.currentIndex === 0 }}
              disabled={session.currentIndex === 0}
              onPress={() => move(-1)}
              style={[styles.iconButton, { opacity: session.currentIndex === 0 ? 0.35 : 1 }]}
            >
              <Icon icon={ChevronLeft} size={24} directional />
            </Pressable>
            <Text variant="small" color="secondary" align="center" style={styles.navLabel}>
              {t('workout.session.exerciseOf', {
                current: format.number(session.currentIndex + 1),
                total: format.number(session.exercises.length),
              })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('workout.session.next')}
              accessibilityState={{ disabled: isLast }}
              disabled={isLast}
              onPress={() => move(1)}
              style={[styles.iconButton, { opacity: isLast ? 0.35 : 1 }]}
            >
              <Icon icon={ChevronRight} size={24} directional />
            </Pressable>
          </View>

          <View style={styles.hero}>
            <ExerciseGlyph equipment={exercise.equipment} size={72} />
            <View style={styles.grow}>
              <Text variant="h1" numberOfLines={2}>
                {text.exercise(exercise)}
              </Text>
              <Text variant="small" color="secondary">
                {text.muscle(exercise.muscle)} · {text.equipment(exercise.equipment)}
              </Text>
            </View>
          </View>

          <Card style={styles.targetCard}>
            <Text variant="bodyStrong">
              {t('workout.session.target', {
                sets: format.number(current.targetSets),
                reps: format.number(current.targetReps),
              })}
            </Text>
            <Text variant="small" color="secondary">
              {lastTime
                ? t('workout.session.last', {
                    weight: text.weight(lastTime.weightKg),
                    reps: format.number(lastTime.reps),
                  })
                : t('workout.session.noLast')}
            </Text>
            {loggedChips.length > 0 ? (
              <View style={styles.chips} role="group" aria-label={t('workout.session.loggedSets')}>
                {loggedChips.map((set, i) => (
                  <View
                    key={`${i}-${set.weightKg}-${set.reps}`}
                    accessible
                    accessibilityLabel={t('workout.session.setChip', {
                      number: format.number(i + 1),
                      weight: text.weight(set.weightKg),
                      reps: format.number(set.reps),
                    })}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.accentSoft, borderColor: colors.accent },
                    ]}
                  >
                    <Icon icon={Check} size={14} color="accentText" strokeWidth={3} />
                    <Text variant="caption" color="accent">
                      {text.weightReps(set)}
                    </Text>
                  </View>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('workout.session.setUndone')}
                  onPress={() => run((s) => undoLastSet(s))}
                  style={styles.undo}
                >
                  <Icon icon={Undo2} size={20} color="textSecondary" />
                </Pressable>
              </View>
            ) : null}
          </Card>

          {rest ? (
            <RestTimerPanel
              key={`${doneSets}-${session.currentIndex}`}
              timer={rest}
              onAdjust={(delta) => run((s, now) => adjustRest(s, delta, now))}
              onPause={() => run((s, now) => pauseRest(s, now))}
              onResume={() => run((s, now) => resumeRest(s, now))}
              onSkip={() => run((s) => clearRest(s))}
            />
          ) : null}
        </ScrollView>
      </GestureDetector>

      <View
        style={[
          styles.controls,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        {exerciseDone ? (
          <View style={styles.doneBlock}>
            <View style={styles.doneRow}>
              <Icon icon={Check} size={22} color="success" strokeWidth={3} />
              <Text variant="bodyStrong" color="success">
                {t('workout.session.allDone')}
              </Text>
            </View>
            {complete ? (
              <Button
                label={t('workout.session.finish')}
                onPress={() => void finish()}
                loading={busy}
              />
            ) : (
              <Button label={t('workout.session.next')} onPress={jumpToNextIncomplete} />
            )}
            <Button
              label={t('workout.session.addSet')}
              onPress={() => run((s) => addSet(s))}
              variant="secondary"
            />
          </View>
        ) : (
          <SetLogger
            key={`${session.currentIndex}:${current.sets.length}:${remainingSets}`}
            exercise={current}
            last={lastTime}
            onComplete={onComplete}
            onAddSet={() => run((s) => addSet(s))}
            onSkipSet={() => run((s) => skipSet(s))}
          />
        )}
      </View>

      <ExerciseListSheet
        visible={listOpen}
        exercises={session.exercises}
        library={library}
        currentIndex={session.currentIndex}
        onSelect={(index) => {
          setListOpen(false);
          run((s) => goTo(s, index));
        }}
        onClose={() => setListOpen(false)}
      />
      <QuitSheet
        visible={quitOpen}
        hasSets={doneSets > 0}
        busy={busy}
        onSave={() => void finish()}
        onDiscard={() => void discard()}
        onContinue={() => setQuitOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { padding: spacing.md, gap: spacing.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    minHeight: layout.minTouchTarget + spacing.sm,
    borderBottomWidth: 1,
  },
  topCenter: { flex: 1, alignItems: 'center' },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: { padding: spacing.md, gap: spacing.md },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  navLabel: { flex: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1, gap: spacing.xxs },
  targetCard: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  undo: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  doneBlock: { gap: spacing.sm },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
