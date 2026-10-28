'use client';

import Box from '@mui/material/Box';
import { alpha, useTheme, type Theme } from '@mui/material/styles';

// One status → one colour across the app (the live app colours the same status differently per page).
type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary';

const STATUS_TONES: Record<string, Tone> = {
  active: 'success',
  approved: 'success',
  verified: 'success',
  compliant: 'success',
  completed: 'success',
  inactive: 'warning',
  pending: 'warning',
  'pending approval': 'warning',
  'pending invite': 'warning',
  'pending upload': 'warning',
  'reverification due': 'warning',
  'pending verification': 'info',
  'awaiting verification': 'info',
  'reschedule requested': 'info',
  rejected: 'error',
  expired: 'error',
  'invitation expired': 'error',
  'resent invite': 'error',
  locked: 'error',
  cancelled: 'error',
  'cancelled by patient': 'error',
  dna: 'error',
  draft: 'neutral',
  archived: 'neutral',
};

function toneColor(theme: Theme, tone: Tone) {
  switch (tone) {
    case 'success':
      return theme.tokens.tone.success.main;
    case 'warning':
      return theme.tokens.tone.warning.main;
    case 'error':
      return theme.tokens.tone.error.main;
    case 'info':
      return theme.tokens.tone.info.main;
    case 'secondary':
      return theme.tokens.tone.secondary.main;
    case 'primary':
      return theme.palette.primary.main;
    default:
      return theme.tokens.neutral[500];
  }
}

export interface StatusChipProps {
  status: string;
  /** Overrides the colour picked from the status text. */
  tone?: Tone;
  /** `soft`: tinted background (default). `outlined`: tinted border on a faint background. */
  variant?: 'soft' | 'outlined';
  icon?: React.ReactNode;
  size?: 'small' | 'medium';
}

/** Small pill status (COMPONENTS.md → StatusChip). Shows "—" for an empty status. */
export function StatusChip({ status, tone, variant = 'soft', icon, size = 'small' }: StatusChipProps) {
  const theme = useTheme();
  const label = status.trim() || '—';
  const color = toneColor(theme, tone ?? STATUS_TONES[label.toLowerCase()] ?? 'neutral');
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        height: size === 'small' ? 24 : 28,
        px: 1.25,
        borderRadius: `${theme.tokens.radius.pill}px`,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        color,
        bgcolor: alpha(color, variant === 'soft' ? 0.12 : 0.04),
        border: `1px solid ${variant === 'soft' ? 'transparent' : alpha(color, 0.5)}`,
        '& svg': { fontSize: 14 },
      }}
    >
      {icon}
      {label}
    </Box>
  );
}
