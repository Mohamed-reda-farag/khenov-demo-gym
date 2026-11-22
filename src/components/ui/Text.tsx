import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { typography, useTheme, type ColorTokens, type TextVariant } from '@/theme';

export type TextColor =
  'text' | 'secondary' | 'muted' | 'accent' | 'onAccent' | 'danger' | 'success' | 'warning';

const colorKey: Record<TextColor, keyof ColorTokens> = {
  text: 'text',
  secondary: 'textSecondary',
  muted: 'textMuted',
  accent: 'accentText',
  onAccent: 'onAccent',
  danger: 'danger',
  success: 'success',
  warning: 'warning',
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: 'auto' | 'center';
}

export function Text({
  variant = 'body',
  color = 'text',
  align = 'auto',
  style,
  accessibilityRole,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.3}
      // Screen titles (h1) are headings for screen reader navigation unless a role is given.
      accessibilityRole={accessibilityRole ?? (variant === 'h1' ? 'header' : undefined)}
      {...rest}
      style={[
        typography[variant],
        { color: colors[colorKey[color]] },
        align === 'center' && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
