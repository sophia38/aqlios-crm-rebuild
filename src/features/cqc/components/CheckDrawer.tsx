'use client';

import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LabelValueList } from '@/components/data/LabelValueList';
import { StatusChip } from '@/components/data/StatusChip';
import { FormDrawer } from '@/components/modals/FormDrawer';
import { DateField, fieldError } from '@/features/staff/staffForm';
import {
  CQC_RISK_LABELS,
  CQC_RISKS,
  CQC_STATUS_LABELS,
  CQC_STATUSES,
  cqcApi,
  type CqcCheck,
  type CqcRisk,
  type CqcStatus,
} from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { useCqcPractice } from '../CqcShell';

interface Values {
  status: CqcStatus;
  risk: CqcRisk | '';
  evidence: string;
  due_date: string;
  completed_date: string;
  gap_action: string;
  owner: string;
  notes: string;
}

const NOTE_MAX = 500;
const isOpen = (status: CqcStatus) => status === 'GAP' || status === 'IN_PROGRESS';
const isDone = (status: CqcStatus) => status === 'COMPLETE' || status === 'OUTSTANDING';

const schema = Yup.object({
  status: Yup.string().required('Status is required'),
  risk: Yup.string().when('status', {
    is: (status: CqcStatus) => isOpen(status),
    then: (rule) => rule.required('Risk is required').notOneOf(['NONE'], 'Choose the level of risk this gap carries'),
  }),
  due_date: Yup.string().when('status', {
    is: (status: CqcStatus) => isOpen(status),
    then: (rule) => rule.required('Due date is required'),
  }),
  gap_action: Yup.string().when('status', {
    is: (status: CqcStatus) => isOpen(status),
    then: (rule) => rule.trim().required('Gap / action required is required'),
  }),
  evidence: Yup.string().when('status', {
    is: (status: CqcStatus) => isDone(status),
    then: (rule) => rule.trim().required('Evidence location is required'),
  }),
  completed_date: Yup.string().when('status', {
    is: (status: CqcStatus) => isDone(status),
    then: (rule) => rule.required('Completed date is required'),
  }),
  notes: Yup.string()
    .max(NOTE_MAX, `Notes must be ${NOTE_MAX} characters or fewer`)
    .when('status', {
      is: 'NOT_APPLICABLE',
      then: (rule) => rule.trim().required('Justification is required in the notes'),
    }),
});

/**
 * One check: the requirement and what completion looks like at the top, then the fields the workbook
 * tracks. A Gap or In progress check needs a risk, a due date and the action; saving it links it to
 * an action in the Action Plan. Complete needs evidence, and can't be set while its action is open.
 */
export function CheckDrawer({
  check,
  onClose,
  onSaved,
}: {
  check: CqcCheck | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const practice = useCqcPractice();
  const { enqueueSnackbar } = useSnackbar();
  const formik = useFormik<Values>({
    enableReinitialize: true,
    initialValues: {
      status: check?.status ?? 'NOT_CHECKED',
      risk: check?.risk ?? '',
      evidence: check?.evidence ?? '',
      due_date: check?.due_date ?? '',
      completed_date: check?.completed_date ?? '',
      gap_action: check?.gap_action ?? '',
      owner: check?.owner ?? '',
      notes: check?.notes ?? '',
    },
    validationSchema: schema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!check) return;
      try {
        await cqcApi.updateCheck(PUBLIC_SUB_APP_ID, practice.id, check.id, {
          ...values,
          risk: values.risk || null,
          due_date: values.due_date || null,
          completed_date: values.completed_date || null,
        });
        enqueueSnackbar('Check updated', { variant: 'success' });
        onSaved();
      } catch (error) {
        enqueueSnackbar(
          error instanceof ApiError && error.code === 400 ? error.message : 'Failed to update the check',
          {
            variant: 'error',
          },
        );
      }
    },
  });
  const { values } = formik;
  const text = (name: keyof Values, label: string, extra: { required?: boolean; multiline?: boolean } = {}) => (
    <TextField
      fullWidth
      label={label}
      required={extra.required}
      multiline={extra.multiline}
      minRows={extra.multiline ? 3 : undefined}
      {...formik.getFieldProps(name)}
      error={Boolean(fieldError(formik, name))}
      helperText={fieldError(formik, name)}
    />
  );

  return (
    <FormDrawer
      open={Boolean(check)}
      title={check ? `Check ${check.id}` : ''}
      subtitle={check?.group}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      onSubmit={() => void formik.submitForm()}
      submitLabel="Save Changes"
      submitDisabled={!formik.isValid || !formik.dirty}
      submitting={formik.isSubmitting}
    >
      {check && (
        <Stack spacing={2.5}>
          <LabelValueList
            items={[
              { label: 'Requirement', value: check.requirement },
              { label: 'Completion looks like', value: check.completion },
              {
                label: 'Action',
                value: check.action_id ? (
                  <StatusChip status={check.action_id} tone="primary" variant="outlined" />
                ) : null,
              },
            ]}
          />
          <TextField
            select
            fullWidth
            required
            label="Status"
            {...formik.getFieldProps('status')}
            error={Boolean(fieldError(formik, 'status'))}
            helperText={fieldError(formik, 'status')}
          >
            {CQC_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {CQC_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            required={isOpen(values.status)}
            label="Risk"
            {...formik.getFieldProps('risk')}
            error={Boolean(fieldError(formik, 'risk'))}
            helperText={fieldError(formik, 'risk')}
          >
            <MenuItem value="">Not set</MenuItem>
            {CQC_RISKS.map((risk) => (
              <MenuItem key={risk} value={risk}>
                {CQC_RISK_LABELS[risk]}
              </MenuItem>
            ))}
          </TextField>
          {text('evidence', 'Evidence location / reference', { required: isDone(values.status) })}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DateField formik={formik} name="due_date" label="Due / review date" required={isOpen(values.status)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DateField
                formik={formik}
                name="completed_date"
                label="Completed date"
                required={isDone(values.status)}
              />
            </Grid>
          </Grid>
          {text('gap_action', 'Gap / action required', { required: isOpen(values.status), multiline: true })}
          {text('owner', 'Owner')}
          <Stack spacing={0.5}>
            {text('notes', 'Notes', { required: values.status === 'NOT_APPLICABLE', multiline: true })}
            <Typography variant="caption" sx={{ textAlign: 'right' }}>
              {values.notes.length}/{NOTE_MAX}
            </Typography>
          </Stack>
        </Stack>
      )}
    </FormDrawer>
  );
}
