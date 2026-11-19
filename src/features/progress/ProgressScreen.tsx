import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Flame, Pencil, Trash2, TrendingUp } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { exerciseRepository, onWorkoutChanged, progressRepository } from '@/data/repository';
import type { BodyDraft, BodyEntry, BodyMeasure } from '@/data/types';
import { useWorkoutText } from '@/features/workout/useWorkoutText';
import { errorMessage } from '@/lib/errorText';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

import { BarChart } from './BarChart';
import { BodyEntrySheet } from './BodyEntrySheet';
import { filterByRange, volumeWeeks, weeklyVolumes, type Range } from './chartMath';
import { LineChart } from './LineChart';
import { AchievementsList, RecordsList } from './RecordsAndAchievements';
import { useChartText } from './useChartText';

async function load() {
  const [entries, sessions, records, achievements, streak, exercises] = await Promise.all([
    progressRepository.listBodyEntries(),
    progressRepository.listSessions(),
    progressRepository.listPersonalRecords(),
    progressRepository.listAchievements(),
    progressRepository.getStreak(),
    exerciseRepository.list(),
  ]);
  return {
    entries,
    sessions,
    records,
    achievements,
    streak,
    library: new Map(exercises.map((e) => [e.id, e])),
  };
}

type Data = Awaited<ReturnType<typeof load>>;

const DEFAULT_DRAFT: Omit<BodyDraft, 'date'> = {
  weightKg: 70,
  waistCm: 80,
  chestCm: 95,
  armCm: 30,
};

export function ProgressScreen() {
  const { t } = useTranslation();
  const { state, reload, refresh } = useAsyncResource(load);

  // A finished workout changes volume, streak, records and achievements.
  useEffect(() => onWorkoutChanged(refresh), [refresh]);

  return (
    <Screen scroll withTabBar>
      <View style={styles.head}>
        <Text variant="h1">{t('progress.title')}</Text>
        <Text variant="small" color="secondary">
          {t('progress.subtitle')}
        </Text>
      </View>
      {state.status === 'loading' ? <ProgressSkeleton /> : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <ProgressContent data={state.data} refresh={refresh} /> : null}
    </Screen>
  );
}

function ProgressContent({ data, refresh }: { data: Data; refresh: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const format = useFormat();
  const text = useWorkoutText();
  const describe = useChartText();

  const [range, setRange] = useState<Range>('8w');
  const [measure, setMeasure] = useState<Exclude<BodyMeasure, 'weightKg'>>('waistCm');
  const [sheet, setSheet] = useState<{ mode: 'add' } | { mode: 'edit'; entry: BodyEntry } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<readonly string[]>([]);
  const [now] = useState(() => new Date());

  const entries = useMemo(
    () => data.entries.filter((e) => !hidden.includes(e.id)),
    [data.entries, hidden],
  );
  const inRange = useMemo(() => filterByRange(entries, range, now), [entries, range, now]);

  const weightPoints = useMemo(
    () => inRange.map((e) => ({ time: Date.parse(e.date), value: e.weightKg })),
    [inRange],
  );
  const measurePoints = useMemo(
    () => inRange.map((e) => ({ time: Date.parse(e.date), value: e[measure] })),
    [inRange, measure],
  );
  const weeks = useMemo(
    () => weeklyVolumes(data.sessions, now, volumeWeeks(range, data.sessions, now)),
    [data.sessions, range, now],
  );
  const hasVolume = weeks.some((w) => w.volumeKg > 0);

  const weightText = describe(
    t('progress.weight.title'),
    weightPoints.map((p) => p.value),
    (v) => format.measure(v, 'kg'),
  );
  const measureTitle = t(`progress.measure.${measure}`);
  const measureText = describe(
    measureTitle,
    measurePoints.map((p) => p.value),
    (v) => format.measure(v, 'cm'),
  );
  const volumeText = describe(
    t('progress.volume.title'),
    weeks.map((w) => w.volumeKg),
    (v) => text.volume(v),
  );

  const latest = entries[entries.length - 1];
  const initial: BodyDraft = useMemo(() => {
    if (sheet?.mode === 'edit') return sheet.entry;
    return { ...DEFAULT_DRAFT, ...(latest ?? {}), date: new Date().toISOString() };
  }, [sheet, latest]);

  async function save(draft: BodyDraft) {
    if (!sheet) return;
    setSaving(true);
    setSheetError(null);
    try {
      if (sheet.mode === 'add') {
        const entry = await progressRepository.addBodyEntry({
          ...draft,
          date: new Date().toISOString(),
        });
        toast.show({
          tone: 'success',
          message: t('progress.toast.added'),
          actionLabel: t('toast.undo'),
          onAction: () => void undo(() => progressRepository.removeBodyEntry(entry.id)),
        });
      } else {
        const { previous } = await progressRepository.updateBodyEntry(sheet.entry.id, {
          ...draft,
          date: sheet.entry.date,
        });
        toast.show({
          tone: 'success',
          message: t('progress.toast.updated'),
          actionLabel: t('toast.undo'),
          onAction: () =>
            void undo(() => progressRepository.updateBodyEntry(previous.id, { ...previous })),
        });
      }
      haptics.success();
      setSheet(null);
      refresh();
    } catch (error) {
      setSheetError(errorMessage(t, error));
    } finally {
      setSaving(false);
    }
  }

  async function undo(action: () => Promise<unknown>) {
    try {
      await action();
      refresh();
    } catch (error) {
      toast.show({ tone: 'error', message: errorMessage(t, error) });
    }
  }

  async function remove(entry: BodyEntry) {
    setHidden((h) => [...h, entry.id]);
    try {
      await progressRepository.removeBodyEntry(entry.id);
      refresh();
      toast.show({
        message: t('progress.toast.deleted'),
        actionLabel: t('toast.undo'),
        durationMs: 6000,
        onAction: () =>
          void undo(async () => {
            await progressRepository.restoreBodyEntry(entry);
            setHidden((h) => h.filter((id) => id !== entry.id));
          }),
      });
    } catch (error) {
      setHidden((h) => h.filter((id) => id !== entry.id));
      toast.show({ tone: 'error', message: errorMessage(t, error) });
    }
  }

  const addButton = (
    <Button
      label={t('progress.weight.add')}
      onPress={() => {
        setSheetError(null);
        setSheet({ mode: 'add' });
      }}
      fullWidth={false}
    />
  );

  return (
    <>
      <SegmentedControl<Range>
        accessibilityLabel={t('progress.range.label')}
        value={range}
        onChange={setRange}
        options={[
          { value: '4w', label: t('progress.range.4w') },
          { value: '8w', label: t('progress.range.8w') },
          { value: 'all', label: t('progress.range.all') },
        ]}
      />

      <Card style={styles.streak}>
        <View style={[styles.streakIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon icon={Flame} size={26} color="accentText" />
        </View>
        <View style={styles.grow}>
          <Text variant="caption" color="secondary">
            {t('home.streakTitle')}
          </Text>
          <Text variant="title">
            {t('home.streakDays', { count: data.streak, countText: format.number(data.streak) })}
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHead}>
          <Text variant="title" style={styles.grow}>
            {t('progress.weight.title')}
          </Text>
          {entries.length > 0 ? addButton : null}
        </View>
        {entries.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title={t('progress.weight.emptyTitle')}
            body={t('progress.weight.emptyBody')}
            actionLabel={t('progress.weight.add')}
            onAction={() => setSheet({ mode: 'add' })}
          />
        ) : inRange.length === 0 ? (
          <Text variant="small" color="secondary">
            {t('progress.weight.noneInRange')}
          </Text>
        ) : (
          weightText && (
            <>
              <Text variant="small" color="secondary">
                {weightText.trend}
              </Text>
              <LineChart
                points={weightPoints}
                formatAxis={(v) => format.number(v, 1)}
                formatValue={(v) => format.measure(v, 'kg')}
                formatDate={(time) => format.dayMonth(new Date(time))}
                summaryLabel={weightText.label}
              />
              <Text variant="caption" color="muted">
                {weightText.summary}
              </Text>
              <Text variant="caption" color="muted">
                {t('progress.chart.hint')}
              </Text>
            </>
          )
        )}
      </Card>

      {entries.length > 0 ? (
        <Card style={styles.card}>
          <Text variant="title">{t('progress.measure.title')}</Text>
          <SegmentedControl<Exclude<BodyMeasure, 'weightKg'>>
            accessibilityLabel={t('progress.measure.select')}
            value={measure}
            onChange={setMeasure}
            options={[
              { value: 'waistCm', label: t('progress.measure.waistCm') },
              { value: 'chestCm', label: t('progress.measure.chestCm') },
              { value: 'armCm', label: t('progress.measure.armCm') },
            ]}
          />
          {measureText ? (
            <>
              <Text variant="small" color="secondary">
                {measureText.trend}
              </Text>
              <LineChart
                points={measurePoints}
                formatAxis={(v) => format.number(v, 1)}
                formatValue={(v) => format.measure(v, 'cm')}
                formatDate={(time) => format.dayMonth(new Date(time))}
                summaryLabel={measureText.label}
              />
              <Text variant="caption" color="muted">
                {measureText.summary}
              </Text>
            </>
          ) : (
            <Text variant="small" color="secondary">
              {t('progress.weight.noneInRange')}
            </Text>
          )}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text variant="title">{t('progress.volume.title')}</Text>
        <Text variant="small" color="secondary">
          {t('progress.volume.subtitle')}
        </Text>
        {hasVolume && volumeText ? (
          <>
            <BarChart
              bars={weeks.map((w) => ({ key: w.weekStart.toISOString(), value: w.volumeKg }))}
              formatAxis={(v) => format.number(v / 1000, 1)}
              formatValue={(v) => text.volume(v)}
              formatLabel={(key) => format.dayMonth(new Date(key))}
              summaryLabel={volumeText.label}
            />
            <Text variant="caption" color="muted">
              {volumeText.summary}
            </Text>
            <Text variant="caption" color="muted">
              {t('progress.volume.axisUnit')}
            </Text>
          </>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title={t('progress.volume.emptyTitle')}
            body={t('progress.volume.emptyBody')}
          />
        )}
      </Card>

      <RecordsList records={data.records} library={data.library} />
      <AchievementsList achievements={data.achievements} />

      {entries.length > 0 ? (
        <Card style={styles.card}>
          <Text variant="title">{t('progress.history.title')}</Text>
          {[...entries].reverse().map((entry) => {
            const date = format.dayMonth(new Date(entry.date));
            return (
              <View key={entry.id} style={[styles.historyRow, { borderColor: colors.border }]}>
                <View style={styles.grow}>
                  <Text variant="bodyStrong">{date}</Text>
                  <Text variant="small" color="secondary">
                    {t('progress.history.row', {
                      weight: format.measure(entry.weightKg, 'kg'),
                      waist: format.measure(entry.waistCm, 'cm'),
                    })}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('progress.history.edit', { date })}
                  onPress={() => {
                    setSheetError(null);
                    setSheet({ mode: 'edit', entry });
                  }}
                  style={styles.iconButton}
                >
                  <Icon icon={Pencil} size={20} color="textSecondary" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('progress.history.delete', { date })}
                  onPress={() => void remove(entry)}
                  style={styles.iconButton}
                >
                  <Icon icon={Trash2} size={20} color="danger" />
                </Pressable>
              </View>
            );
          })}
        </Card>
      ) : null}

      <BodyEntrySheet
        visible={sheet !== null}
        mode={sheet?.mode ?? 'add'}
        initial={initial}
        saving={saving}
        error={sheetError}
        onSave={(draft) => void save(draft)}
        onClose={() => setSheet(null)}
      />
    </>
  );
}

function ProgressSkeleton() {
  return (
    <>
      <Skeleton height={52} rounded={radius.pill} />
      <Skeleton height={88} rounded={radius.xl} />
      <Skeleton height={300} rounded={radius.xl} />
      <Skeleton height={300} rounded={radius.xl} />
    </>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xxs },
  card: { gap: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1, gap: spacing.xxs },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  streakIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
