import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CalendarDays, Dumbbell, QrCode, type LucideIcon } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { haptics } from '@/lib/haptics';
import { layout, radius, spacing, useTheme } from '@/theme';

interface Props {
  onBookClass: () => void;
  onStartWorkout: () => void;
  onCheckIn: () => void;
}

export function QuickActions({ onBookClass, onStartWorkout, onCheckIn }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Text variant="title">{t('home.quick.title')}</Text>
      <View style={styles.row}>
        <Tile icon={CalendarDays} label={t('home.quick.bookClass')} onPress={onBookClass} />
        <Tile icon={Dumbbell} label={t('home.quick.startWorkout')} onPress={onStartWorkout} />
        <Tile icon={QrCode} label={t('home.quick.checkIn')} onPress={onCheckIn} />
      </View>
    </View>
  );
}

interface TileProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

function Tile({ icon, label, onPress }: TileProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
        <Icon icon={icon} size={22} color="accentText" />
      </View>
      <Text variant="caption" align="center" numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.xs },
  tile: {
    flex: 1,
    minHeight: layout.minTouchTarget + spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
