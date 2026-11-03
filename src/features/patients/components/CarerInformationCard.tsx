import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { StatusChip } from '@/components/data/StatusChip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { formatNhsNumber } from '@/lib/api/patients';
import type { PatientCarer } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { ReadOnlyField } from './ReadOnlyField';

/** Carer Information card: read-only, with the Carer Verified badge (docs/practice/01-patients.md §2). */
export function CarerInformationCard({ carer }: { carer: PatientCarer | null }) {
  return (
    <FormSectionCard
      title="Carer Information"
      actions={
        carer && (
          <StatusChip
            status={carer.verified ? 'Carer Verified' : 'Carer Not Verified'}
            tone={carer.verified ? 'secondary' : 'warning'}
          />
        )
      }
    >
      {carer ? (
        <Grid container spacing={2.5}>
          {(
            [
              ['First Name', carer.first_name],
              ['Middle Name', carer.middle_name],
              ['Last Name', carer.last_name],
              ['Date of Birth', carer.date_of_birth ? formatDate(carer.date_of_birth) : ''],
              ['Sex at Birth', carer.sex_at_birth],
              ['Ethnicity', carer.ethnicity],
              ['NHS Number', formatNhsNumber(carer.nhs_number)],
              ['Address', carer.address],
              ['Relationship to Patient', carer.relationship],
              ['Phone Number', carer.phone_number],
              ['Email Address', carer.email],
            ] as const
          ).map(([label, value]) => (
            <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
              <ReadOnlyField label={label} value={value} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
          No carer recorded for this patient.
        </Typography>
      )}
    </FormSectionCard>
  );
}
