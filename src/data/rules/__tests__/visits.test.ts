import { describe, expect, it } from 'vitest';

import { buildMembership } from '../../seed/plans';
import type { Visit, WorkoutSession } from '../../types';
import { describeMembership, resolveMembership } from '../membership';
import {
  SCAN_COOLDOWN_MS,
  VisitError,
  historyVisits,
  newestFirst,
  passPayload,
  recordScan,
  visitStats,
} from '../visits';

const now = new Date(2026, 10, 21, 18, 0);
const DAY = 86_400_000;
const ago = (days: number, extraMs = 0): string =>
  new Date(now.getTime() - days * DAY - extraMs).toISOString();
const visit = (id: string, at: string): Visit => ({ id, at, source: 'history' });
const seeded = buildMembership(now);
const active = describeMembership(resolveMembership(seeded, now), now);
const expired = describeMembership(resolveMembership(seeded, now, 'expired'), now);
const errorOf = (fn: () => unknown) => {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof VisitError ? e : 'other';
  }
};

describe('recording a scan', () => {
  it('records a visit at the scan time', () => {
    const v = recordScan([visit('a', ago(1))], active, now, 'visit-1');
    expect(v).toEqual({ id: 'visit-1', at: now.toISOString(), source: 'scan' });
  });

  it('refuses an expired membership', () => {
    expect((errorOf(() => recordScan([], expired, now, 'x')) as VisitError).code).toBe(
      'membership_expired',
    );
  });

  it('still lets a membership that expires soon check in', () => {
    const soon = describeMembership(resolveMembership(seeded, now, 'expiring'), now);
    expect(errorOf(() => recordScan([], soon, now, 'x'))).toBeNull();
  });

  it('treats a second scan within five minutes as the same visit and says when it was', () => {
    const first = visit('a', ago(0, SCAN_COOLDOWN_MS - 1000));
    const error = errorOf(() => recordScan([first], active, now, 'x')) as VisitError;
    expect(error.code).toBe('duplicate_scan');
    expect(error.at).toBe(first.at);
  });

  it('allows another scan once the cooldown has passed', () => {
    expect(
      errorOf(() => recordScan([visit('a', ago(0, SCAN_COOLDOWN_MS))], active, now, 'x')),
    ).toBeNull();
  });

  it('ignores visits that are far in the past', () => {
    expect(errorOf(() => recordScan([visit('a', ago(3))], active, now, 'x'))).toBeNull();
  });
});

describe('visit stats', () => {
  const visits = [
    visit('1', ago(0, 3_600_000)),
    visit('2', ago(2)),
    visit('3', ago(6)),
    visit('4', ago(8)),
    visit('5', ago(29)),
    visit('6', ago(31)),
    visit('7', ago(55)),
    visit('8', ago(70)),
  ];

  it('counts rolling windows and the weekly average of eight weeks', () => {
    const stats = visitStats(visits, now);
    expect(stats.last7Days).toBe(3);
    expect(stats.last30Days).toBe(5);
    expect(stats.perWeek).toBe(0.9);
    expect(stats.lastAt).toBe(visits[0]!.at);
  });

  it('is all zero with no visits', () => {
    expect(visitStats([], now)).toEqual({ last7Days: 0, last30Days: 0, perWeek: 0, lastAt: null });
  });

  it('does not count visits in the future', () => {
    const future = visit('f', new Date(now.getTime() + DAY).toISOString());
    expect(visitStats([future], now).lastAt).toBeNull();
    expect(visitStats([future], now).last7Days).toBe(0);
  });
});

describe('lists and payload', () => {
  it('turns generated workouts into visits and sorts newest first', () => {
    const sessions = [
      { id: 's1', startedAt: ago(5) },
      { id: 's2', startedAt: ago(1) },
    ] as WorkoutSession[];
    const list = newestFirst(historyVisits(sessions));
    expect(list.map((v) => v.id)).toEqual(['visit-s2', 'visit-s1']);
    expect(list.every((v) => v.source === 'history')).toBe(true);
  });

  it('writes a dated payload for the QR code', () => {
    expect(passPayload('NBD-4827-1953', now)).toBe('NABD:PASS:NBD-4827-1953:20261121');
    expect(passPayload('NBD-1', new Date(2027, 0, 5))).toBe('NABD:PASS:NBD-1:20270105');
  });
});
