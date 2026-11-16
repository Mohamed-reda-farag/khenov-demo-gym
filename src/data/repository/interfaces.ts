import type {
  Achievement,
  BodyEntry,
  Exercise,
  GymClass,
  Member,
  Membership,
  MembershipPlan,
  PersonalRecord,
  Prefs,
  SessionState,
  Trainer,
  WorkoutLogEntry,
  WorkoutPlan,
} from '../types';

export interface SessionRepository {
  get(): Promise<SessionState>;
  completeOnboarding(): Promise<SessionState>;
  loginAsDemoMember(): Promise<SessionState>;
}

export interface MemberRepository {
  get(): Promise<Member>;
}

export interface TrainerRepository {
  list(): Promise<Trainer[]>;
}

export interface ClassRepository {
  list(): Promise<GymClass[]>;
}

export interface ExerciseRepository {
  list(): Promise<Exercise[]>;
}

export interface WorkoutPlanRepository {
  list(): Promise<WorkoutPlan[]>;
}

export interface MembershipRepository {
  listPlans(): Promise<MembershipPlan[]>;
  getCurrent(): Promise<Membership>;
}

export interface ProgressRepository {
  listBodyEntries(): Promise<BodyEntry[]>;
  listPersonalRecords(): Promise<PersonalRecord[]>;
  listAchievements(): Promise<Achievement[]>;
  listWorkoutLog(): Promise<WorkoutLogEntry[]>;
}

export interface PrefsRepository {
  get(): Promise<Prefs>;
  setLanguage(language: Prefs['language']): Promise<void>;
  setTheme(theme: Prefs['theme']): Promise<void>;
}
