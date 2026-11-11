'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Badge from '@mui/material/Badge';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NavigateNext from '@mui/icons-material/NavigateNext';
import ContactPhoneOutlined from '@mui/icons-material/ContactPhoneOutlined';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ShellCanvas } from '@/components/layout/ShellCanvas';
import { ShellTopBar, shellRoundButton } from '@/components/layout/ShellTopBar';
import { PracticeSearch, type SearchPage } from '@/components/navigation/PracticeSearch';
import { UserMenu, type UserMenuPractice } from '@/components/layout/UserMenu';
import { navForUser, PRACTICE_FOOTER_NAV, PRACTICE_NAV, type NavItem } from '@/config/navigation';
import { togglePracticeSidebar } from '@/store/uiSlice';
import { selectSession, selectUi, useAppDispatch, useAppSelector } from '@/store';

export interface PracticeShellProps {
  basePath: string;
  vertical: string;
  /** The current practice, shown in the account chip and menu. */
  practice: UserMenuPractice;
  /** Unread notifications for the 🔔 dot. */
  hasUnread?: boolean;
  /**
   * Breadcrumb after "Dashboard" in place of the page title (practice anatomy, phase 5). `href` is
   * relative to `basePath`; the last crumb is the current page.
   */
  crumbs?: { label: string; href?: string }[] | null;
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

function TopBarCrumbs({
  basePath,
  crumbs,
  compact,
}: {
  basePath: string;
  crumbs: { label: string; href?: string }[];
  compact: boolean;
}) {
  // Phones only have room for the current page.
  const all = compact ? crumbs.slice(-1) : [{ label: 'Dashboard', href: '/dashboard' }, ...crumbs];
  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      separator={<NavigateNext fontSize="small" />}
      sx={{ minWidth: 0, fontSize: { xs: 13, sm: 15 }, '& ol': { flexWrap: 'nowrap' }, '& li': { minWidth: 0 } }}
    >
      {all.map((crumb, index) => {
        const last = index === all.length - 1;
        if (last || !crumb.href) {
          return (
            <Typography
              key={crumb.label}
              component="span"
              noWrap
              aria-current={last ? 'page' : undefined}
              sx={{
                display: 'block',
                fontSize: 'inherit',
                fontWeight: 600,
                color: last ? 'text.primary' : 'text.secondary',
              }}
            >
              {crumb.label}
            </Typography>
          );
        }
        return (
          <MuiLink
            key={crumb.label}
            component={Link}
            href={`${basePath}${crumb.href}`}
            underline="hover"
            noWrap
            sx={{ display: 'block', fontSize: 'inherit', fontWeight: 500, color: 'text.secondary' }}
          >
            {crumb.label}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}

const BRAND_LABEL = (
  <>
    Public
    <br />
    Practice
  </>
);

/**
 * Practice-level frame, refined design (same layout as the hub, COMPONENTS.md → PracticeShell): grey
 * canvas, sticky top bar (page title or breadcrumbs, search, 🔔, account menu with the practice), the floating
 * collapsible sidebar panel and a grey main panel for the pages' white cards. Phones get a ☰ drawer.
 */
export function PracticeShell({
  basePath,
  vertical,
  practice,
  hasUnread = false,
  crumbs = null,
  children,
}: PracticeShellProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectSession);
  const { practiceSidebarCollapsed } = useAppSelector(selectUi);
  const sections = navForUser(PRACTICE_NAV, user);
  const allItems = [...sections.flatMap((section) => section.items), ...PRACTICE_FOOTER_NAV];
  const pages: SearchPage[] = allItems.map((item) => ({
    label: item.label,
    href: `${basePath}${item.path}${item.query ? `?${item.query}` : ''}`,
    icon: item.icon,
  }));
  // Quick links in the account menu, limited to pages this user's menu has.
  const visibleIds = new Set(allItems.map((item) => item.id));
  const accountLinks = [
    { id: 'settings', label: 'Practice Settings', href: `${basePath}/settings`, icon: SettingsOutlined },
    { id: 'notifications', label: 'Notifications', href: `${basePath}/notifications`, icon: NotificationsNoneOutlined },
    { id: 'support', label: 'Support', href: `${basePath}/support`, icon: ContactPhoneOutlined },
  ].filter((link) => visibleIds.has(link.id));
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  // Below md the sidebar panel would crowd the page, so it becomes a ☰ drawer.
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarProps = {
    sections,
    footer: PRACTICE_FOOTER_NAV,
    basePath,
    user,
    brandLabel: BRAND_LABEL,
    showUserCard: true,
  };

  return (
    <ShellCanvas
      collapsed={practiceSidebarCollapsed}
      mainTone="panel"
      topBar={
        <ShellTopBar
          sticky={!compact}
          start={
            <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, pl: { xs: 0, md: 1.5 } }}>
              {compact && (
                <IconButton aria-label="Open menu" onClick={() => setDrawerOpen(true)} sx={shellRoundButton}>
                  <MenuIcon />
                </IconButton>
              )}
              {crumbs?.length ? (
                <TopBarCrumbs basePath={basePath} crumbs={crumbs} compact={compact} />
              ) : (
                <Suspense fallback={null}>
                  <TopBarTitle basePath={basePath} items={allItems} userName={userName} />
                </Suspense>
              )}
            </Box>
          }
          middle={
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <PracticeSearch variant="global" pages={pages} />
            </Box>
          }
          end={
            <>
              <IconButton
                component={Link}
                href={`${basePath}/notifications`}
                aria-label="Notifications"
                sx={[shellRoundButton, { display: { xs: 'none', sm: 'inline-flex' } }]}
              >
                <Badge color="error" variant="dot" invisible={!hasUnread}>
                  <NotificationsNoneOutlined sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
              <UserMenu vertical={vertical} practice={practice} links={accountLinks} />
            </>
          }
        />
      }
      sidebar={
        !compact && (
          <Suspense fallback={null}>
            <AppSidebar
              variant="panel"
              {...sidebarProps}
              collapsed={practiceSidebarCollapsed}
              onToggleCollapsed={() => dispatch(togglePracticeSidebar())}
            />
          </Suspense>
        )
      }
    >
      {compact && (
        <Suspense fallback={null}>
          <AppSidebar
            variant="drawer"
            look="hub"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            {...sidebarProps}
          />
        </Suspense>
      )}
      {children}
    </ShellCanvas>
  );
}
