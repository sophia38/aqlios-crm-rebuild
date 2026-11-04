import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { StaffListPage } from '@/features/staff/StaffListPage';

// The tab lives in `?tab=`; reading search params needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StaffListPage />
    </Suspense>
  );
}
