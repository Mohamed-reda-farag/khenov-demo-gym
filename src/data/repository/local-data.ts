import type {
  ClassRepository,
  ExerciseRepository,
  MemberRepository,
  MembershipRepository,
  ProgressRepository,
  TrainerRepository,
  WorkoutPlanRepository,
} from './interfaces';
import { readCollection } from './local-core';

export const localMemberRepository: MemberRepository = {
  get: () => readCollection('member'),
};

export const localTrainerRepository: TrainerRepository = {
  list: () => readCollection('trainers'),
};

export const localClassRepository: ClassRepository = {
  list: () => readCollection('classes'),
};

export const localExerciseRepository: ExerciseRepository = {
  list: () => readCollection('exercises'),
};

export const localWorkoutPlanRepository: WorkoutPlanRepository = {
  list: () => readCollection('workoutPlans'),
};

export const localMembershipRepository: MembershipRepository = {
  listPlans: () => readCollection('membershipPlans'),
  getCurrent: () => readCollection('membership'),
};

export const localProgressRepository: ProgressRepository = {
  listBodyEntries: () => readCollection('bodyEntries'),
  listPersonalRecords: () => readCollection('personalRecords'),
  listAchievements: () => readCollection('achievements'),
  listWorkoutLog: () => readCollection('workoutLog'),
};
