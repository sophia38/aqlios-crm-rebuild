'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import Menu from '@mui/icons-material/Menu';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { UserMenu } from '@/components/layout/UserMenu';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { navForUser, VERTICAL_FOOTER_NAV, VERTICAL_NAV } from '@/config/navigation';
import { selectSession, useAppSelector } from '@/store';

/**
 * Vertical-level frame: floating header (☰, Back to Verticals, logo with vertical label, 🔔,
 * UserMenu) and the drawer menu (COMPONENTS.md → VerticalShell). Practice users only reach the
 * practice grid here, so they get no ☰ menu and no Back to Verticals, as in the live app.
 */
export function VerticalShell({ vertical, children }: { vertical: string; children: React.ReactNode }) {
  const { user } = useAppSelector(selectSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const basePath = `/verticals/${vertical}`;
  const isAdmin = Boolean(user?.isAdmin);

  const roundButton = (theme: Theme) => ({
    width: 40,
    height: 40,
    border: `1px solid ${theme.tokens.border.medium}`,
    bgcolor: 'background.paper',
  });

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: { xs: 1.5, md: 3 }, pt: 2, pb: 4 }}>
      <Box
        component="header"
        sx={(theme) => ({
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 1,
          px: { xs: 1, md: 1.5 },
          py: 1,
          mb: 3,
          borderRadius: `${theme.tokens.radius.pill}px`,
          bgcolor: theme.tokens.surface.mintWash,
          border: `1px solid ${theme.tokens.border.subtle}`,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAdmin && (
            <>
              <IconButton aria-label="Open menu" onClick={() => setMenuOpen(true)} sx={roundButton}>
                <Menu />
              </IconButton>
              <Button
                component={Link}
                href="/verticals"
                variant="outlined"
                startIcon={<ChevronLeft />}
                sx={(theme) => ({
                  display: { xs: 'none', sm: 'inline-flex' },
                  borderRadius: `${theme.tokens.radius.pill}px`,
                  py: 0.75,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  borderColor: theme.tokens.border.medium,
                })}
              >
                Back to Verticals
              </Button>
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BrandLogo height={30} />
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Typography
            component="span"
            sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 14, lineHeight: 1.2, color: 'text.primary' }}
          >
            Public
            <br />
            Practice
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          <IconButton component={Link} href={`${basePath}/notifications`} aria-label="Notifications" sx={roundButton}>
            <NotificationsNoneOutlined />
          </IconButton>
          <UserMenu />
        </Box>
      </Box>

      {isAdmin && (
        <Suspense fallback={null}>
          <AppSidebar
            variant="drawer"
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            sections={navForUser(VERTICAL_NAV, user)}
            footer={VERTICAL_FOOTER_NAV}
            basePath={basePath}
            user={user}
          />
        </Suspense>
      )}

      <Box component="main">{children}</Box>
    </Box>
  );
}
