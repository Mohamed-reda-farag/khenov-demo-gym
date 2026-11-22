import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/EmptyState';
import { TriangleAlert } from '@/components/ui/icons';
import { Screen } from '@/components/ui/Screen';

/** Shown for any address the app does not have, on web and for bad deep links. */
export default function NotFoundRoute() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <EmptyState
        icon={TriangleAlert}
        title={t('notFound.title')}
        body={t('notFound.body')}
        actionLabel={t('notFound.action')}
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
