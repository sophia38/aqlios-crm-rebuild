'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { selectSession, useAppSelector } from '@/store';

/**
 * Practice dashboard: the live app shows only a welcome banner (docs/practice/00-…, "Practice dashboard").
 * Dark-teal gradient card, ~100px tall, 18px radius.
 */
export function PracticeDashboard() {
  const { user } = useAppSelector(selectSession);
  return (
    <Box
      sx={(theme) => ({
        minHeight: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: { xs: 3, md: 4 },
        py: 3,
        borderRadius: `${theme.tokens.radius.base}px`,
        background: `linear-gradient(120deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: theme.palette.primary.contrastText,
      })}
    >
      <Typography component="h1" sx={{ fontSize: 26, fontWeight: 700, color: 'inherit' }}>
        Welcome, {user?.firstName}!
      </Typography>
      <Typography sx={{ fontSize: 16, color: 'inherit' }}>
        You are in{' '}
        <Box component="strong" sx={(theme) => ({ color: theme.palette.brand.light })}>
          Public Primary Care
        </Box>
      </Typography>
    </Box>
  );
}
