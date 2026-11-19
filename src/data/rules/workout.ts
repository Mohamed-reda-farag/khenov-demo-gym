import type {
  BestSet,
  LoggedSet,
  PersonalRecord,
  PrHit,
  SessionExercise,
  WorkoutSession,
} from '../types';

import { addDays, dateKey } from './sessions';

export const WEIGHT_MAX_KG = 500;
export const REPS_MAX = 100;

export type WorkoutErrorCode =
  | 'invalid_weight'
  | 'invalid_reps'
  | 'invalid_set_count'
  | 'no_sets'
  | 'no_active_session'
  | 'session_in_progress'
  | 'plan_not_found'
  | 'session_not_found';

export class WorkoutError extends Error {
  readonly code: WorkoutErrorCode;

  constructor(code: WorkoutErrorCode) {
    super(code);
    this.name = 'WorkoutError';
    this.code = code;
  }
}

/** Weight is 0 to 500 kg in steps of 0.5 (0 means bodyweight). Reps are whole, 1 to 100. */
export function validateSet(set: LoggedSet): LoggedSet {
  const { weightKg, reps } = set;
  const weightOk =
    Number.isFinite(weightKg) &&
    weightKg >= 0 &&
    weightKg <= WEIGHT_MAX_KG &&
    Math.round(weightKg * 2) === weightKg * 2;
  if (!weightOk) throw new WorkoutError('invalid_weight');
  if (!Number.isInteger(reps) || reps < 1 || reps > REPS_MAX)
    throw new WorkoutError('invalid_reps');
  return { weightKg, reps };
}

export const setVolume = (set: LoggedSet): number => set.weightKg * set.reps;

export function exercisesVolume(exercises: SessionExercise[]): number {
  return exercises.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + setVolume(set), 0), 0);
}

export function exercisesSetCount(exercises: SessionExercise[]): number {
  return exercises.reduce((sum, e) => sum + e.sets.length, 0);
}

/** True when `a` is a better set than `b`: heavier, or the same weight for more reps. */
export function isBetter(a: BestSet, b: BestSet): boolean {
  return a.weightKg > b.weightKg || (a.weightKg === b.weightKg && a.reps > b.reps);
}

export function bestOf(sets: LoggedSet[]): BestSet | null {
  let best: BestSet | null = null;
  for (const set of sets) {
    if (!best || isBetter(set, best)) best = { weightKg: set.weightKg, reps: set.reps };
  }
  return best;
}

const byEnd = (a: WorkoutSession, b: WorkoutSession) =>
  Date.parse(a.endedAt) - Date.parse(b.endedAt);

/** Best set per exercise across the given sessions. */
export function bestsByExercise(sessions: WorkoutSession[]): Map<string, BestSet> {
  const bests = new Map<string, BestSet>();
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const candidate = bestOf(exercise.sets);
      if (!candidate) continue;
      const current = bests.get(exercise.exerciseId);
      if (!current || isBetter(candidate, current)) bests.set(exercise.exerciseId, candidate);
    }
  }
  return bests;
}

/**
 * Records broken by `session` compared with everything done before it. The very first time an
 * exercise is logged sets a baseline and is not reported as a record.
 */
export function detectSessionPrs(before: WorkoutSession[], session: WorkoutSession): PrHit[] {
  const bests = bestsByExercise(before);
  const hits: PrHit[] = [];
  for (const exercise of session.exercises) {
    const previous = bests.get(exercise.exerciseId);
    const best = bestOf(exercise.sets);
    if (previous && best && isBetter(best, previous)) {
      hits.push({ exerciseId: exercise.exerciseId, best, previous });
    }
  }
  return hits;
}

/** Current personal record for every exercise, with the day it was first reached. */
export function personalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const records = new Map<string, PersonalRecord>();
  for (const session of [...sessions].sort(byEnd)) {
    for (const exercise of session.exercises) {
      const candidate = bestOf(exercise.sets);
      if (!candidate) continue;
      const current = records.get(exercise.exerciseId);
      if (!current || isBetter(candidate, current)) {
        records.set(exercise.exerciseId, {
          exerciseId: exercise.exerciseId,
          ...candidate,
          date: session.endedAt,
        });
      }
    }
  }
  return [...records.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/** The most recent best set of each exercise, to show "last time". */
export function lastPerformance(sessions: WorkoutSession[]): Map<string, BestSet> {
  const last = new Map<string, BestSet>();
  for (const session of [...sessions].sort(byEnd)) {
    for (const exercise of session.exercises) {
      const best = bestOf(exercise.sets);
      if (best) last.set(exercise.exerciseId, best);
    }
  }
  return last;
}

export function activeDayKeys(sessions: WorkoutSession[]): Set<string> {
  return new Set(sessions.map((s) => dateKey(new Date(s.endedAt))));
}

/**
 * Consecutive days with at least one workout. It is alive when the latest one is today or
 * yesterday, because today is not over yet.
 */
export function currentStreak(sessions: WorkoutSession[], now: Date): number {
  const days = activeDayKeys(sessions);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let cursor = days.has(dateKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive workout days ever. */
export function bestStreak(sessions: WorkoutSession[]): number {
  const keys = [...activeDayKeys(sessions)].sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of keys) {
    const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    run = previous && dateKey(addDays(previous, 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}
