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

const WEEKDAYS: Record<Language, { long: string[]; short: string[] }> = {
  ar: {
    long: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    short: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  },
  en: {
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
};

const MONTHS: Record<Language, string[]> = {
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

/** Weekday and month names are fixed tables, so they never depend on device Intl data. */
export function formatWeekday(date: Date, language: Language, style: 'long' | 'short'): string {
  return WEEKDAYS[language][style][date.getDay()] ?? '';
}

export function formatDayMonth(date: Date, language: Language): string {
  const day = formatNumber(date.getDate(), language);
  return `${day} ${MONTHS[language][date.getMonth()] ?? ''}`;
}

export function formatTimeOfDay(date: Date, language: Language): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return formatClock(`${hh}:${mm}`, language);
}

export function formatTimeRange(startIso: string, endIso: string, language: Language): string {
  return `${formatTimeOfDay(new Date(startIso), language)} – ${formatTimeOfDay(new Date(endIso), language)}`;
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
      weekday: (date: Date, style: 'long' | 'short' = 'long') =>
        formatWeekday(date, language, style),
      dayMonth: (date: Date) => formatDayMonth(date, language),
      time: (iso: string) => formatTimeOfDay(new Date(iso), language),
      timeRange: (startIso: string, endIso: string) => formatTimeRange(startIso, endIso, language),
    }),
    [language],
  );
}
