'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { ComingSoonPlaceholder, type ComingSoonPlaceholderProps } from '@/components/feedback/ComingSoonPlaceholder';
import { UserMenu } from '@/components/layout/UserMenu';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { selectSession, useAppSelector } from '@/store';

/**
 * Temporary frame for routes whose real screens arrive in later phases. Phase 2 replaces it with
 * VerticalShell; it isn't a reusable component and isn't listed in COMPONENTS.md.
 */
export function InterimPage(props: ComingSoonPlaceholderProps) {
  const router = useRouter();
  const { user } = useAppSelector(selectSession);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 2, md: 5 },
          py: 3,
        }}
      >
        {user?.isAdmin ? (
          <Button
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            onClick={() => router.push('/verticals')}
            sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
          >
            Back to Verticals
          </Button>
        ) : (
          <span />
        )}
        <BrandLogo height={32} />
        <UserMenu />
      </Box>
      <Box
        component="main"
        sx={(theme) => ({
          mx: { xs: 2, md: 5 },
          borderRadius: `${theme.tokens.radius.panel}px`,
          bgcolor: theme.tokens.surface.panel,
        })}
      >
        <ComingSoonPlaceholder {...props} />
      </Box>
    </Box>
  );
}
