import { demoStorage } from './storage';
import { seedDemoData } from './seed';

/** Clears the demo namespace and reseeds it. Callers must confirm with the user first. */
export async function resetDemo(): Promise<void> {
  await demoStorage.clear();
  await seedDemoData();
}
