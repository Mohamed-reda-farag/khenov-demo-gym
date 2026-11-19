import { describe, expect, it } from 'vitest';

import { buildSeed } from '../../seed';
import { generateSeedHistory } from '../../seed/history';
import { workoutPlans } from '../../seed/plans';
import { evaluateAchievements } from '../achievements';
import { createActiveSession, logAllForTest } from './helpers';
import { toWorkoutSession } from '../activeSession';
import { activeDayKeys, currentStreak, detectSessionPrs, personalRecords } from '../workout';
import { dateKey } from '../sessions';

const nowAt = (offset: number, hour = 12) => new Date(2026, 10, 18 + offset, hour, 0);

describe('seed history relative to today', () => {
  it('always covers the last 8 weeks with 24 sessions, on 14 different days', () => {
    for (let offset = 0; offset < 14; offset += 1) {
      const now = nowAt(offset * 3);
      const history = generateSeedHistory(now, workoutPlans);
      expect(history).toHaveLength(24);
      const oldest = Date.parse(history[0]!.endedAt);
      const newest = Date.parse(history[history.length - 1]!.endedAt);
      expect(now.getTime() - oldest).toBeLessThanOrEqual(56 * 86_400_000);
      expect(newest).toBeLessThan(now.getTime());
      const times = history.map((s) => Date.parse(s.endedAt));
      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it('shifts the dates with today but keeps the same workouts', () => {
    const a = generateSeedHistory(nowAt(0), workoutPlans);
    const b = generateSeedHistory(nowAt(20), workoutPlans);
    expect(a.map((s) => s.exercises)).toEqual(b.map((s) => s.exercises));
    expect(a.map((s) => s.volumeKg)).toEqual(b.map((s) => s.volumeKg));
    expect(dateKey(new Date(b[23]!.endedAt))).toBe(dateKey(new Date(2026, 10, 18 + 20 - 1)));
  });

  it('ends with a six day streak and nothing logged today, on any day', () => {
    for (let offset = 0; offset < 14; offset += 1) {
      const now = nowAt(offset);
      const history = generateSeedHistory(now, workoutPlans);
      expect(currentStreak(history, now)).toBe(6);
      expect(activeDayKeys(history).has(dateKey(now))).toBe(false);
    }
  });

  it('lets the latest sessions hold the records, so records keep their meaning', () => {
    const now = nowAt(0);
    const history = generateSeedHistory(now, workoutPlans);
    const records = personalRecords(history);
    const bench = records.find((r) => r.exerciseId === 'bench-press');
    expect(bench?.weightKg).toBeGreaterThanOrEqual(75);
    expect(bench?.weightKg).toBeLessThanOrEqual(80);
    expect(records.length).toBeGreaterThanOrEqual(12);
  });
});

describe('achievements from real history', () => {
  const now = nowAt(0);
  const seed = buildSeed(now);
  const history = generateSeedHistory(now, workoutPlans);

  it('seeds the earned ones and leaves two almost done', () => {
    expect(Object.keys(seed.unlockedAchievements).sort()).toEqual(['first-pr', 'first-workout']);
    const { statuses } = evaluateAchievements(history, now, seed.unlockedAchievements);
    const byId = Object.fromEntries(statuses.map((s) => [s.id, s]));
    expect(byId['first-workout']?.unlockedAt).not.toBeNull();
    expect(byId['streak-7']).toMatchObject({ progress: 6, target: 7, unlockedAt: null });
    expect(byId['sessions-25']).toMatchObject({ progress: 24, target: 25, unlockedAt: null });
    expect(byId['volume-250t']?.unlockedAt).toBeNull();
    expect(byId['volume-250t']?.progress).toBeGreaterThan(150_000);
  });

  it('unlocks the seven day streak and the 25th session with one new workout today', () => {
    const plan = workoutPlans[0]!;
    const active = logAllForTest(createActiveSession(plan, now.getTime() - 40 * 60_000, 's-new'));
    const today = toWorkoutSession(active, now.getTime());
    const all = [...history, today];
    const { newlyUnlocked, statuses } = evaluateAchievements(all, now, seed.unlockedAchievements);
    expect(newlyUnlocked.sort()).toEqual(['sessions-25', 'streak-7']);
    expect(statuses.find((s) => s.id === 'streak-7')?.progress).toBe(7);
    expect(detectSessionPrs(history, today).some((h) => h.exerciseId === 'bench-press')).toBe(true);
  });

  it('never unlocks twice and keeps an unlock after the streak breaks', () => {
    const unlocked = { ...seed.unlockedAchievements, 'streak-7': nowAt(-30).toISOString() };
    const later = nowAt(10);
    const { statuses, newlyUnlocked } = evaluateAchievements(history, later, unlocked);
    expect(newlyUnlocked).not.toContain('streak-7');
    expect(statuses.find((s) => s.id === 'streak-7')?.unlockedAt).toBe(unlocked['streak-7']);
    expect(statuses.find((s) => s.id === 'streak-7')?.progress).toBe(7);
  });

  it('shows empty progress for a brand-new member', () => {
    const { statuses, newlyUnlocked } = evaluateAchievements([], now, {});
    expect(newlyUnlocked).toEqual([]);
    expect(statuses.every((s) => s.progress === 0 && s.unlockedAt === null)).toBe(true);
  });
});
