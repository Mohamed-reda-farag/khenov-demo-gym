import { Platform } from 'react-native';

/**
 * Switches for recording videos and for reaching states that are hard to reach by hand.
 * Web: `?demo=fast,expired`. Native: `EXPO_PUBLIC_DEMO=fast,expired` before `npx expo start -c`.
 */
export type DemoFlag = 'fast' | 'error' | 'payfail' | 'expired' | 'expiring' | 'empty';

const KNOWN: readonly DemoFlag[] = ['fast', 'error', 'payfail', 'expired', 'expiring', 'empty'];

function parse(raw: string | null | undefined): DemoFlag[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part): part is DemoFlag => (KNOWN as readonly string[]).includes(part));
}

function detect(): ReadonlySet<DemoFlag> {
  const found = new Set<DemoFlag>();
  if (process.env.EXPO_PUBLIC_DEMO_FAST === '1') found.add('fast');
  parse(process.env.EXPO_PUBLIC_DEMO).forEach((flag) => found.add(flag));
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    parse(new URLSearchParams(window.location.search).get('demo')).forEach((flag) =>
      found.add(flag),
    );
  }
  return found;
}

/** Read once at startup so redirects that drop the query string cannot turn a flag off. */
export const DEMO_FLAGS: ReadonlySet<DemoFlag> = detect();

export const hasDemoFlag = (flag: DemoFlag): boolean => DEMO_FLAGS.has(flag);

export { parse as parseDemoFlags };
