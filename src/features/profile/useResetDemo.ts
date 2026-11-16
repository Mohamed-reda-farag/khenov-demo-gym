import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useSession } from '@/features/shell/SessionProvider';
import { haptics } from '@/lib/haptics';
import { resetDemo } from '@/lib/demo/reset';

/** Confirm -> clear and reseed -> restart the journey from the splash. */
export function useResetDemo() {
  const router = useRouter();
  const { reload } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const open = useCallback(() => setConfirming(true), []);
  const cancel = useCallback(() => setConfirming(false), []);

  const confirm = useCallback(async () => {
    setBusy(true);
    await resetDemo();
    await reload();
    haptics.success();
    setBusy(false);
    setConfirming(false);
    router.replace('/');
  }, [reload, router]);

  return { confirming, busy, open, cancel, confirm };
}
