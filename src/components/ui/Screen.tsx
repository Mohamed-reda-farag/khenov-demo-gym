import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing, useTheme } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Adds bottom space so content clears the tab bar. */
  withTabBar?: boolean;
  padded?: boolean;
}

export function Screen({
  children,
  scroll = false,
  withTabBar = false,
  padded = true,
}: ScreenProps) {
  const { colors } = useTheme();
  const bottom = withTabBar ? layout.tabBarHeight + spacing.xl : spacing.lg;
  const padding = padded ? layout.screenPadding : 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding, paddingBottom: bottom, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, { padding, paddingBottom: bottom }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
});
