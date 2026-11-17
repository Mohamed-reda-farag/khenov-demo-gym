import { useLocalSearchParams } from 'expo-router';

import { ClassDetailsScreen } from '@/features/classes/ClassDetailsScreen';

export default function ClassDetailsRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return <ClassDetailsScreen sessionId={sessionId} />;
}
