import type {
  Achievement,
  BodyEntry,
  PersonalRecord,
  WorkoutLogEntry,
  WorkoutPlan,
} from '../types';

function daysAgo(now: Date, days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const weights = [83.6, 83.0, 82.4, 81.9, 81.1, 80.6, 80.2, 79.6];
const waists = [92.0, 91.5, 90.8, 90.2, 89.6, 89.1, 88.6, 88.0];
const chests = [101.0, 101.2, 101.4, 101.7, 102.0, 102.2, 102.4, 102.6];
const arms = [32.5, 32.7, 32.8, 33.0, 33.1, 33.2, 33.3, 33.4];

/** Eight weekly check-ins, oldest first. */
export function buildBodyEntries(now: Date): BodyEntry[] {
  return weights.map((weightKg, i) => ({
    date: daysAgo(now, (weights.length - 1 - i) * 7),
    weightKg,
    waistCm: waists[i] ?? 0,
    chestCm: chests[i] ?? 0,
    armCm: arms[i] ?? 0,
  }));
}

export function buildPersonalRecords(now: Date): PersonalRecord[] {
  return [
    { exerciseId: 'bench-press', weightKg: 80, reps: 5, date: daysAgo(now, 6) },
    { exerciseId: 'back-squat', weightKg: 110, reps: 5, date: daysAgo(now, 13) },
    { exerciseId: 'deadlift', weightKg: 130, reps: 3, date: daysAgo(now, 20) },
    { exerciseId: 'overhead-press', weightKg: 50, reps: 5, date: daysAgo(now, 9) },
    { exerciseId: 'pull-up', weightKg: 10, reps: 6, date: daysAgo(now, 16) },
  ];
}

export const achievements: Achievement[] = [
  {
    id: 'first-workout',
    title: { ar: 'أول تمرين', en: 'First workout' },
    description: { ar: 'أكملت أول جلسة تدريب', en: 'Completed your first training session' },
    progress: 1,
    target: 1,
  },
  {
    id: 'first-pr',
    title: { ar: 'أول رقم قياسي', en: 'First personal record' },
    description: {
      ar: 'حطّمت رقمك القياسي لأول مرة',
      en: 'Beat your own record for the first time',
    },
    progress: 1,
    target: 1,
  },
  {
    id: 'streak-7',
    title: { ar: 'أسبوع من الالتزام', en: 'Seven-day streak' },
    description: { ar: 'تدرّب سبعة أيام متتالية', en: 'Train seven days in a row' },
    progress: 6,
    target: 7,
  },
  {
    id: 'sessions-25',
    title: { ar: 'خمس وعشرون جلسة', en: 'Twenty-five sessions' },
    description: { ar: 'أكمل ٢٥ جلسة تدريب', en: 'Complete 25 training sessions' },
    progress: 24,
    target: 25,
  },
  {
    id: 'class-regular',
    title: { ar: 'عضو الحصص', en: 'Class regular' },
    description: { ar: 'احضر ١٠ حصص جماعية', en: 'Attend 10 group classes' },
    progress: 4,
    target: 10,
  },
];

/** Three sessions per week for eight weeks, newest first is not required: oldest first. */
export function buildWorkoutLog(now: Date, plans: WorkoutPlan[]): WorkoutLogEntry[] {
  const log: WorkoutLogEntry[] = [];
  let n = 0;
  for (let week = 7; week >= 0; week -= 1) {
    for (const offset of [5, 3, 1]) {
      const plan = plans[n % plans.length];
      if (!plan) continue;
      log.push({
        id: `log-${n + 1}`,
        planId: plan.id,
        date: daysAgo(now, week * 7 + offset),
        durationMin: plan.durationMin - (n % 4) * 2,
        volumeKg: 3200 + n * 85,
        setsCompleted: plan.exercises.reduce((sum, e) => sum + e.sets, 0),
      });
      n += 1;
    }
  }
  return log;
}
