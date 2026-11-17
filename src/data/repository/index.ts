import { localBookingRepository, localClassRepository } from './local-bookings';
import {
  localExerciseRepository,
  localMemberRepository,
  localMembershipRepository,
  localProgressRepository,
  localTrainerRepository,
  localWorkoutPlanRepository,
} from './local-data';
import { localPrefsRepository } from './local-prefs';
import { localSessionRepository } from './local-session';

/** The only door the UI uses to reach data. Swap implementations here to change storage. */
export const sessionRepository = localSessionRepository;
export const memberRepository = localMemberRepository;
export const trainerRepository = localTrainerRepository;
export const classRepository = localClassRepository;
export const bookingRepository = localBookingRepository;
export const exerciseRepository = localExerciseRepository;
export const workoutPlanRepository = localWorkoutPlanRepository;
export const membershipRepository = localMembershipRepository;
export const progressRepository = localProgressRepository;
export const prefsRepository = localPrefsRepository;

export { onBookingsChanged } from './events';
export { BookingError, type BookingErrorCode } from '../rules/booking';
export type * from './interfaces';
