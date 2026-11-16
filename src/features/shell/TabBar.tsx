import type { LucideIcon } from '@/components/ui/icons';
import { CalendarDays, ChartLine, Dumbbell, House, User } from '@/components/ui/icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { haptics } from '@/lib/haptics';
import { layout, motion, radius, spacing, useTheme } from '@/theme';

type TabName = 'home' | 'classes' | 'workout' | 'progress' | 'profile';

const ICONS: Record<TabName, LucideIcon> = {
  home: House,
  classes: CalendarDays,
  workout: Dumbbell,
  progress: ChartLine,
  profile: User,
};

function TabItem({
  name,
  focused,
  onPress,
}: {
  name: TabName;
  focused: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    active.value = reduceMotion ? (focused ? 1 : 0) : withSpring(focused ? 1 : 0, motion.spring);
  }, [focused, reduceMotion, active]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scaleX: 0.6 + active.value * 0.4 }],
  }));

  const label = t(`tabs.${name}`);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={styles.item}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.pill, { backgroundColor: colors.accent }, pillStyle]} />
        <Icon icon={ICONS[name]} size={22} color={focused ? 'onAccent' : 'textMuted'} />
      </View>
      <Text variant="caption" color={focused ? 'text' : 'muted'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        return (
          <TabItem
            key={route.key}
            name={route.name as TabName}
            focused={focused}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                haptics.select();
                navigateToTab(route.key);
              }
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.xs,
    minHeight: layout.tabBarHeight,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    minHeight: layout.minTouchTarget + spacing.xs,
  },
  iconWrap: {
    width: 56,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    borderRadius: radius.pill,
  },
});
