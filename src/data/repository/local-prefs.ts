import { prefsStorage } from '@/lib/demo/storage';

import type { Prefs } from '../types';

import type { PrefsRepository } from './interfaces';

const PREFS_KEY = 'prefs';
const DEFAULT_PREFS: Prefs = { language: 'ar', theme: 'dark' };

async function read(): Promise<Prefs> {
  const stored = await prefsStorage.get<Partial<Prefs>>(PREFS_KEY);
  return { ...DEFAULT_PREFS, ...stored };
}

export const localPrefsRepository: PrefsRepository = {
  get: read,
  async setLanguage(language) {
    await prefsStorage.set(PREFS_KEY, { ...(await read()), language });
  },
  async setTheme(theme) {
    await prefsStorage.set(PREFS_KEY, { ...(await read()), theme });
  },
};
