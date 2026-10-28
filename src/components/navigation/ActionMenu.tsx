'use client';

import { useId, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVert from '@mui/icons-material/MoreVert';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  /** `danger` items are red, `warning` items orange (as in the Template Library menus). */
  tone?: 'default' | 'warning' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}

/** ⋮ icon button opening a menu of icon + label items (COMPONENTS.md → ActionMenu). */
export function ActionMenu({ items, 'aria-label': ariaLabel }: { items: ActionMenuItem[]; 'aria-label': string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={anchor ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: (theme) => ({ minWidth: 200, boxShadow: theme.tokens.shadow.menu }) } }}
      >
        {items.map((item) => {
          const color =
            item.tone === 'danger' ? 'error.main' : item.tone === 'warning' ? 'warning.main' : 'text.primary';
          return (
            <MenuItem
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                close();
                item.onClick();
              }}
              sx={{ color }}
            >
              {item.icon && <ListItemIcon sx={{ color }}>{item.icon}</ListItemIcon>}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
