import type { SeedData } from '../seed';

export type CollectionKey = keyof SeedData;

export const COLLECTION_KEYS: readonly CollectionKey[] = [
  'session',
  'member',
  'trainers',
  'classes',
  'exercises',
  'workoutPlans',
  'membershipPlans',
  'membership',
  'bodyEntries',
  'personalRecords',
  'achievements',
  'workoutLog',
];
