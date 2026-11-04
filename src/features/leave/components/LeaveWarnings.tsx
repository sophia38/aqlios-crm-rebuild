'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import EventBusy from '@mui/icons-material/EventBusyOutlined';
import WarningAmber from '@mui/icons-material/WarningAmberOutlined';
import type { LeaveWarning } from '@/lib/api/types';

/** Rota clashes and low balance on a pending request ("—" when there are none, as captured). */
export function LeaveWarnings({ warnings }: { warnings: LeaveWarning[] }) {
  if (!warnings.length) return <>—</>;
  return (
    <Stack spacing={0.5} component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {warnings.map((warning) => (
        <Stack
          key={warning.kind}
          component="li"
          direction="row"
          spacing={0.5}
          sx={(theme) => ({ alignItems: 'flex-start', color: theme.tokens.tone.warning.main })}
        >
          {warning.kind === 'ROTA_CLASH' ? (
            <EventBusy sx={{ fontSize: 16, mt: '2px' }} aria-hidden />
          ) : (
            <WarningAmber sx={{ fontSize: 16, mt: '2px' }} aria-hidden />
          )}
          <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 500 }}>
            {warning.message}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
