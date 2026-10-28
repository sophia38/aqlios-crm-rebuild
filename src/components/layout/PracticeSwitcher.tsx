'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Check from '@mui/icons-material/Check';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import Logout from '@mui/icons-material/Logout';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { signOut } from '@/store/sessionSlice';
import { useAppDispatch } from '@/store';

/**
 * Top-bar pill with the current practice: menu with the practice, Switch Practice and Logout
 * (docs/practice/00-practice-shell-and-module-map.md; approved new component).
 */
export function PracticeSwitcher({ practiceName, practicesHref }: { practiceName: string; practicesHref: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const open = Boolean(anchor);
  const close = () => setAnchor(null);

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        aria-controls={open ? menuId : undefined}
        aria-label={`Current practice: ${practiceName}. Switch practice`}
        sx={(theme) => ({
          gap: 1,
          maxWidth: { xs: 140, sm: 280 },
          px: 2,
          py: 1,
          borderRadius: `${theme.tokens.radius.pill}px`,
          bgcolor: 'background.paper',
          boxShadow: theme.tokens.shadow.sm,
          border: `1px solid ${theme.tokens.border.subtle}`,
        })}
      >
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
          {practiceName}
        </Typography>
        {open ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
      </ButtonBase>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 240 } } }}
      >
        <MenuItem selected onClick={close}>
          <ListItemIcon>
            <Check fontSize="small" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { noWrap: true } }}>{practiceName}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem component={Link} href={practicesHref} onClick={close}>
          <ListItemIcon>
            <SwapHoriz fontSize="small" />
          </ListItemIcon>
          <ListItemText>Switch Practice</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={async () => {
            close();
            await dispatch(signOut());
            router.replace('/auth/login');
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
