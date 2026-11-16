import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { prefsRepository } from '@/data/repository';

import { palettes, type ColorTokens, type ThemeMode } from './colors';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorTokens;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  initialMode,
  children,
}: {
  initialMode: ThemeMode;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void prefsRepository.setTheme(next);
  }, []);

  const value = useMemo(() => ({ mode, colors: palettes[mode], setMode }), [mode, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
