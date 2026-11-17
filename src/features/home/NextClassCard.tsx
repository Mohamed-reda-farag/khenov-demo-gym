import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CalendarDays, MapPin } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { ClassSessionView } from '@/data/types';
import { useClassText } from '@/features/classes/useClassText';
import { spacing } from '@/theme';

interface Props {
  /** Null when the member has no upcoming booking. */
  next: ClassSessionView | null;
  busy: boolean;
  onDetails: (sessionId: string) => void;
  onCancel: (view: ClassSessionView) => void;
  onBook: () => void;
}

export function NextClassCard({ next, busy, onDetails, onCancel, onBook }: Props) {
  const { t } = useTranslation();
  const text = useClassText();

  if (!next) {
    return (
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Icon icon={CalendarDays} size={22} color="accentText" />
          <Text variant="title">{t('home.next.title')}</Text>
        </View>
        <Text variant="title">{t('home.next.emptyTitle')}</Text>
        <Text variant="small" color="secondary">
          {t('home.next.emptyBody')}
        </Text>
        <Button label={t('home.next.emptyCta')} onPress={onBook} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Icon icon={CalendarDays} size={22} color="accentText" />
        <Text variant="caption" color="secondary">
          {t('home.next.title')}
        </Text>
      </View>
      <View style={styles.main}>
        <Text variant="h2" numberOfLines={1}>
          {text.name(next)}
        </Text>
        <Text variant="bodyStrong" color="accent">
          {text.when(next.startAt)}
        </Text>
        <View style={styles.where}>
          <Icon icon={MapPin} size={16} color="textMuted" />
          <Text variant="small" color="secondary" style={styles.whereText}>
            {t('home.next.with', { name: text.trainer(next), room: text.room(next) })}
          </Text>
        </View>
      </View>
      {!next.canCancel ? (
        <Text variant="caption" color="muted">
          {t('details.note.bookedLocked')}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label={t('common.details')}
            onPress={() => onDetails(next.id)}
            variant="secondary"
          />
        </View>
        <View style={styles.action}>
          <Button
            label={t('home.next.cancel')}
            onPress={() => onCancel(next)}
            variant="danger"
            disabled={!next.canCancel}
            loading={busy}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  main: { gap: spacing.xxs },
  where: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  whereText: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  action: { flex: 1 },
});
