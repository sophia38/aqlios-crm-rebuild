'use client';

import { useState } from 'react';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CheckIcon from '@mui/icons-material/Check';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useSnackbar } from 'notistack';
import { API_MODE } from '@/lib/api/config';
import { DEMO_PERSONAS, mockApi, type DemoPersona } from '@/lib/api/mock';
import { fetchSession } from '@/store/sessionSlice';
import { selectSession, useAppDispatch, useAppSelector } from '@/store';

/** Which demo persona is active, derived from the session user. */
function usePersona(): DemoPersona {
  const { user } = useAppSelector(selectSession);
  return user && !user.isAdmin ? 'practice-user' : 'super-admin';
}

/**
 * Dev-only: lets reviewers switch between the demo roles and reset the demo data.
 * Renders nothing in live mode (REBUILD-PLAN.md §2, approved new component).
 */
export function DevRoleSwitcherSelect({
  value,
  onChange,
}: {
  value: DemoPersona;
  onChange: (persona: DemoPersona) => void;
}) {
  if (API_MODE !== 'mock') return null;
  return (
    <TextField
      select
      size="small"
      label="Sign in as"
      value={value}
      onChange={(event) => onChange(event.target.value as DemoPersona)}
    >
      {DEMO_PERSONAS.map((persona) => (
        <MenuItem key={persona.id} value={persona.id}>
          {persona.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

/** Menu section for UserMenu: role switch and data reset. */
export function DevRoleSwitcherMenuItems({ onDone }: { onDone: () => void }) {
  const dispatch = useAppDispatch();
  const current = usePersona();
  const { enqueueSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);

  if (API_MODE !== 'mock') return null;

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await action();
      await dispatch(fetchSession());
      enqueueSnackbar(success, { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to update demo data', { variant: 'error' });
    } finally {
      setBusy(false);
      onDone();
    }
  };

  return [
    <Divider key="divider" />,
    <ListSubheader key="header" sx={{ lineHeight: 2.5 }}>
      Demo
    </ListSubheader>,
    ...DEMO_PERSONAS.map((persona) => (
      <MenuItem
        key={persona.id}
        disabled={busy}
        selected={persona.id === current}
        onClick={() => run(() => mockApi.setPersona(persona.id), `Switched to ${persona.label}`)}
      >
        <ListItemIcon>{persona.id === current && <CheckIcon fontSize="small" />}</ListItemIcon>
        <ListItemText>{persona.label}</ListItemText>
      </MenuItem>
    )),
    <MenuItem key="reset" disabled={busy} onClick={() => run(mockApi.reset, 'Demo data reset')}>
      <ListItemIcon />
      <ListItemText>Reset demo data</ListItemText>
    </MenuItem>,
  ];
}
