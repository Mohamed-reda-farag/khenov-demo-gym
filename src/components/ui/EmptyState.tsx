import type { LucideIcon } from '@/components/ui/icons';
import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.root} accessibilityRole="summary">
      <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
        <Icon icon={icon} size={32} color="accentText" />
      </View>
      <Text variant="h2" align="center">
        {title}
      </Text>
      <Text variant="body" color="secondary" align="center" style={styles.body}>
        {body}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  body: { maxWidth: 320, marginBottom: spacing.xs },
});
