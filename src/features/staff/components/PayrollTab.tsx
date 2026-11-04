'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import UploadFile from '@mui/icons-material/UploadFileOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import {
  DOCUMENT_STATUS_LABELS,
  PAYROLL_DOCUMENT_LABELS,
  PENSION_LABELS,
  STAFF_REASON_MAX,
  staffApi,
} from '@/lib/api/staff';
import type { PayrollDocumentType, PensionScheme, StaffPayroll } from '@/lib/api/types';
import { anyError, DateField, fieldError, useSaveBinding, type StaffTabProps } from '../staffForm';
import { UploadDocumentDialog } from './UploadDocumentDialog';

const AMOUNT = /^\d{1,6}(\.\d{1,2})?$/;

/** An amount with its reason and end date: all three, or none (live marks all six as required). */
const pair = (prefix: 'deduction' | 'payment', label: string) => ({
  [`${prefix}_amount`]: Yup.string()
    .trim()
    .matches(AMOUNT, { message: `Enter the ${label.toLowerCase()} in pounds, e.g. 125.50`, excludeEmptyString: true })
    .when([`${prefix}_reason`, `${prefix}_end`], {
      is: (reason: string, end: string) => Boolean(reason?.trim() || end),
      then: (field) => field.required(`${label} is required`),
    }),
  [`${prefix}_reason`]: Yup.string()
    .trim()
    .max(STAFF_REASON_MAX, `Reason must be ${STAFF_REASON_MAX} characters or fewer`)
    .when(`${prefix}_amount`, {
      is: (amount: string) => Boolean(amount?.trim()),
      then: (field) => field.required('Reason is required'),
    }),
  [`${prefix}_end`]: Yup.string().when(`${prefix}_amount`, {
    is: (amount: string) => Boolean(amount?.trim()),
    then: (field) =>
      field
        .required('End Date is required')
        .test('future', 'End Date must be in the future', (value) => !value || dayjs(value).isAfter(dayjs(), 'day')),
  }),
});

const schema = Yup.object().shape(
  { ...pair('deduction', 'Deduction Amount'), ...pair('payment', 'Additional Payment Amount') },
  [
    ['deduction_amount', 'deduction_reason'],
    ['deduction_amount', 'deduction_end'],
    ['payment_amount', 'payment_reason'],
    ['payment_amount', 'payment_end'],
  ],
);

const date = (value: string | null) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

/** Payroll (docs/practice/05-staff-onboarding.md §6): documents, Pension Enrolment and Payroll Updates. */
export function PayrollTab({ staff, onSaved, bind }: StaffTabProps) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const [uploading, setUploading] = useState<PayrollDocumentType | null>(null);

  const formik = useFormik<StaffPayroll>({
    initialValues: staff.payroll,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values, helpers) => {
      try {
        const saved = await staffApi.update(PUBLIC_SUB_APP_ID, practice.id, staff.id, 'payroll', {
          ...values,
          // Documents are saved by their own uploads.
          documents: staff.payroll.documents,
        });
        helpers.resetForm({ values: saved.payroll });
        enqueueSnackbar('Staff details saved', { variant: 'success' });
        onSaved(saved);
      } catch {
        enqueueSnackbar('Failed to save payroll details', { variant: 'error' });
      }
    },
  });
  useSaveBinding(formik, bind);

  const columns: DataTableColumn<StaffPayroll['documents'][number]>[] = [
    { id: 'type', label: 'Document Type', render: (item) => PAYROLL_DOCUMENT_LABELS[item.type] },
    { id: 'file', label: 'Uploaded Document', render: (item) => item.file_name ?? '-' },
    { id: 'added', label: 'Date Added', render: (item) => date(item.added_at) },
    { id: 'verified', label: 'Verified Date', render: (item) => date(item.verified_at) },
    { id: 'by', label: 'Added By', render: (item) => item.added_by ?? '-' },
    { id: 'status', label: 'Status', render: (item) => <StatusChip status={DOCUMENT_STATUS_LABELS[item.status]} /> },
    {
      id: 'action',
      label: 'Action',
      render: (item) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<UploadFile />}
          onClick={() => setUploading(item.type)}
          aria-label={`${item.file_name ? 'Re-upload' : 'Upload'} ${PAYROLL_DOCUMENT_LABELS[item.type]}`}
        >
          {item.file_name ? 'Re-upload' : 'Upload'}
        </Button>
      ),
    },
  ];

  const text = (name: keyof StaffPayroll, label: string, money = false) => {
    const error = fieldError(formik, name);
    return (
      <TextField
        fullWidth
        label={label}
        {...formik.getFieldProps(name)}
        error={Boolean(error)}
        helperText={error}
        slotProps={
          money
            ? {
                input: { startAdornment: <InputAdornment position="start">£</InputAdornment> },
                htmlInput: { inputMode: 'decimal' },
              }
            : undefined
        }
      />
    );
  };

  return (
    <Stack spacing={2.5}>
      <FormSectionCard title="Payroll Documents">
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          (Supported formats: PDF, JPG, PNG, DOC, DOCX | Maximum file size: 10MB)
        </Typography>
        <DataTable
          aria-label="Payroll documents"
          columns={columns}
          rows={staff.payroll.documents}
          getRowId={(item) => item.type}
          page={0}
          rowsPerPage={10}
          totalCount={staff.payroll.documents.length}
          onPageChange={() => undefined}
          onRowsPerPageChange={() => undefined}
          emptyMessage="No payroll documents."
          minWidth={820}
        />
      </FormSectionCard>
      <FormSectionCard title="Pension Enrolment">
        <RadioGroup
          row
          aria-label="Pension Enrolment"
          value={formik.values.pension}
          onChange={(event) => void formik.setFieldValue('pension', event.target.value as PensionScheme)}
        >
          {(Object.keys(PENSION_LABELS) as PensionScheme[]).map((scheme) => (
            <FormControlLabel key={scheme} value={scheme} control={<Radio />} label={PENSION_LABELS[scheme]} />
          ))}
        </RadioGroup>
      </FormSectionCard>
      <FormSectionCard
        title="Payroll Updates"
        hasError={anyError(formik, [
          'deduction_amount',
          'deduction_reason',
          'deduction_end',
          'payment_amount',
          'payment_reason',
          'payment_end',
        ])}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>{text('deduction_amount', 'Deduction Amount', true)}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('deduction_reason', 'Reason')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DateField
              formik={formik}
              name="deduction_end"
              label="End Date"
              minDate={dayjs().add(1, 'day')}
              helperText="For how long these deductions should be made in future"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('payment_amount', 'Additional Payment Amount', true)}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{text('payment_reason', 'Reason')}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DateField formik={formik} name="payment_end" label="End Date" minDate={dayjs().add(1, 'day')} />
          </Grid>
        </Grid>
      </FormSectionCard>
      <UploadDocumentDialog
        open={uploading !== null}
        title={uploading ? `Upload ${PAYROLL_DOCUMENT_LABELS[uploading]}` : 'Upload Document'}
        withDates={false}
        requireExpiry={false}
        onClose={() => setUploading(null)}
        onUpload={async ({ file_name: name }) => {
          if (!uploading) return;
          try {
            onSaved(await staffApi.uploadPayrollDocument(PUBLIC_SUB_APP_ID, practice.id, staff.id, uploading, name));
            enqueueSnackbar('Document uploaded', { variant: 'success' });
            setUploading(null);
          } catch {
            enqueueSnackbar('Failed to upload the document', { variant: 'error' });
          }
        }}
      />
    </Stack>
  );
}
