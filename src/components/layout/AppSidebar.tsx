'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { initials } from '@/components/layout/UserMenu';
import type { NavItem, NavSection } from '@/config/navigation';
import type { AuthUser } from '@/lib/api/types';

export const SIDEBAR_WIDTH = { drawer: 260, persistent: 220, collapsed: 72 } as const;

export interface AppSidebarProps {
  /** `drawer`: vertical level, opened with ☰. `persistent`: practice level, always visible. */
  variant: 'drawer' | 'persistent';
  sections: NavSection[];
  footer: NavItem[];
  /** Base path the items' paths are relative to. */
  basePath: string;
  user: AuthUser | null;
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
    const target = `${basePath}${item.path}`;
    const pathMatches = pathname === target || pathname.startsWith(`${target}/`);
    if (!pathMatches) return false;
    const [key, value] = item.query?.split('=') ?? [];
    if (key) return searchParams.get(key) === value;
    // An item without a query isn't active when a sibling's query is selected (ROTA vs Activity Tracker).
    return searchParams.get('module') !== 'activityTracker' || !target.endsWith('/rota');
  };
}

function NavLink({
  item,
  href,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  href: string;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <ButtonBase
      component={Link}
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      sx={(theme) => ({
        width: '100%',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 1.5,
        px: collapsed ? 0 : 1.5,
        py: 1,
        borderRadius: '10px',
        fontSize: 14,
        textAlign: 'left',
        color: active ? 'primary.main' : theme.tokens.sidebar.itemText,
        fontWeight: active ? 600 : 400,
        bgcolor: active ? theme.tokens.surface.tealLight : 'transparent',
        boxShadow: active ? `inset 0 0 0 1px ${theme.palette.primary.main}` : 'none',
        '&:hover': { bgcolor: active ? theme.tokens.surface.tealLight : theme.tokens.sidebar.itemHoverBg },
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
      })}
    >
      <Icon sx={{ fontSize: 20, flexShrink: 0 }} />
      {!collapsed && <Box component="span">{item.label}</Box>}
    </ButtonBase>
  );
  return collapsed ? (
    <Tooltip title={item.label} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function SidebarContent({
  sections,
  footer,
  basePath,
  user,
  collapsed,
  onNavigate,
}: Omit<AppSidebarProps, 'variant' | 'open' | 'onClose' | 'onToggleCollapsed'> & { onNavigate?: () => void }) {
  const isActive = useIsActive(basePath);
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) =>
    setClosedSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  return (
    <Box component="nav" aria-label="Main navigation" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{ px: collapsed ? 1 : 2.5, py: 2.5, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}
      >
        <BrandLogo height={collapsed ? 20 : 30} />
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}>
        {sections.map((section) => {
          const open = !closedSections.has(section.id);
          return (
            <Box key={section.id} sx={{ mb: 1 }}>
              {section.title === null ? (
                !collapsed && (
                  <Typography variant="caption" component="p" sx={{ px: 1.5, py: 0.75 }}>
                    Overview
                  </Typography>
                )
              ) : collapsed ? (
                <Divider sx={{ my: 1 }} />
              ) : (
                <ButtonBase
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open}
                  sx={(theme) => ({
                    width: '100%',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 0.75,
                    mt: 1,
                    borderRadius: '8px',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'primary.main',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                    },
                    '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}` },
                  })}
                >
                  {section.title}
                  {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </ButtonBase>
              )}
              <Collapse in={open || collapsed} timeout="auto">
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.25, mt: 0.5 }}>
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <NavLink
                        item={item}
                        href={itemHref(basePath, item)}
                        active={isActive(item)}
                        collapsed={Boolean(collapsed)}
                        onNavigate={onNavigate}
                      />
                    </li>
                  ))}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
      <Divider />
      <Box sx={{ px: 1.5, py: 1.5, display: 'grid', gap: 0.25 }}>
        {footer.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            href={itemHref(basePath, item)}
            active={isActive(item)}
            collapsed={Boolean(collapsed)}
            onNavigate={onNavigate}
          />
        ))}
        {user && (
          <Box
            sx={(theme) => ({
              mt: 1,
              p: collapsed ? 1 : 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.25,
              borderRadius: '12px',
              bgcolor: theme.tokens.sidebar.profileCardBg,
            })}
          >
            <Avatar
              aria-label={collapsed ? fullName : undefined}
              sx={(theme) => ({
                width: 36,
                height: 36,
                fontSize: 13,
                fontWeight: 600,
                bgcolor: theme.tokens.sidebar.avatarBg,
                color: theme.tokens.sidebar.avatarText,
              })}
            >
              {initials(user.firstName, user.lastName)}
            </Avatar>
            {!collapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
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
 * Navigation sidebar (COMPONENTS.md → AppSidebar). The vertical level uses it as a temporary
 * drawer opened by ☰; the practice level as a persistent, collapsible sidebar.
 */
export function AppSidebar(props: AppSidebarProps) {
  const { variant, open = false, onClose, collapsed = false, onToggleCollapsed } = props;

  if (variant === 'drawer') {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH.drawer, borderRadius: 0, border: 'none' } } }}
      >
        <SidebarContent {...props} collapsed={false} onNavigate={onClose} />
      </Drawer>
    );
  }

  const width = collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.persistent;
  return (
    <Box
      component="aside"
      sx={(theme) => ({
        position: 'sticky',
        top: 0,
        height: '100dvh',
        width,
        flexShrink: 0,
        bgcolor: theme.tokens.sidebar.surface,
        boxShadow: theme.tokens.sidebar.shadow,
        transition: theme.transitions.create('width'),
        zIndex: theme.zIndex.appBar + 1,
      })}
    >
      <SidebarContent {...props} />
      <IconButton
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        size="small"
        sx={(theme) => ({
          position: 'absolute',
          top: 64,
          right: -14,
          width: 28,
          height: 28,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.tokens.border.medium}`,
          boxShadow: theme.tokens.shadow.sm,
          '&:hover': { bgcolor: theme.tokens.surface.tealLight },
        })}
      >
        {collapsed ? <ChevronRight sx={{ fontSize: 18 }} /> : <ChevronLeft sx={{ fontSize: 18 }} />}
      </IconButton>
    </Box>
  );
}
