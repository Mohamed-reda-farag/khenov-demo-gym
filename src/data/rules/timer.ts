import type { RestTimer } from '../types';

export const MAX_REST_MS = 10 * 60_000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Starts a countdown that ends `seconds` after `nowMs`. */
export function startTimer(nowMs: number, seconds: number): RestTimer {
  const durationMs = clamp(Math.round(seconds * 1000), 0, MAX_REST_MS);
  return { durationMs, endsAtMs: nowMs + durationMs, pausedRemainingMs: null };
}

/** Time left, always computed from timestamps so it is exact after any gap. */
export function remainingMs(timer: RestTimer, nowMs: number): number {
  if (timer.pausedRemainingMs !== null) return timer.pausedRemainingMs;
  return Math.max(0, timer.endsAtMs - nowMs);
}

export function isFinished(timer: RestTimer, nowMs: number): boolean {
  return remainingMs(timer, nowMs) <= 0;
}

export function isPaused(timer: RestTimer): boolean {
  return timer.pausedRemainingMs !== null;
}

export function pauseTimer(timer: RestTimer, nowMs: number): RestTimer {
  if (isPaused(timer)) return timer;
  return { ...timer, pausedRemainingMs: remainingMs(timer, nowMs) };
}

export function resumeTimer(timer: RestTimer, nowMs: number): RestTimer {
  if (timer.pausedRemainingMs === null) return timer;
  return { ...timer, endsAtMs: nowMs + timer.pausedRemainingMs, pausedRemainingMs: null };
}

/** Adds or removes time. The total grows or shrinks too, so the progress bar stays truthful. */
export function adjustTimer(timer: RestTimer, deltaMs: number, nowMs: number): RestTimer {
  const remaining = remainingMs(timer, nowMs);
  const nextRemaining = clamp(remaining + deltaMs, 0, MAX_REST_MS);
  const applied = nextRemaining - remaining;
  const durationMs = Math.max(nextRemaining, timer.durationMs + applied);
  return isPaused(timer)
    ? { ...timer, durationMs, pausedRemainingMs: nextRemaining }
    : { ...timer, durationMs, endsAtMs: nowMs + nextRemaining };
}

/** 0 at the start, 1 when finished. */
export function timerProgress(timer: RestTimer, nowMs: number): number {
  if (timer.durationMs <= 0) return 1;
  return clamp(1 - remainingMs(timer, nowMs) / timer.durationMs, 0, 1);
}
