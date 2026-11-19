import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * The current time, refreshed every `everyMs` while `active`. It also refreshes the moment the
 * app returns to the foreground, so a countdown is right after time in the background.
 * Only the component that calls this re-renders.
 */
export function useNow(everyMs: number, active = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, everyMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [everyMs, active]);

  return now;
}
