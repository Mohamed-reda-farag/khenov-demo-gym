import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { sessionRepository } from '@/data/repository';
import type { SessionState } from '@/data/types';

type Status = 'loading' | 'ready';

interface SessionContextValue {
  status: Status;
  session: SessionState;
  completeOnboarding: () => Promise<void>;
  loginAsDemoMember: () => Promise<void>;
  /** Re-reads the session from storage, e.g. after Reset demo. */
  reload: () => Promise<void>;
}

const INITIAL: SessionState = { onboardingDone: false, loggedIn: false };

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<SessionState>(INITIAL);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      setSession(await sessionRepository.get());
    } catch {
      setSession(INITIAL);
    }
    setStatus('ready');
  }, []);

  useEffect(() => {
    let active = true;
    sessionRepository
      .get()
      .then((next) => {
        if (active) setSession(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setStatus('ready');
      });
    return () => {
      active = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    setSession(await sessionRepository.completeOnboarding());
  }, []);

  const loginAsDemoMember = useCallback(async () => {
    setSession(await sessionRepository.loginAsDemoMember());
  }, []);

  const value = useMemo(
    () => ({ status, session, completeOnboarding, loginAsDemoMember, reload }),
    [status, session, completeOnboarding, loginAsDemoMember, reload],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
