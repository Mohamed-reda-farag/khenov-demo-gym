import { useMemo } from 'react';

import type { Language } from '@/data/types';
import { useLanguage } from '@/i18n';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toArabicDigits(text: string): string {
  return text.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)] ?? d);
}

export function formatNumber(value: number, language: Language, maximumFractionDigits = 0): string {
  let base: string;
  try {
    base = new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
  } catch {
    base = String(Math.round(value));
  }
  return language === 'ar' ? toArabicDigits(base).replace(/,/g, '٬').replace(/\./g, '٫') : base;
}

export function formatCurrency(valueEgp: number, language: Language): string {
  const amount = formatNumber(valueEgp, language, 0);
  return language === 'ar' ? `${amount} ج.م` : `EGP ${amount}`;
}

export function formatDate(
  iso: string,
  language: Language,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  try {
    const text = new Intl.DateTimeFormat(locale, options).format(new Date(iso));
    return language === 'ar' ? toArabicDigits(text) : text;
  } catch {
    return iso.slice(0, 10);
  }
}

/** Formats a 24h "HH:mm" string as 12h time with ص/م or AM/PM. */
export function formatClock(time24: string, language: Language): string {
  const [hh = '0', mm = '00'] = time24.split(':');
  const hour = Number(hh);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = language === 'ar' ? (hour < 12 ? 'ص' : 'م') : hour < 12 ? 'AM' : 'PM';
  const text = `${hour12}:${mm}`;
  return `${language === 'ar' ? toArabicDigits(text) : text} ${suffix}`;
}

export function useFormat() {
  const language = useLanguage();
  return useMemo(
    () => ({
      language,
      number: (value: number, fractionDigits = 0) => formatNumber(value, language, fractionDigits),
      currency: (valueEgp: number) => formatCurrency(valueEgp, language),
      date: (iso: string, options?: Intl.DateTimeFormatOptions) =>
        formatDate(iso, language, options),
      clock: (time24: string) => formatClock(time24, language),
    }),
    [language],
  );
}
