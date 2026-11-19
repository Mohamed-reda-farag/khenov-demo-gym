import { useLocalSearchParams } from 'expo-router';

import { SummaryScreen } from '@/features/workout/SummaryScreen';

export default function SummaryRoute() {
  const { sessionId, fresh } = useLocalSearchParams<{ sessionId: string; fresh?: string }>();
  return <SummaryScreen sessionId={sessionId} fresh={fresh === '1'} />;
}
