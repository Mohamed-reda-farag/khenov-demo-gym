import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Text } from './Text';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
}: ConfirmSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      accessibilityLabel={title}
      dismissible={!loading}
    >
      <View style={styles.text}>
        <Text variant="h2">{title}</Text>
        <Text variant="body" color="secondary">
          {body}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={confirmLabel}
          onPress={onConfirm}
          variant={destructive ? 'danger' : 'primary'}
          loading={loading}
        />
        <Button label={cancelLabel} onPress={onCancel} variant="ghost" disabled={loading} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  text: { gap: spacing.xs },
  actions: { gap: spacing.xs },
});
