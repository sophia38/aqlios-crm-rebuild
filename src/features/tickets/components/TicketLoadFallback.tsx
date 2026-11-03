'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { usePracticeHref } from '@/features/practice/PracticeContext';
import type { TicketLoadState } from '../useTicketDetail';
import { TICKETS_PATH } from '../ticketsRoutes';

/** Loading, unknown id and error states shared by the consultation pages. */
export function TicketLoadFallback({ state, onRetry }: { state: TicketLoadState; onRetry: () => void }) {
  const practiceHref = usePracticeHref();
  if (state.status === 'loading') return <LoadingSpinner message="Loading consultation..." />;
  if (state.status === 'not-found') {
    return (
      <AccessDenied
        title="Consultation not found"
        message="The consultation may have been removed, or the link is wrong."
        backHref={practiceHref(TICKETS_PATH)}
        backLabel="Go to Tickets"
      />
    );
  }
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 8, textAlign: 'center' }} role="alert">
      <Box sx={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</Box>
      <Box sx={{ color: 'text.secondary' }}>Could not load this consultation.</Box>
      <Button variant="contained" onClick={onRetry}>
        Try again
      </Button>
    </Stack>
  );
}
