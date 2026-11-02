'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { StatusChip } from '@/components/data/StatusChip';
import { DUTY_TYPE_LABELS } from '@/lib/api/rota';
import type { StaffActivity } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

const STATUS: Record<StaffActivity['status'], string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
};

/** Staff activity summary: name, date, status chip, label/value rows (COMPONENTS.md → ActivityCard). */
export function ActivityCard({ record, showPractice = true }: { record: StaffActivity; showPractice?: boolean }) {
  const theme = useTheme();
  const tone = { ACTIVE: 'success', INACTIVE: 'warning', ON_LEAVE: 'secondary' } as const;
  const row = (label: string, value: React.ReactNode) => (
    <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
      <Typography sx={{ width: 140, flexShrink: 0, fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography component="div" sx={{ fontSize: 13, color: 'text.primary' }}>
        {value}
      </Typography>
    </Stack>
  );
  return (
    <Box
      component="article"
      aria-label={`${record.staff_name} - ${record.staff_code}`}
      sx={{ p: 2, border: `1px solid ${theme.tokens.border.medium}`, borderRadius: `${theme.tokens.radius.input}px` }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography component="h3" sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            {record.staff_name} - {record.staff_code}
          </Typography>
          <Typography variant="caption">{formatDate(record.date)}</Typography>
        </Box>
        <StatusChip status={STATUS[record.status]} tone={tone[record.status]} variant="outlined" />
      </Stack>
      {showPractice && row('Practice Name', record.practice_name)}
      {row(
        'Duty Type',
        record.status === 'ON_LEAVE' ? (
          '-'
        ) : (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box
              aria-hidden
              sx={{
                width: 10,
                height: 10,
                borderRadius: `${theme.tokens.rota.swatchRadius}px`,
                bgcolor: theme.tokens.dutyType[record.duty_type],
              }}
            />
            <span>{DUTY_TYPE_LABELS[record.duty_type]}</span>
          </Stack>
        ),
      )}
      {row('Login Time', record.login_time ?? '-')}
      {row('Logout Time', record.logout_time ?? '-')}
      {row('Allocated Hours', record.allocated_hours ? `${record.allocated_hours}h` : '-')}
    </Box>
  );
}
