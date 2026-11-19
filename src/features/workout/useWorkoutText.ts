import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Equipment, Exercise, MuscleGroup, WorkoutPlan } from '@/data/types';
import { useFormat } from '@/lib/format';

/** Wording for exercises, plans and sets in the current language. */
export function useWorkoutText() {
  const { t } = useTranslation();
  const format = useFormat();
  const lang = format.language;

  return useMemo(
    () => ({
      exercise: (e: Pick<Exercise, 'name'>) => e.name[lang],
      plan: (p: Pick<WorkoutPlan, 'name'>) => p.name[lang],
      muscle: (m: MuscleGroup) => t(`workout.muscle.${m}`),
      equipment: (e: Equipment) => t(`workout.equipment.${e}`),
      minutes: (n: number) => t('units.minutes', { count: n, countText: format.number(n) }),
      exercises: (n: number) => t('units.exercises', { count: n, countText: format.number(n) }),
      sets: (n: number) => t('units.sets', { count: n, countText: format.number(n) }),
      sessions: (n: number) => t('units.sessions', { count: n, countText: format.number(n) }),
      setsReps: (sets: number, reps: number) =>
        t('workout.planDetail.setsReps', { sets: format.number(sets), reps: format.number(reps) }),
      /** "75 kg × 6", or "Bodyweight × 12" when no weight is added. */
      weightReps: (set: { weightKg: number; reps: number }) =>
        `${set.weightKg === 0 ? t('workout.equipment.bodyweight') : format.measure(set.weightKg, 'kg')} × ${format.number(set.reps)}`,
      weight: (kg: number) => format.measure(kg, 'kg'),
      volume: (kg: number) => format.measure(kg, 'kg', 0),
    }),
    [t, format, lang],
  );
}
