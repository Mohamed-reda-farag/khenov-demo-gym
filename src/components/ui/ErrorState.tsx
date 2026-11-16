import { TriangleAlert } from '@/components/ui/icons';
import { useTranslation } from 'react-i18next';

import { EmptyState } from './EmptyState';

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={TriangleAlert}
      title={t('error.title')}
      body={t('error.body')}
      actionLabel={t('common.retry')}
      onAction={onRetry}
    />
  );
}
