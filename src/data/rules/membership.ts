import type { Membership, MembershipPlan, PaymentDraft, Receipt, RenewalResult } from '../types';

export type MembershipErrorCode =
  | 'plan_not_found'
  | 'invalid_card_number'
  | 'invalid_card_expiry'
  | 'invalid_card_cvv'
  | 'invalid_wallet_phone'
  | 'card_declined'
  | 'payment_failed';

export class MembershipError extends Error {
  readonly code: MembershipErrorCode;

  constructor(code: MembershipErrorCode) {
    super(code);
    this.name = 'MembershipError';
    this.code = code;
  }
}

/** Test numbers of the mock checkout. Nothing is ever charged. */
export const DEMO_CARD = '4242424242424242';
export const DECLINED_DEMO_CARD = '4000000000000002';
export const EXPIRING_SOON_DAYS = 14;

export type MembershipPhase = 'active' | 'expiring' | 'expired';

export interface MembershipView {
  membership: Membership;
  phase: MembershipPhase;
  /** Whole calendar days until the last day ends. 0 on the last day, never negative. */
  daysLeft: number;
  /** Share of the paid period already used, from 0 to 1. */
  usedFraction: number;
}

const DAY_MS = 86_400_000;

export type MembershipScenario = 'active' | 'expiring' | 'expired';

const SCENARIOS: Record<MembershipScenario, { startDaysAgo: number; endDaysAhead: number }> = {
  active: { startDaysAgo: 52, endDaysAhead: 38 },
  expiring: { startDaysAgo: 83, endDaysAhead: 7 },
  expired: { startDaysAgo: 95, endDaysAhead: -5 },
};

/**
 * The seeded membership always has a sensible number of days left, whenever the demo is opened.
 * `scenario` lets `?demo=expiring` and `?demo=expired` show the other states. A membership the
 * member renewed has fixed dates and is returned as stored, so it can really lapse.
 */
export function resolveMembership(
  membership: Membership,
  now: Date,
  scenario: MembershipScenario = 'active',
): Membership {
  if (!membership.followsToday) return membership;
  const { startDaysAgo, endDaysAhead } = SCENARIOS[scenario];
  const day = (offset: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12, 0).toISOString();
  return { ...membership, startDate: day(-startDaysAgo), endDate: day(endDaysAhead) };
}

/** Calendar days from `a` to `b`, ignoring the time of day and daylight saving shifts. */
export function calendarDaysBetween(a: Date, b: Date): number {
  const from = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const to = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((to - from) / DAY_MS);
}

/** Adds calendar months; 31 January plus one month is 28 (or 29) February, never March. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

/** Status is worked out from the dates, so a stored membership expires by itself. */
export function describeMembership(membership: Membership, now: Date): MembershipView {
  const end = new Date(membership.endDate);
  const start = new Date(membership.startDate);
  const daysLeft = Math.max(0, calendarDaysBetween(now, end));
  const expired = calendarDaysBetween(now, end) < 0;
  const total = Math.max(1, end.getTime() - start.getTime());
  const used = Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / total));
  const phase: MembershipPhase = expired
    ? 'expired'
    : daysLeft <= EXPIRING_SOON_DAYS
      ? 'expiring'
      : 'active';
  return {
    membership: { ...membership, status: expired ? 'expired' : 'active' },
    phase,
    daysLeft,
    usedFraction: expired ? 1 : used,
  };
}

/** A renewal continues after the current end; an expired membership restarts today. */
export function renewalStart(membership: Membership, now: Date): Date {
  const { phase } = describeMembership(membership, now);
  if (phase === 'expired') return new Date(now);
  const next = new Date(membership.endDate);
  next.setDate(next.getDate() + 1);
  return next;
}

/** The last day of access: a month from 1 January is 31 January, not 1 February. */
export function renewalEnd(start: Date, plan: MembershipPlan): Date {
  const end = addMonths(start, plan.periodMonths);
  end.setDate(end.getDate() - 1);
  return end;
}

export function pricePerMonth(plan: MembershipPlan): number {
  return Math.round(plan.priceEgp / plan.periodMonths);
}

/** What the plan saves compared with paying the cheapest plan month after month. */
export function savingsVersusMonthly(plan: MembershipPlan, plans: MembershipPlan[]): number {
  const monthly = plans.find((p) => p.periodMonths === 1);
  if (!monthly) return 0;
  return Math.max(0, monthly.priceEgp * plan.periodMonths - plan.priceEgp);
}

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** Keyboards in Arabic can type Arabic-Indic digits. Everything else is dropped. */
export function digitsOnly(text: string): string {
  let result = '';
  for (const ch of text) {
    const arabic = ARABIC_INDIC.indexOf(ch);
    const eastern = EASTERN_ARABIC_INDIC.indexOf(ch);
    if (arabic >= 0) result += String(arabic);
    else if (eastern >= 0) result += String(eastern);
    else if (ch >= '0' && ch <= '9') result += ch;
  }
  return result;
}

export function luhnValid(number: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let digit = Number(number[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return number.length > 0 && sum % 10 === 0;
}

/** "4242424242424242" becomes "4242 4242 4242 4242" while typing. */
export function formatCardNumber(input: string): string {
  return (
    digitsOnly(input)
      .slice(0, 16)
      .match(/.{1,4}/g)
      ?.join(' ') ?? ''
  );
}

/** "1228" becomes "12/28" while typing. */
export function formatExpiry(input: string): string {
  const digits = digitsOnly(input).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function formatWalletPhone(input: string): string {
  return digitsOnly(input).slice(0, 11);
}

function expiryValid(expiry: string, now: Date): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  // A card is good through the last day of its expiry month.
  return new Date(year, month, 1).getTime() > now.getTime();
}

/** Checks the form like a real checkout would, so every error state can be shown. */
export function validatePayment(draft: PaymentDraft, now: Date): void {
  if (draft.method === 'wallet') {
    if (!/^01[0125]\d{8}$/.test(digitsOnly(draft.phone))) {
      throw new MembershipError('invalid_wallet_phone');
    }
    return;
  }
  const number = digitsOnly(draft.cardNumber);
  if (number.length !== 16 || !luhnValid(number)) throw new MembershipError('invalid_card_number');
  if (!expiryValid(draft.expiry, now)) throw new MembershipError('invalid_card_expiry');
  if (!/^\d{3}$/.test(digitsOnly(draft.cvv))) throw new MembershipError('invalid_card_cvv');
  if (number === DECLINED_DEMO_CARD) throw new MembershipError('card_declined');
}

/** Builds the renewed membership and its receipt. Throws before anything is changed. */
export function renewMembership(
  current: Membership,
  plan: MembershipPlan | undefined,
  draft: PaymentDraft,
  now: Date,
  reference: string,
): RenewalResult {
  if (!plan) throw new MembershipError('plan_not_found');
  validatePayment(draft, now);
  const start = renewalStart(current, now);
  const end = renewalEnd(start, plan);
  const receipt: Receipt = {
    reference,
    paidAt: now.toISOString(),
    planId: plan.id,
    amountEgp: plan.priceEgp,
    method: draft.method,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
  const phase = describeMembership(current, now).phase;
  return {
    membership: {
      memberCode: current.memberCode,
      planId: plan.id,
      // A renewal that continues an active period keeps its original start.
      startDate: phase === 'expired' ? start.toISOString() : current.startDate,
      endDate: end.toISOString(),
      status: 'active',
    },
    receipt,
  };
}
