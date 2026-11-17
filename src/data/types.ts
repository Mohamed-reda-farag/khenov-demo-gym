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
  streakDays: number;
  membershipPlanId: string;
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

export interface BookingState {
  bookings: Booking[];
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
}

export interface BodyEntry {
  date: string;
  weightKg: number;
  waistCm: number;
  chestCm: number;
  armCm: number;
}

export interface PersonalRecord {
  exerciseId: string;
  weightKg: number;
  reps: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: Localized;
  description: Localized;
  progress: number;
  target: number;
}

export interface WorkoutLogEntry {
  id: string;
  planId: string;
  date: string;
  durationMin: number;
  volumeKg: number;
  setsCompleted: number;
}

export interface SessionState {
  onboardingDone: boolean;
  loggedIn: boolean;
}

export interface Prefs {
  language: Language;
  theme: 'dark' | 'light';
}
