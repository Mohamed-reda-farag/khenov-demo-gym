import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Bell, ChevronRight, CreditCard, Info, Pencil, RotateCcw } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { Toggle } from '@/components/ui/Toggle';
import {
  memberRepository,
  notificationRepository,
  onNotificationsChanged,
  onProfileChanged,
} from '@/data/repository';
import { initialsOf } from '@/data/rules/profile';
import type { Language, Member, NotificationSettings } from '@/data/types';
import { ltrIsolate, useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme, type ThemeMode } from '@/theme';

import { phaseLabel } from '@/features/membership/phaseLabel';
import { useMembership, type MembershipData } from '@/features/membership/useMembership';

import { useLanguageSwitch } from './useLanguageSwitch';
import { useResetDemo } from './useResetDemo';

export function ProfileScreen() {
  const { t } = useTranslation();
  const member = useAsyncResource(() => memberRepository.get());
  const membership = useMembership();
  const { refresh } = member;
  useEffect(() => onProfileChanged(refresh), [refresh]);

  return (
    <Screen scroll withTabBar>
      <Text variant="h1">{t('profile.title')}</Text>
      {member.state.status === 'loading' ? <Skeleton height={96} rounded={radius.xl} /> : null}
      {member.state.status === 'error' ? <ErrorState onRetry={member.reload} /> : null}
      {member.state.status === 'success' ? (
        <MemberCard
          member={member.state.data}
          plan={membership.state.status === 'success' ? membership.state.data : null}
        />
      ) : null}
      <MembershipLink state={membership.state} reload={membership.reload} />
      <NotificationsLink />
      <NotificationSettingsCard />
      <PreferencesCard />
      <AboutCard />
      <DemoCard />
    </Screen>
  );
}

function MemberCard({ member, plan }: { member: Member; plan: MembershipData | null }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();
  const name = member.name[format.language];

  return (
    <Card style={styles.memberRow}>
      <View style={[styles.avatar, { backgroundColor: colors.accent }]} aria-hidden>
        <Text variant="h2" color="onAccent">
          {initialsOf(member, format.language)}
        </Text>
      </View>
      <View style={styles.grow}>
        <Text variant="title" numberOfLines={1}>
          {name}
        </Text>
        {plan?.plan ? (
          <Text variant="small" color="accent" numberOfLines={1}>
            {t('membership.planName', { name: plan.plan.name[format.language] })}
          </Text>
        ) : null}
        <Text variant="small" color="secondary">
          {t('profile.memberSince', {
            date: format.date(member.joinedAt, { month: 'long', year: 'numeric' }),
          })}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.edit')}
        onPress={() => router.push('/edit-profile')}
        style={[styles.iconButton, { backgroundColor: colors.surfaceAlt }]}
      >
        <Icon icon={Pencil} size={20} />
      </Pressable>
    </Card>
  );
}

function MembershipLink({
  state,
  reload,
}: {
  state: ReturnType<typeof useMembership>['state'];
  reload: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();

  if (state.status === 'loading') return <Skeleton height={72} rounded={radius.xl} />;
  if (state.status === 'error') {
    return (
      <Card style={styles.section}>
        <Text variant="small" color="secondary">
          {t('membership.loadFailed')}
        </Text>
        <Button label={t('common.retry')} variant="secondary" onPress={reload} />
      </Card>
    );
  }
  const { view, plan } = state.data;
  const summary = t('profile.membershipOpen', {
    plan: plan?.name[format.language] ?? '',
    status: phaseLabel(t, view.phase),
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('profile.membership')}: ${summary}`}
      onPress={() => router.push('/membership')}
      style={({ pressed }) => [
        styles.link,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={[styles.linkIcon, { backgroundColor: colors.accentSoft }]} aria-hidden>
        <Icon icon={CreditCard} size={22} color="accentText" />
      </View>
      <View style={styles.grow}>
        <Text variant="title">{t('profile.membership')}</Text>
        <Text variant="small" color="secondary" numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <Icon icon={ChevronRight} size={20} color="textMuted" directional />
    </Pressable>
  );
}

function NotificationsLink() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();
  const { state, refresh } = useAsyncResource(() => notificationRepository.unreadCount());
  useEffect(() => onNotificationsChanged(refresh), [refresh]);
  const unread = state.status === 'success' ? state.data : 0;
  const summary =
    state.status === 'success'
      ? t('notifications.unread', { count: unread, countText: format.number(unread) })
      : t('profile.notificationsHint');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('profile.notifications')}: ${summary}`}
      onPress={() => router.push('/notifications')}
      style={({ pressed }) => [
        styles.link,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={[styles.linkIcon, { backgroundColor: colors.accentSoft }]} aria-hidden>
        <Icon icon={Bell} size={22} color="accentText" />
      </View>
      <View style={styles.grow}>
        <Text variant="title">{t('profile.notifications')}</Text>
        <Text variant="small" color="secondary" numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <Icon icon={ChevronRight} size={20} color="textMuted" directional />
    </Pressable>
  );
}

const SETTING_KEYS = ['classReminders', 'waitlist', 'achievements', 'payments'] as const;

function NotificationSettingsCard() {
  const { t } = useTranslation();
  const { state, reload } = useAsyncResource(() => notificationRepository.getSettings());

  return (
    <Card style={styles.section}>
      <Text variant="title">{t('profile.settingsTitle')}</Text>
      <Text variant="small" color="secondary">
        {t('profile.settingsNote')}
      </Text>
      {state.status === 'loading' ? (
        <View style={styles.section}>
          {SETTING_KEYS.map((key) => (
            <Skeleton key={key} height={48} rounded={radius.lg} />
          ))}
        </View>
      ) : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <SettingsToggles initial={state.data} /> : null}
    </Card>
  );
}

function SettingsToggles({ initial }: { initial: NotificationSettings }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [settings, setSettings] = useState(initial);

  async function change(key: keyof NotificationSettings, value: boolean) {
    setSettings((s) => ({ ...s, [key]: value }));
    try {
      await notificationRepository.setSetting(key, value);
    } catch {
      setSettings((s) => ({ ...s, [key]: !value }));
      toast.show({ message: t('profile.settingsFailed'), tone: 'error' });
    }
  }

  return (
    <View>
      {SETTING_KEYS.map((key) => (
        <Toggle
          key={key}
          label={t(`profile.${key}`)}
          stateLabel={t(settings[key] ? 'profile.on' : 'profile.off')}
          value={settings[key]}
          onValueChange={(value) => void change(key, value)}
        />
      ))}
    </View>
  );
}

function AboutCard() {
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <Card style={styles.section}>
      <View style={styles.hint}>
        <Icon icon={Info} size={20} color="accentText" />
        <Text variant="title">{t('profile.aboutTitle')}</Text>
      </View>
      <DemoBadge />
      <Text variant="small" color="secondary">
        {t('profile.aboutBody')}
      </Text>
      <Text variant="caption" color="muted">
        {t('profile.version', { version: ltrIsolate(version) })}
      </Text>
    </Card>
  );
}

function PreferencesCard() {
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();
  const lang = useLanguageSwitch();

  return (
    <Card style={styles.section}>
      <Text variant="title">{t('profile.preferences')}</Text>

      <View style={styles.field}>
        <Text variant="small" color="secondary">
          {t('profile.language')}
        </Text>
        <SegmentedControl<Language>
          accessibilityLabel={t('profile.language')}
          value={lang.language}
          onChange={(next) => void lang.request(next)}
          options={[
            { value: 'ar', label: t('profile.languageAr') },
            { value: 'en', label: t('profile.languageEn') },
          ]}
        />
      </View>

      <View style={styles.field}>
        <Text variant="small" color="secondary">
          {t('profile.theme')}
        </Text>
        <SegmentedControl<ThemeMode>
          accessibilityLabel={t('profile.theme')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'dark', label: t('profile.themeDark') },
            { value: 'light', label: t('profile.themeLight') },
          ]}
        />
      </View>
    </Card>
  );
}

function DemoCard() {
  const { t } = useTranslation();
  const reset = useResetDemo();

  return (
    <Card style={styles.section}>
      <DemoBadge />
      <Text variant="small" color="secondary">
        {t('profile.demoNote')}
      </Text>
      <Button label={t('profile.reset')} onPress={reset.open} variant="danger" />
      <View style={styles.hint}>
        <Icon icon={RotateCcw} size={16} color="textMuted" />
        <Text variant="caption" color="muted" style={styles.grow}>
          {t('profile.resetHint')}
        </Text>
      </View>
      <ConfirmSheet
        visible={reset.confirming}
        title={t('profile.resetConfirmTitle')}
        body={t('profile.resetConfirmBody')}
        confirmLabel={reset.busy ? t('profile.resetting') : t('profile.resetConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void reset.confirm()}
        onCancel={reset.cancel}
        destructive
        loading={reset.busy}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1, gap: spacing.xxs },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: spacing.md },
  field: { gap: spacing.xs },
  hint: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
