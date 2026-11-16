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

export interface GymClass {
  id: string;
  name: Localized;
  trainerId: string;
  /** 0 = Sunday ... 6 = Saturday */
  dayOfWeek: number;
  /** 24h "HH:mm" */
  startTime: string;
  durationMin: number;
  capacity: number;
  booked: number;
  waitlist: number;
  level: Level;
  category: ClassCategory;
  room: Localized;
  description: Localized;
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
