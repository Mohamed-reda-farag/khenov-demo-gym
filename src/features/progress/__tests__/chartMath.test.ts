import { describe, expect, it } from 'vitest';

import type { WorkoutSession } from '@/data/types';

import {
  filterByRange,
  linePath,
  nearestIndex,
  niceDomain,
  summarize,
  timeFractions,
  volumeWeeks,
  weeklyVolumes,
  xAt,
} from '../chartMath';

const NOW = new Date(2026, 10, 18, 12);
const daysAgo = (n: number) => new Date(2026, 10, 18 - n, 9).toISOString();

describe('range filter', () => {
  const items = [60, 40, 20, 10, 1].map((n) => ({ date: daysAgo(n), n }));

  it('keeps the last 4 or 8 weeks, or everything', () => {
    expect(filterByRange(items, '4w', NOW).map((i) => i.n)).toEqual([20, 10, 1]);
    expect(filterByRange(items, '8w', NOW).map((i) => i.n)).toEqual([40, 20, 10, 1]);
    expect(filterByRange(items, 'all', NOW)).toHaveLength(5);
  });
});

describe('summary for the text version of a chart', () => {
  it('reports latest, lowest, highest and the trend', () => {
    expect(summarize([83.6, 82, 80.2, 79.6])).toEqual({
      first: 83.6,
      latest: 79.6,
      min: 79.6,
      max: 83.6,
      delta: -4,
      trend: 'down',
    });
    expect(summarize([30, 31, 32.5])?.trend).toBe('up');
    expect(summarize([80, 81, 80.02])?.trend).toBe('flat');
    expect(summarize([75])).toMatchObject({ latest: 75, min: 75, max: 75, trend: 'flat' });
    expect(summarize([])).toBeNull();
  });
});

describe('scales', () => {
  it('pads the vertical range and never returns an empty one', () => {
    const [lo, hi] = niceDomain(80, 90);
    expect(lo).toBeLessThan(80);
    expect(hi).toBeGreaterThan(90);
    expect(niceDomain(70, 70)).toEqual([69, 71]);
  });

  it('puts the newest point on the right in LTR and on the left in RTL', () => {
    const layout = { width: 300, padStart: 20, padEnd: 20, rtl: false };
    expect(xAt(0, layout)).toBe(20);
    expect(xAt(1, layout)).toBe(280);
    const mirrored = { ...layout, rtl: true };
    expect(xAt(0, mirrored)).toBe(280);
    expect(xAt(1, mirrored)).toBe(20);
    expect(xAt(0.5, layout)).toBe(xAt(0.5, mirrored));
  });

  it('spaces points by time and centres a single point', () => {
    expect(timeFractions([0, 10, 40])).toEqual([0, 0.25, 1]);
    expect(timeFractions([5])).toEqual([0.5]);
    expect(timeFractions([])).toEqual([]);
  });

  it('finds the point nearest to a touch in both directions', () => {
    const fractions = [0, 0.5, 1];
    const ltr = { width: 300, padStart: 20, padEnd: 20, rtl: false };
    expect(nearestIndex(25, fractions, ltr)).toBe(0);
    expect(nearestIndex(150, fractions, ltr)).toBe(1);
    expect(nearestIndex(290, fractions, ltr)).toBe(2);
    const rtl = { ...ltr, rtl: true };
    expect(nearestIndex(25, fractions, rtl)).toBe(2);
    expect(nearestIndex(290, fractions, rtl)).toBe(0);
  });

  it('builds a path', () => {
    expect(
      linePath([
        { x: 1, y: 2 },
        { x: 3.14159, y: 4 },
      ]),
    ).toBe('M1.0 2.0 L3.1 4.0');
  });
});

describe('weekly volume', () => {
  const session = (n: number, volumeKg: number): WorkoutSession => ({
    id: `s${n}`,
    planId: 'p',
    startedAt: daysAgo(n),
    endedAt: daysAgo(n),
    durationSec: 3600,
    exercises: [],
    volumeKg,
    setsCompleted: 0,
    partial: false,
    unlockedAchievementIds: [],
  });

  it('groups by week starting Saturday and fills empty weeks with zero', () => {
    // 2026-11-18 is a Wednesday, so this week started on Saturday 14 November.
    const weeks = weeklyVolumes([session(1, 1000), session(2, 500), session(9, 700)], NOW, 4);
    expect(weeks).toHaveLength(4);
    expect(weeks[3]?.volumeKg).toBe(1500);
    expect(weeks[2]?.volumeKg).toBe(700);
    expect(weeks[0]?.volumeKg).toBe(0);
    expect(weeks[3]!.weekStart.getDay()).toBe(6);
  });

  it('chooses how many weeks to show for each range', () => {
    expect(volumeWeeks('4w', [], NOW)).toBe(4);
    expect(volumeWeeks('8w', [], NOW)).toBe(8);
    expect(volumeWeeks('all', [], NOW)).toBe(4);
    expect(volumeWeeks('all', [session(50, 1)], NOW)).toBeGreaterThanOrEqual(8);
  });
});
