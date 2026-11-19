import { useLocalSearchParams } from 'expo-router';

import { PlanDetailScreen } from '@/features/workout/PlanDetailScreen';

export default function PlanRoute() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  return <PlanDetailScreen planId={planId} />;
}
