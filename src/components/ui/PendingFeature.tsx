import type { LucideIcon } from '@/components/ui/icons';
import { useTranslation } from 'react-i18next';

import { EmptyState } from './EmptyState';
import { Screen } from './Screen';

type PendingKey = 'classes' | 'workout' | 'progress';

/** Tab shell for a feature that arrives in a later milestone. */
export function PendingFeature({ feature, icon }: { feature: PendingKey; icon: LucideIcon }) {
  const { t } = useTranslation();
  return (
    <Screen withTabBar>
      <EmptyState
        icon={icon}
        title={t(`pending.${feature}.title`)}
        body={t(`pending.${feature}.body`)}
      />
    </Screen>
  );
}
