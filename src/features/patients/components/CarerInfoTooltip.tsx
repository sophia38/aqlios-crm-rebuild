'use client';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { LabelValueList } from '@/components/data/LabelValueList';
import { ageFrom, formatNhsNumber, patientName } from '@/lib/api/patients';
import type { PatientCarer } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

/** The Carer column: name plus ⓘ with the captured "Carer Information" tooltip (also opens on focus). */
export function CarerInfoTooltip({ carer }: { carer: PatientCarer }) {
  const name = patientName(carer);
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
      {name}
      <Tooltip
        arrow
        slotProps={{ tooltip: { sx: { maxWidth: 340, p: 1.5 } } }}
        title={
          <>
            <Typography component="p" sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Carer Information
            </Typography>
            <LabelValueList
              tone="inverse"
              dense
              labelWidth={90}
              items={[
                { label: 'Name', value: name },
                { label: 'NHS No', value: formatNhsNumber(carer.nhs_number) },
                { label: 'DOB', value: carer.date_of_birth ? formatDate(carer.date_of_birth) : '' },
                { label: 'Age', value: carer.date_of_birth ? ageFrom(carer.date_of_birth) : '' },
                { label: 'Sex', value: carer.sex_at_birth },
                { label: 'Ethnicity', value: carer.ethnicity },
                { label: 'Email', value: carer.email },
                { label: 'Phone', value: carer.phone_number },
                { label: 'Address', value: carer.address },
                { label: 'Relationship', value: carer.relationship },
              ]}
            />
          </>
        }
      >
        <IconButton size="small" aria-label={`Carer information for ${name}`} sx={{ color: 'secondary.main', p: 0.25 }}>
          <InfoOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
