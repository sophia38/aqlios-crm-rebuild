'use client';

import Box from '@mui/material/Box';
import { AccessDenied } from '@/components/feedback/AccessDenied';

// Static hosting serves this for any URL that wasn't pre-built (e.g. a practice slug that doesn't exist).
export default function NotFound() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
      <AccessDenied
        title="Page not found"
        message="The link may be wrong, or the practice no longer exists."
        backHref="/verticals"
        backLabel="Go to Verticals"
      />
    </Box>
  );
}
