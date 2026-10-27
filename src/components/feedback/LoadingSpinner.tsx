'use client';

import Box from '@mui/material/Box';
import CircularProgress, { type CircularProgressProps } from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: number;
  thickness?: number;
  color?: CircularProgressProps['color'];
}

/** Spinner with an optional message, inline or covering the viewport (COMPONENTS.md → LoadingSpinner). */
export function LoadingSpinner({
  message = 'Loading...',
  fullScreen = false,
  size = 40,
  thickness = 4,
  color = 'primary',
}: LoadingSpinnerProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: fullScreen ? 0 : 4,
        ...(fullScreen && { position: 'fixed', inset: 0, bgcolor: 'background.default', zIndex: 'modal' }),
      }}
    >
      <CircularProgress size={size} thickness={thickness} color={color} />
      {message && <Typography variant="body2">{message}</Typography>}
    </Box>
  );
}
