'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccessTime from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import { DUTY_TYPE_LABELS } from '@/lib/api/rota';
import type { Shift } from '@/lib/api/types';

export const sessionOf = (start: string): 'AM' | 'PM' => (start < '12:00' ? 'AM' : 'PM');

export function formatHours(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}h ${minutes}m`;
}

const shiftHours = (shift: Shift) =>
  dayjs(`2000-01-01T${shift.end_time}`).diff(dayjs(`2000-01-01T${shift.start_time}`), 'minute') / 60;

/** Small rounded chip used inside the block. */
function Chip({ label, tone }: { label: string; tone: 'role' | 'contract' | 'practice' }) {
  return (
    <Box
      component="span"
      sx={(theme) => {
        const colours = {
          role: { border: theme.tokens.rota.roleChip.border, bg: theme.tokens.rota.roleChip.bg },
          contract: { border: 'transparent', bg: theme.tokens.rota.contractChip.bg },
          practice: { border: theme.tokens.rota.practiceChip.border, bg: theme.tokens.rota.practiceChip.bg },
        }[tone];
        return {
          display: 'block',
          maxWidth: '100%',
          px: 0.75,
          py: '1px',
          fontSize: 11,
          lineHeight: 1.5,
          borderRadius: `${theme.tokens.radius.pill}px`,
          border: `1px solid ${colours.border}`,
          bgcolor: colours.bg,
          color: 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        };
      }}
    >
      {label}
    </Box>
  );
}

/**
 * Shift card in the ROTA calendar (approved new component; design from docs/practice/06-rota-management.md):
 * white card, left bar in the session colour, name and hours, role / contract / practice chips, time.
 * `compact` keeps only the name and time, for short shifts.
 */
export function ShiftBlock({
  shift,
  compact = false,
  onClick,
}: {
  shift: Shift;
  compact?: boolean;
  onClick?: (shift: Shift) => void;
}) {
  const session = sessionOf(shift.start_time);
  const hours = formatHours(shiftHours(shift));
  const time = `${shift.start_time} - ${shift.end_time}`;
  const duty = DUTY_TYPE_LABELS[shift.duty_type];
  const label = `${dayjs(shift.date).format('ddd D MMM')}, ${time}, ${shift.staff_name}, ${shift.role_name}, ${
    shift.staff_type === 'LOCUM' ? 'Locum' : 'Salaried'
  }, ${shift.practice_name}, ${duty}`;

  return (
    <ButtonBase
      onClick={() => onClick?.(shift)}
      aria-label={label}
      sx={(theme) => ({
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        textAlign: 'left',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: `1px solid ${theme.tokens.border.medium}`,
        borderLeft: `${compact ? 6 : 12}px solid ${theme.tokens.rota.session[session]}`,
        borderRadius: `${theme.tokens.rota.shiftRadius}px`,
        p: compact ? 0.5 : 0.75,
        '&:hover': { boxShadow: theme.tokens.shadow.sm },
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
      })}
    >
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', minWidth: 0 }}>
        <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
          {shift.staff_name}
        </Typography>
        {!compact && <Typography sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }}>{hours}</Typography>}
      </Stack>
      {!compact && (
        <Stack spacing={0.4} sx={{ mt: 0.5, alignItems: 'flex-start' }}>
          <Chip label={shift.role_name} tone="role" />
          <Chip label={shift.staff_type === 'LOCUM' ? 'Locum' : 'Salaried'} tone="contract" />
          <Chip label={shift.practice_name} tone="practice" />
        </Stack>
      )}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: compact ? 0 : 0.5 }}>
        <AccessTime aria-hidden sx={{ fontSize: 12, color: 'text.secondary' }} />
        <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>
          {/* Compact blocks only have room for the start; the full time is in the accessible name. */}
          {compact ? shift.start_time : time}
        </Typography>
        <Box
          aria-hidden
          title={duty}
          sx={(theme) => ({
            width: 8,
            height: 8,
            flexShrink: 0,
            borderRadius: `${theme.tokens.rota.swatchRadius}px`,
            bgcolor: theme.tokens.dutyType[shift.duty_type],
          })}
        />
      </Stack>
    </ButtonBase>
  );
}
