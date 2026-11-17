import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { ClassSessionView } from '@/data/types';
import { radius, spacing, useTheme } from '@/theme';

import { useClassText } from './useClassText';

interface Props {
  visible: boolean;
  view: ClassSessionView;
  onDone: () => void;
  onUndo: () => void;
}

/** Confirmation shown right after a booking, with the summary and a last chance to undo. */
export function BookingSuccessSheet({ visible, view, onDone, onUndo }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const text = useClassText();

  return (
    <BottomSheet visible={visible} onClose={onDone} accessibilityLabel={t('success.title')}>
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Icon icon={Check} size={32} color="onAccent" strokeWidth={3} />
        </View>
        <Text variant="h2" align="center">
          {t('success.title')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('success.body')}
        </Text>
      </View>

      <Card style={styles.summary}>
        <Text variant="title">{text.name(view)}</Text>
        <Row label={t('success.when')} value={text.fullWhen(view)} />
        <Row label={t('success.trainer')} value={text.trainer(view)} />
        <Row label={t('success.room')} value={text.room(view)} />
      </Card>

      <View style={styles.actions}>
        <Button label={t('success.done')} onPress={onDone} />
        <Button label={t('success.undo')} onPress={onUndo} variant="ghost" />
      </View>
    </BottomSheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="small" color="muted">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: spacing.xs },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  summary: { gap: spacing.sm },
  row: { gap: spacing.xxs },
  actions: { gap: spacing.xs },
});
