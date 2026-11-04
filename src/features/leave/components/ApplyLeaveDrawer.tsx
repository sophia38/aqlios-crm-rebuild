'use client';

import { useEffect } from 'react';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { StatusChip } from '@/components/data/StatusChip';
import { FormDrawer } from '@/components/modals/FormDrawer';
import { DateField, fieldError } from '@/features/staff/staffForm';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import {
  formatBalance,
  formatLeave,
  LEAVE_NOTE_MAX,
  LEAVE_TYPE_LABELS,
  leaveApi,
  round,
  workingHoursBetween,
} from '@/lib/api/leave';
import { LEAVE_TYPES, type LeaveType, type MyLeaveSummary } from '@/lib/api/types';

type Unit = 'HOURS' | 'DAYS';

interface Values {
  leave_type: LeaveType | '';
  start_date: string;
  end_date: string;
  duration: number | string;
  unit: Unit;
  notes: string;
}

const INITIAL: Values = { leave_type: '', start_date: '', end_date: '', duration: '', unit: 'DAYS', notes: '' };

/**
 * Apply For Leave (plan §6b): Leave Type with its balance, Start / End Date, Duration with Hours or
 * Days, Note (0/300). The duration fills in from the dates and the person's contracted hours, and can
 * be lowered for part days. Apply Leave stays disabled until the form is valid (live is enabled while
 * empty).
 */
export function ApplyLeaveDrawer({
  open,
  summary,
  onClose,
  onApplied,
}: {
  open: boolean;
  summary: MyLeaveSummary;
  onClose: () => void;
  onApplied: () => void;
}) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const today = dayjs().format('YYYY-MM-DD');
  const perDay = summary.day_hours;
  const available = (start: string, end: string) =>
    workingHoursBetween(summary.schedule, summary.bank_holidays, start, end, perDay);
  const toHours = (duration: number | string, unit: Unit) => round(Number(duration) * (unit === 'DAYS' ? perDay : 1));
  // While a year is typed the picker reports 0002, 0020, 0202: no duration until both years are complete.
  const ready = (start: string, end: string) =>
    Boolean(start && end && end >= start && dayjs(start).year() >= 1900 && dayjs(end).year() >= 1900);

  const schema = Yup.object({
    leave_type: Yup.string().required('Leave Type is required'),
    start_date: Yup.string()
      .required('Start Date is required')
      .test('not-past', "Start Date can't be in the past", function check(value) {
        // Sick leave can be recorded after the event.
        return this.parent.leave_type === 'SICK' || !value || value >= today;
      }),
    end_date: Yup.string()
      .required('End Date is required')
      .test('after-start', "End Date can't be before Start Date", function check(value) {
        return !value || !this.parent.start_date || value >= this.parent.start_date;
      }),
    duration: Yup.number()
      .typeError('Duration must be a number')
      .required('Duration is required')
      .moreThan(0, 'Duration must be more than 0')
      .test('fits', '', function check(value) {
        const { start_date: start, end_date: end, unit } = this.parent as Values;
        if (!ready(start, end) || value === undefined) return true;
        const hours = available(start, end);
        if (!hours) return this.createError({ message: "You don't work on these dates" });
        return (
          toHours(value, unit) <= hours ||
          this.createError({
            message: `Duration can't be more than the ${formatLeave(hours, perDay)} you work in these dates`,
          })
        );
      }),
    notes: Yup.string().max(LEAVE_NOTE_MAX, `Note must be ${LEAVE_NOTE_MAX} characters or fewer`),
  });

  const formik = useFormik<Values>({
    initialValues: INITIAL,
    validationSchema: schema,
    validateOnMount: true,
    onSubmit: async (values, helpers) => {
      try {
        await leaveApi.apply(PUBLIC_SUB_APP_ID, practice.id, {
          leave_type: values.leave_type as LeaveType,
          start_date: values.start_date,
          end_date: values.end_date,
          duration_hours: toHours(values.duration, values.unit),
          notes: values.notes.trim(),
        });
        enqueueSnackbar('Leave request submitted', { variant: 'success' });
        helpers.resetForm();
        onApplied();
      } catch (error) {
        enqueueSnackbar(
          error instanceof ApiError && error.code === 400 ? error.message : 'Failed to submit the leave request',
          { variant: 'error' },
        );
      }
    },
  });
  const { values } = formik;

  // Dates or unit changed: fill in the whole working time again (it can then be lowered for part days).
  const { start_date: start, end_date: end, unit } = values;
  const { setFieldValue } = formik;
  useEffect(() => {
    if (!ready(start, end)) return;
    const hours = workingHoursBetween(summary.schedule, summary.bank_holidays, start, end, perDay);
    void setFieldValue('duration', unit === 'DAYS' ? round(hours / perDay) : hours);
  }, [start, end, unit, summary, perDay, setFieldValue]);

  const dateField = (name: 'start_date' | 'end_date', label: string) => (
    <DateField
      formik={formik}
      name={name}
      label={label}
      required
      minDate={values.leave_type === 'SICK' ? undefined : dayjs()}
    />
  );

  const balance = summary.balances.find((item) => item.leave_type === values.leave_type);
  const requested = values.duration === '' ? 0 : toHours(values.duration, values.unit);
  const over = balance?.remaining_hours !== null && balance && requested > (balance.remaining_hours ?? 0);
  const durationError = fieldError(formik, 'duration');
  const workable = ready(values.start_date, values.end_date) ? available(values.start_date, values.end_date) : null;
  const close = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      title="Apply For Leave"
      subtitle="Your manager will be asked to approve it."
      onClose={close}
      onSubmit={() => void formik.submitForm()}
      submitLabel="Apply Leave"
      submitDisabled={!formik.isValid || !formik.dirty}
      submitting={formik.isSubmitting}
    >
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <TextField
            select
            fullWidth
            required
            label="Leave Type"
            {...formik.getFieldProps('leave_type')}
            error={Boolean(fieldError(formik, 'leave_type'))}
            helperText={fieldError(formik, 'leave_type')}
          >
            {LEAVE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {LEAVE_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </TextField>
          {balance && (
            <Stack direction="row">
              <StatusChip
                status={`Balance: ${formatBalance(balance.remaining_hours, perDay)}`}
                tone={over ? 'warning' : 'primary'}
              />
            </Stack>
          )}
        </Stack>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>{dateField('start_date', 'Start Date')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{dateField('end_date', 'End Date')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="number"
              label="Duration"
              {...formik.getFieldProps('duration')}
              error={Boolean(durationError)}
              helperText={
                durationError ??
                (workable !== null ? `You work ${formatLeave(workable, perDay)} in these dates` : undefined)
              }
              slotProps={{ htmlInput: { min: 0, step: values.unit === 'DAYS' ? 0.5 : 0.25 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Duration Type"
              value={values.unit}
              onChange={(event) => void formik.setFieldValue('unit', event.target.value as Unit)}
            >
              <MenuItem value="HOURS">Hours</MenuItem>
              <MenuItem value="DAYS">Days</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        {over && (
          <Alert severity="warning">
            This is more than your remaining balance. Your manager will see a warning when they review it.
          </Alert>
        )}
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Note"
          placeholder="Add a note for your manager (optional)"
          {...formik.getFieldProps('notes')}
          error={Boolean(fieldError(formik, 'notes'))}
          helperText={fieldError(formik, 'notes') ?? `${values.notes.length}/${LEAVE_NOTE_MAX}`}
          slotProps={{ htmlInput: { maxLength: LEAVE_NOTE_MAX } }}
        />
      </Stack>
    </FormDrawer>
  );
}
