import { describe, expect, it } from 'vitest';

import type { LoggedSet, WorkoutSession } from '../../types';
import {
  WorkoutError,
  activeDayKeys,
  bestOf,
  bestStreak,
  bestsByExercise,
  currentStreak,
  detectSessionPrs,
  exercisesSetCount,
  exercisesVolume,
  isBetter,
  lastPerformance,
  personalRecords,
  setVolume,
  validateSet,
} from '../workout';

function session(id: string, end: Date, exercises: Record<string, LoggedSet[]>): WorkoutSession {
  const list = Object.entries(exercises).map(([exerciseId, sets]) => ({ exerciseId, sets }));
  return {
    id,
    planId: 'plan',
    startedAt: new Date(end.getTime() - 3_600_000).toISOString(),
    endedAt: end.toISOString(),
    durationSec: 3600,
    exercises: list,
    volumeKg: exercisesVolume(list),
    setsCompleted: exercisesSetCount(list),
    partial: false,
    unlockedAchievementIds: [],
  };
}

const set = (weightKg: number, reps: number): LoggedSet => ({ weightKg, reps });
const day = (offset: number, hour = 18) => new Date(2026, 10, 18 + offset, hour, 0);
const NOW = new Date(2026, 10, 18, 12, 0);

function codeOf(fn: () => unknown): string {
  try {
    fn();
    return 'ok';
  } catch (error) {
    return error instanceof WorkoutError ? error.code : 'other';
  }
}

describe('set validation', () => {
  it('accepts normal sets, bodyweight and half kilos', () => {
    expect(validateSet(set(80, 5))).toEqual(set(80, 5));
    expect(validateSet(set(0, 12))).toEqual(set(0, 12));
    expect(validateSet(set(22.5, 8))).toEqual(set(22.5, 8));
    expect(validateSet(set(500, 100))).toEqual(set(500, 100));
  });

  it('rejects weights outside 0 to 500 or not in half kilo steps', () => {
    for (const weight of [-1, 500.5, 1000, Number.NaN, Infinity, 22.3]) {
      expect(codeOf(() => validateSet(set(weight, 5)))).toBe('invalid_weight');
    }
  });

  it('rejects reps that are not whole numbers from 1 to 100', () => {
    for (const reps of [0, -3, 101, 2.5, Number.NaN]) {
      expect(codeOf(() => validateSet(set(50, reps)))).toBe('invalid_reps');
    }
  });
});

describe('volume', () => {
  it('multiplies weight by reps and adds nothing for bodyweight sets', () => {
    expect(setVolume(set(80, 5))).toBe(400);
    expect(setVolume(set(0, 20))).toBe(0);
    const exercises = [
      { exerciseId: 'a', sets: [set(80, 5), set(80, 5), set(75, 6)] },
      { exerciseId: 'b', sets: [set(0, 15)] },
    ];
    expect(exercisesVolume(exercises)).toBe(400 + 400 + 450);
    expect(exercisesSetCount(exercises)).toBe(4);
  });
});

describe('personal records', () => {
  it('orders sets by weight, then by reps', () => {
    expect(isBetter(set(82.5, 3), set(80, 8))).toBe(true);
    expect(isBetter(set(80, 6), set(80, 5))).toBe(true);
    expect(isBetter(set(80, 5), set(80, 5))).toBe(false);
    expect(isBetter(set(77.5, 12), set(80, 1))).toBe(false);
    expect(bestOf([set(70, 8), set(80, 3), set(80, 4)])).toEqual(set(80, 4));
    expect(bestOf([])).toBeNull();
  });

  const before = [session('a', day(-10), { bench: [set(80, 5), set(75, 6)] })];

  it('flags a heavier set, and more reps at the same weight', () => {
    const heavier = session('b', day(0), { bench: [set(80, 5), set(82.5, 3)] });
    const hit = detectSessionPrs(before, heavier);
    expect(hit).toEqual([{ exerciseId: 'bench', best: set(82.5, 3), previous: set(80, 5) }]);

    const moreReps = session('c', day(0), { bench: [set(80, 6)] });
    expect(detectSessionPrs(before, moreReps)).toHaveLength(1);
  });

  it('does not flag equal or lighter work', () => {
    expect(detectSessionPrs(before, session('d', day(0), { bench: [set(80, 5)] }))).toEqual([]);
    expect(detectSessionPrs(before, session('e', day(0), { bench: [set(70, 12)] }))).toEqual([]);
  });

  it('treats the first time an exercise is logged as a baseline, not a record', () => {
    expect(detectSessionPrs(before, session('f', day(0), { squat: [set(100, 5)] }))).toEqual([]);
    expect(detectSessionPrs([], session('g', day(0), { bench: [set(60, 5)] }))).toEqual([]);
  });

  it('reports one hit per exercise using its best set', () => {
    const big = session('h', day(0), {
      bench: [set(82.5, 3), set(85, 1), set(82.5, 5)],
      squat: [set(100, 5)],
    });
    const hits = detectSessionPrs(before, big);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.best).toEqual(set(85, 1));
  });

  it('lists the current record per exercise with the day it was reached', () => {
    const history = [
      session('1', day(-20), { bench: [set(70, 5)], squat: [set(90, 5)] }),
      session('2', day(-10), { bench: [set(80, 5)] }),
      session('3', day(-3), { bench: [set(75, 8)], squat: [set(90, 5)] }),
    ];
    const records = personalRecords(history);
    expect(records.find((r) => r.exerciseId === 'bench')).toMatchObject({
      weightKg: 80,
      date: day(-10).toISOString(),
    });
    // a tie does not move the date of the first time it was reached
    expect(records.find((r) => r.exerciseId === 'squat')?.date).toBe(day(-20).toISOString());
    expect(records[0]?.exerciseId).toBe('bench'); // newest record first
    expect(bestsByExercise(history).get('bench')).toEqual(set(80, 5));
  });

  it('remembers the latest best set of each exercise', () => {
    const history = [
      session('1', day(-9), { bench: [set(80, 5)] }),
      session('2', day(-2), { bench: [set(72.5, 8), set(70, 8)] }),
    ];
    expect(lastPerformance(history).get('bench')).toEqual(set(72.5, 8));
  });
});

describe('streak', () => {
  const at = (offsets: number[]) =>
    offsets.map((o) => session(`s${o}`, day(o), { x: [set(1, 1)] }));

  it('is zero without workouts', () => {
    expect(currentStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(currentStreak(at([-2, -1, 0]), NOW)).toBe(3);
  });

  it('stays alive when the last workout was yesterday, because today is not over', () => {
    expect(currentStreak(at([-3, -2, -1]), NOW)).toBe(3);
  });

  it('is broken by a missed day', () => {
    expect(currentStreak(at([-5, -4, -2]), NOW)).toBe(0);
    expect(currentStreak(at([-4, -3, -1, 0]), NOW)).toBe(2);
  });

  it('counts a day once however many workouts it holds', () => {
    const doubled = [...at([-1, 0]), session('extra', day(0, 7), { x: [set(1, 1)] })];
    expect(currentStreak(doubled, NOW)).toBe(2);
    expect(activeDayKeys(doubled).size).toBe(2);
  });

  it('finds the longest run ever', () => {
    expect(bestStreak(at([-30, -29, -28, -27, -10, -9, -1, 0]))).toBe(4);
    expect(bestStreak([])).toBe(0);
  });

  it('works across a month boundary', () => {
    const edge = new Date(2026, 11, 1, 10, 0);
    const days = [
      new Date(2026, 10, 29, 18),
      new Date(2026, 10, 30, 18),
      new Date(2026, 11, 1, 9),
    ].map((d, i) => session(`m${i}`, d, { x: [set(1, 1)] }));
    expect(currentStreak(days, edge)).toBe(3);
  });
});
