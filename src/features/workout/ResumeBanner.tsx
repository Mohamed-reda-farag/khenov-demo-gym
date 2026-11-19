import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Play } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import {
  onWorkoutChanged,
  workoutPlanRepository,
  workoutSessionRepository,
} from '@/data/repository';
import { completedSets, totalTargetSets } from '@/data/rules/activeSession';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { radius, spacing, useTheme } from '@/theme';

import { useWorkoutText } from './useWorkoutText';

async function loadActive() {
  const [active, plans] = await Promise.all([
    workoutSessionRepository.getActive(),
    workoutPlanRepository.list(),
  ]);
  return active ? { active, plan: plans.find((p) => p.id === active.planId) ?? null } : null;
}

/** Shown on Home and Workout while a session is in progress: resume it or throw it away. */
export function ResumeBanner() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();
  const text = useWorkoutText();
  const { state, refresh } = useAsyncResource(loadActive);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => onWorkoutChanged(refresh), [refresh]);

  if (state.status !== 'success' || !state.data) return null;
  const { active, plan } = state.data;

  const progress = t('workout.session.progress', {
    done: format.number(completedSets(active)),
    total: format.number(totalTargetSets(active)),
  });

  async function discard() {
    setBusy(true);
    await workoutSessionRepository.discardActive();
    setBusy(false);
    setConfirming(false);
  }

  return (
    <Card style={[styles.card, { borderColor: colors.accent }]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Icon icon={Play} size={22} color="accentText" />
        </View>
        <View style={styles.text}>
          <Text variant="caption" color="accent">
            {t('workout.resume.title')}
          </Text>
          <Text variant="title" numberOfLines={1}>
            {t('workout.resume.body', { plan: plan ? text.plan(plan) : '', progress })}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button label={t('workout.resume.resume')} onPress={() => router.push('/session')} />
        </View>
        <View style={styles.action}>
          <Button
            label={t('workout.resume.discard')}
            onPress={() => setConfirming(true)}
            variant="secondary"
          />
        </View>
      </View>
      <ConfirmSheet
        visible={confirming}
        title={t('workout.resume.discardTitle')}
        body={t('workout.resume.discardBody')}
        confirmLabel={t('workout.resume.discardConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void discard()}
        onCancel={() => setConfirming(false)}
        destructive
        loading={busy}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: spacing.xxs },
  actions: { flexDirection: 'row', gap: spacing.xs },
  action: { flex: 1 },
});
