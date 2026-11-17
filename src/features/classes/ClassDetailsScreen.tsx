import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CalendarDays, Check, Clock, MapPin, Timer, Users, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { BookingError, classRepository } from '@/data/repository';
import type { ClassSessionView } from '@/data/types';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

import { BookingSuccessSheet } from './BookingSuccessSheet';
import { StateBadge } from './StateBadge';
import { useBookingActions, type ActionHandlers } from './useBookingActions';
import { useClassText } from './useClassText';

const ACTION_BAR_HEIGHT = 152;

export function ClassDetailsScreen({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload } = useAsyncResource(() => classRepository.getSession(sessionId));
  const [override, setOverride] = useState<ClassSessionView | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const actions = useBookingActions(ACTION_BAR_HEIGHT - insets.bottom);

  const view = override ?? (state.status === 'success' ? state.data : null);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/classes');
  }

  const handlers: ActionHandlers = {
    onOptimistic: setOverride,
    onSettled: setOverride,
    onBooked: () => setSuccessOpen(true),
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.topTitle} numberOfLines={1}>
          {t('details.title')}
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

      {state.status === 'loading' ? <DetailsSkeleton /> : null}
      {state.status === 'error' ? (
        state.error instanceof BookingError && state.error.code === 'not_found' ? (
          <EmptyState
            icon={CalendarDays}
            title={t('details.notFound.title')}
            body={t('details.notFound.body')}
            actionLabel={t('details.notFound.cta')}
            onAction={close}
          />
        ) : (
          <ErrorState onRetry={reload} />
        )
      ) : null}

      {view ? (
        <>
          <DetailsBody view={view} />
          <ActionBar
            view={view}
            busy={actions.busy}
            onBook={() => void actions.run('book', view, handlers)}
            onCancel={() => void actions.run('cancel', view, handlers)}
            onJoin={() => void actions.run('joinWaitlist', view, handlers)}
            onLeave={() => void actions.run('leaveWaitlist', view, handlers)}
          />
          <BookingSuccessSheet
            visible={successOpen}
            view={view}
            onDone={() => setSuccessOpen(false)}
            onUndo={() => {
              setSuccessOpen(false);
              void actions.undoBooking(view.id, handlers);
            }}
          />
        </>
      ) : null}
    </Screen>
  );
}

function DetailsBody({ view }: { view: ClassSessionView }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const text = useClassText();
  const format = useFormat();
  const fill = view.capacity === 0 ? 0 : Math.min(1, view.bookedCount / view.capacity);
  const initials = text
    .trainer(view)
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: ACTION_BAR_HEIGHT + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <StateBadge slot={view.slot} />
        <Text variant="h1">{text.name(view)}</Text>
        <Text variant="body" color="secondary">
          {text.category(view.category)} · {text.level(view.level)}
        </Text>
      </View>

      <Card style={styles.facts}>
        <Fact icon={Clock} label={t('details.when')} value={text.fullWhen(view)} />
        <Fact icon={Timer} label={t('details.duration')} value={text.minutes(view.durationMin)} />
        <Fact icon={MapPin} label={t('details.room')} value={text.room(view)} />
      </Card>

      <Card style={styles.capacity}>
        <Text variant="title">{t('details.capacity')}</Text>
        <Text variant="body" color="secondary">
          {t('details.capacityValue', {
            bookedText: format.number(view.bookedCount),
            capacityText: format.number(view.capacity),
          })}
        </Text>
        <View
          role="progressbar"
          aria-valuenow={view.bookedCount}
          aria-valuemin={0}
          aria-valuemax={view.capacity}
          style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
        >
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.accent, width: `${Math.round(fill * 100)}%` },
            ]}
          />
        </View>
        <View style={styles.counts}>
          <Icon icon={Users} size={18} color="textSecondary" />
          <Text variant="small" color="secondary">
            {t('details.onList')}: {text.members(view.bookedCount)}
          </Text>
        </View>
        {view.waitlistCount > 0 ? (
          <Text variant="small" color="secondary">
            {t('details.waiting')}: {text.members(view.waitlistCount)}
          </Text>
        ) : null}
      </Card>

      <Card style={styles.trainer}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]} aria-hidden>
          <Text variant="h2" color="onAccent">
            {initials}
          </Text>
        </View>
        <View style={styles.trainerText}>
          <Text variant="caption" color="muted">
            {t('details.trainer')}
          </Text>
          <Text variant="title">{text.trainer(view)}</Text>
          <Text variant="small" color="secondary">
            {view.trainer.specialty[format.language]} ·{' '}
            {t('details.yearsExperience', { years: text.years(view.trainer.yearsExperience) })}
          </Text>
        </View>
      </Card>

      <View style={styles.section}>
        <Text variant="title">{t('details.about')}</Text>
        <Text variant="body" color="secondary">
          {view.description[format.language]}
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="title">{t('details.requirements')}</Text>
        {view.requirements.map((req) => (
          <View key={req.en} style={styles.req}>
            <Icon icon={Check} size={18} color="accentText" strokeWidth={3} />
            <Text variant="body" color="secondary" style={styles.reqText}>
              {req[format.language]}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Fact({ icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <View style={[styles.factIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon icon={icon} size={20} color="accentText" />
      </View>
      <View style={styles.factText}>
        <Text variant="caption" color="muted">
          {label}
        </Text>
        <Text variant="bodyStrong">{value}</Text>
      </View>
    </View>
  );
}

interface ActionBarProps {
  view: ClassSessionView;
  busy: boolean;
  onBook: () => void;
  onCancel: () => void;
  onJoin: () => void;
  onLeave: () => void;
}

function ActionBar({ view, busy, onBook, onCancel, onJoin, onLeave }: ActionBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const format = useFormat();

  let note: string;
  let button: React.ReactNode;
  switch (view.slot) {
    case 'open':
      note = t('details.note.open');
      button = <Button label={t('details.action.book')} onPress={onBook} loading={busy} />;
      break;
    case 'full':
      note = t('details.note.full');
      button = <Button label={t('details.action.joinWaitlist')} onPress={onJoin} loading={busy} />;
      break;
    case 'booked':
      note = view.canCancel ? t('details.note.booked') : t('details.note.bookedLocked');
      button = (
        <Button
          label={t('details.action.cancel')}
          onPress={onCancel}
          variant="danger"
          loading={busy}
          disabled={!view.canCancel}
        />
      );
      break;
    case 'waitlisted':
      note = `${t('classes.row.position', {
        positionText: format.number(view.waitlistPosition ?? 0),
      })}. ${t('details.note.waitlisted')}`;
      button = (
        <Button
          label={t('details.action.leaveWaitlist')}
          onPress={onLeave}
          variant="secondary"
          loading={busy}
        />
      );
      break;
    case 'ended':
      note = t('details.note.ended');
      button = <Button label={t('details.action.ended')} onPress={onBook} disabled />;
      break;
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      <Text variant="small" color="secondary">
        {note}
      </Text>
      {button}
    </View>
  );
}

function DetailsSkeleton() {
  return (
    <View style={styles.content}>
      <Skeleton width={96} height={26} rounded={radius.pill} />
      <Skeleton width="70%" height={40} />
      <Skeleton height={150} rounded={radius.xl} />
      <Skeleton height={140} rounded={radius.xl} />
      <Skeleton height={96} rounded={radius.xl} />
    </View>
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
  content: { padding: spacing.md, gap: spacing.md },
  hero: { gap: spacing.xs, alignItems: 'flex-start' },
  facts: { gap: spacing.md },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  factIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factText: { flex: 1 },
  capacity: { gap: spacing.xs },
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden', marginVertical: spacing.xxs },
  fill: { height: '100%', borderRadius: radius.pill },
  counts: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trainerText: { flex: 1 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: spacing.xs },
  req: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reqText: { flex: 1 },
  bar: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
});
