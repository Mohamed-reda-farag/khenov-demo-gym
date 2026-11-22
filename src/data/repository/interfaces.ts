import type {
  ActiveSession,
  AppNotification,
  AchievementStatus,
  BodyDraft,
  BodyEntry,
  Exercise,
  ClassSessionView,
  Member,
  Membership,
  MembershipPlan,
  NotificationSettings,
  ProfileDraft,
  PaymentDraft,
  PersonalRecord,
  RenewalResult,
  ScheduleEntry,
  Prefs,
  SessionState,
  Trainer,
  Visit,
  PrHit,
  WorkoutSession,
  WorkoutPlan,
} from '../types';

export interface SessionRepository {
  get(): Promise<SessionState>;
  completeOnboarding(): Promise<SessionState>;
  loginAsDemoMember(): Promise<SessionState>;
}

export interface MemberRepository {
  get(): Promise<Member>;
  /** Name in both languages and initials only. Rejects with a typed `ProfileError`. */
  updateProfile(draft: ProfileDraft): Promise<Member>;
}

export interface VisitRepository {
  /** Scanned passes plus the generated visits of the last weeks, newest first. */
  list(): Promise<Visit[]>;
  /** Simulated scan at the door. Rejects with a typed `VisitError`. */
  recordScan(): Promise<Visit>;
}

export interface NotificationRepository {
  /** Newest first. */
  list(): Promise<AppNotification[]>;
  unreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  getSettings(): Promise<NotificationSettings>;
  setSetting(key: keyof NotificationSettings, value: boolean): Promise<NotificationSettings>;
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
  getSchedule(): Promise<ScheduleEntry[]>;
}

export interface MembershipRepository {
  listPlans(): Promise<MembershipPlan[]>;
  /** Status (active, expired) is worked out from the dates at read time. */
  getCurrent(): Promise<Membership>;
  /** Mock checkout. Rejects with a typed `MembershipError`; nothing is charged. */
  renew(planId: string, payment: PaymentDraft): Promise<RenewalResult>;
}

export interface ProgressRepository {
  /** Oldest first. */
  listBodyEntries(): Promise<BodyEntry[]>;
  addBodyEntry(draft: BodyDraft): Promise<BodyEntry>;
  /** Returns the new entry and the one it replaced, so the change can be undone. */
  updateBodyEntry(id: string, draft: BodyDraft): Promise<{ entry: BodyEntry; previous: BodyEntry }>;
  removeBodyEntry(id: string): Promise<BodyEntry>;
  restoreBodyEntry(entry: BodyEntry): Promise<void>;
  /** The generated history of the last weeks plus workouts done in this demo, oldest first. */
  listSessions(): Promise<WorkoutSession[]>;
  listPersonalRecords(): Promise<PersonalRecord[]>;
  listAchievements(): Promise<AchievementStatus[]>;
  getStreak(): Promise<number>;
}

export interface FinishResult {
  session: WorkoutSession;
  prs: PrHit[];
  newlyUnlocked: AchievementStatus[];
  streak: number;
}

export interface SessionSummary {
  session: WorkoutSession;
  prs: PrHit[];
  unlocked: AchievementStatus[];
  streak: number;
}

/** Rules are enforced here and reported as typed `WorkoutError` / `BodyError`. */
export interface WorkoutSessionRepository {
  getActive(): Promise<ActiveSession | null>;
  start(planId: string): Promise<ActiveSession>;
  /** Called after every change so the session survives a restart. Fast, no simulated delay. */
  saveActive(session: ActiveSession): Promise<void>;
  discardActive(): Promise<void>;
  finish(session: ActiveSession): Promise<FinishResult>;
  getSummary(sessionId: string): Promise<SessionSummary>;
}

export interface PrefsRepository {
  get(): Promise<Prefs>;
  setLanguage(language: Prefs['language']): Promise<void>;
  setTheme(theme: Prefs['theme']): Promise<void>;
}
