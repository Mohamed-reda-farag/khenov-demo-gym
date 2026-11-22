import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Ban, Check, Lock, LogIn, ScanLine, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { QrCode } from '@/components/ui/QrCode';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import {
  memberRepository,
  membershipRepository,
  onMembershipChanged,
  onProfileChanged,
  visitRepository,
  VisitError,
} from '@/data/repository';
import { describeMembership } from '@/data/rules/membership';
import { passPayload, visitStats } from '@/data/rules/visits';
import { errorMessage } from '@/lib/errorText';
import { ltrIsolate, useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, qr, radius, spacing, useTheme } from '@/theme';
import { phaseLabel } from '@/features/membership/phaseLabel';

const QR_SIZE = 224;
const VISITS_SHOWN = 8;

async function load() {
  const [member, membership, plans, visits] = await Promise.all([
    memberRepository.get(),
    membershipRepository.getCurrent(),
    membershipRepository.listPlans(),
    visitRepository.list(),
  ]);
  return {
    member,
    view: describeMembership(membership, new Date()),
    plan: plans.find((p) => p.id === membership.planId),
    visits,
  };
}

type PassData = Awaited<ReturnType<typeof load>>;

export function PassScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload, refresh } = useAsyncResource(load);

  useEffect(() => onMembershipChanged(refresh), [refresh]);
  useEffect(() => onProfileChanged(refresh), [refresh]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.grow} numberOfLines={1} accessibilityRole="header">
          {t('pass.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('pass.close')}
          onPress={close}
          style={styles.close}
        >
          <Icon icon={X} size={24} />
        </Pressable>
      </View>
      {state.status === 'loading' ? (
        <View style={styles.content}>
          <Skeleton height={400} rounded={radius.xl} />
          <Skeleton height={140} rounded={radius.xl} />
          <Skeleton height={88} rounded={radius.xl} />
        </View>
      ) : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <PassBody data={state.data} onChanged={refresh} /> : null}
    </Screen>
  );
}

function PassBody({ data, onChanged }: { data: PassData; onChanged: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const { member, view, plan, visits } = data;
  const expired = view.phase === 'expired';
  const name = member.name[format.language];
  const now = new Date();
  const payload = useMemo(
    () => passPayload(view.membership.memberCode, new Date()),
    [view.membership.memberCode],
  );
  const stats = visitStats(visits, now);

  async function scan() {
    setScanning(true);
    try {
      const visit = await visitRepository.recordScan();
      haptics.success();
      toast.show({ message: t('pass.scanned', { time: format.time(visit.at) }), tone: 'success' });
      onChanged();
    } catch (error) {
      haptics.warning();
      const duplicate = error instanceof VisitError && error.code === 'duplicate_scan' && error.at;
      toast.show({
        message: duplicate
          ? t('pass.duplicate', { time: format.time(error.at as string) })
          : errorMessage(t, error),
        tone: duplicate ? 'info' : 'error',
      });
    } finally {
      setScanning(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.pass, { backgroundColor: colors.accent }]}>
        <View style={styles.passHead}>
          <View style={styles.grow}>
            <Text variant="caption" color="onAccent">
              {t('app.name')}
            </Text>
            <Text variant="h2" color="onAccent" numberOfLines={2}>
              {name}
            </Text>
            <Text variant="small" color="onAccent">
              {t('membership.planName', { name: plan?.name[format.language] ?? '' })}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.onAccent }]}>
            <Icon icon={expired ? Ban : Check} size={16} color="accent" strokeWidth={3} />
            <Text variant="caption" color="accent">
              {phaseLabel(t, view.phase)}
            </Text>
          </View>
        </View>

        <View style={styles.panel}>
          {expired ? (
            <View style={styles.locked}>
              <Icon icon={Lock} size={40} color="textMuted" />
              <Text variant="title" align="center" style={{ color: qr.dark }}>
                {t('pass.expiredTitle')}
              </Text>
              <Text variant="small" align="center" style={{ color: qr.dark }}>
                {t('pass.expiredBody')}
              </Text>
            </View>
          ) : (
            <QrCode
              value={payload}
              size={QR_SIZE}
              label={t('pass.qrLabel', { name, code: view.membership.memberCode })}
            />
          )}
        </View>

        <View style={styles.passFoot}>
          <Text variant="bodyStrong" color="onAccent">
            {ltrIsolate(view.membership.memberCode)}
          </Text>
          <Text variant="caption" color="onAccent">
            {expired
              ? t('membership.endedOn', { date: format.date(view.membership.endDate) })
              : t('pass.validFor', { date: format.date(now.toISOString()) })}
          </Text>
          <Text variant="caption" color="onAccent">
            {t('pass.demoNote')}
          </Text>
        </View>
      </View>

      {expired ? (
        <Button label={t('pass.renew')} onPress={() => router.push('/membership')} />
      ) : null}

      <Card style={styles.section}>
        <View style={styles.titleRow}>
          <Icon icon={ScanLine} size={22} color="accentText" />
          <Text variant="title">{t('pass.simulateTitle')}</Text>
        </View>
        <Text variant="small" color="secondary">
          {t('pass.simulateBody')}
        </Text>
        <Button
          label={scanning ? t('pass.simulating') : t('pass.simulate')}
          loading={scanning}
          disabled={expired}
          onPress={() => void scan()}
        />
      </Card>

      <Card style={styles.section}>
        <Text variant="title">{t('pass.statsTitle')}</Text>
        <View style={styles.stats}>
          <Stat value={format.number(stats.last7Days)} label={t('pass.last7')} />
          <Stat value={format.number(stats.last30Days)} label={t('pass.last30')} />
          <Stat value={format.number(stats.perWeek, 1)} label={t('pass.perWeek')} />
        </View>
        <Text variant="small" color="secondary">
          {stats.lastAt
            ? t('pass.lastVisit', {
                when: `${format.dayMonth(new Date(stats.lastAt))} · ${format.time(stats.lastAt)}`,
              })
            : t('pass.noVisit')}
        </Text>
      </Card>

      <View style={styles.listHead}>
        <Text variant="title">{t('pass.recent')}</Text>
      </View>
      {visits.length === 0 ? (
        <EmptyState icon={LogIn} title={t('pass.emptyTitle')} body={t('pass.emptyBody')} />
      ) : (
        <Card style={styles.list}>
          {visits.slice(0, VISITS_SHOWN).map((visit, i) => {
            const at = new Date(visit.at);
            const day = `${format.weekday(at)} ${format.dayMonth(at)}`;
            return (
              <View
                key={visit.id}
                style={[
                  styles.visitRow,
                  i > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : null,
                ]}
                accessible
                accessibilityLabel={`${day}, ${format.time(visit.at)}, ${t(visit.source === 'scan' ? 'pass.sourceScan' : 'pass.sourceHistory')}`}
              >
                <View
                  style={[styles.visitIcon, { backgroundColor: colors.accentSoft }]}
                  aria-hidden
                >
                  <Icon icon={LogIn} size={18} color="accentText" />
                </View>
                <View style={styles.grow}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {day}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {t(visit.source === 'scan' ? 'pass.sourceScan' : 'pass.sourceHistory')}
                  </Text>
                </View>
                <Text variant="small" color="secondary">
                  {format.time(visit.at)}
                </Text>
              </View>
            );
          })}
          {visits.length > VISITS_SHOWN ? (
            <Text variant="caption" color="muted" style={styles.more}>
              {t('pass.showing', {
                shown: format.number(VISITS_SHOWN),
                total: format.number(visits.length),
              })}
            </Text>
          ) : null}
        </Card>
      )}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text variant="h2" color="accent">
        {value}
      </Text>
      <Text variant="caption" color="secondary" align="center">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xs,
  },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: layout.screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  pass: { borderRadius: radius.xl, padding: spacing.md, gap: spacing.md },
  passHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  panel: {
    alignSelf: 'center',
    backgroundColor: qr.light,
    borderRadius: radius.lg,
    padding: spacing.sm,
    minHeight: QR_SIZE + spacing.sm * 2,
    minWidth: QR_SIZE + spacing.sm * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: { alignItems: 'center', gap: spacing.xs, padding: spacing.md, maxWidth: QR_SIZE },
  passFoot: { alignItems: 'center', gap: spacing.xxs },
  section: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stats: { flexDirection: 'row', gap: spacing.xs },
  stat: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  listHead: { marginTop: spacing.xs },
  list: { paddingVertical: spacing.xxs },
  visitRow: {
    minHeight: layout.minTouchTarget + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  visitIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  more: { textAlign: 'center', paddingVertical: spacing.xs },
});
