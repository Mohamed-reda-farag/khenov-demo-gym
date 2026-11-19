import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Check } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { ActiveExercise, Exercise } from '@/data/types';
import { useFormat } from '@/lib/format';
import { layout, radius, spacing, useTheme } from '@/theme';

import { ExerciseGlyph } from './ExerciseGlyph';
import { useWorkoutText } from './useWorkoutText';

interface ListSheetProps {
  visible: boolean;
  exercises: ActiveExercise[];
  library: Map<string, Exercise>;
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

/** Jump to any exercise of the session. */
export function ExerciseListSheet({
  visible,
  exercises,
  library,
  currentIndex,
  onSelect,
  onClose,
}: ListSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const text = useWorkoutText();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={t('workout.session.list.title')}
      dragFromAnywhere={false}
    >
      <Text variant="h2">{t('workout.session.list.title')}</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {exercises.map((e, index) => {
          const ex = library.get(e.exerciseId);
          if (!ex) return null;
          const current = index === currentIndex;
          const done = e.sets.length >= e.targetSets;
          return (
            <Pressable
              key={e.exerciseId}
              accessibilityRole="button"
              accessibilityLabel={t('workout.session.list.jump', { name: text.exercise(ex) })}
              accessibilityState={{ selected: current }}
              onPress={() => onSelect(index)}
              style={[
                styles.row,
                {
                  backgroundColor: current ? colors.accentSoft : colors.surfaceAlt,
                  borderColor: current ? colors.accent : colors.border,
                },
              ]}
            >
              <ExerciseGlyph equipment={ex.equipment} size={40} />
              <View style={styles.grow}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {text.exercise(ex)}
                </Text>
                <Text variant="caption" color="secondary">
                  {t('workout.session.list.done', {
                    done: format.number(e.sets.length),
                    total: format.number(e.targetSets),
                  })}
                  {current ? ` · ${t('workout.session.list.current')}` : ''}
                </Text>
              </View>
              {done ? <Icon icon={Check} size={20} color="success" strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

interface QuitSheetProps {
  visible: boolean;
  hasSets: boolean;
  busy: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onContinue: () => void;
}

/** Shown when leaving an unfinished session: keep what was done, throw it away, or carry on. */
export function QuitSheet({
  visible,
  hasSets,
  busy,
  onSave,
  onDiscard,
  onContinue,
}: QuitSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      visible={visible}
      onClose={onContinue}
      accessibilityLabel={t('workout.session.quit.title')}
      dismissible={!busy}
    >
      <View style={styles.quitText}>
        <Text variant="h2">{t('workout.session.quit.title')}</Text>
        <Text variant="body" color="secondary">
          {hasSets ? t('workout.session.quit.body') : t('workout.session.quit.noSets')}
        </Text>
      </View>
      <View style={styles.quitActions}>
        <Button
          label={t('workout.session.quit.save')}
          onPress={onSave}
          loading={busy}
          disabled={!hasSets}
        />
        <Button
          label={t('workout.session.quit.discard')}
          onPress={onDiscard}
          variant="danger"
          disabled={busy}
        />
        <Button
          label={t('workout.session.quit.continue')}
          onPress={onContinue}
          variant="ghost"
          disabled={busy}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 380 },
  listContent: { gap: spacing.xs, paddingBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTouchTarget + spacing.md,
    padding: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  grow: { flex: 1, gap: spacing.xxs },
  quitText: { gap: spacing.xs },
  quitActions: { gap: spacing.xs },
});
