import type { SeedData } from '../seed';

export type CollectionKey = keyof SeedData;

export const COLLECTION_KEYS: readonly CollectionKey[] = [
  'session',
  'member',
  'trainers',
  'classTemplates',
  'exercises',
  'workoutPlans',
  'workoutSchedule',
  'bookingState',
  'membershipPlans',
  'membership',
  'bodyEntries',
  'personalRecords',
  'achievements',
  'workoutLog',
];
