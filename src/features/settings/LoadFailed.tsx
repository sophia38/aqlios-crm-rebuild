'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/** Inline load error with Try again, inside a Settings content card. */
export function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', py: 6 }}>
      <Typography variant="body2" sx={{ color: 'error.main' }}>
        Could not load the {what}.
      </Typography>
      <Button variant="outlined" onClick={onRetry}>
        Try again
      </Button>
    </Stack>
  );
}
