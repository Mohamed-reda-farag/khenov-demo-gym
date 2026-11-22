import { useRouter } from 'expo-router';
import { memo, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Bell, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { notificationRepository, onNotificationsChanged } from '@/data/repository';
import { unreadCount } from '@/data/rules/notifications';
import type { AppNotification } from '@/data/types';
import { errorMessage } from '@/lib/errorText';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

import { relativeTime } from './relativeTime';
import { KIND_ICON, KIND_ROUTE, useNotificationText } from './useNotificationText';

export function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload, refresh } = useAsyncResource(() => notificationRepository.list());
  useEffect(() => onNotificationsChanged(refresh), [refresh]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.grow} numberOfLines={1} accessibilityRole="header">
          {t('notifications.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('notifications.close')}
          onPress={close}
          style={styles.close}
        >
          <Icon icon={X} size={24} />
        </Pressable>
      </View>
      {state.status === 'loading' ? (
        <View style={styles.content}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={96} rounded={radius.xl} />
          ))}
        </View>
      ) : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <Inbox items={state.data} /> : null}
    </Screen>
  );
}

function Inbox({ items }: { items: AppNotification[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const format = useFormat();
  const unread = unreadCount(items);
  const [busy, setBusy] = useState(false);
  const [nowMs] = useState(() => Date.now());

  async function markAll() {
    setBusy(true);
    try {
      await notificationRepository.markAllRead();
      haptics.success();
      toast.show({ message: t('notifications.markAllDone'), tone: 'success' });
    } catch (error) {
      toast.show({ message: errorMessage(t, error), tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={t('notifications.emptyTitle')}
        body={t('notifications.emptyBody')}
        actionLabel={t('common.close')}
        onAction={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.actions}>
        <Text variant="small" color="secondary" style={styles.grow}>
          {t('notifications.unread', { count: unread, countText: format.number(unread) })}
        </Text>
        <Button
          label={t('notifications.markAll')}
          variant="secondary"
          fullWidth={false}
          disabled={unread === 0}
          loading={busy}
          onPress={() => void markAll()}
        />
      </View>
      {items.map((item) => (
        <Row key={item.id} item={item} nowMs={nowMs} />
      ))}
    </ScrollView>
  );
}

const Row = memo(function Row({ item, nowMs }: { item: AppNotification; nowMs: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();
  const describe = useNotificationText();
  const { title, body } = describe(item);
  const when = relativeTime(
    t,
    item.createdAt,
    nowMs,
    format.number,
    format.date(item.createdAt, { day: 'numeric', month: 'long' }),
  );
  const status = item.read ? t('notifications.read') : t('notifications.new');

  function open() {
    haptics.tap();
    if (!item.read) void notificationRepository.markRead(item.id).catch(() => undefined);
    router.navigate(KIND_ROUTE[item.payload.kind]);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('notifications.itemLabel', { title, body, when, status })}
      onPress={open}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
    >
      <Card
        style={[
          styles.row,
          item.read ? null : { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]} aria-hidden>
          <Icon icon={KIND_ICON[item.payload.kind]} size={22} color="accentText" />
        </View>
        <View style={styles.grow}>
          <View style={styles.titleRow}>
            <Text variant={item.read ? 'body' : 'bodyStrong'} style={styles.grow} numberOfLines={1}>
              {title}
            </Text>
            {item.read ? null : (
              <View style={[styles.newTag, { backgroundColor: colors.accent }]} aria-hidden>
                <Text variant="caption" color="onAccent">
                  {t('notifications.new')}
                </Text>
              </View>
            )}
          </View>
          <Text variant="small" color="secondary">
            {body}
          </Text>
          <Text variant="caption" color="muted">
            {when}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  grow: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xs,
  },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: layout.screenPadding, paddingBottom: spacing.xl, gap: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  newTag: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.pill },
});
