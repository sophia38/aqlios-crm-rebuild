import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Flag from '@mui/icons-material/Flag';
import type { TicketUrgency } from '@/lib/api/types';

/** The Severity column: a flag with "Urgent" (red) or "Routine" (grey), as captured. */
export function SeverityFlag({ urgency }: { urgency: TicketUrgency }) {
  const theme = useTheme();
  const urgent = urgency === 'URGENT';
  const label = urgent ? 'Urgent' : 'Routine';
  return (
    <Tooltip title={label} describeChild>
      <Flag
        titleAccess={label}
        sx={{ fontSize: 20, color: urgent ? theme.tokens.tone.error.main : theme.tokens.neutral[350] }}
      />
    </Tooltip>
  );
}
