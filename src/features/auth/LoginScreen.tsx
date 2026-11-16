import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useSession } from '@/features/shell/SessionProvider';
import { haptics } from '@/lib/haptics';
import { spacing } from '@/theme';

export function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { loginAsDemoMember } = useSession();
  const [loading, setLoading] = useState(false);

  async function continueAsDemo() {
    setLoading(true);
    await loginAsDemoMember();
    haptics.success();
    router.replace('/home');
  }

  return (
    <Screen>
      <DemoBadge />
      <View style={styles.hero}>
        <Logo size={120} />
        <Text variant="h1" align="center">
          {t('login.title')}
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.subtitle}>
          {t('login.subtitle')}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={loading ? t('login.ctaLoading') : t('login.cta')}
          onPress={continueAsDemo}
          loading={loading}
        />
        <Text variant="small" color="muted" align="center">
          {t('login.note')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  subtitle: { maxWidth: 340 },
  actions: { gap: spacing.sm },
});
