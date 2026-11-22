import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { activeDurationMs } from '@/data/rules/activeSession';
import type { ActiveSession } from '@/data/types';
import { useFormat } from '@/lib/format';

import { useNow } from './useNow';

/** Session clock (idle gaps capped, as in the saved history). Only this text re-renders each second. */
export function ElapsedTime({ session }: { session: ActiveSession }) {
  const { t } = useTranslation();
  const format = useFormat();
  const now = useNow(1000);
  const seconds = Math.max(0, Math.floor(activeDurationMs(session, now) / 1000));
  const hours = Math.floor(seconds / 3600);
  const rest = seconds % 3600;
  const shown =
    hours > 0 ? `${format.number(hours)}:${format.countdown(rest)}` : format.countdown(rest);
  return (
    <Text
      variant="caption"
      color="secondary"
      aria-label={`${t('workout.session.elapsed')}: ${shown}`}
    >
      {shown}
    </Text>
  );
}
