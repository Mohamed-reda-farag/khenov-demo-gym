import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { ProfileError, memberRepository } from '@/data/repository';
import { autoInitials, initialsOf } from '@/data/rules/profile';
import type { Member } from '@/data/types';
import { errorMessage } from '@/lib/errorText';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAsyncResource } from '@/lib/useAsyncResource';
import { layout, radius, spacing, useTheme } from '@/theme';

type Field = 'nameAr' | 'nameEn' | 'initials';

const FIELD_OF_ERROR: Record<string, Field> = {
  invalid_name_ar: 'nameAr',
  invalid_name_en: 'nameEn',
  invalid_initials: 'initials',
};

export function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload } = useAsyncResource(() => memberRepository.get());

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  }

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.grow} numberOfLines={1} accessibilityRole="header">
          {t('editProfile.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('editProfile.close')}
          onPress={close}
          style={styles.close}
        >
          <Icon icon={X} size={24} />
        </Pressable>
      </View>
      {state.status === 'loading' ? (
        <View style={styles.content}>
          <Skeleton width={72} height={72} rounded={radius.pill} />
          <Skeleton height={72} rounded={radius.lg} />
          <Skeleton height={72} rounded={radius.lg} />
          <Skeleton height={72} rounded={radius.lg} />
        </View>
      ) : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' ? <Form member={state.data} onDone={close} /> : null}
    </Screen>
  );
}

function Form({ member, onDone }: { member: Member; onDone: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [nameAr, setNameAr] = useState(member.name.ar);
  const [nameEn, setNameEn] = useState(member.name.en);
  const [initials, setInitials] = useState(member.initials ?? '');
  const [error, setError] = useState<{ field: Field; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const shown =
    initials.trim() !== ''
      ? initials.trim()
      : autoInitials((format.language === 'ar' ? nameAr : nameEn).trim().replace(/\s+/g, ' '));
  const unchanged =
    nameAr === member.name.ar && nameEn === member.name.en && initials === (member.initials ?? '');

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await memberRepository.updateProfile({ nameAr, nameEn, initials });
      haptics.success();
      toast.show({ message: t('editProfile.saved'), tone: 'success' });
      onDone();
    } catch (e) {
      haptics.warning();
      const field = e instanceof ProfileError ? FIELD_OF_ERROR[e.code] : undefined;
      if (field) setError({ field, message: errorMessage(t, e) });
      else toast.show({ message: errorMessage(t, e), tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accent }]} aria-hidden>
          <Text variant="h1" color="onAccent">
            {shown || initialsOf(member, format.language)}
          </Text>
        </View>
        <TextField
          label={t('editProfile.nameAr')}
          value={nameAr}
          onChangeText={setNameAr}
          maxLength={40}
          editable={!saving}
          error={error?.field === 'nameAr' ? error.message : null}
        />
        <TextField
          label={t('editProfile.nameEn')}
          value={nameEn}
          onChangeText={setNameEn}
          maxLength={40}
          editable={!saving}
          ltr
          error={error?.field === 'nameEn' ? error.message : null}
        />
        <TextField
          label={t('editProfile.initials')}
          value={initials}
          onChangeText={setInitials}
          maxLength={2}
          editable={!saving}
          hint={t('editProfile.initialsHint')}
          error={error?.field === 'initials' ? error.message : null}
        />
      </ScrollView>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button
          label={saving ? t('editProfile.saving') : t('editProfile.save')}
          loading={saving}
          disabled={unchanged}
          onPress={() => void save()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xs,
  },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: layout.screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  bar: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm },
});
