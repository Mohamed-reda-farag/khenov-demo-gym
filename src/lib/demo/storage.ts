import AsyncStorage from '@react-native-async-storage/async-storage';

import { NAMESPACE, PREFS_NAMESPACE, ROOT_PREFIX, SEED_VERSION } from './config';

/** Used only when the platform storage throws (private mode, quota). Keeps the demo usable. */
const memoryFallback = new Map<string, string>();

function createStorage(namespace: string) {
  const fullKey = (key: string) => `${namespace}:${key}`;

  return {
    async get<T>(key: string): Promise<T | null> {
      const k = fullKey(key);
      try {
        const raw = await AsyncStorage.getItem(k);
        if (raw !== null) return JSON.parse(raw) as T;
      } catch {
        // fall through to memory
      }
      const mem = memoryFallback.get(k);
      return mem === undefined ? null : (JSON.parse(mem) as T);
    },

    async set<T>(key: string, value: T): Promise<void> {
      const k = fullKey(key);
      const raw = JSON.stringify(value);
      memoryFallback.set(k, raw);
      try {
        await AsyncStorage.setItem(k, raw);
      } catch {
        // memory copy already holds the value
      }
    },

    async remove(key: string): Promise<void> {
      const k = fullKey(key);
      memoryFallback.delete(k);
      try {
        await AsyncStorage.removeItem(k);
      } catch {
        // nothing else to do
      }
    },

    /** Removes every key inside this namespace. */
    async clear(): Promise<void> {
      const prefix = `${namespace}:`;
      for (const k of [...memoryFallback.keys()]) {
        if (k.startsWith(prefix)) memoryFallback.delete(k);
      }
      try {
        const keys = await AsyncStorage.getAllKeys();
        const own = keys.filter((k) => k.startsWith(prefix));
        if (own.length > 0) await AsyncStorage.multiRemove(own);
      } catch {
        // nothing else to do
      }
    },
  };
}

export const demoStorage = createStorage(NAMESPACE);

/** Preferences (language, theme) live outside the versioned namespace so Reset keeps them. */
export const prefsStorage = createStorage(PREFS_NAMESPACE);

/** Deletes data written under older SEED_VERSION namespaces. */
export async function purgeStaleNamespaces(): Promise<void> {
  const stale = new RegExp(`^${ROOT_PREFIX}:v(\\d+):`);
  try {
    const keys = await AsyncStorage.getAllKeys();
    const old = keys.filter((k) => {
      const match = stale.exec(k);
      return match !== null && Number(match[1]) !== SEED_VERSION;
    });
    if (old.length > 0) await AsyncStorage.multiRemove(old);
  } catch {
    // stale data is harmless
  }
}
