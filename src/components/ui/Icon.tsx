import type { LucideIcon } from '@/components/ui/icons';

import { useDirection } from '@/i18n/direction';
import { useTheme, type ColorTokens } from '@/theme';

interface IconProps {
  icon: LucideIcon;
  size?: number;
  color?: keyof ColorTokens;
  strokeWidth?: number;
  /** Mirrors the icon in RTL. Use for arrows and chevrons that point along the reading direction. */
  directional?: boolean;
}

export function Icon({
  icon: Glyph,
  size = 24,
  color = 'text',
  strokeWidth = 2,
  directional = false,
}: IconProps) {
  const { colors } = useTheme();
  const { isRTL } = useDirection();
  return (
    <Glyph
      size={size}
      color={colors[color]}
      strokeWidth={strokeWidth}
      style={directional && isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
      aria-hidden
    />
  );
}
