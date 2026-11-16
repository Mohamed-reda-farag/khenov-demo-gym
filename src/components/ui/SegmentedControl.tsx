import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { layout, radius, spacing, useTheme } from '@/theme';

import { Text } from './Text';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              haptics.select();
              onChange(option.value);
            }}
            style={[styles.segment, selected && { backgroundColor: colors.accent }]}
          >
            <Text variant="label" color={selected ? 'onAccent' : 'secondary'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
});
