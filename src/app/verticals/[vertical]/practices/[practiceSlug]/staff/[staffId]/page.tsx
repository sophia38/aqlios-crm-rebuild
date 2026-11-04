import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { StaffDetailsPage } from '@/features/staff/StaffDetailsPage';

// The tab lives in `?tab=`; reading search params needs a Suspense boundary in a static export.
export default async function Page({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params;
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StaffDetailsPage staffId={staffId} />
    </Suspense>
  );
}
