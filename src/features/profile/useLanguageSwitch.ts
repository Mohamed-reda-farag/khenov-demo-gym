import { useCallback } from 'react';

import { prefsRepository } from '@/data/repository';
import type { Language } from '@/data/types';
import { setLanguage, useLanguage } from '@/i18n';

/** Switches language and layout direction instantly on every platform and remembers the choice. */
export function useLanguageSwitch() {
  const language = useLanguage();

  const request = useCallback(
    async (next: Language) => {
      if (next === language) return;
      await setLanguage(next);
      await prefsRepository.setLanguage(next);
    },
    [language],
  );

  return { language, request };
}
