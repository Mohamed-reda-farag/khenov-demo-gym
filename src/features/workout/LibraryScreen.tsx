import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookOpen, ChevronRight, Search, X } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { exerciseRepository } from '@/data/repository';
import type { Exercise, MuscleGroup } from '@/data/types';
import { useDirection } from '@/i18n/direction';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, typography, useTheme } from '@/theme';

import { ExerciseGlyph } from './ExerciseGlyph';
import { useWorkoutText } from './useWorkoutText';

const MUSCLES: readonly MuscleGroup[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
];

const keyExtractor = (item: Exercise) => item.id;

export function LibraryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useDirection();
  const router = useRouter();
  const format = useFormat();
  const { state, reload } = useAsyncResource(() => exerciseRepository.list());
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');

  const exercises = useMemo(() => (state.status === 'success' ? state.data : []), [state]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (muscle === 'all' || e.muscle === muscle) &&
        (needle === '' ||
          e.name.ar.toLowerCase().includes(needle) ||
          e.name.en.toLowerCase().includes(needle)),
    );
  }, [exercises, query, muscle]);

  const open = useCallback(
    (exerciseId: string) =>
      router.push({ pathname: '/exercises/[exerciseId]', params: { exerciseId } }),
    [router],
  );

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/workout');
  };

  const clear = () => {
    setQuery('');
    setMuscle('all');
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.searchBox}>
        <View
          style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Icon icon={Search} size={20} color="textMuted" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('workout.library.search')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('workout.library.searchLabel')}
            returnKeyType="search"
            autoCorrect={false}
            style={[
              styles.input,
              typography.body,
              { color: colors.text, textAlign: isRTL ? 'right' : 'left' },
            ]}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('workout.library.clear')}
              onPress={() => setQuery('')}
              style={styles.clearInput}
            >
              <Icon icon={X} size={18} color="textSecondary" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.chips} role="group" aria-label={t('workout.library.filterLabel')}>
        {(['all', ...MUSCLES] as const).map((m) => {
          const selected = m === muscle;
          return (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={m === 'all' ? t('workout.library.all') : t(`workout.muscle.${m}`)}
              onPress={() => {
                haptics.select();
                setMuscle(m);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.accent : colors.surface,
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}
            >
              <Text variant="label" color={selected ? 'onAccent' : 'text'}>
                {m === 'all' ? t('workout.library.all') : t(`workout.muscle.${m}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {state.status === 'success' ? (
        <Text variant="caption" color="muted" aria-live="polite">
          {t('units.results', {
            count: filtered.length,
            countText: format.number(filtered.length),
          })}
        </Text>
      ) : null}
    </View>
  );

  const empty =
    state.status === 'loading' ? (
      <View style={styles.skeletons}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={72} rounded={radius.xl} />
        ))}
      </View>
    ) : state.status === 'error' ? (
      <ErrorState onRetry={reload} />
    ) : (
      <EmptyState
        icon={BookOpen}
        title={t('workout.library.emptyTitle')}
        body={t('workout.library.emptyBody')}
        actionLabel={t('workout.library.clear')}
        onAction={clear}
      />
    );

  return (
    <Screen>
      <View style={styles.topBar}>
        <Text variant="h1" style={styles.topTitle}>
          {t('workout.library.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={close}
          style={styles.close}
        >
          <Icon icon={X} size={24} />
        </Pressable>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <ExerciseRow item={item} onPress={open} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={7}
      />
    </Screen>
  );
}

const ExerciseRow = memo(function ExerciseRow({
  item,
  onPress,
}: {
  item: Exercise;
  onPress: (id: string) => void;
}) {
  const { colors } = useTheme();
  const text = useWorkoutText();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text.exercise(item)}، ${text.muscle(item.muscle)}، ${text.equipment(item.equipment)}`}
      onPress={() => onPress(item.id)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <ExerciseGlyph equipment={item.equipment} size={48} />
      <View style={styles.grow}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {text.exercise(item)}
        </Text>
        <Text variant="small" color="secondary" numberOfLines={1}>
          {text.muscle(item.muscle)} · {text.equipment(item.equipment)}
        </Text>
      </View>
      <Icon icon={ChevronRight} size={20} color="textMuted" directional />
    </Pressable>
  );
});

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.minTouchTarget + spacing.xs,
  },
  topTitle: { flex: 1 },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: spacing.sm, paddingBottom: spacing.md },
  searchBox: { flexDirection: 'row' },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: layout.minTouchTarget + spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  input: { flex: 1, minHeight: layout.minTouchTarget, paddingVertical: 0 },
  clearInput: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  grow: { flex: 1, gap: spacing.xxs },
  separator: { height: spacing.xs },
  skeletons: { gap: spacing.xs },
});
