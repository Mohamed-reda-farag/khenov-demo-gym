import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('demo flags', () => {
  it('reads a comma separated list and ignores unknown names', async () => {
    const { parseDemoFlags } = await import('../flags');
    expect(parseDemoFlags('Fast, expired ,nope,empty')).toEqual(['fast', 'expired', 'empty']);
    expect(parseDemoFlags('')).toEqual([]);
    expect(parseDemoFlags(null)).toEqual([]);
  });

  it('are off by default', async () => {
    const { DEMO_FLAGS } = await import('../flags');
    expect(DEMO_FLAGS.size).toBe(0);
  });

  it('come from EXPO_PUBLIC_DEMO on native, and the old fast switch still works', async () => {
    vi.stubEnv('EXPO_PUBLIC_DEMO', 'error,expiring');
    vi.stubEnv('EXPO_PUBLIC_DEMO_FAST', '1');
    const { hasDemoFlag } = await import('../flags');
    expect(hasDemoFlag('error')).toBe(true);
    expect(hasDemoFlag('expiring')).toBe(true);
    expect(hasDemoFlag('fast')).toBe(true);
    expect(hasDemoFlag('expired')).toBe(false);
    const { FAST_MODE } = await import('../fast-mode');
    expect(FAST_MODE).toBe(true);
  });
});
