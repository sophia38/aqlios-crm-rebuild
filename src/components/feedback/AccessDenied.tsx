'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LockOutlined from '@mui/icons-material/LockOutlined';

export interface AccessDeniedProps {
  title?: string;
  message?: string;
  backHref: string;
  backLabel: string;
}

/**
 * Shown instead of the live app's silent redirect when a user opens a page they can't use
 * (approved in docs/plans/phase-2-frames-and-components.md §5).
 */
export function AccessDenied({
  title = "You don't have access to this page",
  message = 'Ask your administrator if you think you should.',
  backHref,
  backLabel,
}: AccessDeniedProps) {
  return (
    <Box
      role="alert"
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1.5, py: 8 }}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: theme.tokens.tone.warning.strongBg,
          color: theme.tokens.tone.warning.main,
        })}
      >
        <LockOutlined />
      </Box>
      <Typography component="h1" variant="sectionTitle">
        {title}
      </Typography>
      <Typography variant="body2">{message}</Typography>
      <Button component={Link} href={backHref} variant="contained" sx={{ mt: 1 }}>
        {backLabel}
      </Button>
    </Box>
  );
}
