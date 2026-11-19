import type { BodyDraft, BodyMeasure } from '../types';

export type BodyErrorCode =
  | 'invalid_weightKg'
  | 'invalid_waistCm'
  | 'invalid_chestCm'
  | 'invalid_armCm'
  | 'invalid_date'
  | 'not_found';

export class BodyError extends Error {
  readonly code: BodyErrorCode;

  constructor(code: BodyErrorCode) {
    super(code);
    this.name = 'BodyError';
    this.code = code;
  }
}

export const BODY_LIMITS: Record<BodyMeasure, { min: number; max: number; step: number }> = {
  weightKg: { min: 30, max: 300, step: 0.1 },
  waistCm: { min: 40, max: 250, step: 0.5 },
  chestCm: { min: 50, max: 250, step: 0.5 },
  armCm: { min: 15, max: 80, step: 0.5 },
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Checks ranges and rounds to one decimal. The date cannot be in the future. */
export function validateBodyDraft(draft: BodyDraft, now: Date): BodyDraft {
  const time = Date.parse(draft.date);
  if (Number.isNaN(time) || time > now.getTime() + 86_400_000) throw new BodyError('invalid_date');
  const result: BodyDraft = { ...draft };
  for (const key of Object.keys(BODY_LIMITS) as BodyMeasure[]) {
    const value = draft[key];
    const { min, max } = BODY_LIMITS[key];
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new BodyError(`invalid_${key}`);
    }
    result[key] = round1(value);
  }
  return result;
}
