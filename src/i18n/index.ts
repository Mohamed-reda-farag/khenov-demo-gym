import i18next, { changeLanguage } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import type { Language } from '@/data/types';

import ar from './ar.json';
import en from './en.json';

const instance = i18next;

export async function initI18n(language: Language): Promise<void> {
  if (i18next.isInitialized) {
    await changeLanguage(language);
    return;
  }
  await instance.use(initReactI18next).init({
    resources: { ar: { translation: ar }, en: { translation: en } },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export async function setLanguage(language: Language): Promise<void> {
  await changeLanguage(language);
}

export function useLanguage(): Language {
  const { i18n } = useTranslation();
  return i18n.language === 'en' ? 'en' : 'ar';
}
