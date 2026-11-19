import type { Member, SessionState } from '../types';

export const initialSession: SessionState = { onboardingDone: false, loggedIn: false };

export function buildMember(now: Date): Member {
  const joined = new Date(now);
  joined.setDate(joined.getDate() - 74);
  return {
    id: 'member-demo',
    name: { ar: 'نور مصطفى', en: 'Nour Mostafa' },
    goal: { ar: 'زيادة القوة وتحسين اللياقة', en: 'Build strength and improve fitness' },
    joinedAt: joined.toISOString(),
    heightCm: 168,
    membershipPlanId: 'plan-quarterly',
  };
}
