import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { TicketListPage } from '@/features/tickets/TicketListPage';

// The tab lives in `?cases=closed`; reading search params needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TicketListPage />
    </Suspense>
  );
}
