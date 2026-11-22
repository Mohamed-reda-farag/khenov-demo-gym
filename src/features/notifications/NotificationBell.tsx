import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Bell } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { notificationRepository, onNotificationsChanged } from '@/data/repository';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

/** Bell with the number of unread notifications. If the count cannot load it shows no number. */
export function NotificationBell() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const format = useFormat();
  const { state, refresh } = useAsyncResource(() => notificationRepository.unreadCount());
  useEffect(() => onNotificationsChanged(refresh), [refresh]);

  const count = state.status === 'success' ? state.data : 0;
  const shown = count > 9 ? `${format.number(9)}+` : format.number(count);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('notifications.bell', { count, countText: format.number(count) })}
      onPress={() => {
        haptics.tap();
        router.push('/notifications');
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Icon icon={Bell} size={22} />
      {count > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.accent }]} aria-hidden>
          <Text variant="caption" color="onAccent">
            {shown}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.minTouchTarget + spacing.xs,
    height: layout.minTouchTarget + spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    end: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
