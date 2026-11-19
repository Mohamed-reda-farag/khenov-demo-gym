import { describe, expect, it } from 'vitest';

import {
  MAX_REST_MS,
  adjustTimer,
  isFinished,
  isPaused,
  pauseTimer,
  remainingMs,
  resumeTimer,
  startTimer,
  timerProgress,
} from '../timer';

const T0 = 1_000_000;

describe('rest timer', () => {
  it('counts down from timestamps, not from ticks', () => {
    const timer = startTimer(T0, 60);
    expect(remainingMs(timer, T0)).toBe(60_000);
    expect(remainingMs(timer, T0 + 20_000)).toBe(40_000);
    expect(remainingMs(timer, T0 + 59_999)).toBe(1);
    expect(isFinished(timer, T0 + 59_999)).toBe(false);
    expect(isFinished(timer, T0 + 60_000)).toBe(true);
  });

  it('is exact after a long gap such as the app staying in the background', () => {
    const timer = startTimer(T0, 90);
    expect(remainingMs(timer, T0 + 3_600_000)).toBe(0);
    expect(isFinished(timer, T0 + 3_600_000)).toBe(true);
  });

  it('never goes below zero or above the maximum', () => {
    expect(remainingMs(startTimer(T0, 10), T0 + 99_000)).toBe(0);
    expect(startTimer(T0, 99_999).durationMs).toBe(MAX_REST_MS);
    expect(startTimer(T0, -5).durationMs).toBe(0);
  });

  it('pauses and keeps the time left, then resumes from there', () => {
    const running = startTimer(T0, 60);
    const paused = pauseTimer(running, T0 + 20_000);
    expect(isPaused(paused)).toBe(true);
    expect(remainingMs(paused, T0 + 20_000)).toBe(40_000);
    expect(remainingMs(paused, T0 + 500_000)).toBe(40_000); // frozen while paused
    expect(pauseTimer(paused, T0 + 30_000)).toBe(paused); // pausing twice changes nothing

    const resumed = resumeTimer(paused, T0 + 100_000);
    expect(isPaused(resumed)).toBe(false);
    expect(remainingMs(resumed, T0 + 100_000)).toBe(40_000);
    expect(remainingMs(resumed, T0 + 130_000)).toBe(10_000);
    expect(resumeTimer(resumed, T0 + 100_001)).toBe(resumed);
  });

  it('adds and removes time in 15 second steps', () => {
    const timer = startTimer(T0, 60);
    const longer = adjustTimer(timer, 15_000, T0 + 10_000);
    expect(remainingMs(longer, T0 + 10_000)).toBe(65_000);
    expect(longer.durationMs).toBe(75_000);

    const shorter = adjustTimer(timer, -15_000, T0 + 10_000);
    expect(remainingMs(shorter, T0 + 10_000)).toBe(35_000);
    expect(shorter.durationMs).toBe(45_000);
  });

  it('cannot remove more time than is left, and finishes when emptied', () => {
    const timer = startTimer(T0, 60);
    const emptied = adjustTimer(timer, -15_000, T0 + 55_000);
    expect(remainingMs(emptied, T0 + 55_000)).toBe(0);
    expect(isFinished(emptied, T0 + 55_000)).toBe(true);
    expect(remainingMs(adjustTimer(timer, MAX_REST_MS * 2, T0), T0)).toBe(MAX_REST_MS);
  });

  it('adjusts a paused timer without starting it', () => {
    const paused = pauseTimer(startTimer(T0, 60), T0 + 30_000);
    const adjusted = adjustTimer(paused, 15_000, T0 + 40_000);
    expect(isPaused(adjusted)).toBe(true);
    expect(remainingMs(adjusted, T0 + 90_000)).toBe(45_000);
  });

  it('reports progress from 0 to 1', () => {
    const timer = startTimer(T0, 60);
    expect(timerProgress(timer, T0)).toBe(0);
    expect(timerProgress(timer, T0 + 30_000)).toBe(0.5);
    expect(timerProgress(timer, T0 + 90_000)).toBe(1);
    expect(timerProgress(startTimer(T0, 0), T0)).toBe(1);
  });
});
