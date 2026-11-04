import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { AppointmentPage } from '@/features/appointments/AppointmentPage';

// The tab and view live in `?tab=requests` / `?view=table`; reading search params needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppointmentPage />
    </Suspense>
  );
}
