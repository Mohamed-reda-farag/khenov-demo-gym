import { StyleSheet, View } from 'react-native';

import {
  Cable,
  Dumbbell,
  HeartPulse,
  PersonStanding,
  type LucideIcon,
} from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import type { Equipment } from '@/data/types';
import { radius, useTheme } from '@/theme';

const ICON: Record<Equipment, LucideIcon> = {
  barbell: Dumbbell,
  dumbbell: Dumbbell,
  kettlebell: Dumbbell,
  machine: Cable,
  cable: Cable,
  bodyweight: PersonStanding,
  cardio: HeartPulse,
};

/** A simple drawn icon for an exercise, chosen by the equipment it uses. */
export function ExerciseGlyph({ equipment, size = 56 }: { equipment: Equipment; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      aria-hidden
      style={[
        styles.box,
        { width: size, height: size, backgroundColor: colors.accentSoft, borderRadius: size / 3.2 },
      ]}
    >
      <Icon icon={ICON[equipment]} size={Math.round(size * 0.5)} color="accentText" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
});
