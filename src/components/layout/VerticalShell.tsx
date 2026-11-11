'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import Menu from '@mui/icons-material/Menu';
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ShellCanvas } from '@/components/layout/ShellCanvas';
import { ShellTopBar, shellRoundButton } from '@/components/layout/ShellTopBar';
import { UserMenu, type UserMenuLink } from '@/components/layout/UserMenu';
import { PracticeSearch, type SearchPage } from '@/components/navigation/PracticeSearch';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { navForUser, VERTICAL_FOOTER_NAV, VERTICAL_NAV } from '@/config/navigation';
import { toggleVerticalSidebar } from '@/store/uiSlice';
import { selectSession, selectUi, useAppDispatch, useAppSelector } from '@/store';

const BRAND_LABEL = (
  <>
    Public
    <br />
    Practice
  </>
);

/**
 * Vertical-level frame, refined design (COMPONENTS.md → VerticalShell): on a grey canvas, a sticky
 * white top bar (Back to Verticals, global search, 🔔, UserMenu), the floating sidebar panel and the
 * white main panel. Phones get a ☰ drawer instead of the panel. Practice users only reach the
 * practice grid here, so they get no menu and no Back to Verticals, as in the live app.
 */
export function VerticalShell({ vertical, children }: { vertical: string; children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectSession);
  const { verticalSidebarCollapsed: collapsed } = useAppSelector(selectUi);
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const basePath = `/verticals/${vertical}`;
  const isAdmin = Boolean(user?.isAdmin);
  const sections = navForUser(VERTICAL_NAV, user);
  const pages: SearchPage[] = isAdmin
    ? [...sections.flatMap((section) => section.items), ...VERTICAL_FOOTER_NAV].map((item) => ({
        label: item.label,
        href: `${basePath}${item.path}${item.query ? `?${item.query}` : ''}`,
        icon: item.icon,
      }))
    : [];
  const showPanel = isAdmin && !compact;
  const accountLinks: UserMenuLink[] = [
    { label: 'Settings', href: `${basePath}/settings`, icon: SettingsOutlined },
    { label: 'Notifications', href: `${basePath}/notifications`, icon: NotificationsNoneOutlined },
    { label: 'Help & System Feed', href: `${basePath}/system-feed`, icon: HelpOutlineOutlined },
  ];

  const start = isAdmin ? (
    <>
      {compact && (
        <IconButton aria-label="Open menu" onClick={() => setMenuOpen(true)} sx={shellRoundButton}>
          <Menu />
        </IconButton>
      )}
      <ButtonBase
        component={Link}
        href="/verticals"
        aria-label={compact ? 'Back to Verticals' : undefined}
        sx={(theme) => ({
          display: { xs: 'none', sm: 'inline-flex' },
          gap: 1,
          height: 46,
          pl: compact ? 0 : 1.75,
          pr: compact ? 0 : 2.5,
          width: compact ? 46 : 'auto',
          borderRadius: `${theme.tokens.radius.pill}px`,
          border: `1px solid ${theme.tokens.shell.line}`,
          bgcolor: 'background.paper',
          color: theme.tokens.shell.ink,
          fontSize: 14,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          '&:hover': { bgcolor: theme.tokens.shell.well },
          '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        })}
      >
        <ChevronLeft sx={{ fontSize: 20 }} />
        {!compact && 'Back to Verticals'}
      </ButtonBase>
    </>
  ) : (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
      <BrandLogo height={28} />
      <Box
        component="span"
        sx={(theme) => ({
          display: { xs: 'none', sm: 'block' },
          pl: 1,
          borderLeft: `1.5px solid ${theme.tokens.neutral[400]}`,
          fontSize: 13,
          lineHeight: 1.1,
          color: theme.tokens.shell.ink,
        })}
      >
        {BRAND_LABEL}
      </Box>
    </Box>
  );

  return (
    <ShellCanvas
      collapsed={collapsed}
      topBar={
        <ShellTopBar
          sticky={!compact}
          start={start}
          middle={<PracticeSearch variant="global" vertical={vertical} pages={pages} />}
          end={
            <>
              <IconButton
                component={Link}
                href={`${basePath}/notifications`}
                aria-label="Notifications"
                sx={[shellRoundButton, { display: { xs: 'none', sm: 'inline-flex' } }]}
              >
                <NotificationsNoneOutlined sx={{ fontSize: 20 }} />
              </IconButton>
              <UserMenu vertical={vertical} links={isAdmin ? accountLinks : []} />
            </>
          }
        />
      }
      sidebar={
        showPanel && (
          <Suspense fallback={null}>
            <AppSidebar
              variant="panel"
              sections={sections}
              footer={VERTICAL_FOOTER_NAV}
              basePath={basePath}
              user={user}
              brandLabel={BRAND_LABEL}
              collapsed={collapsed}
              onToggleCollapsed={() => dispatch(toggleVerticalSidebar())}
            />
          </Suspense>
        )
      }
    >
      {isAdmin && compact && (
        <Suspense fallback={null}>
          <AppSidebar
            variant="drawer"
            look="hub"
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            sections={sections}
            footer={VERTICAL_FOOTER_NAV}
            basePath={basePath}
            user={user}
            brandLabel={BRAND_LABEL}
          />
        </Suspense>
      )}
      {children}
    </ShellCanvas>
  );
}
