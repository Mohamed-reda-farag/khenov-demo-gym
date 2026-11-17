import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ChevronRight } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { ClassSessionView } from '@/data/types';
import { useFormat } from '@/lib/format';
import { layout, motion, radius, spacing, useTheme } from '@/theme';

import { StateBadge } from './StateBadge';
import { useClassText } from './useClassText';

interface ClassRowProps {
  item: ClassSessionView;
  onPress: (sessionId: string) => void;
}

function ClassRowBase({ item, onPress }: ClassRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const text = useClassText();
  const reduceMotion = useReducedMotion();

  const detail =
    item.slot === 'open'
      ? text.spotsLeft(item.spotsLeft)
      : item.slot === 'full'
        ? t('classes.row.waitlist', { countText: format.number(item.waitlistCount) })
        : item.slot === 'waitlisted'
          ? t('classes.row.position', { positionText: format.number(item.waitlistPosition ?? 0) })
          : null;

  const label = [
    text.name(item),
    format.timeRange(item.startAt, item.endAt),
    t('classes.row.with', { name: text.trainer(item) }),
    text.slot(item.slot),
    detail,
  ]
    .filter(Boolean)
    .join(format.language === 'ar' ? '، ' : ', ');

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(motion.duration.base)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={t('classes.row.open')}
        onPress={() => onPress(item.id)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: item.slot === 'ended' ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={[styles.time, { backgroundColor: colors.surfaceAlt }]}>
          <Text variant="label" align="center">
            {format.time(item.startAt)}
          </Text>
          <Text variant="caption" color="muted" align="center">
            {text.minutes(item.durationMin)}
          </Text>
        </View>

        <View style={styles.body}>
          <Text variant="title" numberOfLines={1}>
            {text.name(item)}
          </Text>
          <Text variant="small" color="secondary" numberOfLines={1}>
            {t('classes.row.with', { name: text.trainer(item) })} · {text.level(item.level)}
          </Text>
          <View style={styles.meta}>
            <StateBadge slot={item.slot} />
            {detail ? (
              <Text variant="caption" color="secondary">
                {detail}
              </Text>
            ) : null}
          </View>
        </View>

        <Icon icon={ChevronRight} size={20} color="textMuted" directional />
      </Pressable>
    </Animated.View>
  );
}

export const ClassRow = memo(ClassRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    minHeight: layout.minTouchTarget + spacing.xxl,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  time: {
    width: 76,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
  },
  body: { flex: 1, gap: spacing.xxs },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
});
