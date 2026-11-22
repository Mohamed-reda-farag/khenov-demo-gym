import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useDirection } from '@/i18n/direction';
import { fonts, layout, radius, spacing, useTheme } from '@/theme';

import { Text } from './Text';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  placeholder?: string;
  editable?: boolean;
  /** Numbers and codes read left to right even in Arabic. */
  ltr?: boolean;
  autoComplete?: 'cc-number' | 'cc-exp' | 'cc-csc' | 'tel' | 'off';
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  keyboardType = 'default',
  maxLength,
  placeholder,
  editable = true,
  ltr = false,
  autoComplete = 'off',
}: TextFieldProps) {
  const { colors } = useTheme();
  const { isRTL } = useDirection();
  const [focused, setFocused] = useState(false);
  // The resting border must be visible against the field (3:1), so it uses the muted text colour.
  const borderColor = error ? colors.danger : focused ? colors.accentText : colors.textMuted;

  return (
    <View style={styles.root}>
      <Text variant="small" color="secondary">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        editable={editable}
        autoComplete={autoComplete}
        autoCorrect={false}
        selectionColor={colors.accent}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surfaceAlt,
            borderColor,
            opacity: editable ? 1 : 0.6,
          },
          // Digits and codes are written left to right but sit on the start edge, like the label.
          ltr ? [styles.ltr, { textAlign: isRTL ? 'right' : 'left' }] : null,
        ]}
        {...(Platform.OS === 'web' && ltr ? { dir: 'ltr' as const } : {})}
      />
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xxs },
  input: {
    minHeight: layout.minTouchTarget + spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body500,
    fontSize: 16,
  },
  ltr: { writingDirection: 'ltr' },
});
