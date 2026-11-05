'use client';

import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { FormDrawer } from '@/components/modals/FormDrawer';
import { DateField, fieldError } from '@/features/staff/staffForm';
import {
  CQC_ALERT_ACTION_LABELS,
  CQC_APPLICABLE_LABELS,
  CQC_SIGN_OFF_LABELS,
  cqcApi,
  type CqcAlert,
  type CqcAlertAction,
  type CqcApplicable,
  type CqcSignOff,
} from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { useCqcPractice } from '../CqcShell';
import { optionEntries } from '../format';

interface Values {
  reference: string;
  title: string;
  received_date: string;
  applicable: CqcApplicable | '';
  clinical_owner: string;
  action_deadline: string;
  patients_affected: string;
  action_status: CqcAlertAction | '';
  closure_evidence: string;
  closed_date: string;
  sign_off: CqcSignOff | '';
  notes: string;
}

const EMPTY: Values = {
  reference: '',
  title: '',
  received_date: '',
  applicable: '',
  clinical_owner: '',
  action_deadline: '',
  patients_affected: '',
  action_status: 'NOT_STARTED',
  closure_evidence: '',
  closed_date: '',
  sign_off: 'NOT_CHECKED',
  notes: '',
};

const schema = Yup.object({
  reference: Yup.string().trim().required('Alert reference is required'),
  title: Yup.string().trim().required('Alert title is required'),
  received_date: Yup.string().required('Received date is required'),
  applicable: Yup.string().required('Applicable is required'),
  action_status: Yup.string().required('Action completed is required'),
  sign_off: Yup.string()
    .required('Governance sign-off is required')
    .test('action-done', 'Complete the action before signing off', function check(value) {
      const status = this.parent.action_status;
      return value !== 'SIGNED_OFF' || status === 'COMPLETE' || status === 'NOT_APPLICABLE';
    }),
  patients_affected: Yup.number()
    .transform((value, original) => (original === '' ? undefined : value))
    .typeError('Patients / items affected must be a number')
    .min(0, 'Patients / items affected can’t be negative')
    .integer('Patients / items affected must be a whole number'),
  closure_evidence: Yup.string().when('action_status', {
    is: 'COMPLETE',
    then: (rule) => rule.trim().required('Closure evidence is required'),
  }),
});

/** Add or edit one entry in the CAS alert register (the workbook's table under the CAS Alerts checklist). */
export function AlertDrawer({
  open,
  alert,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** `null` adds a new alert. */
  alert: CqcAlert | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const practice = useCqcPractice();
  const { enqueueSnackbar } = useSnackbar();
  const formik = useFormik<Values>({
    enableReinitialize: true,
    initialValues: alert
      ? {
          reference: alert.reference,
          title: alert.title,
          received_date: alert.received_date ?? '',
          applicable: alert.applicable,
          clinical_owner: alert.clinical_owner,
          action_deadline: alert.action_deadline ?? '',
          patients_affected: alert.patients_affected === null ? '' : String(alert.patients_affected),
          action_status: alert.action_status,
          closure_evidence: alert.closure_evidence,
          closed_date: alert.closed_date ?? '',
          sign_off: alert.sign_off,
          notes: alert.notes,
        }
      : EMPTY,
    validationSchema: schema,
    validateOnMount: true,
    onSubmit: async (values) => {
      const body = {
        ...values,
        applicable: values.applicable as CqcApplicable,
        action_status: values.action_status as CqcAlertAction,
        sign_off: values.sign_off as CqcSignOff,
        received_date: values.received_date || null,
        action_deadline: values.action_deadline || null,
        closed_date: values.closed_date || null,
        patients_affected: values.patients_affected === '' ? null : Number(values.patients_affected),
      };
      try {
        if (alert) await cqcApi.updateAlert(PUBLIC_SUB_APP_ID, practice.id, alert.id, body);
        else await cqcApi.createAlert(PUBLIC_SUB_APP_ID, practice.id, body);
        enqueueSnackbar(alert ? 'Alert updated' : 'Alert added', { variant: 'success' });
        formik.resetForm();
        onSaved();
      } catch (error) {
        enqueueSnackbar(error instanceof ApiError && error.code === 400 ? error.message : 'Failed to save the alert', {
          variant: 'error',
        });
      }
    },
  });
  const field = (
    name: keyof Values,
    label: string,
    extra: { required?: boolean; multiline?: boolean; number?: boolean } = {},
  ) => (
    <TextField
      fullWidth
      label={label}
      required={extra.required}
      multiline={extra.multiline}
      minRows={extra.multiline ? 3 : undefined}
      type={extra.number ? 'number' : undefined}
      {...formik.getFieldProps(name)}
      error={Boolean(fieldError(formik, name))}
      helperText={fieldError(formik, name)}
      slotProps={extra.number ? { htmlInput: { min: 0, step: 1 } } : undefined}
    />
  );
  const select = (name: keyof Values, label: string, labels: Record<string, string>, required = true) => (
    <TextField
      select
      fullWidth
      required={required}
      label={label}
      {...formik.getFieldProps(name)}
      error={Boolean(fieldError(formik, name))}
      helperText={fieldError(formik, name)}
    >
      {optionEntries(labels).map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <FormDrawer
      open={open}
      title={alert ? `Alert ${alert.reference}` : 'Add Alert'}
      subtitle="Applicability, patients actioned, closure and governance sign-off."
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      onSubmit={() => void formik.submitForm()}
      submitLabel={alert ? 'Save Changes' : 'Add Alert'}
      submitDisabled={!formik.isValid || !formik.dirty}
      submitting={formik.isSubmitting}
    >
      <Stack spacing={2.5}>
        {field('reference', 'Alert reference', { required: true })}
        {field('title', 'Alert title', { required: true })}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DateField formik={formik} name="received_date" label="Received date" required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{select('applicable', 'Applicable?', CQC_APPLICABLE_LABELS)}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('clinical_owner', 'Clinical owner')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DateField formik={formik} name="action_deadline" label="Action deadline" />
          </Grid>
        </Grid>
        {field('patients_affected', 'Patients / items affected', { number: true })}
        {select('action_status', 'Action completed', CQC_ALERT_ACTION_LABELS)}
        {field('closure_evidence', 'Closure evidence', { required: formik.values.action_status === 'COMPLETE' })}
        <DateField formik={formik} name="closed_date" label="Closed date" />
        {select('sign_off', 'Governance sign-off', CQC_SIGN_OFF_LABELS)}
        {field('notes', 'Notes', { multiline: true })}
      </Stack>
    </FormDrawer>
  );
}
