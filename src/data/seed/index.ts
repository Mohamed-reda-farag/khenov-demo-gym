import type {
  BodyEntry,
  Exercise,
  BookingState,
  ClassTemplate,
  AppNotification,
  Member,
  Membership,
  MembershipPlan,
  NotificationSettings,
  ScheduleEntry,
  SessionState,
  Trainer,
  Visit,
  WorkoutPlan,
  WorkoutSession,
} from '../types';

import { evaluateAchievements } from '../rules/achievements';
import { defaultNotificationSettings } from '../rules/notifications';
import { buildBookingState, workoutSchedule } from './bookings';
import { classTemplates } from './classes';
import { exercises } from './exercises';
import { buildMember, initialSession } from './member';
import { buildNotifications } from './notifications';
import { buildMembership, membershipPlans, workoutPlans } from './plans';
import { generateSeedHistory } from './history';
import { buildBodyEntries } from './progress';
import { trainers } from './trainers';

export interface SeedData {
  session: SessionState;
  member: Member;
  trainers: Trainer[];
  classTemplates: ClassTemplate[];
  exercises: Exercise[];
  workoutPlans: WorkoutPlan[];
  workoutSchedule: ScheduleEntry[];
  bookingState: BookingState;
  membershipPlans: MembershipPlan[];
  membership: Membership;
  bodyEntries: BodyEntry[];
  /** Workouts the member did in this demo. The older history is generated at runtime. */
  userSessions: WorkoutSession[];
  unlockedAchievements: Record<string, string>;
  /** Passes the member scanned in this demo. The generated visits of past weeks are not stored. */
  visits: Visit[];
  notifications: AppNotification[];
  notificationSettings: NotificationSettings;
}

function initialUnlocks(now: Date): Record<string, string> {
  const { newlyUnlocked } = evaluateAchievements(generateSeedHistory(now, workoutPlans), now, {});
  return Object.fromEntries(newlyUnlocked.map((id) => [id, now.toISOString()]));
}

/** All fictional. Dates are computed from `now` so the demo always feels current. */
export function buildSeed(now: Date): SeedData {
  const unlockedAchievements = initialUnlocks(now);
  const membership = buildMembership(now);
  const bookingState = buildBookingState();
  return {
    session: initialSession,
    member: buildMember(now),
    trainers,
    classTemplates,
    exercises,
    workoutPlans,
    workoutSchedule,
    bookingState,
    membershipPlans,
    membership,
    bodyEntries: buildBodyEntries(now),
    userSessions: [],
    unlockedAchievements,
    visits: [],
    notifications: buildNotifications(
      now,
      Object.keys(unlockedAchievements),
      classTemplates.find((c) => c.id === bookingState.demoSlots[0]?.templateId),
      membership,
      membershipPlans,
    ),
    notificationSettings: defaultNotificationSettings,
  };
}
