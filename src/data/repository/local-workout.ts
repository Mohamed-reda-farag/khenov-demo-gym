import { delay } from '@/lib/demo/delay';
import { demoStorage } from '@/lib/demo/storage';

import { evaluateAchievements } from '../rules/achievements';
import { createActiveSession, toWorkoutSession } from '../rules/activeSession';
import { BodyError, validateBodyDraft } from '../rules/body';
import { WorkoutError, currentStreak, detectSessionPrs, personalRecords } from '../rules/workout';
import { generateSeedHistory } from '../seed/history';
import type { ActiveSession, BodyEntry, WorkoutSession } from '../types';

import { emitWorkoutChanged } from './events';
import type { ProgressRepository, WorkoutSessionRepository } from './interfaces';
import { ACTIVE_SESSION_KEY } from './keys';
import { readCollection, serial, writeCollection } from './local-core';

const QUICK = [0, 0] as const;

const byEnd = (a: WorkoutSession, b: WorkoutSession) =>
  Date.parse(a.endedAt) - Date.parse(b.endedAt);
const byDate = (a: BodyEntry, b: BodyEntry) => Date.parse(a.date) - Date.parse(b.date);

/** Generated history of the last weeks plus the workouts done in this demo. */
async function loadHistory(now: Date) {
  const [plans, user, unlocked] = await Promise.all([
    readCollection('workoutPlans', QUICK),
    readCollection('userSessions', QUICK),
    readCollection('unlockedAchievements', QUICK),
  ]);
  const sessions = [...generateSeedHistory(now, plans), ...user].sort(byEnd);
  return { plans, user, unlocked, sessions };
}

export const localProgressRepository: ProgressRepository = {
  async listBodyEntries() {
    await delay();
    return (await readCollection('bodyEntries', QUICK)).sort(byDate);
  },

  async addBodyEntry(draft) {
    await delay(200, 450);
    return serial(async () => {
      const valid = validateBodyDraft(draft, new Date());
      const entries = await readCollection('bodyEntries', QUICK);
      const entry: BodyEntry = { ...valid, id: `body-${Date.now()}` };
      await writeCollection('bodyEntries', [...entries, entry], QUICK);
      return entry;
    });
  },

  async updateBodyEntry(id, draft) {
    await delay(200, 450);
    return serial(async () => {
      const valid = validateBodyDraft(draft, new Date());
      const entries = await readCollection('bodyEntries', QUICK);
      const previous = entries.find((e) => e.id === id);
      if (!previous) throw new BodyError('not_found');
      const entry: BodyEntry = { ...valid, id };
      await writeCollection(
        'bodyEntries',
        entries.map((e) => (e.id === id ? entry : e)),
        QUICK,
      );
      return { entry, previous };
    });
  },

  async removeBodyEntry(id) {
    await delay(150, 350);
    return serial(async () => {
      const entries = await readCollection('bodyEntries', QUICK);
      const removed = entries.find((e) => e.id === id);
      if (!removed) throw new BodyError('not_found');
      await writeCollection(
        'bodyEntries',
        entries.filter((e) => e.id !== id),
        QUICK,
      );
      return removed;
    });
  },

  async restoreBodyEntry(entry) {
    await delay(100, 250);
    return serial(async () => {
      const entries = await readCollection('bodyEntries', QUICK);
      if (entries.some((e) => e.id === entry.id)) return;
      await writeCollection('bodyEntries', [...entries, entry], QUICK);
    });
  },

  async listSessions() {
    await delay();
    return (await loadHistory(new Date())).sessions;
  },

  async listPersonalRecords() {
    await delay();
    return personalRecords((await loadHistory(new Date())).sessions);
  },

  async listAchievements() {
    await delay();
    const now = new Date();
    const { sessions, unlocked } = await loadHistory(now);
    return evaluateAchievements(sessions, now, unlocked).statuses;
  },

  async getStreak() {
    await delay(100, 300);
    const now = new Date();
    return currentStreak((await loadHistory(now)).sessions, now);
  },
};

async function readActive(): Promise<ActiveSession | null> {
  return demoStorage.get<ActiveSession>(ACTIVE_SESSION_KEY);
}

export const localWorkoutSessionRepository: WorkoutSessionRepository = {
  async getActive() {
    return readActive();
  },

  async start(planId) {
    await delay(250, 500);
    return serial(async () => {
      if (await readActive()) throw new WorkoutError('session_in_progress');
      const plans = await readCollection('workoutPlans', QUICK);
      const plan = plans.find((p) => p.id === planId);
      if (!plan) throw new WorkoutError('plan_not_found');
      const nowMs = Date.now();
      const session = createActiveSession(plan, nowMs, `session-${nowMs}`);
      await demoStorage.set(ACTIVE_SESSION_KEY, session);
      emitWorkoutChanged();
      return session;
    });
  },

  async saveActive(session) {
    await demoStorage.set(ACTIVE_SESSION_KEY, session);
  },

  async discardActive() {
    await delay(100, 250);
    await demoStorage.remove(ACTIVE_SESSION_KEY);
    emitWorkoutChanged();
  },

  async finish(session) {
    await delay(300, 600);
    return serial(async () => {
      if (!(await readActive())) throw new WorkoutError('no_active_session');
      const nowMs = Date.now();
      const now = new Date(nowMs);
      const finished = toWorkoutSession(session, nowMs);
      const { user, unlocked, sessions } = await loadHistory(now);
      const prs = detectSessionPrs(sessions, finished);
      const evaluation = evaluateAchievements([...sessions, finished], now, unlocked);
      const saved: WorkoutSession = {
        ...finished,
        unlockedAchievementIds: evaluation.newlyUnlocked,
      };

      await writeCollection('userSessions', [...user, saved], QUICK);
      await writeCollection(
        'unlockedAchievements',
        {
          ...unlocked,
          ...Object.fromEntries(evaluation.newlyUnlocked.map((id) => [id, now.toISOString()])),
        },
        QUICK,
      );
      await demoStorage.remove(ACTIVE_SESSION_KEY);
      emitWorkoutChanged();

      return {
        session: saved,
        prs,
        newlyUnlocked: evaluation.statuses.filter((s) => evaluation.newlyUnlocked.includes(s.id)),
        streak: currentStreak([...sessions, saved], now),
      };
    });
  },

  async getSummary(sessionId) {
    await delay(200, 450);
    const now = new Date();
    const { sessions, unlocked } = await loadHistory(now);
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new WorkoutError('session_not_found');
    const end = Date.parse(session.endedAt);
    const before = sessions.filter((s) => Date.parse(s.endedAt) < end);
    const upTo = sessions.filter((s) => Date.parse(s.endedAt) <= end);
    const statuses = evaluateAchievements(sessions, now, unlocked).statuses;
    return {
      session,
      prs: detectSessionPrs(before, session),
      unlocked: statuses.filter((s) => session.unlockedAchievementIds.includes(s.id)),
      streak: currentStreak(upTo, new Date(end)),
    };
  },
};
