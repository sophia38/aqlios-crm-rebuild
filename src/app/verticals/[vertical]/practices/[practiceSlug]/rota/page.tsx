import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { PracticeRotaPage } from '@/features/rota/PracticeRotaPage';

// The tab lives in `?module=`; reading search params needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PracticeRotaPage />
    </Suspense>
  );
}
