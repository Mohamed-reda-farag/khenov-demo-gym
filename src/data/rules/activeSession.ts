import type { ActiveSession, LoggedSet, WorkoutPlan, WorkoutSession } from '../types';

import { adjustTimer, isFinished, pauseTimer, resumeTimer, startTimer } from './timer';
import { WorkoutError, exercisesSetCount, exercisesVolume, validateSet } from './workout';

export const MAX_SETS = 10;
export const MIN_DEFAULT_REST_SEC = 60;
export const MAX_DEFAULT_REST_SEC = 90;
export const REST_STEP_SEC = 15;
/** A gap between two actions counts for at most this long (phone left in a locker, app forgotten). */
export const IDLE_GAP_CAP_MS = 3 * 60 * 60 * 1000;

function cappedGap(fromMs: number, toMs: number): number {
  return Math.min(Math.max(0, toMs - fromMs), IDLE_GAP_CAP_MS);
}

/** Records that the member did something now and adds the gap since the last action. */
export function markActivity(session: ActiveSession, nowMs: number): ActiveSession {
  return {
    ...session,
    activeMs: session.activeMs + cappedGap(session.lastActivityMs, nowMs),
    lastActivityMs: Math.max(session.lastActivityMs, nowMs),
  };
}

/** Training time at `nowMs`: earlier gaps and the one still running are each capped. */
export function activeDurationMs(session: ActiveSession, nowMs: number): number {
  return session.activeMs + cappedGap(session.lastActivityMs, nowMs);
}

/** Planned rest times are 30 to 150 seconds; the session starts every rest at 60 to 90. */
export function defaultRestSec(planned: number): number {
  return Math.min(MAX_DEFAULT_REST_SEC, Math.max(MIN_DEFAULT_REST_SEC, planned));
}

export function createActiveSession(plan: WorkoutPlan, nowMs: number, id: string): ActiveSession {
  return {
    id,
    planId: plan.id,
    startedAtMs: nowMs,
    activeMs: 0,
    lastActivityMs: nowMs,
    exercises: plan.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      targetSets: e.sets,
      targetReps: e.reps,
      restSec: defaultRestSec(e.restSec),
      sets: [],
    })),
    currentIndex: 0,
    rest: null,
  };
}

export function isSessionComplete(session: ActiveSession): boolean {
  return session.exercises.every((e) => e.sets.length >= e.targetSets);
}

export function completedSets(session: ActiveSession): number {
  return exercisesSetCount(session.exercises);
}

export function totalTargetSets(session: ActiveSession): number {
  return session.exercises.reduce((sum, e) => sum + e.targetSets, 0);
}

function updateCurrent(
  session: ActiveSession,
  change: (e: ActiveSession['exercises'][number]) => ActiveSession['exercises'][number],
): ActiveSession {
  return {
    ...session,
    exercises: session.exercises.map((e, i) => (i === session.currentIndex ? change(e) : e)),
  };
}

/** Logs a set for the current exercise and starts the rest timer unless everything is done. */
export function logSet(session: ActiveSession, set: LoggedSet, nowMs: number): ActiveSession {
  const valid = validateSet(set);
  const current = session.exercises[session.currentIndex];
  if (!current || current.sets.length >= current.targetSets) {
    throw new WorkoutError('invalid_set_count');
  }
  const next = updateCurrent(markActivity(session, nowMs), (e) => ({
    ...e,
    sets: [...e.sets, valid],
  }));
  return {
    ...next,
    rest: isSessionComplete(next) ? null : startTimer(nowMs, current.restSec),
  };
}

export function undoLastSet(session: ActiveSession): ActiveSession {
  const current = session.exercises[session.currentIndex];
  if (!current || current.sets.length === 0) throw new WorkoutError('invalid_set_count');
  return { ...updateCurrent(session, (e) => ({ ...e, sets: e.sets.slice(0, -1) })), rest: null };
}

export function addSet(session: ActiveSession): ActiveSession {
  return updateCurrent(session, (e) => ({
    ...e,
    targetSets: Math.min(MAX_SETS, e.targetSets + 1),
  }));
}

/** Drops one planned set that has not been done yet. */
export function skipSet(session: ActiveSession): ActiveSession {
  const current = session.exercises[session.currentIndex];
  if (!current || current.targetSets <= current.sets.length) {
    throw new WorkoutError('invalid_set_count');
  }
  return updateCurrent(session, (e) => ({ ...e, targetSets: e.targetSets - 1 }));
}

export function goTo(session: ActiveSession, index: number): ActiveSession {
  const clamped = Math.max(0, Math.min(session.exercises.length - 1, index));
  return { ...session, currentIndex: clamped };
}

export function startRest(session: ActiveSession, seconds: number, nowMs: number): ActiveSession {
  return { ...markActivity(session, nowMs), rest: startTimer(nowMs, seconds) };
}

export function adjustRest(session: ActiveSession, deltaSec: number, nowMs: number): ActiveSession {
  if (!session.rest) return session;
  return {
    ...markActivity(session, nowMs),
    rest: adjustTimer(session.rest, deltaSec * 1000, nowMs),
  };
}

export function pauseRest(session: ActiveSession, nowMs: number): ActiveSession {
  return session.rest
    ? { ...markActivity(session, nowMs), rest: pauseTimer(session.rest, nowMs) }
    : session;
}

export function resumeRest(session: ActiveSession, nowMs: number): ActiveSession {
  return session.rest
    ? { ...markActivity(session, nowMs), rest: resumeTimer(session.rest, nowMs) }
    : session;
}

export function clearRest(session: ActiveSession): ActiveSession {
  return session.rest ? { ...session, rest: null } : session;
}

/** True when a timer exists and has run out. */
export function restIsOver(session: ActiveSession, nowMs: number): boolean {
  return session.rest !== null && isFinished(session.rest, nowMs);
}

/** Turns the live session into a history entry. Fails when nothing was logged. */
export function toWorkoutSession(session: ActiveSession, nowMs: number): WorkoutSession {
  const exercises = session.exercises
    .filter((e) => e.sets.length > 0)
    .map((e) => ({ exerciseId: e.exerciseId, sets: e.sets }));
  const setsCompleted = exercisesSetCount(exercises);
  if (setsCompleted === 0) throw new WorkoutError('no_sets');
  return {
    id: session.id,
    planId: session.planId,
    startedAt: new Date(session.startedAtMs).toISOString(),
    endedAt: new Date(nowMs).toISOString(),
    durationSec: Math.max(1, Math.round(activeDurationMs(session, nowMs) / 1000)),
    exercises,
    volumeKg: exercisesVolume(exercises),
    setsCompleted,
    partial: !isSessionComplete(session),
    unlockedAchievementIds: [],
  };
}
