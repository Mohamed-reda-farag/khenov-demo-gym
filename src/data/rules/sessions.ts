import type { ClassTemplate } from '../types';

/** Sessions exist for the current week (starting Saturday) and the next one. */
export const WINDOW_DAYS = 14;

export interface SessionTiming {
  id: string;
  templateId: string;
  dateKey: string;
  startMs: number;
  endMs: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return next;
}

/** Local midnight of the Saturday that starts the week containing `now`. */
export function weekStartSaturday(now: Date): Date {
  const sinceSaturday = (now.getDay() + 1) % 7;
  return addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -sinceSaturday);
}

export function makeSessionId(templateId: string, key: string): string {
  return `${templateId}@${key}`;
}

export function parseSessionId(id: string): { templateId: string; dateKey: string } | null {
  const [templateId, key, ...rest] = id.split('@');
  if (!templateId || !key || rest.length > 0 || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  return { templateId, dateKey: key };
}

function buildTiming(template: ClassTemplate, key: string): SessionTiming | null {
  const day = parseDateKey(key);
  if (day.getDay() !== template.dayOfWeek) return null;
  const [hh = 0, mm = 0] = template.startTime.split(':').map(Number);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm);
  return {
    id: makeSessionId(template.id, key),
    templateId: template.id,
    dateKey: key,
    startMs: start.getTime(),
    endMs: start.getTime() + template.durationMin * 60_000,
  };
}

/** All sessions of the rolling window, oldest first. */
export function generateSessionTimings(templates: ClassTemplate[], now: Date): SessionTiming[] {
  const start = weekStartSaturday(now);
  const timings: SessionTiming[] = [];
  for (let i = 0; i < WINDOW_DAYS; i += 1) {
    const day = addDays(start, i);
    const key = dateKey(day);
    for (const template of templates) {
      if (template.dayOfWeek !== day.getDay()) continue;
      const timing = buildTiming(template, key);
      if (timing) timings.push(timing);
    }
  }
  return timings.sort((a, b) => a.startMs - b.startMs);
}

/** Finds one session by id, only if it belongs to the current window. */
export function resolveSession(
  templates: ClassTemplate[],
  sessionId: string,
  now: Date,
): { template: ClassTemplate; timing: SessionTiming } | null {
  const parsed = parseSessionId(sessionId);
  if (!parsed) return null;
  const template = templates.find((t) => t.id === parsed.templateId);
  if (!template) return null;
  const start = weekStartSaturday(now);
  const day = parseDateKey(parsed.dateKey);
  const offset = Math.round((day.getTime() - start.getTime()) / 86_400_000);
  if (offset < 0 || offset >= WINDOW_DAYS) return null;
  const timing = buildTiming(template, parsed.dateKey);
  return timing ? { template, timing } : null;
}
