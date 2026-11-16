import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
});
