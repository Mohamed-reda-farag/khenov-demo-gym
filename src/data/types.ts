export type Language = 'ar' | 'en';

export interface Localized {
  ar: string;
  en: string;
}

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body';
export type Equipment =
  'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'cardio' | 'kettlebell';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type ClassCategory = 'strength' | 'cardio' | 'hiit' | 'mind_body';

export interface Member {
  id: string;
  name: Localized;
  goal: Localized;
  joinedAt: string;
  heightCm: number;
  membershipPlanId: string;
  /** Overrides the initials made from the name. */
  initials?: string;
}

export interface Trainer {
  id: string;
  name: Localized;
  specialty: Localized;
  bio: Localized;
  yearsExperience: number;
}

/** A recurring weekly class. Real sessions are generated from templates for a rolling window. */
export interface ClassTemplate {
  id: string;
  name: Localized;
  trainerId: string;
  /** 0 = Sunday ... 6 = Saturday */
  dayOfWeek: number;
  /** 24h "HH:mm", local time */
  startTime: string;
  durationMin: number;
  capacity: number;
  /** Seats already taken by other members, before the demo member books. */
  baseBooked: number;
  /** Other members already waiting, before the demo member joins. */
  baseWaitlist: number;
  level: Level;
  category: ClassCategory;
  room: Localized;
  description: Localized;
  requirements: Localized[];
}

export type ClassSlotState = 'open' | 'full' | 'booked' | 'waitlisted' | 'ended';

export interface Booking {
  /** One booking per session, so the id is derived from the session id. */
  id: string;
  sessionId: string;
  templateId: string;
  startAt: string;
  endAt: string;
  status: 'booked' | 'waitlisted';
  /** 'demo' bookings come from a standing demo slot and follow today's date at runtime. */
  source: 'user' | 'demo';
  createdAt: string;
  waitlistPosition: number | null;
  /** Demo simulation: when a waitlisted booking is promoted because someone else cancelled. */
  promotionDueAt: string | null;
}

/** Changes to the "other members" numbers of one session (promotions, simulated cancellations). */
export interface SessionAdjustment {
  booked: number;
  waitlist: number;
}

export interface CancellationUndo {
  booking: Booking;
  adjustmentBefore: SessionAdjustment;
  expiresAt: string;
}

/** A class the demo member is always booked into: the next upcoming occurrence, at runtime. */
export interface DemoSlot {
  templateId: string;
  /** 'released' once the member cancels it, so it never comes back by itself. */
  status: 'active' | 'released';
}

export interface BookingState {
  bookings: Booking[];
  demoSlots: DemoSlot[];
  adjustments: Record<string, SessionAdjustment>;
  lastCancellation: CancellationUndo | null;
}

export interface ScheduleEntry {
  /** 0 = Sunday ... 6 = Saturday */
  dayOfWeek: number;
  planId: string;
}

export interface ClassSessionView {
  id: string;
  templateId: string;
  name: Localized;
  description: Localized;
  requirements: Localized[];
  trainer: Trainer;
  room: Localized;
  level: Level;
  category: ClassCategory;
  durationMin: number;
  startAt: string;
  endAt: string;
  capacity: number;
  bookedCount: number;
  spotsLeft: number;
  waitlistCount: number;
  slot: ClassSlotState;
  waitlistPosition: number | null;
  /** True while the member may still cancel (booked and at least the cutoff before start). */
  canCancel: boolean;
  cancelDeadline: string;
}

export interface Exercise {
  id: string;
  name: Localized;
  muscle: MuscleGroup;
  equipment: Equipment;
}

export interface PlanExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restSec: number;
}

export interface WorkoutPlan {
  id: string;
  name: Localized;
  focus: Localized;
  level: Level;
  durationMin: number;
  exercises: PlanExercise[];
}

export interface MembershipPlan {
  id: string;
  name: Localized;
  priceEgp: number;
  periodMonths: number;
  perks: Localized[];
  highlighted: boolean;
}

export interface Membership {
  planId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
  memberCode: string;
  /** Seeded membership only: dates are worked out from today at read time. A renewal removes it. */
  followsToday?: boolean;
}

export type PaymentMethod = 'card' | 'wallet';

/** What the checkout form collects. Nothing here is ever sent anywhere. */
export type PaymentDraft =
  | { method: 'card'; cardNumber: string; expiry: string; cvv: string }
  | { method: 'wallet'; phone: string };

export interface Receipt {
  reference: string;
  paidAt: string;
  planId: string;
  amountEgp: number;
  method: PaymentMethod;
  /** First day of the period that was paid for. */
  periodStart: string;
  periodEnd: string;
}

export interface RenewalResult {
  membership: Membership;
  receipt: Receipt;
}

export interface BodyEntry {
  id: string;
  /** For entries with `seedOffsetDays` this is the day it was seeded; the shown date is computed. */
  date: string;
  weightKg: number;
  waistCm: number;
  chestCm: number;
  armCm: number;
  /** Seeded check-ins only: how many days before today they are shown. Editing one removes it. */
  seedOffsetDays?: number;
}

export interface SessionState {
  onboardingDone: boolean;
  loggedIn: boolean;
}

export interface Prefs {
  language: Language;
  theme: 'dark' | 'light';
}

export interface LoggedSet {
  weightKg: number;
  reps: number;
}

export interface SessionExercise {
  exerciseId: string;
  sets: LoggedSet[];
}

/** A finished workout, kept in the history. */
export interface WorkoutSession {
  id: string;
  planId: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  exercises: SessionExercise[];
  /** Sum of weight x reps. Bodyweight sets (0 kg) add nothing. */
  volumeKg: number;
  setsCompleted: number;
  /** Saved before every planned set was done. */
  partial: boolean;
  unlockedAchievementIds: string[];
}

export interface BestSet {
  weightKg: number;
  reps: number;
}

export interface PrHit {
  exerciseId: string;
  best: BestSet;
  /** The record before this session. */
  previous: BestSet;
}

export interface PersonalRecord extends BestSet {
  exerciseId: string;
  date: string;
}

export interface AchievementDef {
  id: string;
  title: Localized;
  description: Localized;
  target: number;
}

export interface AchievementStatus extends AchievementDef {
  progress: number;
  unlockedAt: string | null;
}

/** Wall-clock countdown. Values are timestamps, so it survives re-renders and background time. */
export interface RestTimer {
  durationMs: number;
  endsAtMs: number;
  /** Set while paused: the time left when it was paused. */
  pausedRemainingMs: number | null;
}

export interface ActiveExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restSec: number;
  sets: LoggedSet[];
}

/** The workout in progress. Saved on every change so it can be resumed after a restart. */
export interface ActiveSession {
  id: string;
  planId: string;
  startedAtMs: number;
  /** Training time so far, with every long idle gap counted as at most the idle cap. */
  activeMs: number;
  /** Last moment the member did something, used to measure the next gap. */
  lastActivityMs: number;
  exercises: ActiveExercise[];
  currentIndex: number;
  rest: RestTimer | null;
}

export type BodyMeasure = 'weightKg' | 'waistCm' | 'chestCm' | 'armCm';
export type BodyDraft = Omit<BodyEntry, 'id'>;

/** A gym visit: a scanned pass in this demo, or one of the generated visits of the last weeks. */
export interface Visit {
  id: string;
  at: string;
  source: 'history' | 'scan';
}

export type NotificationKind = 'class_reminder' | 'waitlist' | 'achievement' | 'payment';

/** What a notification is about. The text is written at display time, in the current language. */
export type NotificationPayload =
  | { kind: 'class_reminder'; className: Localized; weekday: number; time: string }
  | { kind: 'waitlist'; className: Localized; weekday: number; time: string }
  | { kind: 'achievement'; title: Localized }
  | { kind: 'payment'; planName: Localized; amountEgp: number };

export interface AppNotification {
  id: string;
  payload: NotificationPayload;
  createdAt: string;
  read: boolean;
  /** Seeded notifications only: shown this many minutes before now, whenever the demo is opened. */
  seedAgeMinutes?: number;
}

/** Simulated: they only decide which notifications reach the inbox. */
export interface NotificationSettings {
  classReminders: boolean;
  waitlist: boolean;
  achievements: boolean;
  payments: boolean;
}

export interface ProfileDraft {
  nameAr: string;
  nameEn: string;
  initials: string;
}
