import { localBookingRepository, localClassRepository } from './local-bookings';
import {
  localExerciseRepository,
  localMemberRepository,
  localMembershipRepository,
  localTrainerRepository,
  localWorkoutPlanRepository,
} from './local-data';
import { localProgressRepository, localWorkoutSessionRepository } from './local-workout';
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
export const workoutSessionRepository = localWorkoutSessionRepository;
export const prefsRepository = localPrefsRepository;

export { onBookingsChanged, onWorkoutChanged } from './events';
export { BookingError, type BookingErrorCode } from '../rules/booking';
export { BodyError, type BodyErrorCode } from '../rules/body';
export { WorkoutError, type WorkoutErrorCode } from '../rules/workout';
export type * from './interfaces';
