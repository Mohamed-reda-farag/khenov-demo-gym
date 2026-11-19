import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Lock, Trophy } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { AchievementStatus, Exercise, PersonalRecord } from '@/data/types';
import { useWorkoutText } from '@/features/workout/useWorkoutText';
import { useLanguage } from '@/i18n';
import { useFormat } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

const COLLAPSED = 5;

export function RecordsList({
  records,
  library,
}: {
  records: PersonalRecord[];
  library: Map<string, Exercise>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const text = useWorkoutText();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? records : records.slice(0, COLLAPSED);

  return (
    <Card style={styles.card}>
      <Text variant="title">{t('progress.records.title')}</Text>
      {records.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={t('progress.records.emptyTitle')}
          body={t('progress.records.emptyBody')}
        />
      ) : (
        <>
          {shown.map((r) => {
            const ex = library.get(r.exerciseId);
            return (
              <View
                key={r.exerciseId}
                style={[styles.row, { borderColor: colors.border }]}
                accessible
                accessibilityLabel={`${ex ? text.exercise(ex) : ''}، ${text.weightReps(r)}، ${format.dayMonth(new Date(r.date))}`}
              >
                <Icon icon={Trophy} size={20} color="accentText" />
                <View style={styles.grow}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {ex ? text.exercise(ex) : r.exerciseId}
                  </Text>
                  <Text variant="caption" color="muted">
                    {format.dayMonth(new Date(r.date))}
                  </Text>
                </View>
                <Text variant="title">{text.weightReps(r)}</Text>
              </View>
            );
          })}
          {records.length > COLLAPSED ? (
            <Button
              label={expanded ? t('progress.records.showLess') : t('progress.records.showAll')}
              onPress={() => setExpanded((v) => !v)}
              variant="ghost"
            />
          ) : null}
        </>
      )}
    </Card>
  );
}

export function AchievementsList({ achievements }: { achievements: AchievementStatus[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useLanguage();
  const format = useFormat();

  return (
    <Card style={styles.card}>
      <Text variant="title">{t('progress.achievements.title')}</Text>
      {achievements.map((a) => {
        const unlocked = a.unlockedAt !== null;
        const fraction = Math.min(1, a.progress / a.target);
        const progressText = t('progress.achievements.progress', {
          progress: format.number(a.progress),
          target: format.number(a.target),
        });
        const status = unlocked
          ? t('progress.achievements.unlocked')
          : t('progress.achievements.locked');
        return (
          <View
            key={a.id}
            style={[styles.achievement, { borderColor: unlocked ? colors.accent : colors.border }]}
            accessible
            accessibilityLabel={`${a.title[language]}، ${status}، ${progressText}`}
          >
            <View style={styles.row}>
              <Icon
                icon={unlocked ? Trophy : Lock}
                size={22}
                color={unlocked ? 'accentText' : 'textMuted'}
              />
              <View style={styles.grow}>
                <Text variant="bodyStrong">{a.title[language]}</Text>
                <Text variant="small" color="secondary">
                  {a.description[language]}
                </Text>
              </View>
              <View
                style={[
                  styles.status,
                  { backgroundColor: unlocked ? colors.accentSoft : colors.surfaceAlt },
                ]}
              >
                <Text variant="caption" color={unlocked ? 'accent' : 'secondary'}>
                  {status}
                </Text>
              </View>
            </View>
            <View
              role="progressbar"
              aria-valuenow={Math.round(fraction * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
            >
              <View
                style={[
                  styles.fill,
                  { backgroundColor: colors.accent, width: `${Math.round(fraction * 100)}%` },
                ]}
              />
            </View>
            <Text variant="caption" color="muted">
              {progressText}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1, gap: spacing.xxs },
  achievement: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  status: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.pill },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
