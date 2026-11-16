import { FAST_MODE } from './fast-mode';

/** Simulates network latency. Resolves immediately in fast mode (`?demo=fast`). */
export function delay(min = 200, max = 600): Promise<void> {
  if (FAST_MODE) return Promise.resolve();
  const ms = min + Math.random() * Math.max(0, max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
