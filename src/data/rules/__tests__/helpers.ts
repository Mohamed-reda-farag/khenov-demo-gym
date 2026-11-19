import { createActiveSession, goTo, logSet } from '../activeSession';
import type { ActiveSession } from '../../types';

export { createActiveSession };

/** Logs every planned set with a fixed weight, as a quick way to finish a plan in tests. */
export function logAllForTest(session: ActiveSession, weightKg = 100): ActiveSession {
  let current = session;
  for (let i = 0; i < current.exercises.length; i += 1) {
    current = goTo(current, i);
    while ((current.exercises[i]?.sets.length ?? 0) < (current.exercises[i]?.targetSets ?? 0)) {
      current = logSet(current, { weightKg, reps: 8 }, session.startedAtMs);
    }
  }
  return current;
}
