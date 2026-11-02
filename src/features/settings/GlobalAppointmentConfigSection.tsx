'use client';

import { useEffect, useState } from 'react';
import { FieldArray, Formik, getIn, useFormikContext } from 'formik';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import Add from '@mui/icons-material/Add';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { AppSwitch } from '@/components/forms/AppSwitch';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { OperatingHoursRow } from '@/components/forms/OperatingHoursRow';
import { RepeatableItemCard } from '@/components/forms/RepeatableItemCard';
import { BOOKING_CHANNELS, EXTRA_APPOINTMENTS } from '@/features/practices/practiceForm';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { settingsApi } from '@/lib/api/settings';
import type {
  AdditionalSlot,
  AdditionalSlotType,
  GlobalAppointmentConfiguration,
  ReminderOption,
  RoleUser,
} from '@/lib/api/types';
import { usersApi } from '@/lib/api/users';
import { LoadFailed } from './LoadFailed';
import { dayError, digits, fromDayHours, SectionActions, toDayHours, useRoles, WEEK } from './settingsShared';

const REMINDERS: { value: ReminderOption; label: string; hours: number | null }[] = [
  { value: 'NONE', label: 'No reminder', hours: null },
  { value: 'BEFORE_48H', label: 'Before 48 Hours', hours: 48 },
  { value: 'BEFORE_24H', label: 'Before 24 Hours', hours: 24 },
  { value: 'BEFORE_12H', label: 'Before 12 Hours', hours: 12 },
  { value: 'BEFORE_6H', label: 'Before 6 Hours', hours: 6 },
  { value: 'BEFORE_2H', label: 'Before 2 Hours', hours: 2 },
];

const SLOT_TYPES: { value: AdditionalSlotType; label: string }[] = [
  { value: 'TELEPHONE_AUDIO', label: 'Telephone/Audio' },
  { value: 'ONLINE_VIDEO', label: 'Online (Video)' },
];

type NumberField =
  'offered_slot_hours' | 'min_cancellation_hours' | 'min_reschedule_hours' | 'max_advance_booking_days';

/** Number fields are text while editing (digits only) and numbers in the API. */
type Values = Omit<GlobalAppointmentConfiguration, NumberField> & Record<NumberField, string>;

const NUMBER_FIELDS: NumberField[] = [
  'offered_slot_hours',
  'min_cancellation_hours',
  'min_reschedule_hours',
  'max_advance_booking_days',
];

const toValues = (config: GlobalAppointmentConfiguration): Values => ({
  ...config,
  ...(Object.fromEntries(NUMBER_FIELDS.map((key) => [key, String(config[key])])) as Record<NumberField, string>),
});

const toConfig = (values: Values): GlobalAppointmentConfiguration => ({
  ...values,
  ...(Object.fromEntries(NUMBER_FIELDS.map((key) => [key, Number(values[key])])) as Record<NumberField, number>),
});

const inRange = (min: number, max: number, unit: string, label: string) =>
  Yup.string()
    .required(`${label} is required`)
    .test('range', `Enter a number of ${unit} from ${min} to ${max}`, (value) => {
      const number = Number(value);
      return number >= min && number <= max;
    });

const schema = Yup.object({
  offered_slot_hours: inRange(1, 720, 'hours', 'Offered slot window'),
  min_cancellation_hours: inRange(0, 720, 'hours', 'Minimum cancellation notice'),
  min_reschedule_hours: inRange(0, 720, 'hours', 'Minimum reschedule notice'),
  max_advance_booking_days: inRange(1, 365, 'days', 'Max advance booking period'),
  urgent_capacity: Yup.array().test('hours', 'Closing time must be after opening time', (days) =>
    (days as Values['urgent_capacity']).every((day) => !dayError(day)),
  ),
  additional_slots: Yup.array().of(
    Yup.object({
      role_id: Yup.string().required('Role is required'),
      appointment_type: Yup.string().required('Appointment type is required'),
      staff_id: Yup.string().required('Staff is required'),
      start_time: Yup.string().required('Start time is required'),
      end_time: Yup.string()
        .required('End time is required')
        .test('after', 'End time must be after start time', function check(value) {
          const start = (this.parent as AdditionalSlot).start_time;
          return !start || !value || value > start;
        }),
    }),
  ),
});

/** Global Appointment Configuration (docs/super-admin/09-settings.md §2). */
export function GlobalAppointmentConfigSection() {
  const { enqueueSnackbar } = useSnackbar();
  const [config, setConfig] = useState<GlobalAppointmentConfiguration | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    settingsApi
      .appointmentConfiguration(PUBLIC_SUB_APP_ID, controller.signal)
      .then((result) => {
        setConfig(result);
        setFailed(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
        enqueueSnackbar('Failed to load global appointment configuration', { variant: 'error' });
      });
    return () => controller.abort();
  }, [reloadKey, enqueueSnackbar]);

  if (failed) {
    return <LoadFailed what="global appointment configuration" onRetry={() => setReloadKey((key) => key + 1)} />;
  }
  if (!config) return <LoadingSpinner message="Loading configuration..." />;

  return (
    <Formik
      initialValues={toValues(config)}
      validationSchema={schema}
      onSubmit={async (values, helpers) => {
        try {
          const saved = await settingsApi.saveAppointmentConfiguration(PUBLIC_SUB_APP_ID, toConfig(values));
          helpers.resetForm({ values: toValues(saved) });
          enqueueSnackbar('Global appointment configuration updated successfully', { variant: 'success' });
        } catch (error) {
          enqueueSnackbar(
            error instanceof ApiError && error.code === 400
              ? error.message
              : 'Failed to save global appointment configuration',
            { variant: 'error' },
          );
        }
      }}
    >
      {(formik) => (
        <Box component="form" noValidate onSubmit={formik.handleSubmit}>
          <SectionActions />
          <AppointmentConfigFields />
        </Box>
      )}
    </Formik>
  );
}

/** Staff for each role, for the Additional Slot "Staff" select. */
function useStaffByRole(roleIds: string[]) {
  const [staff, setStaff] = useState<Record<string, RoleUser[]>>({});
  const wanted = [...new Set(roleIds.filter(Boolean))].sort().join(',');
  useEffect(() => {
    if (!wanted) return;
    const controller = new AbortController();
    for (const roleId of wanted.split(',')) {
      usersApi
        .roleUsers(PUBLIC_SUB_APP_ID, roleId, { page_size: 100 }, controller.signal)
        .then((result) => setStaff((current) => ({ ...current, [roleId]: result.results })))
        .catch(() => undefined);
    }
    return () => controller.abort();
  }, [wanted]);
  return staff;
}

function AppointmentConfigFields() {
  const { values, errors, touched, submitCount, setFieldValue, setFieldTouched, handleChange, handleBlur } =
    useFormikContext<Values>();
  const roles = useRoles();
  const staffByRole = useStaffByRole(values.additional_slots.map((slot) => slot.role_id));
  const shown = (path: string) => submitCount > 0 || Boolean(getIn(touched, path));
  const errorOf = (path: string) => {
    const error = getIn(errors, path);
    return shown(path) && typeof error === 'string' ? error : undefined;
  };

  const field = (path: string, label: string, required = true) => ({
    id: path,
    name: path,
    label,
    required,
    value: getIn(values, path) ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: Boolean(errorOf(path)),
    helperText: errorOf(path),
  });

  const numberField = (path: NumberField, label: string, unit: string, helper: string, required = false) => (
    <TextField
      {...field(path, label, required)}
      onChange={(event) => setFieldValue(path, digits(event.target.value, 3))}
      helperText={errorOf(path) ?? helper}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { inputMode: 'numeric' },
        input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> },
      }}
    />
  );

  const reminderHelper = (kind: 'SMS' | 'Email', value: ReminderOption) => {
    const hours = REMINDERS.find((option) => option.value === value)?.hours;
    return hours === null || hours === undefined
      ? `No ${kind} reminder will be sent to patients.`
      : `Send ${kind} reminder to patient for their appointments before ${hours} hours.`;
  };

  const checkbox = (path: keyof Values, label: string) => (
    <FormControlLabel
      control={
        <Checkbox checked={Boolean(values[path])} onChange={(event) => setFieldValue(path, event.target.checked)} />
      }
      label={label}
      sx={{ '& .MuiFormControlLabel-label': { fontSize: 14 } }}
    />
  );

  const channelSelect = (path: 'urgent_booking' | 'routine_booking', label: string) => (
    <TextField select {...field(path, label)} slotProps={{ inputLabel: { shrink: true } }}>
      {BOOKING_CHANNELS.map((channel) => (
        <MenuItem key={channel.value} value={channel.value}>
          {channel.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const timeField = (path: string, label: string) => {
    const value = getIn(values, path) as string;
    return (
      <TimeField
        label={label}
        required
        value={value ? dayjs(`2000-01-01T${value}`) : null}
        onChange={(next) => setFieldValue(path, next && next.isValid() ? next.format('HH:mm') : '')}
        format="HH:mm"
        ampm={false}
        slotProps={{
          textField: {
            error: Boolean(errorOf(path)),
            helperText: errorOf(path),
            onBlur: () => setFieldTouched(path, true),
          },
        }}
        sx={{ width: '100%' }}
      />
    );
  };

  const slotErrors = values.additional_slots.some((_, index) =>
    ['role_id', 'appointment_type', 'staff_id', 'start_time', 'end_time'].some((key) =>
      errorOf(`additional_slots.${index}.${key}`),
    ),
  );

  return (
    <Stack spacing={2.5}>
      <FormSectionCard title="Opened Slot Configuration" hasError={Boolean(errorOf('offered_slot_hours'))}>
        {numberField(
          'offered_slot_hours',
          'Allow patient to select offered slots',
          'Hrs.',
          `Patients can book their appointments within ${values.offered_slot_hours || 0} hours.`,
          true,
        )}
      </FormSectionCard>

      <FormSectionCard title="Appointment Reminder Settings">
        <Grid container spacing={2}>
          {(
            [
              ['sms_reminder', 'Send SMS Reminder', 'SMS'],
              ['email_reminder', 'Send Email Reminder', 'Email'],
            ] as const
          ).map(([path, label, kind]) => (
            <Grid key={path} size={{ xs: 12, md: 6 }}>
              <TextField
                select
                {...field(path, label, false)}
                helperText={reminderHelper(kind, values[path])}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                {REMINDERS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}
        </Grid>
      </FormSectionCard>

      <FormSectionCard
        title="Cancellation & Reschedule Policy"
        hasError={Boolean(errorOf('min_cancellation_hours') || errorOf('min_reschedule_hours'))}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {numberField(
              'min_cancellation_hours',
              'Minimum Cancellation Notice',
              'Hrs.',
              `Patients must cancel at least ${values.min_cancellation_hours || 0} hours before their appointment.`,
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {numberField(
              'min_reschedule_hours',
              'Minimum Reschedule Notice',
              'Hrs.',
              `Patients must reschedule at least ${values.min_reschedule_hours || 0} hours before their appointment.`,
            )}
          </Grid>
        </Grid>
        <Stack sx={{ mt: 1.5 }}>
          {checkbox('enable_video_appointments', 'Enable Video Appointments')}
          {checkbox('notify_staff_on_cancel', 'Notify staff when a client cancels')}
          {checkbox('show_clinician_name', 'Show clinician name to patients')}
          {checkbox('reopen_cancelled_slot', 'Re-open cancelled slot for immediate booking')}
        </Stack>
      </FormSectionCard>

      <FormSectionCard
        title="Appointment Booking Configuration"
        hasError={Boolean(errorOf('max_advance_booking_days'))}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {numberField(
              'max_advance_booking_days',
              'Max Advance Booking Period',
              'Days',
              `Patients can book up to ${values.max_advance_booking_days || 0} days ahead.`,
              true,
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minHeight: 56 }}>
              <Typography id="same-day-label" sx={{ fontSize: 14, fontWeight: 500 }}>
                Same Day Booking
              </Typography>
              <AppSwitch
                checked={values.same_day_booking}
                onChange={(event) => setFieldValue('same_day_booking', event.target.checked)}
                slotProps={{ input: { 'aria-labelledby': 'same-day-label' } }}
              />
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                {values.same_day_booking ? 'Allowed' : 'Not Allowed'}
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>{channelSelect('urgent_booking', 'Urgent')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{channelSelect('routine_booking', 'Routine')}</Grid>
        </Grid>
        <Box sx={{ mt: 1.5 }}>
          {checkbox('require_manager_approval', 'Require Manager Approval for alternative appointments')}
        </Box>
      </FormSectionCard>

      <FormSectionCard title="Urgent Capacity Threshold" hasError={values.urgent_capacity.some((day) => dayError(day))}>
        {WEEK.map(({ key, label }, index) => (
          <OperatingHoursRow
            key={key}
            dayKey={`urgent-${key}`}
            label={label}
            hours={toDayHours(values.urgent_capacity[index])}
            onChange={(hours) => setFieldValue(`urgent_capacity.${index}`, fromDayHours(key, hours))}
            error={dayError(values.urgent_capacity[index])}
          />
        ))}
        <Box sx={{ mt: 2, maxWidth: { md: 'calc(50% - 8px)' } }}>
          <TextField
            select
            {...field('extra_appointments', 'Extra Appointments')}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {EXTRA_APPOINTMENTS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </FormSectionCard>

      <FieldArray name="additional_slots">
        {(helpers) => (
          <FormSectionCard
            title="Additional Slot Duration"
            hasError={slotErrors}
            actions={
              <Button
                variant="contained"
                color="brand"
                size="small"
                startIcon={<Add />}
                onClick={() =>
                  helpers.push({ role_id: '', appointment_type: '', staff_id: '', start_time: '', end_time: '' })
                }
                sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 2 })}
              >
                Add Another Slot
              </Button>
            }
          >
            <Stack spacing={1.5}>
              {values.additional_slots.length === 0 && (
                <Typography variant="body2">No additional slots configured.</Typography>
              )}
              {values.additional_slots.map((slot, index) => {
                const path = `additional_slots.${index}`;
                const staff = staffByRole[slot.role_id] ?? [];
                return (
                  <RepeatableItemCard
                    key={index}
                    title={`Additional Slot Duration ${index + 1}`}
                    icon={<TuneOutlined fontSize="small" />}
                    onDelete={() => helpers.remove(index)}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          select
                          {...field(`${path}.role_id`, 'Role')}
                          onChange={(event) => {
                            setFieldValue(`${path}.role_id`, event.target.value);
                            setFieldValue(`${path}.staff_id`, '');
                          }}
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          select
                          {...field(`${path}.appointment_type`, 'Appointment Type')}
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          {SLOT_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          select
                          {...field(`${path}.staff_id`, 'Staff')}
                          disabled={!slot.role_id}
                          helperText={errorOf(`${path}.staff_id`) ?? (slot.role_id ? undefined : 'Select role first')}
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          {staff.map((member) => (
                            <MenuItem key={member.id} value={member.id}>
                              {member.first_name} {member.last_name}
                            </MenuItem>
                          ))}
                          {slot.staff_id && !staff.some((member) => member.id === slot.staff_id) && (
                            <MenuItem value={slot.staff_id} disabled>
                              Loading...
                            </MenuItem>
                          )}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>{timeField(`${path}.start_time`, 'Start Time')}</Grid>
                      <Grid size={{ xs: 12, md: 6 }}>{timeField(`${path}.end_time`, 'End Time')}</Grid>
                    </Grid>
                  </RepeatableItemCard>
                );
              })}
            </Stack>
          </FormSectionCard>
        )}
      </FieldArray>
    </Stack>
  );
}
