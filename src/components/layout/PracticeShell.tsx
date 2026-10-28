'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import Search from '@mui/icons-material/Search';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PracticeSwitcher } from '@/components/layout/PracticeSwitcher';
import { navForUser, PRACTICE_FOOTER_NAV, PRACTICE_NAV, type NavItem } from '@/config/navigation';
import { togglePracticeSidebar } from '@/store/uiSlice';
import { selectSession, selectUi, useAppDispatch, useAppSelector } from '@/store';

export interface PracticeShellProps {
  basePath: string;
  practiceName: string;
  practicesHref: string;
  /** Unread notifications for the 🔔 dot. */
  hasUnread?: boolean;
  children: React.ReactNode;
}

/** The nav item for the current route (longest path wins; Activity Tracker matched by its query). */
function useCurrentItem(basePath: string, items: NavItem[]) {
  const pathname = usePathname().replace(/\/$/, '');
  const searchParams = useSearchParams();
  const relative = pathname.slice(basePath.length) || '/';
  const candidates = items.filter((item) => {
    const root = item.path.replace(/\/(ask|library)$/, '');
    return relative === root || relative.startsWith(`${root}/`);
  });
  const byQuery = candidates.find((item) => item.query && searchParams.toString().includes(item.query));
  return byQuery ?? candidates.sort((a, b) => b.path.length - a.path.length).find((item) => !item.query);
}

function TopBarTitle({ basePath, items, userName }: { basePath: string; items: NavItem[]; userName: string }) {
  const item = useCurrentItem(basePath, items);
  if (!item || item.id === 'dashboard') {
    return (
      <Typography component="p" noWrap sx={{ fontSize: { xs: 15, sm: 18 }, fontWeight: 600, color: 'text.primary' }}>
        Welcome back {userName} <span aria-hidden>👋</span>
      </Typography>
    );
  }
  const Icon = item.icon;
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Icon sx={{ color: 'primary.main' }} aria-hidden />
      <Typography component="p" noWrap sx={{ fontSize: { xs: 15, sm: 18 }, fontWeight: 600, color: 'text.primary' }}>
        {item.label}
      </Typography>
    </Stack>
  );
}

const squareButton = (theme: Theme) => ({
  width: 36,
  height: 36,
  borderRadius: '8px',
  border: `1px solid ${theme.tokens.border.medium}`,
  boxShadow: theme.tokens.shadow.sm,
  bgcolor: 'background.paper',
});

/**
 * Practice-level frame: persistent collapsible sidebar, flat top bar with page title, search,
 * notifications and the practice switcher (approved new component; docs/practice/00-…).
 */
export function PracticeShell({
  basePath,
  practiceName,
  practicesHref,
  hasUnread = false,
  children,
}: PracticeShellProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectSession);
  const { practiceSidebarCollapsed } = useAppSelector(selectUi);
  const sections = navForUser(PRACTICE_NAV, user);
  const allItems = [...sections.flatMap((section) => section.items), ...PRACTICE_FOOTER_NAV];
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  // Below md the persistent sidebar would crowd the page, so it becomes a ☰ drawer.
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={(theme) => ({ display: 'flex', minHeight: '100dvh', bgcolor: theme.tokens.surface.panel })}>
      <Suspense fallback={null}>
        {compact ? (
          <AppSidebar
            variant="drawer"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sections={sections}
            footer={PRACTICE_FOOTER_NAV}
            basePath={basePath}
            user={user}
          />
        ) : (
          <AppSidebar
            variant="persistent"
            sections={sections}
            footer={PRACTICE_FOOTER_NAV}
            basePath={basePath}
            user={user}
            collapsed={practiceSidebarCollapsed}
            onToggleCollapsed={() => dispatch(togglePracticeSidebar())}
          />
        )}
      </Suspense>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box
          component="header"
          sx={(theme) => ({
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndex.appBar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1, sm: 2 },
            px: { xs: 1.5, md: 3 },
            py: 1.5,
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.tokens.border.medium}`,
          })}
        >
          <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            {compact && (
              <IconButton aria-label="Open menu" onClick={() => setDrawerOpen(true)} sx={squareButton}>
                <MenuIcon fontSize="small" />
              </IconButton>
            )}
            <Suspense fallback={null}>
              <TopBarTitle basePath={basePath} items={allItems} userName={userName} />
            </Suspense>
          </Box>
          <Stack direction="row" spacing={{ xs: 0.75, sm: 1.25 }} sx={{ alignItems: 'center', flexShrink: 0 }}>
            {/* The live search button does nothing; disabled here until search is designed. */}
            <Tooltip title="Search is coming soon">
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                <IconButton aria-label="Search" disabled sx={squareButton}>
                  <Search fontSize="small" />
                </IconButton>
              </Box>
            </Tooltip>
            <IconButton
              component={Link}
              href={`${basePath}/notifications`}
              aria-label="Notifications"
              sx={squareButton}
            >
              <Badge color="error" variant="dot" invisible={!hasUnread}>
                <NotificationsNoneOutlined fontSize="small" />
              </Badge>
            </IconButton>
            <PracticeSwitcher practiceName={practiceName} practicesHref={practicesHref} />
          </Stack>
        </Box>
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
