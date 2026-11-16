import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { FAST_MODE } from '@/lib/demo/fast-mode';

import { SplashView } from './SplashView';
import { useSession } from './SessionProvider';

const MIN_SPLASH_MS = FAST_MODE ? 250 : 1500;

/** Entry route: plays the splash, then sends the visitor to the right step of the journey. */
export function SplashGate() {
  const { status, session } = useSession();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!minElapsed || status !== 'ready') return <SplashView />;
  if (!session.onboardingDone) return <Redirect href="/onboarding" />;
  if (!session.loggedIn) return <Redirect href="/login" />;
  return <Redirect href="/home" />;
}
