'use client';

import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { formatNhsNumber, patientsApi, REGISTRATION_STATUS_LABELS, REGISTRATION_TYPE_LABELS } from '@/lib/api/patients';
import {
  REGISTRATION_STATUSES,
  REGISTRATION_TYPES,
  type PatientDetail,
  type RegistrationStatus,
  type RegistrationType,
} from '@/lib/api/types';

const schema = Yup.object({
  registration_type: Yup.string().required('Registration type is required'),
  registration_status: Yup.string().required('Registration status is required'),
  nhs_number: Yup.string().test(
    'nhs',
    'Enter a valid NHS number',
    (value) => !value?.trim() || value.replace(/\D/g, '').length === 10,
  ),
});

/** Manage Registration card: type, status and NHS number with Save Status (docs/practice/01-patients.md §2). */
export function ManageRegistrationCard({
  practiceId,
  patient,
  readOnly,
  onSaved,
}: {
  practiceId: string;
  patient: PatientDetail;
  readOnly: boolean;
  onSaved: (patient: PatientDetail) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const initialValues = {
    registration_type: patient.registration_type as RegistrationType,
    registration_status: patient.registration_status as RegistrationStatus,
    nhs_number: formatNhsNumber(patient.nhs_number),
  };

  return (
    <Formik
      // A new version of the patient (e.g. after Deregister) resets the form.
      key={`${patient.registration_type}:${patient.registration_status}:${patient.nhs_number}`}
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values) => {
        try {
          const saved = await patientsApi.update(PUBLIC_SUB_APP_ID, practiceId, patient.id, {
            registration_type: values.registration_type,
            registration_status: values.registration_status,
            nhs_number: values.nhs_number.replace(/\D/g, ''),
          });
          enqueueSnackbar('Registration status saved', { variant: 'success' });
          onSaved(saved);
        } catch {
          enqueueSnackbar('Failed to save the registration status', { variant: 'error' });
        }
      }}
    >
      {(formik) => (
        <FormSectionCard title="Manage Registration">
          <Box component="form" noValidate onSubmit={formik.handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Registration Type"
                  {...formik.getFieldProps('registration_type')}
                  disabled={readOnly}
                >
                  {REGISTRATION_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {REGISTRATION_TYPE_LABELS[type]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Registration Status"
                  {...formik.getFieldProps('registration_status')}
                  disabled={readOnly}
                >
                  {REGISTRATION_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {REGISTRATION_STATUS_LABELS[status]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="NHS Number"
                  placeholder="999 123 4567"
                  {...formik.getFieldProps('nhs_number')}
                  error={formik.touched.nhs_number && Boolean(formik.errors.nhs_number)}
                  helperText={formik.touched.nhs_number && formik.errors.nhs_number}
                  disabled={readOnly}
                  slotProps={{ htmlInput: { maxLength: 12, inputMode: 'numeric' } }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
              <Button
                type="submit"
                variant="contained"
                color="brand"
                startIcon={<SaveOutlined />}
                loading={formik.isSubmitting}
                disabled={readOnly || !formik.dirty || !formik.isValid}
              >
                Save Status
              </Button>
            </Box>
          </Box>
        </FormSectionCard>
      )}
    </Formik>
  );
}
