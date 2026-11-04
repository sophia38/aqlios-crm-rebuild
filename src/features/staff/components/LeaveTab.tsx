'use client';

import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Add from '@mui/icons-material/Add';
import { LabelValueList } from '@/components/data/LabelValueList';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { RepeatableItemCard } from '@/components/forms/RepeatableItemCard';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { OTHER_LEAVE_TYPES, staffApi } from '@/lib/api/staff';
import { anyError, dayLength, fieldError, formatLeave, useSaveBinding, type StaffTabProps } from '../staffForm';

const MAX_DAYS = 60;
const MAX_OTHER = 4;

const days = (label: string) =>
  Yup.number()
    .typeError(`${label} must be a number`)
    .required(`${label} is required`)
    .min(0, `${label} can't be negative`)
    .max(MAX_DAYS, `${label} must be ${MAX_DAYS} days or fewer`);

const schema = Yup.object({
  annual_days: days('Annual leave'),
  sick_days: days('Sick leave'),
  other: Yup.array().of(
    Yup.object({ leave_type: Yup.string().required('Leave Type is required'), days: days('Duration') }),
  ),
});

interface Values {
  annual_days: number | string;
  sick_days: number | string;
  other: { leave_type: string; days: number | string }[];
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Leave Management (docs/practice/05-staff-onboarding.md §6). Entitlements are entered in days and
 * stored in hours, using the person's contracted day length, and shown as "X days (Y h)" (phase 5
 * question 3). Read-only on your own profile, as captured.
 */
export function LeaveTab({ staff, self, onSaved, bind }: StaffTabProps) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const perDay = dayLength(staff.account.availability);
  const toDays = (hours: number) => round(hours / perDay);

  const formik = useFormik<Values>({
    initialValues: {
      annual_days: toDays(staff.leave.annual_hours),
      sick_days: toDays(staff.leave.sick_hours),
      other: staff.leave.other.map((item) => ({ leave_type: item.leave_type, days: toDays(item.hours) })),
    },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const saved = await staffApi.update(PUBLIC_SUB_APP_ID, practice.id, staff.id, 'leave', {
          annual_hours: round(Number(values.annual_days) * perDay),
          sick_hours: round(Number(values.sick_days) * perDay),
          other: values.other.map((item) => ({
            leave_type: item.leave_type,
            hours: round(Number(item.days) * perDay),
          })),
        });
        enqueueSnackbar('Staff details saved', { variant: 'success' });
        onSaved(saved);
      } catch {
        enqueueSnackbar('Failed to save leave entitlements', { variant: 'error' });
      }
    },
  });
  useSaveBinding(formik, bind);

  const note = (
    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
      One day is {round(perDay)} hours, from the contracted working week in Account Details.
    </Typography>
  );

  if (self) {
    return (
      <Stack spacing={2.5}>
        <Alert severity="info">
          Your leave entitlement is set by your practice. Your balances are in Leaves and ROTA.
        </Alert>
        <FormSectionCard title="Annual Leave Entitlement">
          <LabelValueList items={[{ label: 'Entitlement', value: formatLeave(staff.leave.annual_hours, perDay) }]} />
          {note}
        </FormSectionCard>
        <FormSectionCard title="Sick Leave Entitlement">
          <LabelValueList items={[{ label: 'Entitlement', value: formatLeave(staff.leave.sick_hours, perDay) }]} />
        </FormSectionCard>
        <FormSectionCard title="Other Leaves Entitlement">
          {staff.leave.other.length ? (
            <LabelValueList
              items={staff.leave.other.map((item) => ({
                label: item.leave_type,
                value: formatLeave(item.hours, perDay),
              }))}
            />
          ) : (
            <Typography variant="body2">No Fixed Entitlement</Typography>
          )}
        </FormSectionCard>
      </Stack>
    );
  }

  const daysField = (name: string, label: string, value: number | string) => {
    const error = fieldError(formik, name);
    const hours = Number(value) * perDay;
    return (
      <TextField
        fullWidth
        required
        type="number"
        label={label}
        {...formik.getFieldProps(name)}
        error={Boolean(error)}
        helperText={error ?? (Number.isFinite(hours) ? `${round(hours)} hours` : undefined)}
        slotProps={{ htmlInput: { min: 0, max: MAX_DAYS, step: 0.5 } }}
      />
    );
  };

  return (
    <Stack spacing={2.5}>
      <FormSectionCard title="Annual Leave Entitlement" hasError={anyError(formik, ['annual_days'])}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{daysField('annual_days', 'Duration (days)', formik.values.annual_days)}</Grid>
        </Grid>
        {note}
      </FormSectionCard>
      <FormSectionCard title="Sick Leave Entitlement" hasError={anyError(formik, ['sick_days'])}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{daysField('sick_days', 'Duration (days)', formik.values.sick_days)}</Grid>
        </Grid>
      </FormSectionCard>
      <FormSectionCard
        title="Other Leaves Entitlement"
        hasError={formik.values.other.some((_, index) =>
          anyError(formik, [`other.${index}.leave_type`, `other.${index}.days`]),
        )}
      >
        <Stack spacing={2}>
          {formik.values.other.length === 0 && <Typography variant="body2">No Fixed Entitlement</Typography>}
          {formik.values.other.map((item, index) => {
            const typeError = fieldError(formik, `other.${index}.leave_type`);
            const taken = formik.values.other.filter((_, other) => other !== index).map((entry) => entry.leave_type);
            return (
              <RepeatableItemCard
                key={index}
                title={`Leave ${index + 1}`}
                hasError={anyError(formik, [`other.${index}.leave_type`, `other.${index}.days`])}
                onDelete={() =>
                  void formik.setFieldValue(
                    'other',
                    formik.values.other.filter((_, other) => other !== index),
                  )
                }
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Leave Type"
                      {...formik.getFieldProps(`other.${index}.leave_type`)}
                      value={item.leave_type}
                      error={Boolean(typeError)}
                      helperText={typeError}
                    >
                      {OTHER_LEAVE_TYPES.map((type) => (
                        <MenuItem key={type} value={type} disabled={taken.includes(type)}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>{daysField(`other.${index}.days`, 'Duration (days)', item.days)}</Grid>
                </Grid>
              </RepeatableItemCard>
            );
          })}
          <Box>
            <Button
              variant="outlined"
              startIcon={<Add />}
              disabled={formik.values.other.length >= MAX_OTHER}
              onClick={() => void formik.setFieldValue('other', [...formik.values.other, { leave_type: '', days: '' }])}
            >
              Add Leave Type
            </Button>
          </Box>
        </Stack>
      </FormSectionCard>
    </Stack>
  );
}
