import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/ui/Toast';
import { workoutSessionRepository } from '@/data/repository';
import { errorMessage } from '@/lib/errorText';
import { haptics } from '@/lib/haptics';

/** Creates the session for a plan and opens it. Rules (one at a time) are enforced by the repository. */
export function useStartSession() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const start = useCallback(
    async (planId: string) => {
      setBusy(true);
      try {
        await workoutSessionRepository.start(planId);
        haptics.success();
        router.push('/session');
      } catch (error) {
        toast.show({ tone: 'error', message: errorMessage(t, error) });
      } finally {
        setBusy(false);
      }
    },
    [router, t, toast],
  );

  return { start, busy };
}
