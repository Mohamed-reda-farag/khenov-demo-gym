import type { TFunction } from 'i18next';

import { BookingError } from '@/data/repository';

/** Turns any thrown value into a message for the user, in the current language. */
export function bookingErrorMessage(t: TFunction, error: unknown): string {
  if (error instanceof BookingError) return t(`errors.booking.${error.code}`);
  return t('errors.generic');
}
