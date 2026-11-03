import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import CheckCircle from '@mui/icons-material/CheckCircle';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { Ticket } from '@/lib/api/types';

/** "—" when nobody is recommended, name + ⓘ when recommended, green name + ✅ when assigned (captured). */
export function RecommendedStaffCell({ ticket }: { ticket: Ticket }) {
  const theme = useTheme();
  const staff = ticket.assigned_staff ?? ticket.recommended_staff;
  if (!staff) return <Box component="span">—</Box>;
  const assigned = Boolean(ticket.assigned_staff);
  const label = assigned ? 'Assigned Staff' : 'Recommended Staff';
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        whiteSpace: 'nowrap',
        color: assigned ? theme.tokens.tone.success.main : 'text.primary',
        fontWeight: assigned ? 500 : 400,
      }}
    >
      {staff.name}
      <Tooltip title={label} describeChild>
        {assigned ? (
          <CheckCircle titleAccess={label} sx={{ fontSize: 16 }} />
        ) : (
          <InfoOutlined titleAccess={label} sx={{ fontSize: 16, color: 'text.secondary' }} />
        )}
      </Tooltip>
    </Box>
  );
}
