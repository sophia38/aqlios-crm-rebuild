'use client';

import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import type { PatientDetail } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { yesNoLabel } from '../patientForm';
import { ConsultationList, type ConsultationsState } from './MedicalRequestsPanel';
import { MedicationList } from './MedicationList';
import { ReadOnlyField } from './ReadOnlyField';

export type ProfileTab = 'overview' | 'details' | 'carer' | 'contact' | 'requests' | 'notes';

const RECENT = 3;

function ViewAll({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="small" endIcon={<ChevronRight />} onClick={onClick} aria-label={`View all ${label}`}>
      View all
    </Button>
  );
}

/**
 * Overview tab of the patient profile: a summary of each section in one column, each linking to its tab
 * (docs/practice/01-patients.md §2, tabbed variation).
 */
export function PatientOverview({
  patient,
  consultations,
  readOnly,
  onOpen,
  onAddNote,
}: {
  patient: PatientDetail;
  consultations: ConsultationsState;
  readOnly: boolean;
  onOpen: (tab: ProfileTab) => void;
  onAddNote: () => void;
}) {
  const { address } = patient;
  const fullAddress = [address.street_address, address.address_line_2, address.city, address.post_code]
    .filter((part) => part.trim())
    .join(', ');
  const latest = patient.notes[0];
  const ongoing = patient.medications.filter((medication) => medication.status === 'ONGOING');

  return (
    <Stack spacing={2}>
      <FormSectionCard
        title="Patient Information"
        collapsible={false}
        actions={<ViewAll label="patient information" onClick={() => onOpen('details')} />}
      >
        <Grid container component="dl" columnSpacing={3.5} sx={{ m: 0 }}>
          {(
            [
              ['Date of Birth', formatDate(patient.date_of_birth)],
              ['Sex at Birth', patient.sex_at_birth],
              ['Ethnicity', patient.ethnicity],
              ['Spoken Language', patient.spoken_language],
              ['Do you need an interpreter?', yesNoLabel(patient.needs_interpreter)],
              ['Do you need transport assistance?', yesNoLabel(patient.needs_transport)],
              ['Phone Number', patient.phone_number],
              ['Address', fullAddress],
            ] as const
          ).map(([label, value]) => (
            <Grid key={label} size={{ xs: 12, sm: 6 }}>
              <ReadOnlyField label={label} value={value} variant="text" />
            </Grid>
          ))}
        </Grid>
      </FormSectionCard>

      <FormSectionCard
        title="Recent Consultations"
        collapsible={false}
        actions={<ViewAll label="consultations" onClick={() => onOpen('requests')} />}
      >
        <ConsultationList state={consultations} limit={RECENT} />
      </FormSectionCard>

      <FormSectionCard
        title="Medications"
        collapsible={false}
        actions={<ViewAll label="medications" onClick={() => onOpen('requests')} />}
      >
        {/* Ongoing ones only; finished courses are on the Medical Requests tab. */}
        <MedicationList medications={ongoing.slice(0, RECENT)} />
      </FormSectionCard>

      <FormSectionCard
        title="Latest Note"
        collapsible={false}
        actions={
          !readOnly && (
            <Button variant="contained" color="brand" size="small" startIcon={<AddCircleOutline />} onClick={onAddNote}>
              Add Note
            </Button>
          )
        }
      >
        {latest ? (
          <Box
            component="article"
            aria-label={`Note by ${latest.added_by_name}`}
            sx={(theme) => ({
              p: 2,
              borderRadius: `${theme.tokens.radius.input}px`,
              bgcolor: theme.tokens.patient.noteBg,
              border: `1px solid ${theme.tokens.patient.noteBorder}`,
            })}
          >
            <Typography sx={{ fontSize: 14, color: 'text.primary', whiteSpace: 'pre-wrap' }}>{latest.text}</Typography>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1.5, gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption">Added By: {latest.added_by_name}</Typography>
              <Typography variant="caption">{dayjs(latest.created_at).format('DD/MM/YYYY HH:mm')}</Typography>
            </Stack>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
            No notes yet.
          </Typography>
        )}
      </FormSectionCard>
    </Stack>
  );
}
