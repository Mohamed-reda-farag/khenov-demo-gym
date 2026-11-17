import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CalendarDays, SlidersHorizontal, X } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { classRepository, onBookingsChanged } from '@/data/repository';
import { addDays, dateKey, weekStartSaturday, WINDOW_DAYS } from '@/data/rules/sessions';
import type { ClassSessionView, Trainer } from '@/data/types';
import { useLanguage } from '@/i18n';
import { useFormat } from '@/lib/format';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

import { ClassRow } from './ClassRow';
import { DaySelector, type DayCell } from './DaySelector';
import { FilterSheet } from './FilterSheet';
import {
  applyFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  toggle,
  type ClassFilters,
} from './filters';

const keyExtractor = (item: ClassSessionView) => item.id;

export function ClassesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const format = useFormat();
  const language = useLanguage();
  const { colors } = useTheme();
  const { state, reload, refresh } = useAsyncResource(() => classRepository.listSessions());

  const [today] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(() => dateKey(new Date()));
  const [filters, setFilters] = useState<ClassFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => onBookingsChanged(refresh), [refresh]);

  const sessions = useMemo(() => (state.status === 'success' ? state.data : []), [state]);
  const filtered = useMemo(() => applyFilters(sessions, filters), [sessions, filters]);

  const trainers = useMemo(() => {
    const byId = new Map<string, Trainer>();
    for (const s of sessions) byId.set(s.trainer.id, s.trainer);
    return [...byId.values()];
  }, [sessions]);

  const days = useMemo<DayCell[]>(() => {
    const start = weekStartSaturday(today);
    const todayKey = dateKey(today);
    return Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const date = addDays(start, i);
      const key = dateKey(date);
      const own = filtered.filter((s) => dateKey(new Date(s.startAt)) === key);
      return {
        key,
        date,
        isToday: key === todayKey,
        isPast: key < todayKey,
        classCount: own.length,
        hasBooking: sessions.some(
          (s) =>
            dateKey(new Date(s.startAt)) === key &&
            (s.slot === 'booked' || s.slot === 'waitlisted'),
        ),
      };
    });
  }, [today, filtered, sessions]);

  const daySessions = useMemo(
    () => filtered.filter((s) => dateKey(new Date(s.startAt)) === selectedKey),
    [filtered, selectedKey],
  );

  const openDetails = useCallback(
    (sessionId: string) => router.push({ pathname: '/class/[sessionId]', params: { sessionId } }),
    [router],
  );

  const activeCount = countActiveFilters(filters);
  const chips = [
    ...filters.categories.map((c) => ({
      key: `c-${c}`,
      label: t(`classes.category.${c}`),
      remove: () => setFilters((f) => ({ ...f, categories: toggle(f.categories, c) })),
    })),
    ...filters.trainerIds.map((id) => ({
      key: `t-${id}`,
      label: trainers.find((tr) => tr.id === id)?.name[language] ?? id,
      remove: () => setFilters((f) => ({ ...f, trainerIds: toggle(f.trainerIds, id) })),
    })),
    ...filters.times.map((time) => ({
      key: `d-${time}`,
      label: t(`classes.timeOfDay.${time}`),
      remove: () => setFilters((f) => ({ ...f, times: toggle(f.times, time) })),
    })),
  ];

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <Text variant="h1">{t('classes.title')}</Text>
          <Text variant="small" color="secondary">
            {t('classes.subtitle')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            activeCount > 0
              ? `${t('classes.filters.open')} (${t('units.filters', { count: activeCount, countText: format.number(activeCount) })})`
              : t('classes.filters.open')
          }
          onPress={() => setFilterOpen(true)}
          style={[
            styles.filterButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Icon icon={SlidersHorizontal} size={20} />
          <Text variant="label">{t('classes.filters.open')}</Text>
          {activeCount > 0 ? (
            <View style={[styles.count, { backgroundColor: colors.accent }]}>
              <Text variant="caption" color="onAccent">
                {format.number(activeCount)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <DaySelector days={days} selectedKey={selectedKey} onSelect={setSelectedKey} />

      {chips.length > 0 ? (
        <View style={styles.chips} role="group" aria-label={t('classes.filters.active')}>
          {chips.map((chip) => (
            <Pressable
              key={chip.key}
              accessibilityRole="button"
              accessibilityLabel={t('classes.filters.removeChip', { label: chip.label })}
              onPress={chip.remove}
              style={[
                styles.chip,
                { backgroundColor: colors.accentSoft, borderColor: colors.accent },
              ]}
            >
              <Text variant="label" color="accent">
                {chip.label}
              </Text>
              <Icon icon={X} size={16} color="accentText" />
            </Pressable>
          ))}
          {chips.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('classes.filters.clearAll')}
              onPress={() => setFilters(EMPTY_FILTERS)}
              style={styles.clearAll}
            >
              <Text variant="label" color="secondary">
                {t('classes.filters.clearAll')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const empty =
    state.status === 'loading' ? (
      <View style={styles.skeletons}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={104} rounded={radius.xl} />
        ))}
      </View>
    ) : state.status === 'error' ? (
      <ErrorState onRetry={reload} />
    ) : activeCount > 0 ? (
      <EmptyState
        icon={CalendarDays}
        title={t('classes.empty.filteredTitle')}
        body={t('classes.empty.filteredBody')}
        actionLabel={t('classes.empty.clearFilters')}
        onAction={() => setFilters(EMPTY_FILTERS)}
      />
    ) : (
      <EmptyState
        icon={CalendarDays}
        title={t('classes.empty.dayTitle')}
        body={t('classes.empty.dayBody')}
      />
    );

  return (
    <Screen withTabBar>
      <FlatList
        data={daySessions}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <ClassRow item={item} onPress={openDetails} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
      />
      <FilterSheet
        visible={filterOpen}
        filters={filters}
        trainers={trainers}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: { gap: spacing.md, paddingBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleText: { flex: 1 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  count: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  clearAll: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  list: { paddingBottom: spacing.xl },
  separator: { height: spacing.sm },
  skeletons: { gap: spacing.sm },
});
