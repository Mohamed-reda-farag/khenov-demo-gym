import { Platform } from 'react-native';

function detectFastMode(): boolean {
  if (process.env.EXPO_PUBLIC_DEMO_FAST === '1') return true;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).get('demo') === 'fast';
  }
  return false;
}

/** Read once at startup so redirects that drop the query string cannot turn it off. */
export const FAST_MODE: boolean = detectFastMode();
