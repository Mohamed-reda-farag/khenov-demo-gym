import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS !== 'web';

function run(action: () => Promise<void>): void {
  if (!supported) return;
  action().catch(() => undefined);
}

export const haptics = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
