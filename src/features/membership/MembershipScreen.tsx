import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Check, Info, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { pricePerMonth, renewalStart, savingsVersusMonthly } from '@/data/rules/membership';
import type { MembershipPlan } from '@/data/types';
import { ltrIsolate, useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { layout, radius, spacing, useTheme } from '@/theme';

import { phaseLabel } from './phaseLabel';
import { useMembership, type MembershipData } from './useMembership';

export function MembershipScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload } = useMembership();

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  }

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.topTitle} numberOfLines={1} accessibilityRole="header">
          {t('membership.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('membership.close')}
          onPress={close}
          style={styles.close}
        >
          <Icon icon={X} size={24} />
        </Pressable>
      </View>
      {state.status === 'loading' ? (
        <View style={styles.content}>
          <Skeleton height={220} rounded={radius.xl} />
          <Skeleton height={110} rounded={radius.xl} />
          <Skeleton height={110} rounded={radius.xl} />
        </View>
      ) : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <Body data={state.data} /> : null}
    </Screen>
  );
}

function Body({ data }: { data: MembershipData }) {
  const { t } = useTranslation();
  const router = useRouter();
  const format = useFormat();
  const insets = useSafeAreaInsets();
  const { view, plans, plan } = data;
  const [selectedId, setSelectedId] = useState(view.membership.planId);
  const selected = plans.find((p) => p.id === selectedId) ?? plans[0];
  const expired = view.phase === 'expired';
  const now = new Date();
  const startsOn = renewalStart(view.membership, now);

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StatusCard data={data} />

        {expired || view.phase === 'expiring' ? (
          <Card style={styles.notice}>
            <Icon icon={Info} size={20} color={expired ? 'danger' : 'warning'} />
            <View style={styles.grow}>
              {expired ? <Text variant="bodyStrong">{t('membership.expiredTitle')}</Text> : null}
              <Text variant="small" color="secondary">
                {expired ? t('membership.expiredBody') : t('membership.expiringBody')}
              </Text>
            </View>
          </Card>
        ) : null}

        {plan ? (
          <Card style={styles.section}>
            <Text variant="title">{t('membership.perks')}</Text>
            {plan.perks.map((perk) => (
              <View key={perk.en} style={styles.perk}>
                <Icon icon={Check} size={18} color="success" />
                <Text variant="body" style={styles.grow}>
                  {perk[format.language]}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={styles.section}>
          <Text variant="title">{t('membership.renewTitle')}</Text>
          <Text variant="small" color="secondary">
            {t(expired ? 'membership.renewHintExpired' : 'membership.renewHint', {
              date: format.date(startsOn.toISOString()),
            })}
          </Text>
          <View role="radiogroup" aria-label={t('membership.renewTitle')} style={styles.plans}>
            {plans.map((p) => (
              <PlanOption
                key={p.id}
                plan={p}
                plans={plans}
                selected={p.id === selected?.id}
                current={p.id === view.membership.planId}
                onSelect={() => {
                  haptics.select();
                  setSelectedId(p.id);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {selected ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button
            label={t(expired ? 'membership.renewCtaExpired' : 'membership.renewCta', {
              name: selected.name[format.language],
            })}
            onPress={() =>
              router.push({ pathname: '/membership/checkout', params: { planId: selected.id } })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function StatusCard({ data }: { data: MembershipData }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const { view, plan } = data;
  const { membership, phase, daysLeft } = view;
  const tone =
    phase === 'active' ? colors.success : phase === 'expiring' ? colors.warning : colors.danger;
  const percent = Math.round(view.usedFraction * 100);

  return (
    <Card style={styles.status}>
      <View style={styles.statusHead}>
        <Text variant="h2" style={styles.grow} numberOfLines={2}>
          {t('membership.planName', { name: plan?.name[format.language] ?? '' })}
        </Text>
        <View style={[styles.chip, { borderColor: tone }]}>
          <View style={[styles.dot, { backgroundColor: tone }]} aria-hidden />
          <Text variant="caption" style={{ color: tone }}>
            {phaseLabel(t, phase)}
          </Text>
        </View>
      </View>

      {phase === 'expired' ? (
        <Text variant="body" color="secondary">
          {t('membership.endedOn', { date: format.date(membership.endDate) })}
        </Text>
      ) : (
        <View style={styles.daysRow}>
          <Text
            variant="display"
            color="accent"
            aria-label={`${t('membership.daysLeft')}: ${daysLeft}`}
          >
            {format.number(daysLeft)}
          </Text>
          <Text variant="body" color="secondary">
            {t('membership.daysLeft')}
          </Text>
        </View>
      )}

      <View
        role="progressbar"
        aria-label={t('membership.usedLabel', { percent: format.number(percent) })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
      >
        <View style={[styles.fillBar, { width: `${percent}%`, backgroundColor: tone }]} />
      </View>

      <View style={styles.metaRow}>
        <Text variant="small" color="secondary">
          {t('membership.period', {
            start: format.date(membership.startDate, { day: 'numeric', month: 'short' }),
            end: format.date(membership.endDate),
          })}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text variant="caption" color="muted">
          {t('membership.memberCode')}
        </Text>
        <Text variant="caption" color="secondary">
          {ltrIsolate(membership.memberCode)}
        </Text>
      </View>
    </Card>
  );
}

interface PlanOptionProps {
  plan: MembershipPlan;
  plans: MembershipPlan[];
  selected: boolean;
  current: boolean;
  onSelect: () => void;
}

function PlanOption({ plan, plans, selected, current, onSelect }: PlanOptionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const savings = savingsVersusMonthly(plan, plans);
  const name = plan.name[format.language];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${t('membership.selectPlan', { name })}, ${format.currency(plan.priceEgp)}`}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          borderColor: selected ? colors.accentText : colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.optionHead}>
        <View
          style={[styles.radio, { borderColor: selected ? colors.accentText : colors.textMuted }]}
        >
          {selected ? (
            <View style={[styles.radioDot, { backgroundColor: colors.accentText }]} />
          ) : null}
        </View>
        <Text variant="title" style={styles.grow}>
          {name}
        </Text>
        {plan.highlighted ? (
          <View style={[styles.tag, { backgroundColor: colors.accent }]}>
            <Text variant="caption" color="onAccent">
              {t('membership.bestValue')}
            </Text>
          </View>
        ) : current ? (
          <View style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}>
            <Text variant="caption" color="secondary">
              {t('membership.current_tag')}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.optionPrice}>
        <Text variant="h2">{format.currency(plan.priceEgp)}</Text>
        <Text variant="small" color="secondary">
          {t('units.months', {
            count: plan.periodMonths,
            countText: format.number(plan.periodMonths),
          })}
          {plan.periodMonths > 1
            ? ` · ${t('membership.perMonth', { price: format.currency(pricePerMonth(plan)) })}`
            : ''}
        </Text>
      </View>
      {savings > 0 ? (
        <Text variant="caption" color="success">
          {t('membership.save', { amount: format.currency(savings) })}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xs,
  },
  topTitle: { flex: 1 },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: layout.screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  status: { gap: spacing.sm },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  daysRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fillBar: { height: 8, borderRadius: radius.pill },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  section: { gap: spacing.sm },
  perk: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  plans: { gap: spacing.sm },
  option: { borderRadius: radius.xl, borderWidth: 1.5, padding: spacing.md, gap: spacing.xs },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionPrice: { gap: spacing.xxs },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill },
  tag: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.pill },
  bar: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm },
});
