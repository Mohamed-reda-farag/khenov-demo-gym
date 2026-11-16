import { RotateCcw } from '@/components/ui/icons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { memberRepository } from '@/data/repository';
import type { Language, Member } from '@/data/types';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { radius, spacing, useTheme, type ThemeMode } from '@/theme';

import { useLanguageSwitch } from './useLanguageSwitch';
import { useResetDemo } from './useResetDemo';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { state, reload } = useAsyncResource(() => memberRepository.get());

  return (
    <Screen scroll withTabBar>
      <Text variant="h1">{t('profile.title')}</Text>
      {state.status === 'loading' ? <Skeleton height={96} rounded={radius.xl} /> : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <MemberCard member={state.data} /> : null}
      <PreferencesCard />
      <DemoCard />
    </Screen>
  );
}

function MemberCard({ member }: { member: Member }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const name = member.name[format.language];
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');

  return (
    <Card style={styles.memberRow}>
      <View style={[styles.avatar, { backgroundColor: colors.accent }]} aria-hidden>
        <Text variant="h2" color="onAccent">
          {initials}
        </Text>
      </View>
      <View style={styles.grow}>
        <Text variant="title" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="small" color="secondary">
          {t('profile.memberSince', {
            date: format.date(member.joinedAt, { month: 'long', year: 'numeric' }),
          })}
        </Text>
      </View>
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
  section: { gap: spacing.md },
  field: { gap: spacing.xs },
  hint: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
