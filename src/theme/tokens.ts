export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  huge: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fonts = {
  display800: 'Changa_800ExtraBold',
  display700: 'Changa_700Bold',
  body400: 'ReadexPro_400Regular',
  body500: 'ReadexPro_500Medium',
  body600: 'ReadexPro_600SemiBold',
} as const;

export type TextVariant =
  'display' | 'h1' | 'h2' | 'title' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'label';

export const typography: Record<
  TextVariant,
  { fontFamily: string; fontSize: number; lineHeight: number }
> = {
  display: { fontFamily: fonts.display800, fontSize: 44, lineHeight: 56 },
  h1: { fontFamily: fonts.display800, fontSize: 32, lineHeight: 44 },
  h2: { fontFamily: fonts.display700, fontSize: 24, lineHeight: 34 },
  title: { fontFamily: fonts.body600, fontSize: 18, lineHeight: 28 },
  body: { fontFamily: fonts.body400, fontSize: 16, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.body500, fontSize: 16, lineHeight: 26 },
  small: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 22 },
  caption: { fontFamily: fonts.body500, fontSize: 12, lineHeight: 18 },
  label: { fontFamily: fonts.body600, fontSize: 16, lineHeight: 24 },
};

export const shadow = {
  card: '0px 6px 20px rgba(0, 0, 0, 0.28)',
  sheet: '0px -8px 32px rgba(0, 0, 0, 0.4)',
} as const;

export const motion = {
  duration: { instant: 80, fast: 150, base: 240, slow: 400 },
  spring: { damping: 20, stiffness: 240, mass: 0.9 },
} as const;

export const layout = {
  minTouchTarget: 44,
  screenPadding: spacing.md,
  tabBarHeight: 68,
} as const;
