import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Flame } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import {
  classRepository,
  memberRepository,
  onBookingsChanged,
  onWorkoutChanged,
  progressRepository,
  workoutPlanRepository,
  workoutSessionRepository,
} from '@/data/repository';
import type { ClassSessionView, Member, WorkoutPlan } from '@/data/types';
import { useBookingActions, type ActionHandlers } from '@/features/classes/useBookingActions';
import { ResumeBanner } from '@/features/workout/ResumeBanner';
import { useStartSession } from '@/features/workout/useStartSession';
import { useLanguage } from '@/i18n';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { radius, spacing, useTheme } from '@/theme';

import { NextClassCard } from './NextClassCard';
import { QuickActions } from './QuickActions';
import { TodayPlanCard } from './TodayPlanCard';

interface HomeData {
  member: Member;
  plan: WorkoutPlan | null;
  upcoming: ClassSessionView[];
  streak: number;
  hasActiveSession: boolean;
}

async function loadHome(): Promise<HomeData> {
  const [member, plan, upcoming, streak, active] = await Promise.all([
    memberRepository.get(),
    workoutPlanRepository.getForToday(),
    classRepository.listUpcomingBooked(),
    progressRepository.getStreak(),
    workoutSessionRepository.getActive(),
  ]);
  return { member, plan, upcoming, streak, hasActiveSession: active !== null };
}

function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');
}

export function HomeScreen() {
  const { state, reload, refresh } = useAsyncResource(loadHome);

  useEffect(() => onBookingsChanged(refresh), [refresh]);
  useEffect(() => onWorkoutChanged(refresh), [refresh]);

  return (
    <Screen scroll withTabBar>
      <DemoBadge />
      {state.status === 'loading' ? <HomeSkeleton /> : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <HomeContent data={state.data} /> : null}
    </Screen>
  );
}

function HomeContent({ data }: { data: HomeData }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const language = useLanguage();
  const format = useFormat();
  const actions = useBookingActions();
  const workout = useStartSession();
  const [hidden, setHidden] = useState<readonly string[]>([]);

  const name = data.member.name[language];
  const next = data.upcoming.find((v) => !hidden.includes(v.id)) ?? null;

  // A cancelled class stays hidden until fresh data arrives; undo or an error brings it back.
  const handlers: ActionHandlers = {
    onOptimistic: (view) => setHidden((h) => [...h, view.id]),
    onSettled: (view) => {
      if (view.slot === 'booked') setHidden((h) => h.filter((id) => id !== view.id));
    },
  };

  const openDetails = useCallback(
    (sessionId: string) => router.push({ pathname: '/class/[sessionId]', params: { sessionId } }),
    [router],
  );
  const goClasses = useCallback(() => router.navigate('/classes'), [router]);
  const goWorkout = useCallback(() => router.navigate('/workout'), [router]);
  const startToday = useCallback(() => {
    if (data.hasActiveSession) router.push('/session');
    else if (data.plan) void workout.start(data.plan.id);
  }, [data.hasActiveSession, data.plan, router, workout]);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.grow}>
          <Text variant="body" color="secondary">
            {t(`home.greeting.${greetingKey(new Date().getHours())}`)}
          </Text>
          <Text variant="h1" numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]} aria-hidden>
          <Text variant="h2" color="onAccent">
            {initials(name)}
          </Text>
        </View>
      </View>

      <Card style={styles.streak}>
        <View style={[styles.streakIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon icon={Flame} size={28} color="accentText" />
        </View>
        <View style={styles.grow}>
          <Text variant="caption" color="secondary">
            {t('home.streakTitle')}
          </Text>
          <Text variant="title">
            {t('home.streakDays', {
              count: data.streak,
              countText: format.number(data.streak),
            })}
          </Text>
          <Text variant="small" color="muted">
            {t('home.streakHint')}
          </Text>
        </View>
      </Card>

      <ResumeBanner />

      <TodayPlanCard
        plan={data.plan}
        resume={data.hasActiveSession}
        busy={workout.busy}
        onStart={startToday}
        onBrowseClasses={goClasses}
      />

      <NextClassCard
        next={next}
        busy={actions.busy}
        onDetails={openDetails}
        onCancel={(view) => void actions.run('cancel', view, handlers)}
        onBook={goClasses}
      />

      <QuickActions onBookClass={goClasses} onStartWorkout={goWorkout} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.grow}>
          <Skeleton width={96} height={18} />
          <Skeleton width={200} height={36} />
        </View>
        <Skeleton width={56} height={56} rounded={radius.pill} />
      </View>
      <Skeleton height={104} rounded={radius.xl} />
      <Skeleton height={168} rounded={radius.xl} />
      <Skeleton height={196} rounded={radius.xl} />
      <Skeleton height={120} rounded={radius.xl} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  grow: { flex: 1, gap: spacing.xxs },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
