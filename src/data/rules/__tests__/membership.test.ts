import { describe, expect, it } from 'vitest';

import { buildMembership, membershipPlans } from '../../seed/plans';
import type { Membership, PaymentDraft } from '../../types';
import {
  DECLINED_DEMO_CARD,
  DEMO_CARD,
  MembershipError,
  addMonths,
  calendarDaysBetween,
  describeMembership,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  luhnValid,
  pricePerMonth,
  renewMembership,
  renewalEnd,
  renewalStart,
  resolveMembership,
  savingsVersusMonthly,
  validatePayment,
} from '../membership';

const now = new Date(2026, 10, 21, 10, 0);
const monthly = membershipPlans[0]!;
const quarterly = membershipPlans[1]!;
const annual = membershipPlans[2]!;
const card = (over: Partial<Extract<PaymentDraft, { method: 'card' }>> = {}): PaymentDraft => ({
  method: 'card',
  cardNumber: DEMO_CARD,
  expiry: '12/29',
  cvv: '123',
  ...over,
});
const code = (fn: () => unknown) => {
  try {
    fn();
    return 'ok';
  } catch (e) {
    return e instanceof MembershipError ? e.code : 'other';
  }
};
const ymd = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const daysFromNow = (n: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + n, 23, 0);
const membership = (endInDays: number, planId = 'plan-quarterly'): Membership => ({
  planId,
  startDate: daysFromNow(endInDays - 90).toISOString(),
  endDate: daysFromNow(endInDays).toISOString(),
  status: 'active',
  memberCode: 'NBD-4827-1953',
});

describe('dates', () => {
  it('counts calendar days regardless of the hour', () => {
    expect(calendarDaysBetween(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 2, 0, 1))).toBe(1);
    expect(calendarDaysBetween(new Date(2026, 2, 28, 12), new Date(2026, 2, 30, 1))).toBe(2);
  });

  it('adds months without spilling into the next one', () => {
    expect(ymd(addMonths(new Date(2026, 0, 31), 1).toISOString())).toBe('2026-2-28');
    expect(ymd(addMonths(new Date(2028, 0, 31), 1).toISOString())).toBe('2028-2-29');
    expect(ymd(addMonths(new Date(2026, 10, 30), 3).toISOString())).toBe('2027-2-28');
    expect(ymd(addMonths(new Date(2026, 11, 15), 12).toISOString())).toBe('2027-12-15');
  });

  it('ends a period on the last day of access', () => {
    expect(ymd(renewalEnd(new Date(2026, 0, 1), monthly).toISOString())).toBe('2026-1-31');
    expect(ymd(renewalEnd(new Date(2026, 0, 1), annual).toISOString())).toBe('2026-12-31');
  });
});

describe('membership status', () => {
  it('is active with days left', () => {
    const view = describeMembership(membership(38), now);
    expect(view.phase).toBe('active');
    expect(view.daysLeft).toBe(38);
    expect(view.usedFraction).toBeGreaterThan(0.5);
    expect(view.usedFraction).toBeLessThan(0.6);
  });

  it('warns two weeks before the end', () => {
    expect(describeMembership(membership(14), now).phase).toBe('expiring');
    expect(describeMembership(membership(15), now).phase).toBe('active');
  });

  it('is still active, with zero days left, on the last day', () => {
    const view = describeMembership(membership(0), now);
    expect(view.phase).toBe('expiring');
    expect(view.daysLeft).toBe(0);
    expect(view.membership.status).toBe('active');
  });

  it('expires by itself the day after the end date', () => {
    const view = describeMembership(membership(-1), now);
    expect(view.phase).toBe('expired');
    expect(view.membership.status).toBe('expired');
    expect(view.daysLeft).toBe(0);
    expect(view.usedFraction).toBe(1);
  });

  it('the seeded membership is active on any day it is seeded', () => {
    expect(describeMembership(buildMembership(now), now).phase).toBe('active');
  });
});

describe('prices', () => {
  it('works out the monthly price and what a long plan saves', () => {
    expect(pricePerMonth(quarterly)).toBe(800);
    expect(pricePerMonth(annual)).toBe(700);
    expect(savingsVersusMonthly(monthly, membershipPlans)).toBe(0);
    expect(savingsVersusMonthly(quarterly, membershipPlans)).toBe(300);
    expect(savingsVersusMonthly(annual, membershipPlans)).toBe(2400);
  });
});

describe('card input helpers', () => {
  it('formats while typing and reads Arabic digits', () => {
    expect(formatCardNumber('42424242')).toBe('4242 4242');
    expect(formatCardNumber('4242 4242 4242 4242 99')).toBe('4242 4242 4242 4242');
    expect(formatExpiry('1229')).toBe('12/29');
    expect(formatExpiry('1')).toBe('1');
    expect(digitsOnly('٤٢٤٢ abc ۴۲')).toBe('424242');
  });

  it('checks card numbers with the Luhn rule', () => {
    expect(luhnValid(DEMO_CARD)).toBe(true);
    expect(luhnValid(DECLINED_DEMO_CARD)).toBe(true);
    expect(luhnValid('4242424242424241')).toBe(false);
    expect(luhnValid('')).toBe(false);
  });
});

describe('payment validation', () => {
  it('accepts the demo card and a valid wallet number', () => {
    expect(code(() => validatePayment(card(), now))).toBe('ok');
    expect(code(() => validatePayment({ method: 'wallet', phone: '01012345678' }, now))).toBe('ok');
  });

  it('rejects bad card numbers, expiry and security codes with typed errors', () => {
    expect(code(() => validatePayment(card({ cardNumber: '4242 4242' }), now))).toBe(
      'invalid_card_number',
    );
    expect(code(() => validatePayment(card({ cardNumber: '4242424242424241' }), now))).toBe(
      'invalid_card_number',
    );
    expect(code(() => validatePayment(card({ expiry: '13/29' }), now))).toBe('invalid_card_expiry');
    expect(code(() => validatePayment(card({ expiry: '1/29' }), now))).toBe('invalid_card_expiry');
    expect(code(() => validatePayment(card({ expiry: '10/26' }), now))).toBe('invalid_card_expiry');
    expect(code(() => validatePayment(card({ cvv: '12' }), now))).toBe('invalid_card_cvv');
  });

  it('accepts a card through the last day of its expiry month', () => {
    expect(code(() => validatePayment(card({ expiry: '11/26' }), now))).toBe('ok');
  });

  it('rejects wallet numbers that are not Egyptian mobiles', () => {
    for (const phone of ['', '0101234567', '01312345678', '02012345678', '010123456789']) {
      expect(code(() => validatePayment({ method: 'wallet', phone }, now))).toBe(
        'invalid_wallet_phone',
      );
    }
  });

  it('declines the test decline card', () => {
    expect(code(() => validatePayment(card({ cardNumber: DECLINED_DEMO_CARD }), now))).toBe(
      'card_declined',
    );
  });
});

describe('renewing', () => {
  it('continues right after the current end while the membership is active', () => {
    const current = membership(38);
    const result = renewMembership(current, monthly, card(), now, 'NBD-R-1');
    expect(ymd(renewalStart(current, now).toISOString())).toBe(ymd(daysFromNow(39).toISOString()));
    expect(result.membership.planId).toBe('plan-monthly');
    expect(result.membership.startDate).toBe(current.startDate);
    expect(result.membership.status).toBe('active');
    expect(ymd(result.membership.endDate)).toBe(
      ymd(renewalEnd(daysFromNow(39), monthly).toISOString()),
    );
    expect(result.receipt.amountEgp).toBe(900);
    expect(ymd(result.receipt.periodStart)).toBe(ymd(daysFromNow(39).toISOString()));
  });

  it('restarts today when the membership has expired', () => {
    const current = membership(-10);
    const result = renewMembership(current, annual, card(), now, 'NBD-R-2');
    expect(ymd(result.membership.startDate)).toBe(ymd(now.toISOString()));
    expect(ymd(result.membership.endDate)).toBe('2027-11-20');
    expect(describeMembership(result.membership, now).phase).toBe('active');
  });

  it('keeps the member code and records the payment method', () => {
    const result = renewMembership(
      membership(5),
      quarterly,
      { method: 'wallet', phone: '01112345678' },
      now,
      'NBD-R-3',
    );
    expect(result.membership.memberCode).toBe('NBD-4827-1953');
    expect(result.receipt).toMatchObject({
      method: 'wallet',
      reference: 'NBD-R-3',
      planId: 'plan-quarterly',
    });
  });

  it('changes nothing when the plan is unknown or the payment is refused', () => {
    const current = membership(38);
    expect(code(() => renewMembership(current, undefined, card(), now, 'x'))).toBe(
      'plan_not_found',
    );
    expect(code(() => renewMembership(current, monthly, card({ cvv: '' }), now, 'x'))).toBe(
      'invalid_card_cvv',
    );
    expect(
      code(() =>
        renewMembership(current, monthly, card({ cardNumber: DECLINED_DEMO_CARD }), now, 'x'),
      ),
    ).toBe('card_declined');
    expect(current.planId).toBe('plan-quarterly');
  });
});

describe('the seeded membership follows today', () => {
  const seeded = buildMembership(new Date(2026, 0, 1));

  it('always has a sensible number of days left, on any day', () => {
    for (const day of [
      new Date(2026, 0, 1),
      new Date(2026, 6, 15),
      new Date(2028, 1, 29, 23, 59),
    ]) {
      const view = describeMembership(resolveMembership(seeded, day), day);
      expect(view.phase).toBe('active');
      expect(view.daysLeft).toBe(38);
      expect(view.membership.status).toBe('active');
    }
  });

  it('shows the expiring and expired states on request', () => {
    const day = new Date(2026, 10, 21, 10);
    const expiring = describeMembership(resolveMembership(seeded, day, 'expiring'), day);
    expect(expiring.phase).toBe('expiring');
    expect(expiring.daysLeft).toBe(7);
    const expired = describeMembership(resolveMembership(seeded, day, 'expired'), day);
    expect(expired.phase).toBe('expired');
    expect(expired.membership.status).toBe('expired');
  });

  it('leaves a renewed membership exactly as stored, so it can really lapse', () => {
    const day = new Date(2026, 10, 21, 10);
    const renewed = renewMembership(
      resolveMembership(seeded, day, 'expired'),
      monthly,
      card(),
      day,
      'R',
    );
    expect(renewed.membership.followsToday).toBeUndefined();
    expect(resolveMembership(renewed.membership, new Date(2027, 5, 1), 'active')).toBe(
      renewed.membership,
    );
    expect(describeMembership(renewed.membership, new Date(2027, 5, 1)).phase).toBe('expired');
  });
});
