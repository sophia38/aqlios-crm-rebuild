'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { UserMenu } from '@/components/layout/UserMenu';
import { VerticalCard } from '@/components/practice/VerticalCard';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { authApi } from '@/lib/api/auth';
import type { SubApp } from '@/lib/api/types';
import { selectSession, useAppSelector } from '@/store';

// Card order and labels as on the live /verticals page. Everyclinic is always shown disabled.
const VERTICALS = [
  { slug: 'public', label: 'Public Primary Care', href: '/verticals/public/practices' },
  { slug: 'private', label: 'Private Business', href: '/verticals/private' },
  { slug: 'everyclinic', label: 'Everyclinic Business', href: null },
] as const;

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; subApps: SubApp[] };

export default function VerticalsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAppSelector(selectSession);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  // Bumped by "Try again" (which also resets the state to loading) to re-run the request.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    authApi
      .subApps(controller.signal)
      .then(({ sub_apps }) => setState({ status: 'ready', subApps: sub_apps }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: 'error' });
        enqueueSnackbar('Failed to load verticals', { variant: 'error' });
      });
    return () => controller.abort();
  }, [attempt, enqueueSnackbar]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  };

  // Like the live app, practice users skip the picker and land on their practice grid.
  useEffect(() => {
    if (user && !user.isAdmin) router.replace('/verticals/public/practices');
  }, [router, user]);

  if (!user || !user.isAdmin) return <LoadingSpinner fullScreen message="Verifying session..." />;

  const isEnabled = (slug: string) =>
    state.status === 'ready' && state.subApps.some((subApp) => subApp.slug === slug && subApp.is_active);

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${theme.tokens.surface.background} 40%, ${theme.tokens.surface.mintWash} 100%)`,
      })}
    >
      <Box
        component="header"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, md: 5 }, py: 3 }}
      >
        <BrandLogo height={36} />
        <UserMenu />
      </Box>

      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 5 }, py: { xs: 4, md: 8 } }}>
        <Typography component="h1" sx={{ textAlign: 'center', fontSize: { xs: 24, md: 32 }, fontWeight: 400, mb: 6 }}>
          Welcome back{' '}
          <Box component="strong" sx={{ fontWeight: 700 }}>
            {user.firstName} {user.lastName}
          </Box>{' '}
          <span aria-hidden>👋</span>
        </Typography>

        {state.status === 'loading' && <LoadingSpinner message="Loading verticals..." />}

        {state.status === 'error' && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Failed to load verticals.
            </Typography>
            <Button variant="outlined" onClick={retry}>
              Try again
            </Button>
          </Box>
        )}

        {state.status === 'ready' && state.subApps.length === 0 && (
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            No verticals available for your account.
          </Typography>
        )}

        {state.status === 'ready' && state.subApps.length > 0 && (
          <Box
            component="nav"
            aria-label="Verticals"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 3,
              maxWidth: 840,
              mx: 'auto',
            }}
          >
            {VERTICALS.map((vertical) => {
              const enabled = vertical.href !== null && isEnabled(vertical.slug);
              return (
                <VerticalCard
                  key={vertical.slug}
                  label={vertical.label}
                  disabled={!enabled}
                  onClick={enabled && vertical.href ? () => router.push(vertical.href) : undefined}
                />
              );
            })}
          </Box>
        )}
      </Box>

      <Box
        component="footer"
        sx={(theme) => ({ borderTop: `1px solid ${theme.tokens.border.medium}`, py: 2.5, textAlign: 'center' })}
      >
        <Typography variant="body2">Copyright © {new Date().getFullYear()} Aqlios. All rights reserved.</Typography>
      </Box>
    </Box>
  );
}
