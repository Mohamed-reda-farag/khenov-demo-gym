import { exercisesSetCount, exercisesVolume } from '../rules/workout';
import type { SessionExercise, WorkoutPlan, WorkoutSession } from '../types';

/**
 * Days back from today for each past session, oldest first: a six-day run ending yesterday (so
 * one workout today makes a seven-day streak), and 18 earlier sessions over the previous weeks.
 */
const DAYS_AGO = [
  50, 46, 44, 42, 39, 37, 35, 32, 30, 28, 25, 23, 21, 18, 16, 14, 11, 9, 6, 5, 4, 3, 2, 1,
];

/** Working weight (kg) at the first and the latest session, per exercise. */
const LOADS: Record<string, readonly [number, number]> = {
  'bench-press': [65, 80],
  'barbell-row': [55, 70],
  'overhead-press': [35, 50],
  'pull-up': [0, 10],
  'barbell-curl': [25, 35],
  'triceps-pushdown': [25, 37.5],
  'back-squat': [90, 110],
  'romanian-deadlift': [80, 100],
  'leg-press': [140, 180],
  'walking-lunges': [16, 24],
  'calf-raise': [60, 80],
  'kettlebell-swing': [16, 24],
  'lat-pulldown': [45, 60],
  'russian-twist': [0, 6],
};

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

function loadAt(exerciseId: string, index: number, total: number): number {
  const [start, end] = LOADS[exerciseId] ?? [0, 0];
  if (total <= 1) return end;
  return roundTo(start + ((end - start) * index) / (total - 1), 2.5);
}

/**
 * Workout history relative to `now`, so charts always show the most recent weeks. The weights
 * rise a little every session, so the latest session holds the current records.
 */
export function generateSeedHistory(now: Date, plans: WorkoutPlan[]): WorkoutSession[] {
  return DAYS_AGO.flatMap((daysAgo, index): WorkoutSession[] => {
    const plan = plans[index % plans.length];
    if (!plan) return [];
    const exercises: SessionExercise[] = plan.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      sets: Array.from({ length: e.sets }, (_, setIndex) => ({
        weightKg: loadAt(e.exerciseId, index, DAYS_AGO.length),
        reps: e.reps - (setIndex === e.sets - 1 && index % 2 === 1 ? 1 : 0),
      })),
    }));
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 18, 0);
    const durationSec = (plan.durationMin - (index % 4) * 2) * 60;
    return [
      {
        id: `history-${index + 1}`,
        planId: plan.id,
        startedAt: new Date(end.getTime() - durationSec * 1000).toISOString(),
        endedAt: end.toISOString(),
        durationSec,
        exercises,
        volumeKg: exercisesVolume(exercises),
        setsCompleted: exercisesSetCount(exercises),
        partial: false,
        unlockedAchievementIds: [],
      },
    ];
  });
}
