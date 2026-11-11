'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import KeyboardDoubleArrowLeft from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { initials } from '@/components/layout/UserMenu';
import type { NavItem, NavSection } from '@/config/navigation';
import type { AuthUser } from '@/lib/api/types';
import { signOut } from '@/store/sessionSlice';
import { useAppDispatch } from '@/store';

export const SIDEBAR_WIDTH = { drawer: 264, panel: 264, collapsed: 76 } as const;
/** Logo row height in the `practice` look. */
const PRACTICE_BAR_HEIGHT = 64;

type Look = 'hub' | 'practice';

export interface AppSidebarProps {
  /**
   * `panel`: the floating panel of the hub and practice shells. `drawer`: small screens, opened with
   * ☰ (`look` picks the styling; both shells use `hub`).
   */
  variant: 'drawer' | 'panel';
  look?: Look;
  sections: NavSection[];
  footer: NavItem[];
  /** Base path the items' paths are relative to. */
  basePath: string;
  user: AuthUser | null;
  /** Label beside the logo in the hub look ("Public / Practice"). */
  brandLabel?: React.ReactNode;
  /** Show the name-and-role card at the foot in the hub look (the practice level keeps its user card). */
  showUserCard?: boolean;
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function itemHref(basePath: string, item: NavItem) {
  return `${basePath}${item.path}${item.query ? `?${item.query}` : ''}`;
}

/** Active when the path matches; items sharing a path (ROTA / Activity Tracker) are told apart by the query. */
function useIsActive(basePath: string) {
  const pathname = usePathname().replace(/\/$/, '');
  const searchParams = useSearchParams();
  return (item: NavItem) => {
    const target = `${basePath}${item.activePath ?? item.path}`;
    const pathMatches = pathname === target || pathname.startsWith(`${target}/`);
    if (!pathMatches) return false;
    const [key, value] = item.query?.split('=') ?? [];
    if (key) return searchParams.get(key) === value;
    // An item without a query isn't active when a sibling's query is selected (ROTA vs Activity Tracker).
    return searchParams.get('module') !== 'activityTracker' || !target.endsWith('/rota');
  };
}

/** Item styles from the refined prototype: pill rows with a primary outline when active. */
function itemSx(look: Look, active: boolean, collapsed: boolean, danger = false) {
  return (theme: Theme) => {
    const hub = look === 'hub';
    const nav = theme.tokens.shell.practiceNav;
    return {
      width: collapsed ? 44 : '100%',
      minHeight: collapsed ? 44 : 36,
      alignSelf: collapsed ? 'center' : 'stretch',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: hub ? 1.25 : 1.5,
      px: collapsed ? 0 : hub ? 1.75 : 1.5,
      borderRadius: `${theme.tokens.radius.pill}px`,
      border: '1px solid transparent',
      fontSize: hub ? 13.5 : 14,
      textAlign: 'left' as const,
      color: danger
        ? theme.tokens.shell.danger
        : hub
          ? theme.tokens.shell.ink
          : active
            ? nav.label
            : theme.tokens.text.strong,
      fontWeight: active ? (hub ? 600 : 500) : 400,
      '& .MuiSvgIcon-root': {
        fontSize: hub ? 17 : 18,
        flexShrink: 0,
        color: danger
          ? theme.tokens.shell.danger
          : active
            ? 'primary.main'
            : hub
              ? theme.tokens.shell.inkMuted
              : nav.icon,
      },
      ...(active && {
        borderColor: theme.palette.primary.main,
        bgcolor: hub ? 'transparent' : nav.activeBg,
      }),
      '&:hover': {
        bgcolor: danger ? theme.tokens.shell.dangerHover : hub ? theme.tokens.shell.itemHover : nav.hoverBg,
      },
      '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
    };
  };
}

function withTooltip(collapsed: boolean, label: string, node: React.ReactElement) {
  return collapsed ? (
    <Tooltip title={label} placement="right">
      {node}
    </Tooltip>
  ) : (
    node
  );
}

function NavLink({
  item,
  href,
  active,
  collapsed,
  look,
  onNavigate,
}: {
  item: NavItem;
  href: string;
  active: boolean;
  collapsed: boolean;
  look: Look;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return withTooltip(
    collapsed,
    item.label,
    <ButtonBase
      component={Link}
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      sx={itemSx(look, active, collapsed)}
    >
      <Icon />
      {!collapsed && <Box component="span">{item.label}</Box>}
    </ButtonBase>,
  );
}

function SectionHeader({
  title,
  look,
  open,
  onToggle,
}: {
  title: string;
  look: Look;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <ButtonBase
      onClick={onToggle}
      aria-expanded={open}
      sx={(theme) => ({
        width: '100%',
        justifyContent: 'space-between',
        borderRadius: `${theme.tokens.radius.pill}px`,
        fontSize: 12,
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}` },
        '& .MuiSvgIcon-root': { fontSize: 16 },
        ...(look === 'hub'
          ? {
              px: 1.25,
              pt: 0.25,
              pb: 0.5,
              color: theme.tokens.shell.inkMuted,
              '&:hover': { color: theme.tokens.shell.ink },
            }
          : {
              py: 1,
              pr: 0.75,
              fontWeight: 600,
              letterSpacing: '0.4px',
              color: theme.tokens.shell.practiceNav.label,
              '&::before': {
                content: '""',
                width: 2,
                height: 10,
                mr: 0.75,
                bgcolor: theme.tokens.shell.practiceNav.label,
              },
              '& .MuiSvgIcon-root': { fontSize: 18, color: theme.tokens.shell.practiceNav.icon },
              '&:hover': { color: 'primary.main' },
            }),
      })}
    >
      <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
        {title}
      </Box>
      {open ? <ExpandLess /> : <ExpandMore />}
    </ButtonBase>
  );
}

function OverviewLabel({ look }: { look: Look }) {
  return (
    <Typography
      component="p"
      sx={(theme) =>
        look === 'hub'
          ? { fontSize: 12, px: 1.25, pb: 0.5, color: theme.tokens.shell.inkMuted }
          : {
              fontSize: 12,
              fontWeight: 500,
              pt: 1,
              pb: 0.25,
              letterSpacing: '0.4px',
              color: theme.tokens.shell.practiceNav.label,
            }
      }
    >
      Overview
    </Typography>
  );
}

function SidebarContent({
  sections,
  footer,
  basePath,
  user,
  collapsed = false,
  look,
  brandLabel,
  showUserCard = false,
  onNavigate,
  onToggleCollapsed,
}: Omit<AppSidebarProps, 'variant' | 'open' | 'onClose' | 'look'> & { look: Look; onNavigate?: () => void }) {
  const isActive = useIsActive(basePath);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) =>
    setClosedSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const hub = look === 'hub';

  const logout = async () => {
    onNavigate?.();
    await dispatch(signOut());
    router.replace('/auth/login');
  };

  const brand = hub ? (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: collapsed ? 0 : 0.75,
        pt: 0.5,
        mb: 0.75,
        flexDirection: collapsed ? 'column' : 'row',
      }}
    >
      {!collapsed && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <BrandLogo height={26} />
          {brandLabel && (
            <Box
              component="span"
              sx={(theme) => ({
                pl: 1,
                borderLeft: `1.5px solid ${theme.tokens.neutral[400]}`,
                fontSize: 12.5,
                lineHeight: 1.1,
                color: theme.tokens.shell.ink,
              })}
            >
              {brandLabel}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ flex: 1 }} />
      {onToggleCollapsed &&
        withTooltip(
          collapsed,
          'Expand sidebar',
          <IconButton
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            sx={(theme) => ({
              width: 32,
              height: 32,
              border: `1px solid ${theme.tokens.shell.line}`,
              color: theme.tokens.shell.ink,
              '&:hover': { bgcolor: theme.tokens.shell.well },
            })}
          >
            {collapsed ? (
              <KeyboardDoubleArrowRight sx={{ fontSize: 16 }} />
            ) : (
              <KeyboardDoubleArrowLeft sx={{ fontSize: 16 }} />
            )}
          </IconButton>,
        )}
    </Box>
  ) : (
    <>
      <Box
        sx={(theme) => ({
          height: PRACTICE_BAR_HEIGHT,
          flexShrink: 0,
          px: collapsed ? 1 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: `1px solid ${theme.tokens.shell.practiceNav.divider}`,
        })}
      >
        <BrandLogo height={collapsed ? 20 : 30} />
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      {brand}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: hub ? 1.5 : 0.25,
          px: hub ? 0 : 1.5,
          py: hub ? 0.5 : 1.5,
          scrollbarWidth: 'thin',
        }}
      >
        {sections.map((section, index) => {
          const hasActive = section.items.some(isActive);
          const open = collapsed || section.title === null || !closedSections.has(section.id) || hasActive;
          return (
            <Box
              key={section.id}
              sx={(theme) => ({
                display: 'flex',
                flexDirection: 'column',
                gap: hub ? 0.25 : 0,
                // Rail: a short line between groups in place of the headings.
                ...(collapsed &&
                  index > 0 && {
                    pt: 1.25,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      width: 24,
                      ml: '-12px',
                      height: '1px',
                      bgcolor: hub ? theme.tokens.shell.line : theme.tokens.shell.practiceNav.divider,
                    },
                  }),
              })}
            >
              {!collapsed &&
                (section.title === null ? (
                  <OverviewLabel look={look} />
                ) : (
                  <SectionHeader
                    title={section.title}
                    look={look}
                    open={open}
                    onToggle={() => toggleSection(section.id)}
                  />
                ))}
              <Collapse in={open} timeout="auto">
                <Box
                  component="ul"
                  sx={{
                    listStyle: 'none',
                    m: 0,
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    pb: hub ? 0 : 0.75,
                  }}
                >
                  {section.items.map((item) => (
                    <Box component="li" key={item.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                      <NavLink
                        item={item}
                        href={itemHref(basePath, item)}
                        active={isActive(item)}
                        collapsed={collapsed}
                        look={look}
                        onNavigate={onNavigate}
                      />
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
          borderTop: `1px solid ${hub ? theme.tokens.shell.line : theme.tokens.shell.practiceNav.divider}`,
          pt: hub ? 1.25 : 1.5,
          px: hub ? 0 : 1.5,
          pb: hub ? 0 : 1.5,
        })}
      >
        {footer.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            href={itemHref(basePath, item)}
            active={isActive(item)}
            collapsed={collapsed}
            look={look}
            onNavigate={onNavigate}
          />
        ))}
        {hub &&
          withTooltip(
            collapsed,
            'Sign out',
            <ButtonBase
              onClick={logout}
              aria-label={collapsed ? 'Sign out' : undefined}
              sx={itemSx(look, false, collapsed, true)}
            >
              <LogoutOutlined />
              {!collapsed && <Box component="span">Sign out</Box>}
            </ButtonBase>,
          )}
        {(!hub || showUserCard) && user && (
          <Box
            sx={(theme) => ({
              mt: 1,
              p: collapsed ? 1 : 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.5,
              borderRadius: `${theme.tokens.radius.input}px`,
              bgcolor: theme.tokens.shell.practiceNav.profileBg,
            })}
          >
            <Avatar
              aria-label={collapsed ? fullName : undefined}
              sx={{
                width: 40,
                height: 40,
                fontSize: 13,
                fontWeight: 500,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              {initials(user.firstName, user.lastName)}
            </Avatar>
            {!collapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={(theme) => ({ fontSize: 14, fontWeight: 500, color: theme.tokens.text.strong })}>
                  {fullName}
                </Typography>
                {user.role && (
                  <Typography variant="caption" component="p" noWrap>
                    {user.role}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * Navigation sidebar (COMPONENTS.md → AppSidebar), refined design. Vertical level: a floating panel
 * that collapses to an icon rail; the practice level uses the same panel.
 * Small screens use either look as a ☰ drawer.
 */
export function AppSidebar(props: AppSidebarProps) {
  const { variant, open = false, onClose, collapsed = false } = props;

  if (variant === 'drawer') {
    const look = props.look ?? 'practice';
    return (
      <Drawer
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: SIDEBAR_WIDTH.drawer,
              borderRadius: 0,
              border: 'none',
              ...(look === 'hub' && { px: 1.5, py: 1.75, gap: 1.25 }),
            },
          },
        }}
      >
        <SidebarContent {...props} look={look} collapsed={false} onToggleCollapsed={undefined} onNavigate={onClose} />
      </Drawer>
    );
  }

  return (
    <Box
      component="aside"
      sx={(theme) => ({
        gridArea: 'side',
        position: 'sticky',
        // Below the sticky top bar (72px plus the canvas gaps).
        top: `calc(72px + ${theme.spacing(3.5)})`,
        height: `calc(100dvh - 72px - ${theme.spacing(5.25)})`,
        display: 'flex',
        flexDirection: 'column',
        px: collapsed ? 1.25 : 1.5,
        py: 1.75,
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.shellPanel}px`,
        border: `1px solid ${theme.tokens.shell.panelBorder}`,
        overflow: 'hidden',
        transition: theme.transitions.create('padding'),
      })}
    >
      <SidebarContent {...props} look="hub" />
    </Box>
  );
}
