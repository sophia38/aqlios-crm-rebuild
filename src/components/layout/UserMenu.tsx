'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import { DevRoleSwitcherMenuItems } from '@/components/dev/DevRoleSwitcher';
import { signOut } from '@/store/sessionSlice';
import { selectSession, useAppDispatch, useAppSelector } from '@/store';

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
}

/** Header user pill: initials avatar, name, role and chevron, opening the account menu (COMPONENTS.md → UserMenu). */
export function UserMenu() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector(selectSession);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const close = () => setAnchor(null);

  const logout = async () => {
    close();
    await dispatch(signOut());
    router.replace('/auth/login');
  };

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={anchor ? 'true' : undefined}
        aria-controls={anchor ? menuId : undefined}
        aria-label={`Account menu for ${fullName}`}
        sx={(theme) => ({
          gap: 1.25,
          py: 0.75,
          pl: 0.75,
          pr: 1.5,
          borderRadius: `${theme.tokens.radius.pill}px`,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.tokens.userPill.border}`,
          boxShadow: theme.tokens.shadow.sm,
        })}
      >
        <Avatar
          sx={(theme) => ({
            width: 36,
            height: 36,
            fontSize: '0.875rem',
            fontWeight: 600,
            bgcolor: theme.tokens.userPill.avatarBg,
            color: theme.tokens.userPill.avatarText,
          })}
        >
          {initials(user.firstName, user.lastName)}
        </Avatar>
        <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
            {fullName}
          </Typography>
          {/* Practice users have an empty role in /api/auth/me; the live app shows "Actions" there (a bug). */}
          {user.role && (
            <Typography variant="caption" component="p" sx={{ lineHeight: 1.3 }}>
              {user.role}
            </Typography>
          )}
        </Box>
        <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      </ButtonBase>

      <Menu
        id={menuId}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 260 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {fullName}
          </Typography>
          <Typography variant="caption" component="p">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
        <DevRoleSwitcherMenuItems onDone={close} />
      </Menu>
    </>
  );
}
