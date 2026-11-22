import type { BodyEntry } from '../types';

const weights = [83.6, 83.0, 82.4, 81.9, 81.1, 80.6, 80.2, 79.6];
const waists = [92.0, 91.5, 90.8, 90.2, 89.6, 89.1, 88.6, 88.0];
const chests = [101.0, 101.2, 101.4, 101.7, 102.0, 102.2, 102.4, 102.6];
const arms = [32.5, 32.7, 32.8, 33.0, 33.1, 33.2, 33.3, 33.4];

function daysAgo(now: Date, days: number): string {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, 8, 0).toISOString();
}

/** Eight weekly check-ins ending today, oldest first. Shown dates follow today at read time. */
export function buildBodyEntries(now: Date): BodyEntry[] {
  return weights.map((weightKg, i) => ({
    id: `body-${i + 1}`,
    date: daysAgo(now, (weights.length - 1 - i) * 7),
    weightKg,
    waistCm: waists[i] ?? 0,
    chestCm: chests[i] ?? 0,
    armCm: arms[i] ?? 0,
    seedOffsetDays: (weights.length - 1 - i) * 7,
  }));
}
