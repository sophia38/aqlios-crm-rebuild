import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { StatusChip } from '@/components/data/StatusChip';
import type { PatientMedication } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

/**
 * A patient's prescriptions: name, how to take it, quantity and last issued date, with an outlined Ongoing or
 * Completed pill on the right (COMPONENTS.md → MedicationList).
 */
export function MedicationList({ medications }: { medications: PatientMedication[] }) {
  if (medications.length === 0) {
    return (
      <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
        No medications found.
      </Typography>
    );
  }
  return (
    <Stack component="ul" spacing={1.25} aria-label="Medications" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {medications.map((medication) => (
        <Stack
          key={medication.id}
          component="li"
          direction="row"
          spacing={2}
          sx={(theme) => ({
            alignItems: 'center',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            rowGap: 1,
            px: 2,
            py: 1.75,
            borderRadius: `${theme.tokens.radius.input}px`,
            border: `1px solid ${theme.tokens.shell.line}`,
            bgcolor: 'background.paper',
          })}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={(theme) => ({ fontSize: 15, fontWeight: 500, color: theme.tokens.shell.ink })}>
              {medication.name}
            </Typography>
            <Typography sx={(theme) => ({ fontSize: 14, color: theme.tokens.shell.inkMuted, mt: 0.25 })}>
              {medication.instructions}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              {medication.quantity} · Last issued {formatDate(medication.last_issued)}
            </Typography>
          </Box>
          <StatusChip
            status={medication.status === 'ONGOING' ? 'Ongoing' : 'Completed'}
            tone={medication.status === 'ONGOING' ? 'info' : 'neutral'}
            variant="outlined"
            size="medium"
          />
        </Stack>
      ))}
    </Stack>
  );
}
