import type { Membership, MembershipPlan, WorkoutPlan } from '../types';

export const workoutPlans: WorkoutPlan[] = [
  {
    id: 'plan-upper-power',
    name: { ar: 'قوة الجزء العلوي', en: 'Upper Body Power' },
    focus: { ar: 'صدر، ظهر، أكتاف وذراعين', en: 'Chest, back, shoulders and arms' },
    level: 'intermediate',
    durationMin: 55,
    exercises: [
      { exerciseId: 'bench-press', sets: 4, reps: 6, restSec: 120 },
      { exerciseId: 'barbell-row', sets: 4, reps: 8, restSec: 90 },
      { exerciseId: 'overhead-press', sets: 3, reps: 8, restSec: 90 },
      { exerciseId: 'pull-up', sets: 3, reps: 6, restSec: 90 },
      { exerciseId: 'barbell-curl', sets: 3, reps: 10, restSec: 60 },
      { exerciseId: 'triceps-pushdown', sets: 3, reps: 12, restSec: 60 },
    ],
  },
  {
    id: 'plan-lower-strength',
    name: { ar: 'قوة الجزء السفلي', en: 'Lower Body Strength' },
    focus: { ar: 'أرجل وأرداف وبطن', en: 'Legs, glutes and core' },
    level: 'intermediate',
    durationMin: 60,
    exercises: [
      { exerciseId: 'back-squat', sets: 4, reps: 6, restSec: 150 },
      { exerciseId: 'romanian-deadlift', sets: 3, reps: 8, restSec: 120 },
      { exerciseId: 'leg-press', sets: 3, reps: 12, restSec: 90 },
      { exerciseId: 'walking-lunges', sets: 3, reps: 12, restSec: 75 },
      { exerciseId: 'calf-raise', sets: 4, reps: 15, restSec: 45 },
      { exerciseId: 'hanging-leg-raise', sets: 3, reps: 10, restSec: 60 },
    ],
  },
  {
    id: 'plan-full-burn',
    name: { ar: 'حرق الجسم كاملًا', en: 'Full Body Burn' },
    focus: { ar: 'تمارين مركّبة بوتيرة سريعة', en: 'Compound moves at a fast pace' },
    level: 'beginner',
    durationMin: 40,
    exercises: [
      { exerciseId: 'kettlebell-swing', sets: 4, reps: 15, restSec: 45 },
      { exerciseId: 'push-up', sets: 3, reps: 15, restSec: 45 },
      { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restSec: 60 },
      { exerciseId: 'burpees', sets: 3, reps: 12, restSec: 45 },
      { exerciseId: 'russian-twist', sets: 3, reps: 20, restSec: 30 },
    ],
  },
];

export const membershipPlans: MembershipPlan[] = [
  {
    id: 'plan-monthly',
    name: { ar: 'شهري', en: 'Monthly' },
    priceEgp: 900,
    periodMonths: 1,
    perks: [
      { ar: 'دخول غير محدود للصالة', en: 'Unlimited gym access' },
      { ar: 'حجز الحصص الجماعية', en: 'Group class booking' },
    ],
    highlighted: false,
  },
  {
    id: 'plan-quarterly',
    name: { ar: 'ربع سنوي', en: 'Quarterly' },
    priceEgp: 2400,
    periodMonths: 3,
    perks: [
      { ar: 'دخول غير محدود للصالة', en: 'Unlimited gym access' },
      { ar: 'حجز الحصص الجماعية', en: 'Group class booking' },
      { ar: 'جلسة تقييم لياقة مجانية', en: 'Free fitness assessment' },
    ],
    highlighted: true,
  },
  {
    id: 'plan-annual',
    name: { ar: 'سنوي', en: 'Annual' },
    priceEgp: 8400,
    periodMonths: 12,
    perks: [
      { ar: 'دخول غير محدود للصالة', en: 'Unlimited gym access' },
      { ar: 'حجز الحصص الجماعية', en: 'Group class booking' },
      { ar: 'جلسة تقييم لياقة مجانية', en: 'Free fitness assessment' },
      { ar: 'جلستان مع مدرب شخصي', en: 'Two personal training sessions' },
    ],
    highlighted: false,
  },
];

export function buildMembership(now: Date): Membership {
  const start = new Date(now);
  start.setDate(start.getDate() - 52);
  const end = new Date(now);
  end.setDate(end.getDate() + 38);
  return {
    planId: 'plan-quarterly',
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    status: 'active',
    memberCode: 'NBD-4827-1953',
    followsToday: true,
  };
}
