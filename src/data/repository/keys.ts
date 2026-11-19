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
  'userSessions',
  'unlockedAchievements',
];

/** Stored on its own: absent when no workout is in progress, so it is not a seeded collection. */
export const ACTIVE_SESSION_KEY = 'activeSession';
