'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ShellTopBar } from '@/components/layout/ShellTopBar';
import { UserMenu } from '@/components/layout/UserMenu';
import { PracticeSearch } from '@/components/navigation/PracticeSearch';
import { VerticalCard } from '@/components/practice/VerticalCard';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { VERTICALS } from '@/config/verticals';
import { authApi } from '@/lib/api/auth';
import type { SubApp } from '@/lib/api/types';
import { selectSession, useAppSelector } from '@/store';

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
    <Box sx={(theme) => ({ minHeight: '100dvh', p: { xs: 1.25, md: 1.75 }, bgcolor: theme.tokens.shell.canvas })}>
      <Box
        sx={(theme) => ({
          minHeight: { xs: 'calc(100dvh - 20px)', md: 'calc(100dvh - 28px)' },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: `${theme.tokens.radius.shellPanel}px`,
          border: `1px solid ${theme.tokens.shell.panelBorder}`,
        })}
      >
        <ShellTopBar
          start={<BrandLogo height={32} sx={{ ml: 1 }} />}
          end={<UserMenu />}
          sx={(theme) => ({ m: { xs: 1, md: 1.75 }, mb: 0, borderColor: theme.tokens.shell.line })}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: 'min(860px, 100%)',
            mx: 'auto',
            px: 3,
            pt: { xs: 4, md: '8vh' },
            pb: 6,
            textAlign: 'center',
          }}
        >
          <Typography
            component="h1"
            sx={(theme) => ({ fontSize: { xs: 24, md: 30 }, fontWeight: 600, color: theme.tokens.shell.ink })}
          >
            Welcome back, {user.firstName}
          </Typography>
          <Typography sx={(theme) => ({ mt: 0.75, mb: 4, fontSize: 15, color: theme.tokens.shell.inkMuted })}>
            Choose where you want to work today.
          </Typography>

          {state.status === 'loading' && <LoadingSpinner message="Loading verticals..." />}

          {state.status === 'error' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Failed to load verticals.
              </Typography>
              <Button variant="outlined" onClick={retry}>
                Try again
              </Button>
            </Box>
          )}

          {state.status === 'ready' && state.subApps.length === 0 && (
            <Typography variant="body2">No verticals available for your account.</Typography>
          )}

          {state.status === 'ready' && state.subApps.length > 0 && (
            <>
              <Box
                component="nav"
                aria-label="Verticals"
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}
              >
                {VERTICALS.map((vertical) => {
                  const enabled = vertical.href !== null && isEnabled(vertical.slug);
                  return (
                    <VerticalCard
                      key={vertical.slug}
                      label={vertical.label}
                      description={vertical.description}
                      icon={vertical.icon}
                      tone={vertical.slug}
                      disabled={!enabled}
                      onClick={enabled && vertical.href ? () => router.push(vertical.href) : undefined}
                    />
                  );
                })}
              </Box>
              {isEnabled('public') && (
                <Box sx={{ mt: 3.5, textAlign: 'left' }}>
                  <PracticeSearch variant="jump" />
                  <Typography
                    variant="caption"
                    component="p"
                    sx={(theme) => ({ mt: 1.25, px: 0.75, color: theme.tokens.shell.inkMuted })}
                  >
                    Search Public Primary Care practices by name
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        <Box component="footer" sx={{ py: 2.5, textAlign: 'center' }}>
          <Typography variant="caption">Copyright © {new Date().getFullYear()} Aqlios. All rights reserved.</Typography>
        </Box>
      </Box>
    </Box>
  );
}
