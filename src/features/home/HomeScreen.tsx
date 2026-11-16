import { CalendarCheck, Flame } from '@/components/ui/icons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { memberRepository } from '@/data/repository';
import type { Member } from '@/data/types';
import { useLanguage } from '@/i18n';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { radius, spacing, useTheme } from '@/theme';

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
  const { state, reload } = useAsyncResource(() => memberRepository.get());

  return (
    <Screen scroll withTabBar>
      <DemoBadge />
      {state.status === 'loading' ? <HomeSkeleton /> : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <HomeContent member={state.data} /> : null}
    </Screen>
  );
}

function HomeContent({ member }: { member: Member }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useLanguage();
  const format = useFormat();
  const name = member.name[language];

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
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
        <View style={styles.headerText}>
          <Text variant="caption" color="secondary">
            {t('home.streakTitle')}
          </Text>
          <Text variant="title">
            {t('home.streakDays', {
              count: member.streakDays,
              countText: format.number(member.streakDays),
            })}
          </Text>
          <Text variant="small" color="muted">
            {t('home.streakHint')}
          </Text>
        </View>
      </Card>

      <Card style={styles.pending}>
        <Icon icon={CalendarCheck} size={24} color="accentText" />
        <View style={styles.headerText}>
          <Text variant="title">{t('home.pendingTitle')}</Text>
          <Text variant="small" color="secondary">
            {t('home.pendingBody')}
          </Text>
        </View>
      </Card>
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Skeleton width={96} height={18} />
          <Skeleton width={200} height={36} />
        </View>
        <Skeleton width={56} height={56} rounded={radius.pill} />
      </View>
      <Skeleton height={104} rounded={radius.xl} />
      <Skeleton height={88} rounded={radius.xl} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  headerText: { flex: 1, gap: spacing.xxs },
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
  pending: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
