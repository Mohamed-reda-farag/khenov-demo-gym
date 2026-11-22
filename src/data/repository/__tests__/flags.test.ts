import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const demoCard = {
  method: 'card',
  cardNumber: '4242 4242 4242 4242',
  expiry: '12/99',
  cvv: '123',
} as const;

/** Flags are read once at startup, so each test loads the app's data layer fresh. */
async function load(flags: string) {
  vi.resetModules();
  vi.stubEnv('EXPO_PUBLIC_DEMO', `fast,${flags}`);
  const repos = await import('..');
  const seed = await import('@/lib/demo/seed');
  const storage = await import('@/lib/demo/storage');
  await storage.demoStorage.clear();
  await seed.ensureSeeded();
  return repos;
}

beforeEach(() => store.clear());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('?demo=expired and ?demo=expiring', () => {
  it('show the seeded membership as expired', async () => {
    const repos = await load('expired');
    expect((await repos.membershipRepository.getCurrent()).status).toBe('expired');
  });

  it('let the visitor renew out of it, after which the flag no longer matters', async () => {
    const repos = await load('expired');
    await repos.membershipRepository.renew('plan-monthly', demoCard);
    const after = await repos.membershipRepository.getCurrent();
    expect(after.status).toBe('active');
    expect(Date.parse(after.endDate)).toBeGreaterThan(Date.now());
  });

  it('block check-in while expired', async () => {
    const repos = await load('expired');
    await expect(repos.visitRepository.recordScan()).rejects.toMatchObject({
      code: 'membership_expired',
    });
  });

  it('show an active membership that ends in a week', async () => {
    const repos = await load('expiring');
    const { describeMembership } = await import('../../rules/membership');
    const m = await repos.membershipRepository.getCurrent();
    expect(describeMembership(m, new Date())).toMatchObject({ phase: 'expiring', daysLeft: 7 });
  });
});

describe('?demo=payfail', () => {
  it('fails the payment with a typed error and changes nothing', async () => {
    const repos = await load('payfail');
    const before = await repos.membershipRepository.getCurrent();
    await expect(repos.membershipRepository.renew('plan-monthly', demoCard)).rejects.toMatchObject({
      code: 'payment_failed',
    });
    expect(await repos.membershipRepository.getCurrent()).toEqual(before);
    expect(await repos.notificationRepository.list()).toHaveLength(4);
  });
});

describe('?demo=error', () => {
  it('makes every read fail so each screen shows its error state', async () => {
    const repos = await load('error');
    await expect(repos.memberRepository.get()).rejects.toThrow();
    await expect(repos.notificationRepository.list()).rejects.toThrow();
    await expect(repos.visitRepository.list()).rejects.toThrow();
    await expect(repos.membershipRepository.getCurrent()).rejects.toThrow();
  });

  it('reaches the active workout session too, which lives outside the collections', async () => {
    const repos = await load('error');
    await expect(repos.workoutSessionRepository.getActive()).rejects.toThrow();
    await expect(repos.progressRepository.listSessions()).rejects.toThrow();
    await expect(repos.classRepository.listSessions()).rejects.toThrow();
    await expect(repos.workoutPlanRepository.list()).rejects.toThrow();
  });

  it('still lets the app open: the session is spared', async () => {
    const repos = await load('error');
    expect(await repos.sessionRepository.get()).toEqual({ onboardingDone: false, loggedIn: false });
  });
});

describe('?demo=empty on the older screens', () => {
  it('shows no classes, no history, no measurements and no badges', async () => {
    const repos = await load('empty');
    expect(await repos.classRepository.listSessions()).toEqual([]);
    expect(await repos.classRepository.listUpcomingBooked()).toEqual([]);
    expect(await repos.progressRepository.listSessions()).toEqual([]);
    expect(await repos.progressRepository.listBodyEntries()).toEqual([]);
    expect(await repos.progressRepository.getStreak()).toBe(0);
    expect(await repos.progressRepository.listPersonalRecords()).toEqual([]);
    const achievements = await repos.progressRepository.listAchievements();
    expect(achievements.every((a) => !a.unlockedAt)).toBe(true);
  });

  it('still lets the visitor add a measurement and see it', async () => {
    const repos = await load('empty');
    await repos.progressRepository.addBodyEntry({
      date: new Date().toISOString(),
      weightKg: 80,
      waistCm: 90,
      chestCm: 100,
      armCm: 33,
    });
    expect(await repos.progressRepository.listBodyEntries()).toHaveLength(1);
  });
});

describe('?demo=empty', () => {
  it('hides the seeded notifications and visits, but keeps what the visitor creates', async () => {
    const repos = await load('empty');
    expect(await repos.notificationRepository.list()).toEqual([]);
    expect(await repos.visitRepository.list()).toEqual([]);
    const scan = await repos.visitRepository.recordScan();
    expect(await repos.visitRepository.list()).toEqual([scan]);
    await repos.membershipRepository.renew('plan-monthly', demoCard);
    expect(await repos.notificationRepository.list()).toHaveLength(1);
  });
});
