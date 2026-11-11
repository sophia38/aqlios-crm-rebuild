'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { SvgIconComponent } from '@mui/icons-material';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Check from '@mui/icons-material/Check';
import ChevronRight from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import ScienceOutlined from '@mui/icons-material/ScienceOutlined';
import { DevRoleSwitcherMenuItems } from '@/components/dev/DevRoleSwitcher';
import { VERTICALS } from '@/config/verticals';
import { API_MODE, PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi, practiceSlug } from '@/lib/api/practiceManagement';
import type { Practice } from '@/lib/api/types';
import { signOut } from '@/store/sessionSlice';
import { selectSession, useAppDispatch, useAppSelector } from '@/store';
import type { Theme } from '@mui/material/styles';

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
}

export interface UserMenuLink {
  label: string;
  href: string;
  icon: SvgIconComponent;
}

export interface UserMenuPractice {
  id: string;
  name: string;
  city: string;
  odsCode: string;
}

export interface UserMenuProps {
  /** The vertical you're working in (ticked under "Working in"). */
  vertical?: string;
  /** Quick links (Settings, Notifications, …) for the current level. */
  links?: UserMenuLink[];
  /** Inside a practice: the chip shows it, and the menu lists practices to switch to. */
  practice?: UserMenuPractice;
}

const PRACTICES_SHOWN = 5;

const itemSx = (theme: Theme) => ({
  width: '100%',
  gap: 1.5,
  borderRadius: `${theme.tokens.radius.menuItem}px`,
  color: theme.tokens.shell.ink,
  whiteSpace: 'normal',
  '&:hover, &.Mui-focusVisible': { bgcolor: theme.tokens.shell.itemHover },
});

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="li"
      role="presentation"
      sx={(theme) => ({
        width: '100%',
        mt: 0.5,
        pt: 1.25,
        px: 1.5,
        pb: 0.75,
        fontSize: 11.5,
        color: theme.tokens.shell.menu.heading,
        borderTop: `1px solid ${theme.tokens.shell.menu.divider}`,
      })}
    >
      {children}
    </Box>
  );
}

function TwoLine({ title, caption, muted }: { title: React.ReactNode; caption?: React.ReactNode; muted?: boolean }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        noWrap
        sx={(theme) => ({ fontSize: 13.5, fontWeight: 500, color: muted ? theme.tokens.shell.inkMuted : 'inherit' })}
      >
        {title}
      </Typography>
      {caption && (
        <Typography noWrap sx={(theme) => ({ fontSize: 12, color: theme.tokens.shell.inkMuted })}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Header account chip and menu (refined design, COMPONENTS.md → UserMenu): who you are, the practices
 * you can switch to (inside a practice), the vertical you're working in, quick links, then Demo role
 * and Sign out. Inside a practice the chip also shows the practice, its town and ODS code.
 */
export function UserMenu({ vertical = 'public', links = [], practice }: UserMenuProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector(selectSession);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [practices, setPractices] = useState<{ rows: Practice[]; count: number } | null>(null);
  const menuId = useId();

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const isAdmin = user.isAdmin;
  const close = () => {
    setAnchor(null);
    setDemoOpen(false);
  };

  const openMenu = (target: HTMLElement) => {
    setAnchor(target);
    // The practice list (and its count for "Working in") is fetched each time the menu opens.
    if (practice || isAdmin) {
      practiceManagementApi
        .practices(PUBLIC_SUB_APP_ID, { page_size: PRACTICES_SHOWN + 1 })
        .then((result) => setPractices({ rows: result.results, count: result.count }))
        .catch(() => setPractices({ rows: [], count: 0 }));
    }
  };

  const logout = async () => {
    close();
    await dispatch(signOut());
    router.replace('/auth/login');
  };

  const switchTo = (target: Practice) => {
    close();
    if (!isAdmin) {
      void practiceManagementApi.selectBusiness(PUBLIC_SUB_APP_ID, user.id, target.id).catch(() => undefined);
    }
    router.push(`/verticals/${vertical}/practices/${practiceSlug(target.practice_name)}/dashboard`);
  };

  const others = (practices?.rows ?? []).filter((row) => row.id !== practice?.id).slice(0, PRACTICES_SHOWN - 1);
  const avatarSx = {
    fontSize: 13,
    fontWeight: 500,
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
  } as const;

  return (
    <>
      <ButtonBase
        onClick={(event) => openMenu(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={anchor ? 'true' : undefined}
        aria-controls={anchor ? menuId : undefined}
        aria-label={`Account menu for ${fullName}${practice ? `, in ${practice.name}` : ''}`}
        sx={(theme) => ({
          gap: 1.25,
          minWidth: 0,
          height: { xs: 50, md: 54 },
          pl: 0.625,
          pr: { xs: 0.625, sm: 2 },
          borderRadius: `${theme.tokens.radius.pill}px`,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.tokens.shell.line}`,
          '&:hover': { bgcolor: theme.tokens.shell.well },
          '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        })}
      >
        <Avatar sx={{ ...avatarSx, width: { xs: 40, md: 44 }, height: { xs: 40, md: 44 } }}>
          {initials(user.firstName, user.lastName)}
        </Avatar>
        <Box sx={{ minWidth: 0, textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
          <Typography
            noWrap
            sx={(theme) => ({ fontSize: 14, fontWeight: 500, lineHeight: 1.25, color: theme.tokens.shell.ink })}
          >
            {fullName}
          </Typography>
          {practice ? (
            <Box
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                fontSize: 12,
                lineHeight: 1.3,
                color: theme.tokens.shell.inkMuted,
                whiteSpace: 'nowrap',
              })}
            >
              <Box
                component="span"
                sx={(theme) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  maxWidth: 180,
                  px: 0.75,
                  borderRadius: `${theme.tokens.radius.pill}px`,
                  bgcolor: theme.tokens.shell.accentSoft,
                  color: theme.tokens.shell.accentInk,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  '&::before': {
                    content: '""',
                    flexShrink: 0,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                  },
                })}
              >
                {practice.name}
              </Box>
              <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>
                {[practice.city, practice.odsCode && `ODS ${practice.odsCode}`].filter(Boolean).join(' | ')}
              </Box>
            </Box>
          ) : (
            // Practice users have an empty role in /api/auth/me; the live app shows "Actions" there (a bug).
            user.role && (
              <Typography sx={(theme) => ({ fontSize: 12, lineHeight: 1.3, color: theme.tokens.shell.inkMuted })}>
                {user.role}
              </Typography>
            )
          )}
        </Box>
        <KeyboardArrowDownIcon
          fontSize="small"
          sx={(theme) => ({ display: { xs: 'none', sm: 'block' }, color: theme.tokens.shell.inkMuted })}
        />
      </ButtonBase>

      <Menu
        id={menuId}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              mt: 1,
              width: 300,
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: 'calc(100vh - 100px)',
              p: 1,
              borderRadius: `${theme.tokens.radius.tile}px`,
              border: `1px solid ${theme.tokens.shell.panelBorder}`,
              boxShadow: theme.tokens.shell.menu.shadow,
            }),
          },
          // Wraps so the footer's two pill buttons sit side by side while arrow keys still reach them.
          list: {
            sx: {
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.25,
              p: 0,
              // The Demo section's own items and dividers take a full row too.
              '& > .MuiDivider-root, & > .MuiListSubheader-root, & > .MuiMenuItem-root': { width: '100%' },
              '& > .MuiMenuItem-root.account-foot': { width: 'auto' },
            },
          },
        }}
      >
        <Box component="li" role="presentation" sx={{ width: '100%', display: 'flex', gap: 1.5, p: 1.25, pb: 1.5 }}>
          <Avatar sx={{ ...avatarSx, width: 48, height: 48 }}>{initials(user.firstName, user.lastName)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={(theme) => ({ fontSize: 14.5, fontWeight: 600, color: theme.tokens.shell.ink })}>
              {fullName}
            </Typography>
            <Typography noWrap sx={(theme) => ({ fontSize: 12.5, color: theme.tokens.shell.inkMuted })}>
              {user.email}
            </Typography>
            {user.role && (
              <Box
                component="span"
                sx={(theme) => ({
                  display: 'inline-block',
                  mt: 0.75,
                  px: 1.125,
                  py: 0.375,
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: `${theme.tokens.radius.pill}px`,
                  bgcolor: theme.tokens.shell.accentSoft,
                  color: theme.tokens.shell.accentInk,
                })}
              >
                {user.role}
              </Box>
            )}
          </Box>
        </Box>

        {practice && <SectionHeading>This practice</SectionHeading>}
        {practice && (
          <MenuItem
            role="menuitemradio"
            aria-checked="true"
            onClick={close}
            sx={(theme) => ({ ...itemSx(theme), py: 1, bgcolor: theme.tokens.shell.menu.selected })}
          >
            <TwoLine title={practice.name} caption={[practice.city, practice.odsCode].filter(Boolean).join(' · ')} />
            <Check sx={{ fontSize: 18, color: 'primary.main' }} />
          </MenuItem>
        )}
        {practice &&
          (practices
            ? others.map((row) => (
                <MenuItem
                  key={row.id}
                  role="menuitemradio"
                  aria-checked="false"
                  onClick={() => switchTo(row)}
                  sx={(theme) => ({ ...itemSx(theme), py: 1 })}
                >
                  <TwoLine
                    muted
                    title={row.practice_name}
                    caption={[row.city, row.ods_code].filter(Boolean).join(' · ')}
                  />
                </MenuItem>
              ))
            : [0, 1].map((index) => (
                <Box component="li" role="presentation" key={index} sx={{ width: '100%', px: 1.5, py: 0.75 }}>
                  <Skeleton width="70%" />
                </Box>
              )))}
        {practice && (
          <MenuItem
            component={Link}
            href={`/verticals/${vertical}/practices`}
            onClick={close}
            sx={(theme) => ({ ...itemSx(theme), fontSize: 13, color: 'primary.main', minHeight: 36 })}
          >
            <ArrowBack sx={{ fontSize: 16 }} />
            All practices
          </MenuItem>
        )}

        {isAdmin && <SectionHeading>Working in</SectionHeading>}
        {isAdmin &&
          VERTICALS.map((item) => {
            const current = item.slug === vertical;
            const Icon = item.icon;
            const caption = current
              ? practices
                ? `${practices.count} practices`
                : 'Loading…'
              : item.href
                ? item.description
                : 'Coming soon';
            return (
              <MenuItem
                key={item.slug}
                role="menuitemradio"
                aria-checked={current ? 'true' : 'false'}
                disabled={!current && !item.href}
                {...(item.href && !current ? { component: Link, href: item.href } : {})}
                onClick={close}
                sx={(theme) => ({
                  ...itemSx(theme),
                  py: 1,
                  px: 1.25,
                  ...(current && { bgcolor: theme.tokens.shell.menu.selected }),
                })}
              >
                <Box
                  aria-hidden
                  sx={(theme) => {
                    const tone = theme.tokens.shell.vertical[item.slug];
                    return {
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      bgcolor: tone.bg,
                      color: tone.fg,
                    };
                  }}
                >
                  <Icon sx={{ fontSize: 17 }} />
                </Box>
                <TwoLine title={item.label} caption={caption} muted={!current} />
                {current && <Check sx={{ fontSize: 18, color: 'primary.main' }} />}
              </MenuItem>
            );
          })}
        {isAdmin && (
          <MenuItem
            component={Link}
            href="/verticals"
            onClick={close}
            sx={(theme) => ({ ...itemSx(theme), fontSize: 13, color: 'primary.main', minHeight: 36 })}
          >
            <AppsOutlined sx={{ fontSize: 16 }} />
            All verticals
          </MenuItem>
        )}

        {links.length > 0 && <SectionHeading>Quick links</SectionHeading>}
        {links.map(({ label, href, icon: Icon }) => (
          <MenuItem
            key={href}
            component={Link}
            href={href}
            onClick={close}
            sx={(theme) => ({ ...itemSx(theme), minHeight: 40, fontSize: 13.5 })}
          >
            <Icon sx={(theme) => ({ fontSize: 18, color: theme.tokens.shell.inkMuted })} />
            <Box component="span" sx={{ flex: 1 }}>
              {label}
            </Box>
            <ChevronRight sx={(theme) => ({ fontSize: 18, color: theme.tokens.shell.menu.chevron })} />
          </MenuItem>
        ))}

        <Box
          component="li"
          role="presentation"
          sx={(theme) => ({ width: '100%', mt: 0.5, borderTop: `1px solid ${theme.tokens.shell.menu.divider}` })}
        />
        {API_MODE === 'mock' && (
          <MenuItem
            className="account-foot"
            aria-expanded={demoOpen}
            onClick={() => setDemoOpen((value) => !value)}
            sx={(theme) => ({
              ...itemSx(theme),
              flex: 1,
              width: 'auto',
              mt: 0.75,
              justifyContent: 'center',
              gap: 0.75,
              minHeight: 38,
              fontSize: 13,
              borderRadius: `${theme.tokens.radius.pill}px`,
              border: `1px solid ${theme.tokens.shell.line}`,
              color: theme.tokens.shell.inkMuted,
              '&:hover, &.Mui-focusVisible': { bgcolor: theme.tokens.shell.well },
            })}
          >
            <ScienceOutlined sx={{ fontSize: 16 }} />
            Demo role
          </MenuItem>
        )}
        <MenuItem
          className="account-foot"
          onClick={logout}
          sx={(theme) => ({
            ...itemSx(theme),
            flex: 1,
            width: 'auto',
            mt: 0.75,
            justifyContent: 'center',
            gap: 0.75,
            minHeight: 38,
            fontSize: 13,
            borderRadius: `${theme.tokens.radius.pill}px`,
            border: `1px solid ${theme.tokens.shell.menu.dangerBorder}`,
            color: theme.tokens.shell.danger,
            '&:hover, &.Mui-focusVisible': { bgcolor: theme.tokens.shell.dangerHover },
          })}
        >
          <LogoutIcon sx={{ fontSize: 16 }} />
          Sign out
        </MenuItem>
        {demoOpen && <DevRoleSwitcherMenuItems onDone={close} />}
      </Menu>
    </>
  );
}
