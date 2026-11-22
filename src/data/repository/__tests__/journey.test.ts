import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { logSet } from '../../rules/activeSession';
import { logAllForTest } from '../../rules/__tests__/helpers';

const store = new Map<string, string>();

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
    getAllKeys: async () => [...store.keys()],
    multiRemove: async (keys: string[]) => keys.forEach((k) => store.delete(k)),
  },
}));

type Repos = typeof import('..');
let repos: Repos;
let reset: typeof import('@/lib/demo/reset');
let seed: typeof import('@/lib/demo/seed');
let storage: typeof import('@/lib/demo/storage');

beforeAll(async () => {
  vi.stubEnv('EXPO_PUBLIC_DEMO_FAST', '1');
  repos = await import('..');
  reset = await import('@/lib/demo/reset');
  seed = await import('@/lib/demo/seed');
  storage = await import('@/lib/demo/storage');
});

beforeEach(async () => {
  await storage.demoStorage.clear();
  await seed.ensureSeeded();
});

afterEach(() => {
  vi.useRealTimers();
});

async function code(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'ok';
  } catch (error) {
    return error instanceof repos.BookingError ? error.code : 'other';
  }
}

/** Future sessions that are open and do not clash with the seeded bookings. */
async function freeSessions() {
  const [all, booked] = await Promise.all([
    repos.classRepository.listSessions(),
    repos.classRepository.listUpcomingBooked(),
  ]);
  const clash = (a: { startAt: string; endAt: string }) =>
    booked.some(
      (b) =>
        Date.parse(a.startAt) < Date.parse(b.endAt) && Date.parse(b.startAt) < Date.parse(a.endAt),
    );
  return all.filter((s) => s.slot === 'open' && !clash(s));
}

describe('a visitor journey through the repositories', () => {
  it('starts with a fresh session, a member, and two upcoming bookings', async () => {
    expect(await repos.sessionRepository.get()).toEqual({ onboardingDone: false, loggedIn: false });
    expect((await repos.memberRepository.get()).name.en).toBe('Nour Mostafa');
    expect(await repos.classRepository.listUpcomingBooked()).toHaveLength(2);
    expect((await repos.classRepository.listSessions()).length).toBeGreaterThanOrEqual(20);
  });

  it('logs in and remembers it', async () => {
    await repos.sessionRepository.completeOnboarding();
    await repos.sessionRepository.loginAsDemoMember();
    expect((await repos.sessionRepository.get()).loggedIn).toBe(true);
  });

  it('books, shows the booking, then cancels and undoes the cancellation', async () => {
    const [target] = (await freeSessions()).filter(
      (s) => Date.parse(s.startAt) - Date.now() > 3 * 3_600_000,
    );
    expect(target).toBeDefined();
    const booked = await repos.bookingRepository.book(target!.id);
    expect(booked.slot).toBe('booked');
    expect(booked.bookedCount).toBe(target!.bookedCount + 1);
    expect(await repos.classRepository.listUpcomingBooked()).toHaveLength(3);

    expect(await code(repos.bookingRepository.book(target!.id))).toBe('already_booked');

    const cancelled = await repos.bookingRepository.cancel(target!.id);
    expect(cancelled.slot).toBe('open');
    expect(await repos.classRepository.listUpcomingBooked()).toHaveLength(2);

    const restored = await repos.bookingRepository.undoCancel(target!.id);
    expect(restored.slot).toBe('booked');
  });

  it('enforces capacity, overlap and the past through the repository', async () => {
    const all = await repos.classRepository.listSessions();
    const full = all.find((s) => s.slot === 'full' && s.waitlistCount > 0)!;
    expect(await code(repos.bookingRepository.book(full.id))).toBe('class_full');

    const ended = all.find((s) => s.slot === 'ended');
    if (ended) expect(await code(repos.bookingRepository.book(ended.id))).toBe('in_past');

    const [mine] = await repos.classRepository.listUpcomingBooked();
    const clash = all.find(
      (s) =>
        s.id !== mine!.id &&
        s.slot === 'open' &&
        Date.parse(s.startAt) < Date.parse(mine!.endAt) &&
        Date.parse(mine!.startAt) < Date.parse(s.endAt),
    );
    if (clash) expect(await code(repos.bookingRepository.book(clash.id))).toBe('overlap');
  });

  it('joins a waitlist and gets confirmed after the simulated delay', async () => {
    const all = await repos.classRepository.listSessions();
    const [mine0, mine1] = await repos.classRepository.listUpcomingBooked();
    const full = all.find(
      (s) =>
        s.slot === 'full' &&
        Date.parse(s.startAt) > Date.now() &&
        ![mine0, mine1].some(
          (b) =>
            Date.parse(s.startAt) < Date.parse(b!.endAt) &&
            Date.parse(b!.startAt) < Date.parse(s.endAt),
        ),
    );
    if (!full) return; // every full class clashes today; covered by the pure rule tests
    const joined = await repos.bookingRepository.joinWaitlist(full.id);
    expect(joined.slot).toBe('waitlisted');
    expect(await repos.bookingRepository.settleWaitlist()).toHaveLength(0);

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 6_000);
    const promoted = await repos.bookingRepository.settleWaitlist();
    expect(promoted.map((p) => p.id)).toEqual([full.id]);
    expect((await repos.classRepository.getSession(full.id)).slot).toBe('booked');
    expect(await repos.bookingRepository.settleWaitlist()).toHaveLength(0);
  });

  it('serialises simultaneous bookings without losing one', async () => {
    const free = (await freeSessions()).filter((s) => Date.parse(s.startAt) > Date.now());
    const picked: typeof free = [];
    for (const s of free) {
      if (
        picked.every(
          (p) =>
            Date.parse(s.startAt) >= Date.parse(p.endAt) ||
            Date.parse(p.startAt) >= Date.parse(s.endAt),
        )
      ) {
        picked.push(s);
      }
      if (picked.length === 3) break;
    }
    expect(picked).toHaveLength(3);
    await Promise.all(picked.map((s) => repos.bookingRepository.book(s.id)));
    expect(await repos.classRepository.listUpcomingBooked()).toHaveLength(5);
  });

  it('notifies subscribers when bookings change', async () => {
    const listener = vi.fn();
    const off = repos.onBookingsChanged(listener);
    const [target] = await freeSessions();
    await repos.bookingRepository.book(target!.id);
    expect(listener).toHaveBeenCalled();
    off();
  });

  it('plans today from the schedule: a plan on training days, none on rest days', async () => {
    const plans = await Promise.all(
      Array.from({ length: 7 }, (_, i) =>
        repos.workoutPlanRepository.getForToday(new Date(2026, 10, 14 + i, 12)),
      ),
    );
    expect(plans.filter(Boolean).length).toBeGreaterThan(0);
    expect(plans.filter((p) => p === null).length).toBeGreaterThan(0);
  });

  it('Reset demo wipes the changes and reseeds', async () => {
    const [target] = await freeSessions();
    await repos.bookingRepository.book(target!.id);
    await repos.sessionRepository.loginAsDemoMember();
    await reset.resetDemo();
    expect(await repos.classRepository.listUpcomingBooked()).toHaveLength(2);
    expect((await repos.sessionRepository.get()).loggedIn).toBe(false);
  });
});

async function failure(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'ok';
  } catch (error) {
    if (error instanceof repos.WorkoutError || error instanceof repos.BodyError) return error.code;
    throw error;
  }
}

describe('a workout through the repositories', () => {
  it('starts, saves progress, resumes after a restart, and allows one session at a time', async () => {
    const [plan] = await repos.workoutPlanRepository.list();
    expect(await repos.workoutSessionRepository.getActive()).toBeNull();
    const active = await repos.workoutSessionRepository.start(plan!.id);
    expect(await failure(repos.workoutSessionRepository.start(plan!.id))).toBe(
      'session_in_progress',
    );
    expect(await failure(repos.workoutSessionRepository.start('nope'))).toBe('session_in_progress');

    const edited = { ...active, currentIndex: 2 };
    await repos.workoutSessionRepository.saveActive(edited);
    expect((await repos.workoutSessionRepository.getActive())?.currentIndex).toBe(2);

    await repos.workoutSessionRepository.discardActive();
    expect(await repos.workoutSessionRepository.getActive()).toBeNull();
    expect(await failure(repos.workoutSessionRepository.start('nope'))).toBe('plan_not_found');
  });

  it('refuses to finish with nothing logged and without an active session', async () => {
    const [plan] = await repos.workoutPlanRepository.list();
    const active = await repos.workoutSessionRepository.start(plan!.id);
    expect(await failure(repos.workoutSessionRepository.finish(active))).toBe('no_sets');
    await repos.workoutSessionRepository.discardActive();
    expect(await failure(repos.workoutSessionRepository.finish(active))).toBe('no_active_session');
  });

  it('finishes: saves to history, finds records, unlocks achievements and extends the streak', async () => {
    const before = await repos.progressRepository.listSessions();
    expect(before).toHaveLength(24);
    expect(await repos.progressRepository.getStreak()).toBe(6);

    const [plan] = await repos.workoutPlanRepository.list();
    const started = await repos.workoutSessionRepository.start(plan!.id);
    const full = logAllForTest(started, 120);
    const result = await repos.workoutSessionRepository.finish(full);

    expect(result.session.partial).toBe(false);
    expect(result.streak).toBe(7);
    expect(result.prs.some((p) => p.exerciseId === 'bench-press')).toBe(true);
    expect(result.newlyUnlocked.map((a) => a.id).sort()).toEqual(['sessions-25', 'streak-7']);
    expect(await repos.workoutSessionRepository.getActive()).toBeNull();

    expect(await repos.progressRepository.listSessions()).toHaveLength(25);
    expect(await repos.progressRepository.getStreak()).toBe(7);
    const records = await repos.progressRepository.listPersonalRecords();
    expect(records.find((r) => r.exerciseId === 'bench-press')?.weightKg).toBe(120);
    const statuses = await repos.progressRepository.listAchievements();
    expect(statuses.find((a) => a.id === 'streak-7')?.unlockedAt).not.toBeNull();

    const summary = await repos.workoutSessionRepository.getSummary(result.session.id);
    expect(summary.prs).toEqual(result.prs);
    expect(summary.unlocked.map((a) => a.id).sort()).toEqual(['sessions-25', 'streak-7']);
    expect(summary.streak).toBe(7);

    // a second workout does not unlock them again
    const again = await repos.workoutSessionRepository.start(plan!.id);
    const second = await repos.workoutSessionRepository.finish(logAllForTest(again, 125));
    expect(second.newlyUnlocked).toEqual([]);
  });

  it('saves a partial session and keeps only what was logged', async () => {
    const [plan] = await repos.workoutPlanRepository.list();
    const started = await repos.workoutSessionRepository.start(plan!.id);
    const rules = await import('@/data/rules/activeSession');
    const partial = rules.logSet(started, { weightKg: 60, reps: 8 }, Date.now());
    const result = await repos.workoutSessionRepository.finish(partial);
    expect(result.session.partial).toBe(true);
    expect(result.session.exercises).toHaveLength(1);
    expect(result.session.volumeKg).toBe(480);
  });

  it('reports an unknown summary as a typed error', async () => {
    expect(await failure(repos.workoutSessionRepository.getSummary('missing'))).toBe(
      'session_not_found',
    );
  });

  it('Reset demo forgets workouts, unlocks and any session in progress', async () => {
    const [plan] = await repos.workoutPlanRepository.list();
    const started = await repos.workoutSessionRepository.start(plan!.id);
    await repos.workoutSessionRepository.finish(logAllForTest(started, 100));
    const again = await repos.workoutSessionRepository.start(plan!.id);
    expect(again).toBeDefined();
    await reset.resetDemo();
    expect(await repos.workoutSessionRepository.getActive()).toBeNull();
    expect(await repos.progressRepository.listSessions()).toHaveLength(24);
    expect(await repos.progressRepository.getStreak()).toBe(6);
  });
});

describe('body measurements through the repository', () => {
  const draft = {
    date: new Date().toISOString(),
    weightKg: 79.2,
    waistCm: 87.5,
    chestCm: 102.8,
    armCm: 33.5,
  };

  it('lists the eight seeded weeks, oldest first', async () => {
    const entries = await repos.progressRepository.listBodyEntries();
    expect(entries).toHaveLength(8);
    const times = entries.map((e) => Date.parse(e.date));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('adds, updates, removes and restores an entry', async () => {
    const added = await repos.progressRepository.addBodyEntry(draft);
    expect(await repos.progressRepository.listBodyEntries()).toHaveLength(9);

    const { entry, previous } = await repos.progressRepository.updateBodyEntry(added.id, {
      ...draft,
      weightKg: 78.9,
    });
    expect(entry.weightKg).toBe(78.9);
    expect(previous.weightKg).toBe(79.2);

    const removed = await repos.progressRepository.removeBodyEntry(added.id);
    expect(await repos.progressRepository.listBodyEntries()).toHaveLength(8);
    await repos.progressRepository.restoreBodyEntry(removed);
    await repos.progressRepository.restoreBodyEntry(removed);
    expect(await repos.progressRepository.listBodyEntries()).toHaveLength(9);
  });

  it('refuses values out of range and unknown entries with typed errors', async () => {
    expect(await failure(repos.progressRepository.addBodyEntry({ ...draft, weightKg: 12 }))).toBe(
      'invalid_weightKg',
    );
    expect(await failure(repos.progressRepository.addBodyEntry({ ...draft, armCm: 200 }))).toBe(
      'invalid_armCm',
    );
    expect(
      await failure(
        repos.progressRepository.addBodyEntry({
          ...draft,
          date: new Date(Date.now() + 9 * 86_400_000).toISOString(),
        }),
      ),
    ).toBe('invalid_date');
    expect(await failure(repos.progressRepository.removeBodyEntry('missing'))).toBe('not_found');
    expect(await failure(repos.progressRepository.updateBodyEntry('missing', draft))).toBe(
      'not_found',
    );
  });

  it('lets a brand-new member start with no measurements', async () => {
    for (const e of await repos.progressRepository.listBodyEntries()) {
      await repos.progressRepository.removeBodyEntry(e.id);
    }
    expect(await repos.progressRepository.listBodyEntries()).toEqual([]);
    const first = await repos.progressRepository.addBodyEntry(draft);
    expect(first.weightKg).toBe(79.2);
  });
});

describe('membership through the repository', () => {
  const quarterly = 'plan-quarterly';
  const demoCard = {
    method: 'card',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/99',
    cvv: '123',
  } as const;

  async function renewFailure(promise: Promise<unknown>): Promise<string> {
    try {
      await promise;
      return 'ok';
    } catch (error) {
      if (error instanceof repos.MembershipError) return error.code;
      throw error;
    }
  }

  it('renews, persists the new period and tells listeners', async () => {
    const before = await repos.membershipRepository.getCurrent();
    let heard = 0;
    const stop = repos.onMembershipChanged(() => (heard += 1));
    const { membership, receipt } = await repos.membershipRepository.renew(quarterly, demoCard);
    stop();
    expect(heard).toBe(1);
    expect(Date.parse(membership.endDate)).toBeGreaterThan(Date.parse(before.endDate));
    expect(receipt.amountEgp).toBe(2400);
    expect(receipt.reference).toMatch(/^NBD-R-\d{6}$/);
    expect(await repos.membershipRepository.getCurrent()).toEqual(membership);
  });

  it('refuses a declined card or a bad form and leaves the membership alone', async () => {
    const before = await repos.membershipRepository.getCurrent();
    expect(
      await renewFailure(
        repos.membershipRepository.renew(quarterly, {
          ...demoCard,
          cardNumber: '4000 0000 0000 0002',
        }),
      ),
    ).toBe('card_declined');
    expect(
      await renewFailure(repos.membershipRepository.renew(quarterly, { ...demoCard, cvv: '1' })),
    ).toBe('invalid_card_cvv');
    expect(await renewFailure(repos.membershipRepository.renew('plan-gold', demoCard))).toBe(
      'plan_not_found',
    );
    expect(await repos.membershipRepository.getCurrent()).toEqual(before);
  });

  it('the seeded membership is always active, whenever the demo is opened', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 400 * 86_400_000);
    const later = await repos.membershipRepository.getCurrent();
    expect(later.status).toBe('active');
    expect(Date.parse(later.endDate)).toBeGreaterThan(Date.now());
  });

  it('a membership the member renewed has fixed dates and can lapse for real', async () => {
    const { membership } = await repos.membershipRepository.renew('plan-monthly', demoCard);
    expect(membership.followsToday).toBeUndefined();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse(membership.endDate) + 3 * 86_400_000);
    const lapsed = await repos.membershipRepository.getCurrent();
    expect(lapsed.status).toBe('expired');
    const again = await repos.membershipRepository.renew('plan-monthly', demoCard);
    expect(new Date(again.membership.startDate).toDateString()).toBe(new Date().toDateString());
    expect((await repos.membershipRepository.getCurrent()).status).toBe('active');
  });
});

describe('seeded measurements and workout time through the repositories', () => {
  it('the newest seeded measurement is still today 40 days after seeding', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 40 * 86_400_000);
    const entries = await repos.progressRepository.listBodyEntries();
    expect(entries).toHaveLength(8);
    expect(new Date(entries[7]!.date).toDateString()).toBe(new Date().toDateString());
  });

  it('a measurement the member edits stops following today', async () => {
    const [first] = await repos.progressRepository.listBodyEntries();
    const { entry } = await repos.progressRepository.updateBodyEntry(first!.id, {
      date: first!.date,
      weightKg: 90,
      waistCm: first!.waistCm,
      chestCm: first!.chestCm,
      armCm: first!.armCm,
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 30 * 86_400_000);
    const after = await repos.progressRepository.listBodyEntries();
    expect(after.find((e) => e.id === entry.id)?.date).toBe(entry.date);
  });

  it('a workout forgotten for ten hours is saved as at most three hours', async () => {
    const [plan] = await repos.workoutPlanRepository.list();
    const started = await repos.workoutSessionRepository.start(plan!.id);
    const logged = logSet(started, { weightKg: 60, reps: 8 }, started.startedAtMs + 2 * 60_000);
    await repos.workoutSessionRepository.saveActive(logged);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(started.startedAtMs + 10 * 3_600_000);
    const { session } = await repos.workoutSessionRepository.finish(logged);
    expect(session.durationSec).toBe(2 * 60 + 3 * 3600);
  });
});

describe('check-in, notifications and profile through the repositories', () => {
  async function inbox() {
    return repos.notificationRepository.list();
  }

  it('records a scan, shows it newest first, and refuses an immediate second scan', async () => {
    const before = await repos.visitRepository.list();
    expect(before.length).toBeGreaterThanOrEqual(20);
    expect(before.every((v) => v.source === 'history')).toBe(true);
    const scan = await repos.visitRepository.recordScan();
    const after = await repos.visitRepository.list();
    expect(after).toHaveLength(before.length + 1);
    expect(after[0]).toEqual(scan);
    try {
      await repos.visitRepository.recordScan();
      expect.unreachable();
    } catch (error) {
      expect((error as InstanceType<typeof repos.VisitError>).code).toBe('duplicate_scan');
    }
  });

  it('refuses a scan once the renewed membership has lapsed', async () => {
    const { membership } = await repos.membershipRepository.renew('plan-monthly', {
      method: 'wallet',
      phone: '01012345678',
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse(membership.endDate) + 3 * 86_400_000);
    try {
      await repos.visitRepository.recordScan();
      expect.unreachable();
    } catch (error) {
      expect((error as InstanceType<typeof repos.VisitError>).code).toBe('membership_expired');
    }
  });

  it('starts with a seeded inbox and keeps read state', async () => {
    const items = await inbox();
    expect(items).toHaveLength(4);
    expect(await repos.notificationRepository.unreadCount()).toBe(2);
    await repos.notificationRepository.markRead(items.find((n) => !n.read)!.id);
    expect(await repos.notificationRepository.unreadCount()).toBe(1);
    await repos.notificationRepository.markAllRead();
    expect(await repos.notificationRepository.unreadCount()).toBe(0);
  });

  it('adds a notification for a real booking and for a payment, and tells listeners', async () => {
    await repos.notificationRepository.markAllRead();
    let heard = 0;
    const stop = repos.onNotificationsChanged(() => (heard += 1));
    const [target] = (await freeSessions()).filter(
      (s) => Date.parse(s.startAt) - Date.now() > 3_600_000,
    );
    await repos.bookingRepository.book(target!.id);
    await repos.membershipRepository.renew('plan-annual', {
      method: 'wallet',
      phone: '01012345678',
    });
    stop();
    expect(heard).toBe(2);
    const items = await inbox();
    expect(items).toHaveLength(6);
    expect(
      items
        .filter((n) => !n.read)
        .map((n) => n.payload.kind)
        .sort(),
    ).toEqual(['class_reminder', 'payment']);
  });

  it('sends nothing for a kind that is switched off', async () => {
    await repos.notificationRepository.setSetting('payments', false);
    expect((await repos.notificationRepository.getSettings()).payments).toBe(false);
    await repos.membershipRepository.renew('plan-annual', {
      method: 'wallet',
      phone: '01012345678',
    });
    expect(await inbox()).toHaveLength(4);
    await repos.notificationRepository.setSetting('payments', true);
  });

  it('does not notify for a payment that was declined', async () => {
    try {
      await repos.membershipRepository.renew('plan-annual', {
        method: 'card',
        cardNumber: '4000 0000 0000 0002',
        expiry: '12/99',
        cvv: '123',
      });
    } catch {
      // expected
    }
    expect(await inbox()).toHaveLength(4);
  });

  it('notifies about badges earned by a finished workout', async () => {
    const [plan] = await repos.workoutPlanRepository.list();
    const started = await repos.workoutSessionRepository.start(plan!.id);
    const done = logAllForTest(started);
    await repos.workoutSessionRepository.saveActive(done);
    const { newlyUnlocked } = await repos.workoutSessionRepository.finish(done);
    const badges = (await inbox()).filter((n) => n.payload.kind === 'achievement');
    expect(badges).toHaveLength(2 + newlyUnlocked.length);
  });

  it('edits the name and initials, tells listeners, and refuses bad input', async () => {
    let heard = 0;
    const stop = repos.onProfileChanged(() => (heard += 1));
    const member = await repos.memberRepository.updateProfile({
      nameAr: 'نور أحمد',
      nameEn: 'Nour Ahmed',
      initials: 'NA',
    });
    stop();
    expect(heard).toBe(1);
    expect(member).toMatchObject({ name: { en: 'Nour Ahmed' }, initials: 'NA', id: 'member-demo' });
    expect((await repos.memberRepository.get()).initials).toBe('NA');
    const cleared = await repos.memberRepository.updateProfile({
      nameAr: 'نور أحمد',
      nameEn: 'Nour Ahmed',
      initials: '',
    });
    expect(cleared.initials).toBeUndefined();
    try {
      await repos.memberRepository.updateProfile({ nameAr: 'نور', nameEn: 'N', initials: '' });
      expect.unreachable();
    } catch (error) {
      expect((error as InstanceType<typeof repos.ProfileError>).code).toBe('invalid_name_en');
    }
  });
});
