'use client';

import { useId, useState } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import LayersOutlined from '@mui/icons-material/LayersOutlined';
import MedicalServicesOutlined from '@mui/icons-material/MedicalServicesOutlined';
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

const PERSONA_CARDS: Record<DemoPersona, { icon: SvgIconComponent; blurb: string }> = {
  'super-admin': { icon: LayersOutlined, blurb: 'Oversee every practice in Public Primary Care' },
  'practice-user': { icon: MedicalServicesOutlined, blurb: "See your practice's patients, rota and leave" },
};

/**
 * Login variant of the role choice: the refined prototype's radio cards (one per demo persona).
 * Native radios, so arrow keys move between them. Renders nothing in live mode.
 */
export function DevRoleCards({ value, onChange }: { value: DemoPersona; onChange: (persona: DemoPersona) => void }) {
  const id = useId();
  if (API_MODE !== 'mock') return null;
  return (
    <RadioGroup
      aria-label="Sign in as"
      value={value}
      onChange={(event) => onChange(event.target.value as DemoPersona)}
      sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}
    >
      {DEMO_PERSONAS.map((persona) => {
        const { icon: Icon, blurb } = PERSONA_CARDS[persona.id];
        const selected = persona.id === value;
        return (
          <Box
            key={persona.id}
            component="label"
            sx={(theme) => ({
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              p: selected ? '11px' : 1.5,
              borderRadius: `${theme.tokens.radius.roleCard}px`,
              border: selected
                ? `2px solid ${theme.palette.primary.main}`
                : `1px solid ${theme.tokens.shell.login.roleBorder}`,
              bgcolor: selected ? theme.tokens.shell.login.roleSelectedBg : 'background.paper',
              cursor: 'pointer',
              transition: theme.transitions.create(['border-color', 'background-color']),
              '&:hover': { borderColor: selected ? 'primary.main' : theme.tokens.shell.login.roleHover },
              '&:has(.Mui-focusVisible)': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
            })}
          >
            <Box
              aria-hidden
              sx={(theme) => ({
                width: 34,
                height: 34,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: `${theme.tokens.radius.iconTile}px`,
                bgcolor: selected ? 'primary.main' : theme.tokens.shell.login.roleIconBg,
                color: selected ? 'primary.contrastText' : 'primary.main',
              })}
            >
              <Icon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ minWidth: 0, pr: 2.5 }}>
              <Typography component="span" variant="subtitle2" sx={{ display: 'block', fontWeight: 500 }}>
                {persona.label}
              </Typography>
              <Typography id={`${id}-${persona.id}`} component="span" variant="caption" sx={{ display: 'block' }}>
                {blurb}
              </Typography>
            </Box>
            <Radio
              value={persona.id}
              size="small"
              slotProps={{
                input: { 'aria-label': persona.label, 'aria-describedby': `${id}-${persona.id}` },
              }}
              sx={{ position: 'absolute', top: 2, right: 2 }}
            />
          </Box>
        );
      })}
    </RadioGroup>
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
