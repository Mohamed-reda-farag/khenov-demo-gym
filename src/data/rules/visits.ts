import type { Visit, WorkoutSession } from '../types';

import type { MembershipView } from './membership';

export type VisitErrorCode = 'membership_expired' | 'duplicate_scan';

export class VisitError extends Error {
  readonly code: VisitErrorCode;
  /** For a duplicate scan: when the visit that is already recorded happened. */
  readonly at: string | null;

  constructor(code: VisitErrorCode, at: string | null = null) {
    super(code);
    this.name = 'VisitError';
    this.code = code;
    this.at = at;
  }
}

/** A second scan this soon after a visit is the same visit (a double tap at the door). */
export const SCAN_COOLDOWN_MS = 5 * 60 * 1000;

const DAY_MS = 86_400_000;

/** Every workout of the generated history started with a visit. */
export function historyVisits(sessions: WorkoutSession[]): Visit[] {
  return sessions.map((s) => ({
    id: `visit-${s.id}`,
    at: s.startedAt,
    source: 'history' as const,
  }));
}

export function newestFirst(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/** Records a simulated scan at the door. Throws before anything is stored. */
export function recordScan(
  visits: Visit[],
  membership: MembershipView,
  now: Date,
  id: string,
): Visit {
  if (membership.phase === 'expired') throw new VisitError('membership_expired');
  const recent = visits.find((v) => Math.abs(now.getTime() - Date.parse(v.at)) < SCAN_COOLDOWN_MS);
  if (recent) throw new VisitError('duplicate_scan', recent.at);
  return { id, at: now.toISOString(), source: 'scan' };
}

export interface VisitStats {
  last7Days: number;
  last30Days: number;
  /** Average visits per week over the last eight weeks, one decimal. */
  perWeek: number;
  lastAt: string | null;
}

export function visitStats(visits: Visit[], now: Date): VisitStats {
  const t = now.getTime();
  const within = (days: number) =>
    visits.filter((v) => {
      const at = Date.parse(v.at);
      return at <= t && at > t - days * DAY_MS;
    }).length;
  const past = visits.map((v) => Date.parse(v.at)).filter((at) => at <= t);
  return {
    last7Days: within(7),
    last30Days: within(30),
    perWeek: Math.round((within(56) / 8) * 10) / 10,
    lastAt: past.length > 0 ? new Date(Math.max(...past)).toISOString() : null,
  };
}

/** What the pass QR code says. Fictional: it is not a real credential. */
export function passPayload(memberCode: string, now: Date): string {
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `NABD:PASS:${memberCode}:${yyyy}${mm}${dd}`;
}
