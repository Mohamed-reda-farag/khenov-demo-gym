import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, useTheme } from '@/theme';

import { Text } from './Text';

export function DemoBadge() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={t('common.demoBadgeLabel')}
      style={[styles.badge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      <View style={[styles.dot, { backgroundColor: colors.accent }]} />
      <Text variant="caption" color="secondary">
        {t('common.demoBadge')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
