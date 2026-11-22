import { delay } from '@/lib/demo/delay';
import { hasDemoFlag } from '@/lib/demo/flags';

import { generateSeedHistory } from '../seed/history';
import { historyVisits, newestFirst, recordScan } from '../rules/visits';
import type { Visit } from '../types';

import { loadMembershipView } from './local-data';
import type { VisitRepository } from './interfaces';
import { readCollection, serial, writeCollection } from './local-core';

const QUICK = [0, 0] as const;

/** `?demo=empty` leaves out the generated visits, so the empty state can be reached. */
async function loadAll(now: Date): Promise<Visit[]> {
  const stored = await readCollection('visits', QUICK);
  if (hasDemoFlag('empty')) return newestFirst(stored);
  const plans = await readCollection('workoutPlans', QUICK);
  return newestFirst([...historyVisits(generateSeedHistory(now, plans)), ...stored]);
}

export const localVisitRepository: VisitRepository = {
  async list() {
    await delay();
    return loadAll(new Date());
  },

  async recordScan() {
    // The scanner takes a moment to read the code.
    await delay(500, 900);
    return serial(async () => {
      const now = new Date();
      const [view, all, stored] = await Promise.all([
        loadMembershipView(now),
        loadAll(now),
        readCollection('visits', QUICK),
      ]);
      const visit = recordScan(all, view, now, `visit-${now.getTime()}`);
      await writeCollection('visits', [...stored, visit], QUICK);
      return visit;
    });
  },
};
