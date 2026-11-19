import type { AchievementDef, AchievementStatus, WorkoutSession } from '../types';

import { bestStreak, currentStreak, detectSessionPrs } from './workout';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-workout',
    title: { ar: 'أول تمرين', en: 'First workout' },
    description: { ar: 'أكملت أول جلسة تدريب', en: 'Completed your first training session' },
    target: 1,
  },
  {
    id: 'first-pr',
    title: { ar: 'أول رقم قياسي', en: 'First personal record' },
    description: {
      ar: 'حطّمت رقمك القياسي لأول مرة',
      en: 'Beat your own record for the first time',
    },
    target: 1,
  },
  {
    id: 'streak-7',
    title: { ar: 'أسبوع من الالتزام', en: 'Seven-day streak' },
    description: { ar: 'تدرّب سبعة أيام متتالية', en: 'Train seven days in a row' },
    target: 7,
  },
  {
    id: 'sessions-25',
    title: { ar: 'خمس وعشرون جلسة', en: 'Twenty-five sessions' },
    description: { ar: 'أكمل ٢٥ جلسة تدريب', en: 'Complete 25 training sessions' },
    target: 25,
  },
  {
    id: 'volume-250t',
    title: { ar: 'مئتان وخمسون طنًا', en: 'Two hundred fifty tons' },
    description: { ar: 'ارفع ٢٥٠ طنًا إجمالًا', en: 'Lift 250 tons in total' },
    target: 250_000,
  },
];

/** [shown progress, progress that decides the unlock]. Unlocks never go away once earned. */
function measure(id: string, sessions: WorkoutSession[], now: Date): [number, number] {
  switch (id) {
    case 'first-workout':
    case 'sessions-25':
      return [sessions.length, sessions.length];
    case 'first-pr': {
      const sorted = [...sessions].sort((a, b) => Date.parse(a.endedAt) - Date.parse(b.endedAt));
      const broke = sorted.some((s, i) => detectSessionPrs(sorted.slice(0, i), s).length > 0);
      return broke ? [1, 1] : [0, 0];
    }
    case 'streak-7':
      return [currentStreak(sessions, now), bestStreak(sessions)];
    case 'volume-250t': {
      const total = sessions.reduce((sum, s) => sum + s.volumeKg, 0);
      return [total, total];
    }
    default:
      return [0, 0];
  }
}

/**
 * Progress of every achievement, computed from the real history.
 * `unlocked` maps ids already earned to their date; `newlyUnlocked` lists ids earned now.
 */
export function evaluateAchievements(
  sessions: WorkoutSession[],
  now: Date,
  unlocked: Record<string, string>,
): { statuses: AchievementStatus[]; newlyUnlocked: string[] } {
  const newlyUnlocked: string[] = [];
  const statuses = ACHIEVEMENTS.map((def) => {
    const [shown, deciding] = measure(def.id, sessions, now);
    let unlockedAt = unlocked[def.id] ?? null;
    if (!unlockedAt && deciding >= def.target) {
      unlockedAt = now.toISOString();
      newlyUnlocked.push(def.id);
    }
    return { ...def, progress: unlockedAt ? def.target : Math.min(def.target, shown), unlockedAt };
  });
  return { statuses, newlyUnlocked };
}
