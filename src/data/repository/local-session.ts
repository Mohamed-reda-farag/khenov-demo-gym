import type { SessionState } from '../types';

import type { SessionRepository } from './interfaces';
import { readCollection, writeCollection } from './local-core';

const QUICK = [60, 140] as const;

async function update(patch: Partial<SessionState>, latency: readonly [number, number]) {
  const current = await readCollection('session', QUICK);
  const next = { ...current, ...patch };
  await writeCollection('session', next, latency);
  return next;
}

export const localSessionRepository: SessionRepository = {
  get: () => readCollection('session', QUICK),
  completeOnboarding: () => update({ onboardingDone: true }, QUICK),
  loginAsDemoMember: () => update({ loggedIn: true, onboardingDone: true }, [400, 800]),
};
