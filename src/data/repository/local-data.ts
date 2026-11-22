import { delay } from '@/lib/demo/delay';
import { hasDemoFlag } from '@/lib/demo/flags';

import {
  MembershipError,
  describeMembership,
  renewMembership,
  resolveMembership,
  type MembershipScenario,
  type MembershipView,
} from '../rules/membership';
import { validateProfile } from '../rules/profile';
import type { Member } from '../types';

import { emitMembershipChanged, emitProfileChanged } from './events';
import type {
  ExerciseRepository,
  MemberRepository,
  MembershipRepository,
  TrainerRepository,
  WorkoutPlanRepository,
} from './interfaces';
import { readCollection, serial, writeCollection } from './local-core';
import { notify } from './local-notifications';

export const localMemberRepository: MemberRepository = {
  get: () => readCollection('member'),

  async updateProfile(draft) {
    await delay(200, 450);
    return serial(async () => {
      const { name, initials } = validateProfile(draft);
      const member = await readCollection('member', [0, 0]);
      const next: Member = {
        id: member.id,
        goal: member.goal,
        joinedAt: member.joinedAt,
        heightCm: member.heightCm,
        membershipPlanId: member.membershipPlanId,
        name,
        ...(initials === undefined ? {} : { initials }),
      };
      await writeCollection('member', next, [0, 0]);
      emitProfileChanged();
      return next;
    });
  },
};

export const localTrainerRepository: TrainerRepository = {
  list: () => readCollection('trainers'),
};

export const localExerciseRepository: ExerciseRepository = {
  list: () => readCollection('exercises'),
};

export const localWorkoutPlanRepository: WorkoutPlanRepository = {
  list: () => readCollection('workoutPlans'),
  getSchedule: () => readCollection('workoutSchedule'),
  async getForToday(now = new Date()) {
    const [schedule, plans] = await Promise.all([
      readCollection('workoutSchedule'),
      readCollection('workoutPlans'),
    ]);
    const entry = schedule.find((e) => e.dayOfWeek === now.getDay());
    return plans.find((p) => p.id === entry?.planId) ?? null;
  },
};

function scenario(): MembershipScenario {
  return hasDemoFlag('expired') ? 'expired' : hasDemoFlag('expiring') ? 'expiring' : 'active';
}

/** The membership as it stands at `now`, with the demo scenario switches applied. */
export async function loadMembershipView(now: Date): Promise<MembershipView> {
  const stored = await readCollection('membership', [0, 0]);
  return describeMembership(resolveMembership(stored, now, scenario()), now);
}

export const localMembershipRepository: MembershipRepository = {
  listPlans: () => readCollection('membershipPlans'),
  async getCurrent() {
    await delay();
    return (await loadMembershipView(new Date())).membership;
  },

  async renew(planId, payment) {
    // The "bank" takes a moment, like a real checkout would.
    await delay(1200, 2000);
    if (hasDemoFlag('payfail')) throw new MembershipError('payment_failed');
    return serial(async () => {
      const [current, plans] = await Promise.all([
        readCollection('membership', [0, 0]),
        readCollection('membershipPlans', [0, 0]),
      ]);
      const now = new Date();
      const result = renewMembership(
        resolveMembership(current, now, scenario()),
        plans.find((p) => p.id === planId),
        payment,
        now,
        `NBD-R-${String(now.getTime()).slice(-6)}`,
      );
      await writeCollection('membership', result.membership, [0, 0]);
      emitMembershipChanged();
      const bought = plans.find((p) => p.id === planId);
      if (bought) {
        await notify({ kind: 'payment', planName: bought.name, amountEgp: bought.priceEgp });
      }
      return result;
    });
  },
};
