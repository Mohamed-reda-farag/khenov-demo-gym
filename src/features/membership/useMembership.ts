import { useEffect } from 'react';

import { membershipRepository, onMembershipChanged } from '@/data/repository';
import { describeMembership, type MembershipView } from '@/data/rules/membership';
import type { MembershipPlan } from '@/data/types';
import { useAsyncResource } from '@/lib/useAsyncResource';

export interface MembershipData {
  view: MembershipView;
  plans: MembershipPlan[];
  plan: MembershipPlan | undefined;
}

async function load(): Promise<MembershipData> {
  const [membership, plans] = await Promise.all([
    membershipRepository.getCurrent(),
    membershipRepository.listPlans(),
  ]);
  return {
    view: describeMembership(membership, new Date()),
    plans,
    plan: plans.find((p) => p.id === membership.planId),
  };
}

/** The member's plan and status. Refreshes by itself after a renewal made anywhere in the app. */
export function useMembership() {
  const resource = useAsyncResource(load);
  const { refresh } = resource;
  useEffect(() => onMembershipChanged(refresh), [refresh]);
  return resource;
}
