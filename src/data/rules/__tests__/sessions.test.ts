import { describe, expect, it } from 'vitest';

import {
  WINDOW_DAYS,
  addDays,
  dateKey,
  generateSessionTimings,
  parseSessionId,
  resolveSession,
  weekStartSaturday,
} from '../sessions';

import { template } from './fixtures';

describe('weekStartSaturday', () => {
  it('starts the week on Saturday for every weekday', () => {
    const saturday = new Date(2026, 10, 14);
    for (let i = 0; i < 7; i += 1) {
      const day = addDays(saturday, i);
      expect(dateKey(weekStartSaturday(day))).toBe('2026-11-14');
    }
    expect(dateKey(weekStartSaturday(new Date(2026, 10, 21, 9)))).toBe('2026-11-21');
  });
});

describe('generateSessionTimings', () => {
  const templates = [
    template({ id: 'wed', dayOfWeek: 3 }),
    template({ id: 'sat', dayOfWeek: 6, startTime: '07:30' }),
  ];

  it('rolls with today: always covers two weeks from the current Saturday', () => {
    for (let offset = 0; offset < 21; offset += 1) {
      const now = addDays(new Date(2026, 10, 14, 10), offset);
      const timings = generateSessionTimings(templates, now);
      expect(timings).toHaveLength(4);
      expect(timings[0]?.dateKey).toBe(dateKey(weekStartSaturday(now)));
      const last = timings[timings.length - 1];
      const windowEnd = addDays(weekStartSaturday(now), WINDOW_DAYS);
      expect(last && last.startMs < windowEnd.getTime()).toBe(true);
    }
  });

  it('always has sessions ahead of today for every template', () => {
    for (let offset = 0; offset < 21; offset += 1) {
      const now = addDays(new Date(2026, 10, 14, 23, 30), offset);
      const timings = generateSessionTimings(templates, now);
      for (const id of ['wed', 'sat']) {
        expect(timings.some((t) => t.templateId === id && t.startMs > now.getTime())).toBe(true);
      }
    }
  });

  it('sorts sessions by start time', () => {
    const timings = generateSessionTimings(templates, new Date(2026, 10, 18));
    const starts = timings.map((t) => t.startMs);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });
});

describe('session ids', () => {
  it('parses valid ids and rejects bad ones', () => {
    expect(parseSessionId('t1@2026-11-18')).toEqual({ templateId: 't1', dateKey: '2026-11-18' });
    expect(parseSessionId('nonsense')).toBeNull();
    expect(parseSessionId('t1@18-11-2026')).toBeNull();
  });

  it('refuses sessions outside the window or on the wrong weekday', () => {
    const templates = [template({ id: 't1', dayOfWeek: 3 })];
    const now = new Date(2026, 10, 18, 12);
    expect(resolveSession(templates, 't1@2026-11-18', now)).not.toBeNull();
    expect(resolveSession(templates, 't1@2026-12-02', now)).toBeNull();
    expect(resolveSession(templates, 't1@2026-11-11', now)).toBeNull();
    expect(resolveSession(templates, 't1@2026-11-19', now)).toBeNull();
    expect(resolveSession(templates, 'zzz@2026-11-18', now)).toBeNull();
  });
});
