import type { TFunction } from 'i18next';

import type { MembershipPhase } from '@/data/rules/membership';

export function phaseLabel(t: TFunction, phase: MembershipPhase): string {
  switch (phase) {
    case 'active':
      return t('membership.phaseActive');
    case 'expiring':
      return t('membership.phaseExpiring');
    case 'expired':
      return t('membership.phaseExpired');
  }
}
