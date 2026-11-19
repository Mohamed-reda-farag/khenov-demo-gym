import type { TFunction } from 'i18next';

import { BodyError, BookingError, WorkoutError } from '@/data/repository';

/** Turns any thrown value into a message for the user, in the current language. */
export function errorMessage(t: TFunction, error: unknown): string {
  if (error instanceof WorkoutError) return t(`errors.workout.${error.code}`);
  if (error instanceof BodyError) return t(`errors.body.${error.code}`);
  if (error instanceof BookingError) return t(`errors.booking.${error.code}`);
  return t('errors.generic');
}
