import { describe, expect, it } from 'vitest';

import { workoutPlans } from '../../seed/plans';
import {
  IDLE_GAP_CAP_MS,
  activeDurationMs,
  adjustRest,
  createActiveSession,
  logSet,
  markActivity,
  pauseRest,
  toWorkoutSession,
} from '../activeSession';

const T0 = 10_000_000;
const MIN = 60_000;
const HOUR = 60 * MIN;
const plan = workoutPlans[0]!;
const set = { weightKg: 60, reps: 8 };
const fresh = () => createActiveSession(plan, T0, 'session-idle');

describe('session duration with an idle cap', () => {
  it('starts at zero and counts the time since the last action', () => {
    expect(activeDurationMs(fresh(), T0)).toBe(0);
    expect(activeDurationMs(fresh(), T0 + 25 * MIN)).toBe(25 * MIN);
  });

  it('counts normal gaps in full', () => {
    let s = logSet(fresh(), set, T0 + 10 * MIN);
    s = logSet(s, set, T0 + 14 * MIN);
    expect(s.activeMs).toBe(14 * MIN);
    expect(toWorkoutSession(s, T0 + 20 * MIN).durationSec).toBe(20 * 60);
  });

  it('counts a gap of exactly the cap in full', () => {
    const s = logSet(fresh(), set, T0 + IDLE_GAP_CAP_MS);
    expect(s.activeMs).toBe(IDLE_GAP_CAP_MS);
  });

  it('counts a longer gap as the cap only', () => {
    const s = logSet(fresh(), set, T0 + 7 * HOUR);
    expect(s.activeMs).toBe(IDLE_GAP_CAP_MS);
    expect(s.lastActivityMs).toBe(T0 + 7 * HOUR);
  });

  it('caps each gap on its own, so two long gaps add up to two caps', () => {
    let s = logSet(fresh(), set, T0 + 10 * HOUR);
    s = logSet(s, set, T0 + 20 * HOUR);
    expect(s.activeMs).toBe(2 * IDLE_GAP_CAP_MS);
  });

  it('caps the gap between the last action and finishing', () => {
    const s = logSet(fresh(), set, T0 + 5 * MIN);
    const saved = toWorkoutSession(s, T0 + 12 * HOUR);
    expect(saved.durationSec).toBe((5 * MIN + IDLE_GAP_CAP_MS) / 1000);
    expect(activeDurationMs(s, T0 + 12 * HOUR)).toBe(5 * MIN + IDLE_GAP_CAP_MS);
  });

  it('counts rest timer actions as activity', () => {
    let s = logSet(fresh(), set, T0 + 2 * MIN);
    s = adjustRest(s, 15, T0 + 3 * MIN);
    s = pauseRest(s, T0 + 4 * MIN);
    expect(s.activeMs).toBe(4 * MIN);
    expect(s.lastActivityMs).toBe(T0 + 4 * MIN);
  });

  it('ignores a clock that moves backwards', () => {
    const s = markActivity(logSet(fresh(), set, T0 + 10 * MIN), T0 + 5 * MIN);
    expect(s.activeMs).toBe(10 * MIN);
    expect(s.lastActivityMs).toBe(T0 + 10 * MIN);
    expect(activeDurationMs(s, T0)).toBe(10 * MIN);
  });

  it('never reports less than one second', () => {
    const s = logSet(fresh(), set, T0);
    expect(toWorkoutSession(s, T0).durationSec).toBe(1);
  });
});
