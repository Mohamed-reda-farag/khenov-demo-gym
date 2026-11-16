import { useEffect, useState } from 'react';

import { prefsRepository } from '@/data/repository';
import type { Prefs } from '@/data/types';
import { initI18n } from '@/i18n';
import { ensureSeeded } from '@/lib/demo/seed';
import { purgeStaleNamespaces } from '@/lib/demo/storage';

export type BootState = { status: 'loading' } | { status: 'ready'; prefs: Prefs };

const FALLBACK_PREFS: Prefs = { language: 'ar', theme: 'dark' };

/** Seeds data, loads preferences and starts i18n before the first screen renders. */
export function useBootstrap(): BootState {
  const [state, setState] = useState<BootState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    async function boot(): Promise<BootState> {
      let prefs = FALLBACK_PREFS;
      try {
        await purgeStaleNamespaces();
        await ensureSeeded();
        prefs = await prefsRepository.get();
      } catch {
        // storage problems must never block the demo; defaults apply
      }
      await initI18n(prefs.language);
      return { status: 'ready', prefs };
    }

    boot().then((next) => {
      if (active) setState(next);
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
