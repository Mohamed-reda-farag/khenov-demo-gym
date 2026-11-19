import { describe, expect, it } from 'vitest';

import { workoutPlans } from '../../seed/plans';
import type { ActiveSession } from '../../types';
import {
  MAX_SETS,
  addSet,
  clearRest,
  completedSets,
  createActiveSession,
  defaultRestSec,
  goTo,
  isSessionComplete,
  logSet,
  pauseRest,
  adjustRest,
  resumeRest,
  restIsOver,
  skipSet,
  toWorkoutSession,
  totalTargetSets,
  undoLastSet,
} from '../activeSession';
import { remainingMs } from '../timer';
import { WorkoutError } from '../workout';

const T0 = 5_000_000;
const plan = workoutPlans[0]!;
const fresh = () => createActiveSession(plan, T0, 'session-1');

function codeOf(fn: () => unknown): string {
  try {
    fn();
    return 'ok';
  } catch (error) {
    return error instanceof WorkoutError ? error.code : 'other';
  }
}

function logAll(session: ActiveSession, at = T0): ActiveSession {
  let current = session;
  for (let i = 0; i < current.exercises.length; i += 1) {
    current = goTo(current, i);
    while ((current.exercises[i]?.sets.length ?? 0) < (current.exercises[i]?.targetSets ?? 0)) {
      current = logSet(current, { weightKg: 50, reps: 8 }, at);
    }
  }
  return current;
}

describe('starting a session', () => {
  it('copies the plan and keeps every rest between 60 and 90 seconds', () => {
    const s = fresh();
    expect(s.exercises).toHaveLength(plan.exercises.length);
    expect(s.currentIndex).toBe(0);
    expect(s.rest).toBeNull();
    for (const e of s.exercises) {
      expect(e.restSec).toBeGreaterThanOrEqual(60);
      expect(e.restSec).toBeLessThanOrEqual(90);
    }
    expect([defaultRestSec(30), defaultRestSec(75), defaultRestSec(150)]).toEqual([60, 75, 90]);
  });
});

describe('logging sets', () => {
  it('stores the set and starts the rest timer', () => {
    const s = logSet(fresh(), { weightKg: 80, reps: 6 }, T0);
    expect(s.exercises[0]?.sets).toEqual([{ weightKg: 80, reps: 6 }]);
    expect(s.rest).not.toBeNull();
    expect(remainingMs(s.rest!, T0)).toBe((s.exercises[0]?.restSec ?? 0) * 1000);
  });

  it('rejects invalid sets with typed errors and changes nothing', () => {
    expect(codeOf(() => logSet(fresh(), { weightKg: -5, reps: 6 }, T0))).toBe('invalid_weight');
    expect(codeOf(() => logSet(fresh(), { weightKg: 50, reps: 0 }, T0))).toBe('invalid_reps');
  });

  it('refuses more sets than planned until one is added', () => {
    let s = fresh();
    const planned = s.exercises[0]!.targetSets;
    for (let i = 0; i < planned; i += 1) s = logSet(s, { weightKg: 60, reps: 8 }, T0);
    expect(codeOf(() => logSet(s, { weightKg: 60, reps: 8 }, T0))).toBe('invalid_set_count');
    s = addSet(s);
    expect(codeOf(() => logSet(s, { weightKg: 60, reps: 8 }, T0))).toBe('ok');
  });

  it('adds sets up to a maximum and skips planned sets', () => {
    let s = fresh();
    for (let i = 0; i < 20; i += 1) s = addSet(s);
    expect(s.exercises[0]?.targetSets).toBe(MAX_SETS);

    const before = fresh();
    const skipped = skipSet(before);
    expect(skipped.exercises[0]?.targetSets).toBe(before.exercises[0]!.targetSets - 1);
    let done = before;
    for (let i = 0; i < before.exercises[0]!.targetSets; i += 1) {
      done = logSet(done, { weightKg: 60, reps: 8 }, T0);
    }
    expect(codeOf(() => skipSet(done))).toBe('invalid_set_count');
  });

  it('undoes the last set and clears the rest it started', () => {
    const logged = logSet(fresh(), { weightKg: 60, reps: 8 }, T0);
    const undone = undoLastSet(logged);
    expect(undone.exercises[0]?.sets).toHaveLength(0);
    expect(undone.rest).toBeNull();
    expect(codeOf(() => undoLastSet(undone))).toBe('invalid_set_count');
  });

  it('moves between exercises within bounds', () => {
    const s = fresh();
    expect(goTo(s, 2).currentIndex).toBe(2);
    expect(goTo(s, -4).currentIndex).toBe(0);
    expect(goTo(s, 99).currentIndex).toBe(s.exercises.length - 1);
  });

  it('does not start a rest after the very last set', () => {
    const done = logAll(fresh());
    expect(isSessionComplete(done)).toBe(true);
    expect(done.rest).toBeNull();
    expect(completedSets(done)).toBe(totalTargetSets(done));
  });
});

describe('rest timer inside the session', () => {
  it('adjusts, pauses and resumes using timestamps', () => {
    const logged = logSet(fresh(), { weightKg: 60, reps: 8 }, T0);
    const rest = logged.exercises[0]!.restSec;
    const longer = adjustRest(logged, 15, T0 + 5_000);
    expect(remainingMs(longer.rest!, T0 + 5_000)).toBe((rest - 5 + 15) * 1000);

    const paused = pauseRest(longer, T0 + 10_000);
    const resumed = resumeRest(paused, T0 + 70_000);
    expect(remainingMs(resumed.rest!, T0 + 70_000)).toBe(remainingMs(paused.rest!, T0 + 10_000));
  });

  it('reports when the rest ran out, even after a long time in the background', () => {
    const logged = logSet(fresh(), { weightKg: 60, reps: 8 }, T0);
    expect(restIsOver(logged, T0 + 1000)).toBe(false);
    expect(restIsOver(logged, T0 + 3_600_000)).toBe(true);
    expect(restIsOver(clearRest(logged), T0 + 3_600_000)).toBe(false);
  });

  it('survives being saved and loaded again (a restart)', () => {
    const logged = logSet(fresh(), { weightKg: 60, reps: 8 }, T0);
    const reloaded = JSON.parse(JSON.stringify(logged)) as ActiveSession;
    expect(remainingMs(reloaded.rest!, T0 + 10_000)).toBe(remainingMs(logged.rest!, T0 + 10_000));
  });
});

describe('finishing', () => {
  it('needs at least one logged set', () => {
    expect(codeOf(() => toWorkoutSession(fresh(), T0 + 60_000))).toBe('no_sets');
  });

  it('keeps only exercises with sets and marks an unfinished session as partial', () => {
    let s = logSet(fresh(), { weightKg: 80, reps: 5 }, T0);
    s = logSet(s, { weightKg: 80, reps: 5 }, T0);
    const saved = toWorkoutSession(s, T0 + 15 * 60_000);
    expect(saved.exercises).toHaveLength(1);
    expect(saved.setsCompleted).toBe(2);
    expect(saved.volumeKg).toBe(800);
    expect(saved.partial).toBe(true);
    expect(saved.durationSec).toBe(900);
  });

  it('is not partial when every planned set is done', () => {
    const saved = toWorkoutSession(logAll(fresh()), T0 + 40 * 60_000);
    expect(saved.partial).toBe(false);
    expect(saved.exercises).toHaveLength(plan.exercises.length);
  });
});
