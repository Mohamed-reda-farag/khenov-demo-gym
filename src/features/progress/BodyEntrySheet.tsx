import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { BODY_LIMITS } from '@/data/rules/body';
import type { BodyDraft, BodyMeasure } from '@/data/types';
import { useFormat } from '@/lib/format';
import { spacing } from '@/theme';

interface BodyEntrySheetProps {
  visible: boolean;
  mode: 'add' | 'edit';
  /** Values to start from: the latest entry when adding, the entry itself when editing. */
  initial: BodyDraft;
  saving: boolean;
  /** Message from the repository when the values were refused. */
  error: string | null;
  onSave: (draft: BodyDraft) => void;
  onClose: () => void;
}

const MEASURES: readonly { key: BodyMeasure; unit: 'kg' | 'cm' }[] = [
  { key: 'weightKg', unit: 'kg' },
  { key: 'waistCm', unit: 'cm' },
  { key: 'chestCm', unit: 'cm' },
  { key: 'armCm', unit: 'cm' },
];

/** Add or edit a weight and measurements entry with large steppers. */
export function BodyEntrySheet({
  visible,
  mode,
  initial,
  saving,
  error,
  onSave,
  onClose,
}: BodyEntrySheetProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const [draft, setDraft] = useState<BodyDraft>(initial);
  const [wasVisible, setWasVisible] = useState(visible);

  // Each time the sheet opens it starts from the values it was given.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(initial);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={
        mode === 'add' ? t('progress.entry.addTitle') : t('progress.entry.editTitle')
      }
      dismissible={!saving}
    >
      <Text variant="h2">
        {mode === 'add' ? t('progress.entry.addTitle') : t('progress.entry.editTitle')}
      </Text>
      <Text variant="small" color="secondary">
        {t('progress.entry.date', { date: format.dayMonth(new Date(draft.date)) })}
      </Text>
      <View style={styles.steppers}>
        {MEASURES.map(({ key, unit }) => {
          const limits = BODY_LIMITS[key];
          const label = t(`progress.entry.${key}`);
          const shown = format.measure(draft[key], unit, 1);
          return (
            <Stepper
              key={key}
              label={label}
              value={draft[key]}
              onChange={(value) => setDraft((d) => ({ ...d, [key]: value }))}
              step={limits.step}
              min={limits.min}
              max={limits.max}
              display={shown}
              decreaseLabel={t('progress.entry.dec', { label })}
              increaseLabel={t('progress.entry.inc', { label })}
              valueLabel={t('progress.entry.value', { label, value: shown })}
            />
          );
        })}
      </View>
      {error ? (
        <Text variant="small" color="danger" aria-live="polite">
          {error}
        </Text>
      ) : null}
      <Button label={t('progress.entry.save')} onPress={() => onSave(draft)} loading={saving} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  steppers: { gap: spacing.sm },
});
