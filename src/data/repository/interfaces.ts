import type {
  Achievement,
  BodyEntry,
  Exercise,
  ClassSessionView,
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
  /** Every session of the rolling two-week window, with this member's booking state. */
  listSessions(): Promise<ClassSessionView[]>;
  getSession(sessionId: string): Promise<ClassSessionView>;
  /** Booked sessions that have not started yet, soonest first. */
  listUpcomingBooked(): Promise<ClassSessionView[]>;
}

/** Every method enforces the booking rules and rejects with a typed `BookingError`. */
export interface BookingRepository {
  book(sessionId: string): Promise<ClassSessionView>;
  cancel(sessionId: string): Promise<ClassSessionView>;
  joinWaitlist(sessionId: string): Promise<ClassSessionView>;
  leaveWaitlist(sessionId: string): Promise<ClassSessionView>;
  undoBook(sessionId: string): Promise<ClassSessionView>;
  undoCancel(sessionId: string): Promise<ClassSessionView>;
  /** Simulates other members cancelling; returns the sessions that just got confirmed. */
  settleWaitlist(): Promise<ClassSessionView[]>;
}

export interface ExerciseRepository {
  list(): Promise<Exercise[]>;
}

export interface WorkoutPlanRepository {
  list(): Promise<WorkoutPlan[]>;
  /** The plan scheduled for today, or null on a rest day. */
  getForToday(now?: Date): Promise<WorkoutPlan | null>;
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
