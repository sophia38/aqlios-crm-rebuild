'use client';

import { useEffect, useState } from 'react';
import { FieldArray, Formik, getIn, useFormikContext } from 'formik';
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
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { OperatingHoursRow } from '@/components/forms/OperatingHoursRow';
import { RepeatableItemCard } from '@/components/forms/RepeatableItemCard';
import { ToggleOptionRow } from '@/components/forms/ToggleOptionRow';
import { BOOKING_CHANNELS } from '@/features/practices/practiceForm';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { settingsApi } from '@/lib/api/settings';
import type { GlobalAppointmentType, GlobalPracticeConfiguration } from '@/lib/api/types';
import {
  dayError,
  digits,
  fromDayHours,
  SectionActions,
  SectionTag,
  toDayHours,
  useRoles,
  WEEK,
} from './settingsShared';
import { LoadFailed } from './LoadFailed';

const TYPE_LABEL: Record<GlobalAppointmentType, string> = { FACE_TO_FACE: 'Face-to-Face', CALL: 'Call' };
const MESSAGE_MAX = 300;

/** Durations are text while editing (digits only) and numbers in the API. */
type Values = Omit<GlobalPracticeConfiguration, 'slot_durations'> & {
  slot_durations: { role_id: string; appointment_type: GlobalAppointmentType | ''; duration_minutes: string }[];
};

const toValues = (config: GlobalPracticeConfiguration): Values => ({
  ...config,
  slot_durations: config.slot_durations.map((slot) => ({ ...slot, duration_minutes: String(slot.duration_minutes) })),
});

const toConfig = (values: Values): GlobalPracticeConfiguration => ({
  ...values,
  slot_durations: values.slot_durations.map((slot) => ({
    role_id: slot.role_id,
    appointment_type: slot.appointment_type as GlobalAppointmentType,
    duration_minutes: Number(slot.duration_minutes),
  })),
  closed_message_clinical: values.closed_message_clinical.trim(),
  closed_message_non_clinical: values.closed_message_non_clinical.trim(),
});

const schema = Yup.object({
  appointment_types: Yup.array().test('default', 'Select a default appointment type.', (types) =>
    (types as Values['appointment_types']).some((type) => type.enabled && type.is_default),
  ),
  slot_durations: Yup.array().of(
    Yup.object({
      role_id: Yup.string().required('Role is required'),
      appointment_type: Yup.string().required('Appointment type is required'),
      duration_minutes: Yup.string()
        .required('Duration is required')
        .test(
          'positive',
          'Enter a duration from 1 to 480 minutes',
          (value) => Number(value) >= 1 && Number(value) <= 480,
        ),
    }),
  ),
  operating_hours: Yup.array().test('hours', 'Closing time must be after opening time', (days) =>
    (days as Values['operating_hours']).every((day) => !dayError(day)),
  ),
  closed_message_clinical: Yup.string().trim().required('Message is required').max(MESSAGE_MAX),
  closed_message_non_clinical: Yup.string().trim().required('Message is required').max(MESSAGE_MAX),
});

/** Global Practice Configuration (docs/super-admin/09-settings.md §1). */
export function GlobalPracticeConfigSection() {
  const { enqueueSnackbar } = useSnackbar();
  const [config, setConfig] = useState<GlobalPracticeConfiguration | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    settingsApi
      .practiceConfiguration(PUBLIC_SUB_APP_ID, controller.signal)
      .then((result) => {
        setConfig(result);
        setFailed(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
        enqueueSnackbar('Failed to load global practice configuration', { variant: 'error' });
      });
    return () => controller.abort();
  }, [reloadKey, enqueueSnackbar]);

  if (failed) return <LoadFailed what="global practice configuration" onRetry={() => setReloadKey((key) => key + 1)} />;
  if (!config) return <LoadingSpinner message="Loading configuration..." />;

  return (
    <Formik
      initialValues={toValues(config)}
      validationSchema={schema}
      onSubmit={async (values, helpers) => {
        try {
          const saved = await settingsApi.savePracticeConfiguration(PUBLIC_SUB_APP_ID, toConfig(values));
          helpers.resetForm({ values: toValues(saved) });
          enqueueSnackbar('Global practice configuration updated successfully', { variant: 'success' });
        } catch (error) {
          enqueueSnackbar(
            error instanceof ApiError && error.code === 400
              ? error.message
              : 'Failed to save global practice configuration',
            { variant: 'error' },
          );
        }
      }}
    >
      {(formik) => (
        <Box component="form" noValidate onSubmit={formik.handleSubmit}>
          <SectionActions />
          <PracticeConfigFields />
        </Box>
      )}
    </Formik>
  );
}

function PracticeConfigFields() {
  const { values, errors, touched, submitCount, setFieldValue, handleChange, handleBlur } = useFormikContext<Values>();
  const roles = useRoles();
  const shown = (path: string) => submitCount > 0 || Boolean(getIn(touched, path));
  const errorOf = (path: string) => {
    const error = getIn(errors, path);
    return shown(path) && typeof error === 'string' ? error : undefined;
  };
  const typesError =
    submitCount > 0 && typeof errors.appointment_types === 'string' ? errors.appointment_types : undefined;
  const enabledTypes = values.appointment_types.filter((type) => type.enabled);
  const slotErrors = values.slot_durations.some((_, index) =>
    ['role_id', 'appointment_type', 'duration_minutes'].some((field) => errorOf(`slot_durations.${index}.${field}`)),
  );
  const hoursError = values.operating_hours.some((day) => dayError(day));

  const field = (path: string, label: string, extra: object = {}) => ({
    id: path,
    name: path,
    label,
    required: true,
    value: getIn(values, path) ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: Boolean(errorOf(path)),
    helperText: errorOf(path),
    slotProps: { inputLabel: { shrink: true } },
    ...extra,
  });

  const message = (
    path: 'closed_message_clinical' | 'closed_message_non_clinical',
    heading: string,
    advice: string,
  ) => (
    <Box>
      <Typography component="h3" sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
        {heading}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {advice}
      </Typography>
      <TextField
        {...field(path, 'Message')}
        multiline
        minRows={3}
        helperText={errorOf(path) ?? `Character limit: ${values[path].length}/${MESSAGE_MAX}`}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: MESSAGE_MAX } }}
      />
    </Box>
  );

  return (
    <Stack spacing={2.5}>
      <FormSectionCard
        title={
          <>
            Appointment Type Configuration
            <SectionTag>Mandatory</SectionTag>
          </>
        }
        hasError={Boolean(typesError)}
      >
        <Alert severity="warning" sx={{ mb: 2 }}>
          Only enabled appointment types will be available for booking. You must configure at least one appointment type
          as default.
        </Alert>
        <Stack spacing={1.25}>
          {values.appointment_types.map((type, index) => (
            <ToggleOptionRow
              key={type.type}
              label={TYPE_LABEL[type.type]}
              enabled={type.enabled}
              onEnabledChange={(enabled) =>
                setFieldValue(
                  'appointment_types',
                  values.appointment_types.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, enabled, is_default: enabled && item.is_default } : item,
                  ),
                )
              }
              isDefault={type.is_default}
              onSetDefault={() =>
                setFieldValue(
                  'appointment_types',
                  values.appointment_types.map((item, itemIndex) => ({ ...item, is_default: itemIndex === index })),
                )
              }
            />
          ))}
        </Stack>
        {typesError && (
          <Typography role="alert" sx={{ mt: 1, fontSize: 12, color: 'error.main' }}>
            {typesError}
          </Typography>
        )}
      </FormSectionCard>

      <FieldArray name="slot_durations">
        {(helpers) => (
          <FormSectionCard
            title={
              <>
                Slot Duration Configuration
                <SectionTag>Optional</SectionTag>
              </>
            }
            hasError={slotErrors}
            actions={
              <Button
                variant="contained"
                color="brand"
                size="small"
                startIcon={<Add />}
                onClick={() => helpers.push({ role_id: '', appointment_type: '', duration_minutes: '' })}
                sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 2 })}
              >
                Add Another Slot
              </Button>
            }
          >
            <Typography variant="body2" sx={{ mb: 2 }}>
              Configure slot durations per Practice + Role + Appointment Type combination
            </Typography>
            <Stack spacing={1.5}>
              {values.slot_durations.length === 0 && (
                <Typography variant="body2">No slot durations configured.</Typography>
              )}
              {values.slot_durations.map((slot, index) => {
                const path = `slot_durations.${index}`;
                return (
                  <RepeatableItemCard
                    key={index}
                    title={`Slot Duration ${index + 1}`}
                    icon={<TuneOutlined fontSize="small" />}
                    onDelete={() => helpers.remove(index)}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField select {...field(`${path}.role_id`, 'Role')}>
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField select {...field(`${path}.appointment_type`, 'Appointment Type')}>
                          {enabledTypes.map((type) => (
                            <MenuItem key={type.type} value={type.type}>
                              {TYPE_LABEL[type.type]}
                            </MenuItem>
                          ))}
                          {slot.appointment_type &&
                            !enabledTypes.some((type) => type.type === slot.appointment_type) && (
                              <MenuItem value={slot.appointment_type} disabled>
                                {TYPE_LABEL[slot.appointment_type]} (disabled)
                              </MenuItem>
                            )}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          {...field(`${path}.duration_minutes`, 'Duration (Mins)')}
                          onChange={(event) => setFieldValue(`${path}.duration_minutes`, digits(event.target.value, 3))}
                          slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: 'numeric' } }}
                        />
                      </Grid>
                    </Grid>
                  </RepeatableItemCard>
                );
              })}
            </Stack>
          </FormSectionCard>
        )}
      </FieldArray>

      <FormSectionCard title="Appointment Booking Configuration">
        <Grid container spacing={2}>
          {(['urgent_booking', 'routine_booking'] as const).map((path) => (
            <Grid key={path} size={{ xs: 12, md: 6 }}>
              <TextField select {...field(path, path === 'urgent_booking' ? 'Urgent' : 'Routine')}>
                {BOOKING_CHANNELS.map((channel) => (
                  <MenuItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}
        </Grid>
      </FormSectionCard>

      <FormSectionCard title="Operating Hours" hasError={hoursError}>
        {WEEK.map(({ key, label }, index) => (
          <OperatingHoursRow
            key={key}
            dayKey={`global-${key}`}
            label={label}
            hours={toDayHours(values.operating_hours[index])}
            onChange={(hours) => setFieldValue(`operating_hours.${index}`, fromDayHours(key, hours))}
            error={dayError(values.operating_hours[index])}
          />
        ))}
      </FormSectionCard>

      <FormSectionCard
        title="Custom practice closed messages"
        hasError={Boolean(errorOf('closed_message_clinical') || errorOf('closed_message_non_clinical'))}
      >
        <Typography variant="body2" sx={{ mb: 2.5 }}>
          These are messages you can set to appear when practice is closed for clinical and non-clinical requests.
        </Typography>
        <Stack spacing={3}>
          {message(
            'closed_message_clinical',
            'Message for clinical requests',
            'We recommend including guidance on where to get urgent help, for example: call 111.',
          )}
          {message(
            'closed_message_non_clinical',
            'Message for non-clinical requests',
            'We recommend telling patients when the practice will reply to their request.',
          )}
        </Stack>
      </FormSectionCard>
    </Stack>
  );
}
