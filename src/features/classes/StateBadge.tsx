import { StyleSheet, View } from 'react-native';

import { Ban, Check, Clock, Hourglass, Plus, type LucideIcon } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text, type TextColor } from '@/components/ui/Text';
import type { ClassSlotState } from '@/data/types';
import type { ColorTokens } from '@/theme';
import { radius, spacing, useTheme } from '@/theme';

import { useClassText } from './useClassText';

const STYLE: Record<
  ClassSlotState,
  { icon: LucideIcon; text: TextColor; icolor: keyof ColorTokens }
> = {
  booked: { icon: Check, text: 'success', icolor: 'success' },
  waitlisted: { icon: Hourglass, text: 'warning', icolor: 'warning' },
  full: { icon: Ban, text: 'secondary', icolor: 'textSecondary' },
  open: { icon: Plus, text: 'accent', icolor: 'accentText' },
  ended: { icon: Clock, text: 'muted', icolor: 'textMuted' },
};

/** State is told by an icon and a word, never by color alone. */
export function StateBadge({ slot }: { slot: ClassSlotState }) {
  const { colors } = useTheme();
  const text = useClassText();
  const style = STYLE[slot];
  return (
    <View
      style={[styles.badge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      <Icon icon={style.icon} size={14} color={style.icolor} strokeWidth={2.5} />
      <Text variant="caption" color={style.text}>
        {text.slot(slot)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
