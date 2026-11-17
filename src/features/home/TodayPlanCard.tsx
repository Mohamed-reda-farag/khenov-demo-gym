import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dumbbell, Moon } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { WorkoutPlan } from '@/data/types';
import { useLanguage } from '@/i18n';
import { useFormat } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

interface Props {
  /** Null on a rest day. */
  plan: WorkoutPlan | null;
  onStart: () => void;
  onBrowseClasses: () => void;
}

export function TodayPlanCard({ plan, onStart, onBrowseClasses }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useLanguage();
  const format = useFormat();

  if (!plan) {
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
            <Icon icon={Moon} size={26} color="textSecondary" />
          </View>
          <View style={styles.text}>
            <Text variant="caption" color="secondary">
              {t('home.today.title')}
            </Text>
            <Text variant="title">{t('home.today.restTitle')}</Text>
          </View>
        </View>
        <Text variant="small" color="secondary">
          {t('home.today.restBody')}
        </Text>
        <Button label={t('home.today.restCta')} onPress={onBrowseClasses} variant="secondary" />
      </Card>
    );
  }

  const meta = t('home.today.meta', {
    exercises: t('units.exercises', {
      count: plan.exercises.length,
      countText: format.number(plan.exercises.length),
    }),
    minutes: t('units.minutes', {
      count: plan.durationMin,
      countText: format.number(plan.durationMin),
    }),
  });

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Icon icon={Dumbbell} size={26} color="accentText" />
        </View>
        <View style={styles.text}>
          <Text variant="caption" color="secondary">
            {t('home.today.title')}
          </Text>
          <Text variant="title" numberOfLines={1}>
            {plan.name[language]}
          </Text>
          <Text variant="small" color="secondary">
            {plan.focus[language]}
          </Text>
        </View>
      </View>
      <Text variant="small" color="muted">
        {meta}
      </Text>
      <Button label={t('home.today.start')} onPress={onStart} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: spacing.xxs },
});
