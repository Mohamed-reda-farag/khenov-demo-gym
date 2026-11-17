import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Check } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { Trainer } from '@/data/types';
import { useLanguage } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { layout, radius, spacing, useTheme } from '@/theme';

import { CATEGORIES, EMPTY_FILTERS, TIMES_OF_DAY, toggle, type ClassFilters } from './filters';

interface FilterSheetProps {
  visible: boolean;
  filters: ClassFilters;
  trainers: Trainer[];
  onApply: (filters: ClassFilters) => void;
  onClose: () => void;
}

export function FilterSheet({ visible, filters, trainers, onApply, onClose }: FilterSheetProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const [draft, setDraft] = useState<ClassFilters>(filters);
  const [wasVisible, setWasVisible] = useState(visible);

  // Every time the sheet opens it starts from the filters that are currently applied.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(filters);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={t('classes.filters.title')}
    >
      <Text variant="h2">{t('classes.filters.title')}</Text>

      <Group title={t('classes.filters.type')}>
        {CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={t(`classes.category.${category}`)}
            selected={draft.categories.includes(category)}
            onPress={() => setDraft((d) => ({ ...d, categories: toggle(d.categories, category) }))}
          />
        ))}
      </Group>

      <Group title={t('classes.filters.trainer')}>
        {trainers.map((trainer) => (
          <Chip
            key={trainer.id}
            label={trainer.name[language]}
            selected={draft.trainerIds.includes(trainer.id)}
            onPress={() =>
              setDraft((d) => ({ ...d, trainerIds: toggle(d.trainerIds, trainer.id) }))
            }
          />
        ))}
      </Group>

      <Group title={t('classes.filters.time')}>
        {TIMES_OF_DAY.map((time) => (
          <Chip
            key={time}
            label={t(`classes.timeOfDay.${time}`)}
            selected={draft.times.includes(time)}
            onPress={() => setDraft((d) => ({ ...d, times: toggle(d.times, time) }))}
          />
        ))}
      </Group>

      <View style={styles.actions}>
        <Button label={t('classes.filters.apply')} onPress={() => onApply(draft)} />
        <Button
          label={t('classes.filters.clearAll')}
          variant="ghost"
          onPress={() => setDraft(EMPTY_FILTERS)}
        />
      </View>
    </BottomSheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group} role="group" aria-label={title}>
      <Text variant="small" color="secondary">
        {title}
      </Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surfaceAlt,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      {selected ? <Icon icon={Check} size={16} color="onAccent" strokeWidth={3} /> : null}
      <Text variant="label" color={selected ? 'onAccent' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  actions: { gap: spacing.xs, marginTop: spacing.xs },
});
