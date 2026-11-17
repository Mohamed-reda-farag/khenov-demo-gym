import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/ui/Toast';
import { bookingRepository } from '@/data/repository';
import { useLanguage } from '@/i18n';
import { haptics } from '@/lib/haptics';

const CHECK_EVERY_MS = 8000;

/**
 * Demo simulation of other members cancelling: every few seconds, and whenever the app comes
 * back to the foreground, waiting bookings that are due get confirmed and announced.
 */
export function useWaitlistSettlement() {
  const { t } = useTranslation();
  const toast = useToast();
  const language = useLanguage();

  useEffect(() => {
    let active = true;

    async function settle() {
      try {
        const promoted = await bookingRepository.settleWaitlist();
        if (!active) return;
        for (const view of promoted) {
          haptics.success();
          toast.show({
            tone: 'success',
            message: t('toast.promoted', { name: view.name[language] }),
            durationMs: 7000,
          });
        }
      } catch {
        // a failed background check must never disturb the user
      }
    }

    void settle();
    const timer = setInterval(() => void settle(), CHECK_EVERY_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void settle();
    });
    return () => {
      active = false;
      clearInterval(timer);
      sub.remove();
    };
  }, [t, toast, language]);
}
