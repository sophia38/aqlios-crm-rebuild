'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const hoursText = (hours: number) => `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;

/**
 * Practice or staff card in the ROTA side panel: title, hours, optional role chip and the weekly
 * capacity bar (COMPONENTS.md → CapacityCard).
 */
export function CapacityCard({
  title,
  subtitle,
  icon,
  chip,
  assigned,
  total,
  selected,
  onSelect,
}: {
  title: string;
  /** e.g. opening hours "08:00 - 18:30". */
  subtitle: string;
  icon?: React.ReactNode;
  chip?: string;
  assigned: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const remaining = Math.max(0, total - assigned);
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      sx={(theme) => ({
        width: '100%',
        display: 'block',
        textAlign: 'left',
        p: 1.25,
        borderRadius: `${theme.tokens.radius.input}px`,
        border: `1px solid ${selected ? theme.palette.primary.main : theme.tokens.border.medium}`,
        bgcolor: selected ? theme.tokens.surface.tealLight : 'background.paper',
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
        {icon && (
          <Box aria-hidden sx={{ display: 'flex', color: 'primary.main' }}>
            {icon}
          </Box>
        )}
        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', minWidth: 0 }}>
          {title}
        </Typography>
      </Stack>
      {chip && (
        <Box
          component="span"
          sx={(theme) => ({
            display: 'inline-block',
            mt: 0.5,
            px: 1,
            fontSize: 11,
            borderRadius: `${theme.tokens.radius.pill}px`,
            border: `1px solid ${theme.tokens.rota.roleChip.border}`,
            color: 'primary.main',
          })}
        >
          {chip}
        </Box>
      )}
      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{subtitle}</Typography>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.75 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Weekly Capacity</Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.primary' }}>
          {hoursText(remaining)} remaining
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={total ? Math.min(100, (assigned / total) * 100) : 0}
        aria-label={`${title} weekly capacity`}
        sx={(theme) => ({ my: 0.5, height: 4, borderRadius: `${theme.tokens.radius.pill}px` })}
      />
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{hoursText(assigned)} assigned</Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{hoursText(total)} total</Typography>
      </Stack>
    </ButtonBase>
  );
}
