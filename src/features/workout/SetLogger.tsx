import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { REPS_MAX, WEIGHT_MAX_KG } from '@/data/rules/workout';
import type { ActiveExercise, BestSet, LoggedSet } from '@/data/types';
import { useFormat } from '@/lib/format';
import { spacing } from '@/theme';

interface SetLoggerProps {
  exercise: ActiveExercise;
  /** What the member did last time, for "same as last". */
  last: BestSet | undefined;
  onComplete: (set: LoggedSet) => void;
  onAddSet: () => void;
  onSkipSet: () => void;
}

/**
 * Weight and reps for the next set. The parent remounts it (new `key`) after every logged set,
 * so the steppers start from the set just done, or from last time, or from the plan.
 */
export function SetLogger({ exercise, last, onComplete, onAddSet, onSkipSet }: SetLoggerProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const previous = exercise.sets[exercise.sets.length - 1];
  const start = previous ?? last ?? { weightKg: 0, reps: exercise.targetReps };
  const [weightKg, setWeightKg] = useState(start.weightKg);
  const [reps, setReps] = useState(start.reps);

  const number = exercise.sets.length + 1;
  const sameAsLast = last && (last.weightKg !== weightKg || last.reps !== reps);

  const weightText = format.measure(weightKg, 'kg');
  const repsText = format.number(reps);

  return (
    <View style={styles.root}>
      <Stepper
        large
        label={t('workout.session.weight')}
        value={weightKg}
        onChange={setWeightKg}
        step={2.5}
        min={0}
        max={WEIGHT_MAX_KG}
        display={weightText}
        decreaseLabel={t('workout.session.decWeight')}
        increaseLabel={t('workout.session.incWeight')}
        valueLabel={t('workout.session.weightValue', { value: weightText })}
      />
      <Stepper
        large
        label={t('workout.session.reps')}
        value={reps}
        onChange={setReps}
        step={1}
        min={1}
        max={REPS_MAX}
        display={repsText}
        decreaseLabel={t('workout.session.decReps')}
        increaseLabel={t('workout.session.incReps')}
        valueLabel={t('workout.session.repsValue', { value: repsText })}
      />
      <Button
        label={t('workout.session.completeSet', { number: format.number(number) })}
        onPress={() => onComplete({ weightKg, reps })}
      />
      <View style={styles.row}>
        <View style={styles.cell}>
          <Button
            label={t('workout.session.sameAsLast')}
            onPress={() => {
              if (!last) return;
              setWeightKg(last.weightKg);
              setReps(last.reps);
            }}
            variant="secondary"
            disabled={!sameAsLast}
          />
        </View>
        <View style={styles.cell}>
          <Button label={t('workout.session.addSet')} onPress={onAddSet} variant="secondary" />
        </View>
        <View style={styles.cell}>
          <Button label={t('workout.session.skipSet')} onPress={onSkipSet} variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.xs },
  cell: { flex: 1 },
});
