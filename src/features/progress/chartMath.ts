import { addDays, dateKey, parseDateKey, weekStartSaturday } from '@/data/rules/sessions';
import type { WorkoutSession } from '@/data/types';

export type Range = '4w' | '8w' | 'all';

const DAY_MS = 86_400_000;

/** Start of the range in milliseconds, or null for "all". */
export function rangeStart(range: Range, now: Date): number | null {
  if (range === 'all') return null;
  const weeks = range === '4w' ? 4 : 8;
  return now.getTime() - weeks * 7 * DAY_MS;
}

export function filterByRange<T extends { date: string }>(
  items: T[],
  range: Range,
  now: Date,
): T[] {
  const start = rangeStart(range, now);
  return start === null ? items : items.filter((item) => Date.parse(item.date) >= start);
}

export interface ValueSummary {
  first: number;
  latest: number;
  min: number;
  max: number;
  delta: number;
  trend: 'up' | 'down' | 'flat';
}

/** Numbers for the text version of a chart. Changes smaller than 0.05 count as flat. */
export function summarize(values: number[]): ValueSummary | null {
  const first = values[0];
  const latest = values[values.length - 1];
  if (first === undefined || latest === undefined) return null;
  const delta = Math.round((latest - first) * 100) / 100;
  return {
    first,
    latest,
    min: Math.min(...values),
    max: Math.max(...values),
    delta,
    trend: Math.abs(delta) < 0.05 ? 'flat' : delta > 0 ? 'up' : 'down',
  };
}

/** Vertical range with some breathing room, never empty. */
export function niceDomain(min: number, max: number): [number, number] {
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.12;
  return [min - pad, max + pad];
}

interface Layout {
  width: number;
  padStart: number;
  padEnd: number;
  /** In a right-to-left layout time runs from right to left. */
  rtl: boolean;
}

/** Horizontal position of a fraction (0 = oldest, 1 = newest) of the time axis. */
export function xAt(fraction: number, { width, padStart, padEnd, rtl }: Layout): number {
  const plot = Math.max(0, width - padStart - padEnd);
  const along = padStart + fraction * plot;
  return rtl ? width - along : along;
}

/** Index of the item whose position is closest to a touch at `x`. */
export function nearestIndex(x: number, fractions: number[], layout: Layout): number {
  let best = 0;
  let distance = Infinity;
  fractions.forEach((fraction, i) => {
    const d = Math.abs(xAt(fraction, layout) - x);
    if (d < distance) {
      distance = d;
      best = i;
    }
  });
  return best;
}

/** Position of every timestamp as a fraction of the time span. One point sits in the middle. */
export function timeFractions(times: number[]): number[] {
  const first = times[0];
  const last = times[times.length - 1];
  if (first === undefined || last === undefined || first === last) return times.map(() => 0.5);
  return times.map((t) => (t - first) / (last - first));
}

export function linePath(points: { x: number; y: number }[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

export interface WeekVolume {
  weekStart: Date;
  volumeKg: number;
}

/** Total weight lifted per week (weeks start on Saturday), oldest first. */
export function weeklyVolumes(sessions: WorkoutSession[], now: Date, weeks: number): WeekVolume[] {
  const current = weekStartSaturday(now);
  const starts = Array.from({ length: weeks }, (_, i) => addDays(current, -(weeks - 1 - i) * 7));
  return starts.map((weekStart) => {
    const from = weekStart.getTime();
    const to = addDays(weekStart, 7).getTime();
    const volumeKg = sessions
      .filter((s) => {
        const end = Date.parse(s.endedAt);
        return end >= from && end < to;
      })
      .reduce((sum, s) => sum + s.volumeKg, 0);
    return { weekStart, volumeKg };
  });
}

/** How many weeks the volume chart shows for a range. "All" shows every week with workouts. */
export function volumeWeeks(range: Range, sessions: WorkoutSession[], now: Date): number {
  if (range === '4w') return 4;
  if (range === '8w') return 8;
  const first = sessions[0];
  if (!first) return 4;
  const spanDays =
    (weekStartSaturday(now).getTime() - parseDateKey(dateKey(new Date(first.endedAt))).getTime()) /
    DAY_MS;
  return Math.max(4, Math.min(26, Math.ceil(spanDays / 7) + 1));
}
