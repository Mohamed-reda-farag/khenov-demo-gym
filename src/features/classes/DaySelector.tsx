import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { layout, radius, spacing, useTheme } from '@/theme';

import { useClassText } from './useClassText';

export interface DayCell {
  key: string;
  date: Date;
  isToday: boolean;
  isPast: boolean;
  classCount: number;
  hasBooking: boolean;
}

interface DaySelectorProps {
  /** Fourteen days, the first one is the Saturday that starts the current week. */
  days: DayCell[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

const WEEK = 7;

/**
 * Seven days in a row for the visible week. It fits the screen width, so there is no horizontal
 * scroll to mirror: Saturday is first in reading order in both Arabic and English.
 */
function DaySelectorBase({ days, selectedKey, onSelect }: DaySelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const text = useClassText();

  const selectedIndex = Math.max(
    0,
    days.findIndex((d) => d.key === selectedKey),
  );
  const week = Math.floor(selectedIndex / WEEK);
  const weekDays = days.slice(week * WEEK, week * WEEK + WEEK);
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];

  function select(key: string) {
    if (key === selectedKey) return;
    haptics.select();
    onSelect(key);
  }

  function shiftWeek(direction: -1 | 1) {
    const target = days[selectedIndex + direction * WEEK];
    if (target) select(target.key);
  }

  const canPrev = week > 0;
  const canNext = (week + 1) * WEEK < days.length;

  return (
    <View style={styles.root}>
      <View style={styles.weekRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('classes.week.previous')}
          accessibilityState={{ disabled: !canPrev }}
          disabled={!canPrev}
          onPress={() => shiftWeek(-1)}
          style={[styles.nav, { opacity: canPrev ? 1 : 0.35 }]}
        >
          <Icon icon={ChevronLeft} size={22} directional />
        </Pressable>
        <Text variant="bodyStrong" align="center" style={styles.range}>
          {first && last
            ? t('classes.week.range', {
                from: format.dayMonth(first.date),
                to: format.dayMonth(last.date),
              })
            : ''}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('classes.week.next')}
          accessibilityState={{ disabled: !canNext }}
          disabled={!canNext}
          onPress={() => shiftWeek(1)}
          style={[styles.nav, { opacity: canNext ? 1 : 0.35 }]}
        >
          <Icon icon={ChevronRight} size={22} directional />
        </Pressable>
      </View>

      <View style={styles.days}>
        {weekDays.map((day) => {
          const selected = day.key === selectedKey;
          const label = [
            `${format.weekday(day.date)} ${format.dayMonth(day.date)}`,
            day.isToday ? t('classes.day.today') : null,
            day.isPast ? t('classes.day.past') : null,
            text.classes(day.classCount),
            day.hasBooking ? t('classes.day.hasBooking') : null,
          ]
            .filter(Boolean)
            .join(format.language === 'ar' ? '، ' : ', ');
          return (
            <Pressable
              key={day.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => select(day.key)}
              style={[
                styles.day,
                {
                  backgroundColor: selected ? colors.accent : colors.surface,
                  borderColor: day.isToday && !selected ? colors.accent : colors.border,
                  opacity: day.isPast && !selected ? 0.55 : 1,
                },
              ]}
            >
              <Text variant="caption" color={selected ? 'onAccent' : 'secondary'} numberOfLines={1}>
                {format.weekday(day.date, 'short')}
              </Text>
              <Text variant="title" color={selected ? 'onAccent' : 'text'}>
                {format.number(day.date.getDate())}
              </Text>
              <View
                aria-hidden
                style={[
                  styles.dot,
                  {
                    backgroundColor: day.hasBooking
                      ? selected
                        ? colors.onAccent
                        : colors.accent
                      : 'transparent',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const DaySelector = memo(DaySelectorBase);

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  range: { flex: 1 },
  days: { flexDirection: 'row', gap: 2 },
  day: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
