import { delay } from '@/lib/demo/delay';
import { hasDemoFlag } from '@/lib/demo/flags';
import { seedDemoData } from '@/lib/demo/seed';
import { demoStorage } from '@/lib/demo/storage';

import type { SeedData } from '../seed';

import type { CollectionKey } from './keys';

type Latency = readonly [min: number, max: number];

const DEFAULT_LATENCY: Latency = [200, 600];

/** Reads a collection. If storage was cleared behind our back, reseeds instead of failing. */
export async function readCollection<K extends CollectionKey>(
  key: K,
  latency: Latency = DEFAULT_LATENCY,
): Promise<SeedData[K]> {
  await delay(latency[0], latency[1]);
  // `?demo=error`: every screen shows its error state. The session is spared so the app still opens.
  if (key !== 'session' && hasDemoFlag('error')) throw new Error('Demo error mode');
  let value = await demoStorage.get<SeedData[K]>(key);
  if (value === null) {
    await seedDemoData();
    value = await demoStorage.get<SeedData[K]>(key);
  }
  if (value === null) throw new Error(`Collection unavailable: ${key}`);
  return value;
}

export async function writeCollection<K extends CollectionKey>(
  key: K,
  value: SeedData[K],
  latency: Latency = DEFAULT_LATENCY,
): Promise<void> {
  await delay(latency[0], latency[1]);
  await demoStorage.set(key, value);
}

/** Read-modify-write on stored data must never interleave. Tasks run one after another. */
let queue: Promise<unknown> = Promise.resolve();
export function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
}
