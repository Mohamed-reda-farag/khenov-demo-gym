import { useLocalSearchParams } from 'expo-router';

import { ExerciseDetailScreen } from '@/features/workout/ExerciseDetailScreen';

export default function ExerciseRoute() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  return <ExerciseDetailScreen exerciseId={exerciseId} />;
}
