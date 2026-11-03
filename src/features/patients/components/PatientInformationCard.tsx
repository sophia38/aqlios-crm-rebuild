'use client';

import { useEffect, useRef } from 'react';
import { Formik, type FormikProps } from 'formik';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import SyncDisabledOutlined from '@mui/icons-material/SyncDisabledOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { StatusChip } from '@/components/data/StatusChip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { PhoneField } from '@/components/forms/PhoneField';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { patientsApi, SEX_AT_BIRTH_OPTIONS } from '@/lib/api/patients';
import type { PatientDetail } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import {
  patientFormInput,
  patientFormSchema,
  patientFormValues,
  yesNoLabel,
  type PatientFormValues,
} from '../patientForm';
import { ReadOnlyField } from './ReadOnlyField';

type FieldName = keyof PatientFormValues;

const YES_NO = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
];

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="h3" sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mt: 1 }}>
      {children}
    </Typography>
  );
}

/**
 * Patient Information card: read-only outlined fields, switched to an edit form by Edit Details
 * (docs/plans/phase-5-practice-modules.md §1b). Save Changes sits top right of the card.
 */
export function PatientInformationCard({
  practiceId,
  patient,
  editing,
  onEditingChange,
  onSaved,
}: {
  practiceId: string;
  patient: PatientDetail;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onSaved: (patient: PatientDetail) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const cardRef = useRef<HTMLDivElement>(null);

  // Edit Details in the page header scrolls the card into view and focuses the first field.
  useEffect(() => {
    if (!editing) return;
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const timer = window.setTimeout(
      () => cardRef.current?.querySelector<HTMLInputElement>('input[name]')?.focus(),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [editing]);

  const badge = (
    <StatusChip
      status={patient.synced_with_clinical_system ? 'Synced with clinical system' : 'Not synced with clinical system'}
      tone={patient.synced_with_clinical_system ? 'success' : 'neutral'}
      icon={patient.synced_with_clinical_system ? undefined : <SyncDisabledOutlined />}
    />
  );

  if (!editing) {
    const value = (name: FieldName) => patientFormValues(patient)[name];
    return (
      <Box ref={cardRef} sx={{ scrollMarginTop: (theme) => theme.spacing(10) }}>
        <FormSectionCard
          title="Patient Information"
          actions={<Box sx={{ display: { xs: 'none', sm: 'block' } }}>{badge}</Box>}
        >
          <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>{badge}</Box>
          <Grid container spacing={2.5}>
            {(
              [
                ['First Name', value('first_name')],
                ['Middle Name', value('middle_name')],
                ['Last Name', value('last_name')],
                ['Date of Birth', formatDate(patient.date_of_birth)],
                ['Sex at Birth', value('sex_at_birth')],
                ['Ethnicity', value('ethnicity')],
                ['Phone Number', value('phone_number')],
                ['Email Address', value('email')],
                ['Spoken Language', value('spoken_language')],
                ['Do you need an interpreter?', yesNoLabel(patient.needs_interpreter)],
                ['Interpreter', value('interpreter_language')],
                ['Do you need transport assistance?', yesNoLabel(patient.needs_transport)],
              ] as const
            ).map(([label, text]) => (
              <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
                <ReadOnlyField label={label} value={text} />
              </Grid>
            ))}
            <Grid size={12}>
              <SubHeading>Address</SubHeading>
            </Grid>
            {(
              [
                ['Street Address', value('street_address')],
                ['Address Line 2', value('address_line_2')],
                ['City', value('city')],
                ['Post Code', value('post_code')],
              ] as const
            ).map(([label, text]) => (
              <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                <ReadOnlyField label={label} value={text} />
              </Grid>
            ))}
          </Grid>
        </FormSectionCard>
      </Box>
    );
  }

  return (
    <Formik<PatientFormValues>
      initialValues={patientFormValues(patient)}
      validationSchema={patientFormSchema}
      onSubmit={async (values) => {
        try {
          const saved = await patientsApi.update(PUBLIC_SUB_APP_ID, practiceId, patient.id, patientFormInput(values));
          enqueueSnackbar('Patient details updated', { variant: 'success' });
          onSaved(saved);
          onEditingChange(false);
        } catch {
          enqueueSnackbar('Failed to update the patient details', { variant: 'error' });
        }
      }}
    >
      {(formik) => <EditForm formik={formik} cardRef={cardRef} badge={badge} onCancel={() => onEditingChange(false)} />}
    </Formik>
  );
}

function EditForm({
  formik,
  cardRef,
  badge,
  onCancel,
}: {
  formik: FormikProps<PatientFormValues>;
  cardRef: React.RefObject<HTMLDivElement | null>;
  badge: React.ReactNode;
  onCancel: () => void;
}) {
  const error = (name: FieldName) => (formik.touched[name] && formik.errors[name]) || undefined;
  const text = (name: FieldName, label: string, required = false) => (
    <TextField
      fullWidth
      label={label}
      required={required}
      {...formik.getFieldProps(name)}
      error={Boolean(error(name))}
      helperText={error(name)}
    />
  );
  const select = (name: FieldName, label: string, options: { value: string; label: string }[], required = false) => (
    <TextField
      select
      fullWidth
      label={label}
      required={required}
      {...formik.getFieldProps(name)}
      error={Boolean(error(name))}
      helperText={error(name)}
    >
      {!required && (
        <MenuItem value="">
          <em>Not recorded</em>
        </MenuItem>
      )}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box
      ref={cardRef}
      sx={{ scrollMarginTop: (theme) => theme.spacing(10) }}
      component="form"
      noValidate
      onSubmit={formik.handleSubmit}
      aria-label="Edit patient details"
    >
      <FormSectionCard
        title="Patient Information"
        hasError={formik.submitCount > 0 && !formik.isValid}
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>{badge}</Box>
            <Button variant="outlined" size="small" onClick={onCancel} disabled={formik.isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="brand"
              size="small"
              startIcon={<SaveOutlined />}
              loading={formik.isSubmitting}
              disabled={!formik.dirty}
            >
              Save Changes
            </Button>
          </Stack>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>{text('first_name', 'First Name', true)}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>{text('middle_name', 'Middle Name')}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>{text('last_name', 'Last Name', true)}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DatePicker
              label="Date of Birth"
              format="DD/MM/YYYY"
              disableFuture
              value={formik.values.date_of_birth ? dayjs(formik.values.date_of_birth) : null}
              onChange={(next) =>
                formik.setFieldValue('date_of_birth', next?.isValid() ? next.format('YYYY-MM-DD') : '', true)
              }
              slotProps={{
                textField: {
                  name: 'date_of_birth',
                  required: true,
                  fullWidth: true,
                  onBlur: () => formik.setFieldTouched('date_of_birth', true),
                  error: Boolean(error('date_of_birth')),
                  helperText: error('date_of_birth'),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {select(
              'sex_at_birth',
              'Sex at Birth',
              SEX_AT_BIRTH_OPTIONS.map((option) => ({ value: option, label: option })),
              true,
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>{text('ethnicity', 'Ethnicity')}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <PhoneField
              name="phone_number"
              label="Phone Number"
              required
              value={formik.values.phone_number}
              onChange={(next) => formik.setFieldValue('phone_number', next)}
              onBlur={() => formik.setFieldTouched('phone_number', true)}
              error={Boolean(error('phone_number'))}
              helperText={error('phone_number')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>{text('email', 'Email Address')}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>{text('spoken_language', 'Spoken Language')}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {select('needs_interpreter', 'Do you need an interpreter?', YES_NO)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {formik.values.needs_interpreter === 'YES' ? (
              text('interpreter_language', 'Interpreter', true)
            ) : (
              <ReadOnlyField label="Interpreter" value="" />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {select('needs_transport', 'Do you need transport assistance?', YES_NO)}
          </Grid>
          <Grid size={12}>
            <SubHeading>Address</SubHeading>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>{text('street_address', 'Street Address')}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>{text('address_line_2', 'Address Line 2')}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>{text('city', 'City')}</Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>{text('post_code', 'Post Code')}</Grid>
        </Grid>
      </FormSectionCard>
    </Box>
  );
}
