import { COLLECTION_KEYS } from '@/data/repository/keys';
import { buildSeed } from '@/data/seed';

import { demoStorage } from './storage';

const SEEDED_MARKER = '__seeded';

/** Writes every seed collection into the current namespace. */
export async function seedDemoData(now: Date = new Date()): Promise<void> {
  const seed = buildSeed(now);
  for (const key of COLLECTION_KEYS) {
    await demoStorage.set(key, seed[key]);
  }
  await demoStorage.set(SEEDED_MARKER, true);
}

/** Seeds only when the current namespace is empty (first launch or new SEED_VERSION). */
export async function ensureSeeded(): Promise<void> {
  const seeded = await demoStorage.get<boolean>(SEEDED_MARKER);
  if (!seeded) await seedDemoData();
}
