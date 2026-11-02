import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { TemplateLibraryPage } from '@/features/templates/TemplateLibraryPage';

// The tab lives in `?tab=`; reading search params needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TemplateLibraryPage />
    </Suspense>
  );
}
