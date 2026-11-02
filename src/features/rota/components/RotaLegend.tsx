'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { DUTY_TYPE_LABELS } from '@/lib/api/rota';
import type { DutyType } from '@/lib/api/types';

/** Session, duty type and gap legend with small colour squares (COMPONENTS.md → RotaLegend). */
export function RotaLegend() {
  const theme = useTheme();
  const { rota, dutyType } = theme.tokens;
  const groups: { title: string; dashed?: boolean; items: { label: string; color: string }[] }[] = [
    {
      title: 'Session type',
      items: [
        { label: 'AM', color: rota.session.AM },
        { label: 'PM', color: rota.session.PM },
      ],
    },
    {
      title: 'Duty type',
      items: (Object.keys(DUTY_TYPE_LABELS) as DutyType[]).map((key) => ({
        label: DUTY_TYPE_LABELS[key],
        color: dutyType[key],
      })),
    },
    {
      title: 'Gaps',
      dashed: true,
      items: [
        { label: 'Leave-created', color: rota.gap.leave },
        { label: 'Published', color: rota.gap.published },
        { label: 'Holidays', color: rota.gap.holiday },
        { label: 'Unallocated', color: rota.gap.unallocated },
      ],
    },
  ];

  return (
    <Stack
      component="ul"
      aria-label="Legend"
      direction="row"
      sx={{ listStyle: 'none', m: 0, p: 0, flexWrap: 'wrap', columnGap: 3, rowGap: 1 }}
    >
      {groups.map((group) => (
        <Box
          component="li"
          key={group.title}
          sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {group.title}
          </Typography>
          {group.items.map((item) => (
            <Box key={item.label} component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                component="span"
                aria-hidden
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: `${rota.swatchRadius}px`,
                  ...(group.dashed ? { border: `2px dashed ${item.color}` } : { bgcolor: item.color }),
                }}
              />
              <Typography component="span" sx={{ fontSize: 12 }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      ))}
    </Stack>
  );
}
