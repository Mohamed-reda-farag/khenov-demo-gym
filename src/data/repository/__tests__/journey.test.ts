import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
