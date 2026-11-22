import { useLocalSearchParams } from 'expo-router';

import { CheckoutScreen } from '@/features/membership/CheckoutScreen';

export default function CheckoutRoute() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  return <CheckoutScreen planId={planId} />;
}
