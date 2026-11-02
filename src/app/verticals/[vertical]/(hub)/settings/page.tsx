import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { SettingsPage } from '@/features/settings/SettingsPage';

// The section lives in `?section=` (as live); reading search params needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SettingsPage />
    </Suspense>
  );
}
