export type ThemeMode = 'dark' | 'light';

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentText: string;
  onAccent: string;
  accentSoft: string;
  danger: string;
  success: string;
  warning: string;
  overlay: string;
}

export const palettes: Record<ThemeMode, ColorTokens> = {
  dark: {
    background: '#0E1116',
    surface: '#171B22',
    surfaceAlt: '#212733',
    border: '#2B3240',
    text: '#F6F7F9',
    textSecondary: '#A3ADBC',
    textMuted: '#8791A1',
    accent: '#FFD21F',
    accentText: '#FFD21F',
    onAccent: '#14110A',
    accentSoft: 'rgba(255, 210, 31, 0.14)',
    danger: '#FF6B6B',
    success: '#3DDC97',
    warning: '#FFB84D',
    overlay: 'rgba(5, 7, 10, 0.68)',
  },
  light: {
    background: '#F3F5F8',
    surface: '#FFFFFF',
    surfaceAlt: '#E9EDF2',
    border: '#D8DEE6',
    text: '#0E1116',
    textSecondary: '#454F5E',
    textMuted: '#5B6676',
    accent: '#FFD21F',
    accentText: '#7A5B00',
    onAccent: '#14110A',
    accentSoft: 'rgba(255, 210, 31, 0.28)',
    danger: '#C62828',
    success: '#0B6B45',
    warning: '#9A5B00',
    overlay: 'rgba(14, 17, 22, 0.5)',
  },
};
