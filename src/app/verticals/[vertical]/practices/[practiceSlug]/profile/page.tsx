import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { StaffDetailsPage } from '@/features/staff/StaffDetailsPage';
import { SELF_STAFF_ID } from '@/lib/api/staff';

// The signed-in user's own staff record (docs/practice-user/00-practice-user-role.md).
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StaffDetailsPage staffId={SELF_STAFF_ID} />
    </Suspense>
  );
}
