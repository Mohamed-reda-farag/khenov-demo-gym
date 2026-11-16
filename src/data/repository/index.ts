import {
  localClassRepository,
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
export const exerciseRepository = localExerciseRepository;
export const workoutPlanRepository = localWorkoutPlanRepository;
export const membershipRepository = localMembershipRepository;
export const progressRepository = localProgressRepository;
export const prefsRepository = localPrefsRepository;

export type * from './interfaces';
