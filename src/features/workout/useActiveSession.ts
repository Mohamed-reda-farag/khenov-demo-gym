import { useCallback, useRef, useState } from 'react';

import { workoutSessionRepository } from '@/data/repository';
import type { ActiveSession } from '@/data/types';

/**
 * Holds the live session in state and saves it after every change, so closing the app loses
 * nothing. `apply` runs a pure rule from `data/rules/activeSession` with the current time.
 * Rules may throw a typed `WorkoutError`; callers decide how to show it.
 */
export function useActiveSession(initial: ActiveSession) {
  const latest = useRef(initial);
  const [session, setSession] = useState(initial);

  const apply = useCallback((change: (s: ActiveSession, nowMs: number) => ActiveSession) => {
    const next = change(latest.current, Date.now());
    latest.current = next;
    setSession(next);
    void workoutSessionRepository.saveActive(next);
    return next;
  }, []);

  const getLatest = useCallback(() => latest.current, []);

  return { session, apply, getLatest };
}
