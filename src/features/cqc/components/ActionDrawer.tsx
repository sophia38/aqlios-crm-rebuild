'use client';

import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { LabelValueList } from '@/components/data/LabelValueList';
import { FormDrawer } from '@/components/modals/FormDrawer';
import { DateField, fieldError } from '@/features/staff/staffForm';
import {
  CQC_ACTION_STATUS_LABELS,
  CQC_ACTION_STATUSES,
  CQC_PRIORITIES,
  CQC_RISK_LABELS,
  CQC_SUMMARY_AREA_LABELS,
  cqcApi,
  type CqcAction,
  type CqcActionStatus,
  type CqcPriority,
} from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { formatDate } from '@/lib/format';
import { useCqcPractice } from '../CqcShell';

interface Values {
  priority: CqcPriority;
  gap: string;
  required_action: string;
  owner: string;
  due_date: string;
  status: CqcActionStatus;
  completion_evidence: string;
  effectiveness_check: string;
}

const schema = Yup.object({
  priority: Yup.string().required('Priority is required'),
  gap: Yup.string().trim().required('Gap / risk is required'),
  required_action: Yup.string().trim().required('Required action is required'),
  status: Yup.string().required('Status is required'),
  completion_evidence: Yup.string().when('status', {
    is: 'CLOSED',
    then: (rule) => rule.trim().required('Completion evidence is required to close an action'),
  }),
  effectiveness_check: Yup.string().when('status', {
    is: 'CLOSED',
    then: (rule) => rule.trim().required('Effectiveness check is required to close an action'),
  }),
});

/** One action in the single action plan. It can only be Closed with completion evidence and an effectiveness check. */
export function ActionDrawer({
  action,
  onClose,
  onSaved,
}: {
  action: CqcAction | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const practice = useCqcPractice();
  const { enqueueSnackbar } = useSnackbar();
  const formik = useFormik<Values>({
    enableReinitialize: true,
    initialValues: {
      priority: action?.priority ?? 'MEDIUM',
      gap: action?.gap ?? '',
      required_action: action?.required_action ?? '',
      owner: action?.owner ?? '',
      due_date: action?.due_date ?? '',
      status: action?.status ?? 'OPEN',
      completion_evidence: action?.completion_evidence ?? '',
      effectiveness_check: action?.effectiveness_check ?? '',
    },
    validationSchema: schema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!action) return;
      try {
        await cqcApi.updateAction(PUBLIC_SUB_APP_ID, practice.id, action.id, {
          ...values,
          due_date: values.due_date || null,
        });
        enqueueSnackbar('Action updated', { variant: 'success' });
        onSaved();
      } catch (error) {
        enqueueSnackbar(
          error instanceof ApiError && error.code === 400 ? error.message : 'Failed to update the action',
          {
            variant: 'error',
          },
        );
      }
    },
  });
  const closing = formik.values.status === 'CLOSED';
  const field = (name: keyof Values, label: string, extra: { required?: boolean; multiline?: boolean } = {}) => (
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
      open={Boolean(action)}
      title={action ? `Action ${action.id}` : ''}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      onSubmit={() => void formik.submitForm()}
      submitLabel="Save Changes"
      submitDisabled={!formik.isValid || !formik.dirty}
      submitting={formik.isSubmitting}
    >
      {action && (
        <Stack spacing={2.5}>
          <LabelValueList
            items={[
              { label: 'Source', value: action.source_area ? CQC_SUMMARY_AREA_LABELS[action.source_area] : null },
              { label: 'Source check', value: action.source_check_id },
              { label: 'Opened', value: formatDate(action.opened_date) },
              { label: 'Closed', value: action.closed_date ? formatDate(action.closed_date) : null },
            ]}
          />
          <TextField
            select
            fullWidth
            required
            label="Priority"
            {...formik.getFieldProps('priority')}
            error={Boolean(fieldError(formik, 'priority'))}
            helperText={fieldError(formik, 'priority')}
          >
            {CQC_PRIORITIES.map((priority) => (
              <MenuItem key={priority} value={priority}>
                {CQC_RISK_LABELS[priority]}
              </MenuItem>
            ))}
          </TextField>
          {field('gap', 'Gap / risk', { required: true, multiline: true })}
          {field('required_action', 'Required action', { required: true, multiline: true })}
          {field('owner', 'Owner')}
          <DateField formik={formik} name="due_date" label="Due date" />
          <TextField
            select
            fullWidth
            required
            label="Status"
            {...formik.getFieldProps('status')}
            error={Boolean(fieldError(formik, 'status'))}
            helperText={fieldError(formik, 'status')}
          >
            {CQC_ACTION_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {CQC_ACTION_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>
          {field('completion_evidence', 'Completion evidence', { required: closing, multiline: true })}
          {field('effectiveness_check', 'Effectiveness check', { required: closing, multiline: true })}
        </Stack>
      )}
    </FormDrawer>
  );
}
