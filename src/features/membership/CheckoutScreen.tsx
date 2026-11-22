import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Check, TriangleAlert, X } from '@/components/ui/icons';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { MembershipError, membershipRepository } from '@/data/repository';
import {
  DEMO_CARD,
  formatCardNumber,
  formatExpiry,
  formatWalletPhone,
  renewalEnd,
  renewalStart,
  validatePayment,
} from '@/data/rules/membership';
import type { MembershipPlan, PaymentDraft, PaymentMethod, RenewalResult } from '@/data/types';
import { errorMessage } from '@/lib/errorText';
import { ltrIsolate, useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { layout, motion, radius, spacing, useTheme } from '@/theme';

import { useMembership, type MembershipData } from './useMembership';

type Field = 'cardNumber' | 'expiry' | 'cvv' | 'phone';

const FIELD_OF_ERROR: Partial<Record<string, Field>> = {
  invalid_card_number: 'cardNumber',
  invalid_card_expiry: 'expiry',
  invalid_card_cvv: 'cvv',
  invalid_wallet_phone: 'phone',
};

/** Two years ahead, so the prefilled demo card is always valid. */
function demoExpiry(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${month}/${String((now.getFullYear() + 2) % 100).padStart(2, '0')}`;
}

export function CheckoutScreen({ planId }: { planId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, reload } = useMembership();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) return undefined;
    // Leaving mid-payment would hide the result, so the back button waits.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [busy]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/membership');
  }

  const plan =
    state.status === 'success' ? state.data.plans.find((p) => p.id === planId) : undefined;

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text variant="title" style={styles.grow} numberOfLines={1}>
          {t('checkout.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('checkout.close')}
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={close}
          style={[styles.close, { opacity: busy ? 0.4 : 1 }]}
        >
          <Icon icon={X} size={24} />
        </Pressable>
      </View>
      {state.status === 'loading' ? (
        <View style={styles.content}>
          <Skeleton height={64} rounded={radius.lg} />
          <Skeleton height={180} rounded={radius.xl} />
          <Skeleton height={260} rounded={radius.xl} />
        </View>
      ) : null}
      {state.status === 'error' ? <ErrorState onRetry={reload} /> : null}
      {state.status === 'success' && !plan ? (
        <EmptyState
          icon={TriangleAlert}
          title={t('errors.membership.plan_not_found')}
          body={t('membership.renewTitle')}
          actionLabel={t('checkout.backToMembership')}
          onAction={close}
        />
      ) : null}
      {state.status === 'success' && plan ? (
        <Form data={state.data} plan={plan} onBusy={setBusy} onClose={close} />
      ) : null}
    </Screen>
  );
}

interface FormProps {
  data: MembershipData;
  plan: MembershipPlan;
  onBusy: (busy: boolean) => void;
  onClose: () => void;
}

function Form({ data, plan, onBusy, onClose }: FormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const insets = useSafeAreaInsets();
  const [now] = useState(() => new Date());
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState(formatCardNumber(DEMO_CARD));
  const [expiry, setExpiry] = useState(demoExpiry(now));
  const [cvv, setCvv] = useState('123');
  const [phone, setPhone] = useState('');
  const [fieldError, setFieldError] = useState<{ field: Field; message: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RenewalResult | null>(null);

  const start = renewalStart(data.view.membership, now);
  const end = renewalEnd(start, plan);

  function update(next: boolean) {
    setBusy(next);
    onBusy(next);
  }

  async function pay() {
    const draft: PaymentDraft =
      method === 'card' ? { method, cardNumber, expiry, cvv } : { method, phone };
    setFailure(null);
    setFieldError(null);
    try {
      validatePayment(draft, now);
    } catch (error) {
      const field = error instanceof MembershipError ? FIELD_OF_ERROR[error.code] : undefined;
      if (field) {
        haptics.warning();
        setFieldError({ field, message: errorMessage(t, error) });
        return;
      }
      // A declined test card passes the form check on purpose: the "bank" answers after processing.
    }
    update(true);
    try {
      const renewed = await membershipRepository.renew(plan.id, draft);
      haptics.success();
      setResult(renewed);
    } catch (error) {
      haptics.warning();
      setFailure(errorMessage(t, error));
    } finally {
      update(false);
    }
  }

  if (result) return <Success result={result} plan={plan} onClose={onClose} />;

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
        <Card
          style={[
            styles.banner,
            { backgroundColor: colors.accentSoft, borderColor: colors.accent },
          ]}
        >
          <Text variant="small">{t('checkout.mockBanner')}</Text>
        </Card>

        <Card style={styles.section}>
          <Text variant="title">{t('checkout.summary')}</Text>
          <Row label={t('checkout.plan')} value={plan.name[format.language]} />
          <Row
            label={t('checkout.duration')}
            value={t('units.months', {
              count: plan.periodMonths,
              countText: format.number(plan.periodMonths),
            })}
          />
          <Row label={t('checkout.starts')} value={format.date(start.toISOString())} />
          <Row label={t('checkout.ends')} value={format.date(end.toISOString())} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row label={t('checkout.total')} value={format.currency(plan.priceEgp)} strong />
        </Card>

        <Card style={styles.section}>
          <Text variant="title">{t('checkout.method')}</Text>
          <SegmentedControl<PaymentMethod>
            accessibilityLabel={t('checkout.method')}
            value={method}
            onChange={(next) => {
              if (busy) return;
              setFieldError(null);
              setFailure(null);
              setMethod(next);
            }}
            options={[
              { value: 'card', label: t('checkout.methodCard') },
              { value: 'wallet', label: t('checkout.methodWallet') },
            ]}
          />

          {method === 'card' ? (
            <View style={styles.fields}>
              <TextField
                label={t('checkout.cardNumber')}
                value={cardNumber}
                onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                keyboardType="number-pad"
                maxLength={19}
                ltr
                autoComplete="cc-number"
                editable={!busy}
                error={fieldError?.field === 'cardNumber' ? fieldError.message : null}
                hint={t('checkout.cardHint')}
              />
              <View style={styles.pair}>
                <View style={styles.grow}>
                  <TextField
                    label={t('checkout.expiry')}
                    value={expiry}
                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="MM/YY"
                    ltr
                    autoComplete="cc-exp"
                    editable={!busy}
                    error={fieldError?.field === 'expiry' ? fieldError.message : null}
                  />
                </View>
                <View style={styles.grow}>
                  <TextField
                    label={t('checkout.cvv')}
                    value={cvv}
                    onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    maxLength={3}
                    ltr
                    autoComplete="cc-csc"
                    editable={!busy}
                    error={fieldError?.field === 'cvv' ? fieldError.message : null}
                  />
                </View>
              </View>
              <Button
                label={t('checkout.useDemoCard')}
                variant="ghost"
                fullWidth={false}
                disabled={busy}
                onPress={() => {
                  setCardNumber(formatCardNumber(DEMO_CARD));
                  setExpiry(demoExpiry(now));
                  setCvv('123');
                  setFieldError(null);
                  setFailure(null);
                }}
              />
            </View>
          ) : (
            <View style={styles.fields}>
              <TextField
                label={t('checkout.phone')}
                value={phone}
                onChangeText={(v) => setPhone(formatWalletPhone(v))}
                keyboardType="phone-pad"
                maxLength={11}
                placeholder="01012345678"
                ltr
                autoComplete="tel"
                editable={!busy}
                error={fieldError?.field === 'phone' ? fieldError.message : null}
                hint={t('checkout.walletHint')}
              />
            </View>
          )}
        </Card>

        {failure ? (
          <Card accessibilityRole="alert" style={[styles.failure, { borderColor: colors.danger }]}>
            <Icon icon={TriangleAlert} size={20} color="danger" />
            <View style={styles.grow}>
              <Text variant="bodyStrong" color="danger">
                {t('checkout.failedTitle')}
              </Text>
              <Text variant="small" color="secondary">
                {failure}
              </Text>
            </View>
          </Card>
        ) : null}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {busy ? (
          <Text variant="caption" color="secondary" align="center" accessibilityLiveRegion="polite">
            {t('checkout.payingA11y')}
          </Text>
        ) : null}
        <Button
          label={
            busy
              ? t('checkout.paying')
              : t('checkout.pay', { amount: format.currency(plan.priceEgp) })
          }
          loading={busy}
          onPress={() => void pay()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant={strong ? 'bodyStrong' : 'small'} color={strong ? 'text' : 'secondary'}>
        {label}
      </Text>
      <Text variant={strong ? 'h2' : 'bodyStrong'} style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Success({
  result,
  plan,
  onClose,
}: {
  result: RenewalResult;
  plan: MembershipPlan;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const format = useFormat();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.6);
  const { receipt, membership } = result;

  useEffect(() => {
    if (!reduceMotion) scale.set(withSpring(1, motion.spring));
  }, [reduceMotion, scale]);

  const pop = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={styles.successContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.badge, { backgroundColor: colors.accent }, pop]} aria-hidden>
          <Icon icon={Check} size={40} color="onAccent" strokeWidth={3} />
        </Animated.View>
        <Text variant="h1" align="center" accessibilityRole="header">
          {t('checkout.successTitle')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('checkout.successBody')}
        </Text>
        <Card style={[styles.section, styles.receipt]}>
          <Text variant="title">{t('checkout.receipt')}</Text>
          <Row label={t('checkout.reference')} value={ltrIsolate(receipt.reference)} />
          <Row label={t('checkout.plan')} value={plan.name[format.language]} />
          <Row label={t('checkout.paidOn')} value={format.date(receipt.paidAt)} />
          <Row
            label={t('checkout.paidWith')}
            value={t(receipt.method === 'card' ? 'checkout.methodCard' : 'checkout.methodWallet')}
          />
          <Row label={t('checkout.validThrough')} value={format.date(membership.endDate)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row label={t('checkout.amount')} value={format.currency(receipt.amountEgp)} strong />
        </Card>
      </ScrollView>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label={t('checkout.backToMembership')} onPress={onClose} />
      </View>
    </View>
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
  banner: { padding: spacing.sm },
  section: { gap: spacing.sm },
  fields: { gap: spacing.sm },
  pair: { flexDirection: 'row', gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowValue: { flexShrink: 1 },
  divider: { height: 1 },
  failure: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bar: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, gap: spacing.xs },
  successContent: {
    padding: layout.screenPadding,
    paddingTop: spacing.xl,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  receipt: { marginTop: spacing.sm },
});
