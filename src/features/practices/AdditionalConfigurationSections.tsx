'use client';

import { FieldArray, getIn, useFormikContext } from 'formik';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { OperatingHoursRow } from '@/components/forms/OperatingHoursRow';
import { RepeatableItemCard } from '@/components/forms/RepeatableItemCard';
import { RotaGroupSelect } from '@/components/forms/RotaGroupSelect';
import { ToggleOptionRow } from '@/components/forms/ToggleOptionRow';
import type { Role } from '@/lib/api/types';
import { useFieldError, useSectionErrors, useTextField } from './formHelpers';
import {
  APPOINTMENT_TYPE_LABELS,
  BOOKING_CHANNELS,
  DAYS,
  EXTRA_APPOINTMENTS,
  FREQUENCIES,
  STAFF_TYPES,
  type ProfileValues,
} from './practiceForm';

function Optional({ mandatory = false }: { mandatory?: boolean }) {
  return (
    <Box
      component="span"
      sx={{ ml: 0.75, fontSize: 14, fontWeight: 400, color: mandatory ? 'error.main' : 'text.secondary' }}
    >
      {mandatory ? '(Mandatory)' : '(Optional)'}
    </Box>
  );
}

export interface AdditionalConfigurationSectionsProps {
  subAppId: string;
  currentPracticeId: string;
  /** Practices that can be linked as sites (all visible practices except this one). */
  practiceOptions: { id: string; practice_name: string }[];
  roles: Role[];
}

/** "Additional Configuration" area of the practice profile (docs/super-admin/04-practice-profile.md). */
export function AdditionalConfigurationSections({
  subAppId,
  currentPracticeId,
  practiceOptions,
  roles,
}: AdditionalConfigurationSectionsProps) {
  const formik = useFormikContext<ProfileValues>();
  const { values, setFieldValue, setFieldTouched, submitCount } = formik;
  const text = useTextField();
  const errorOf = useFieldError();
  const sectionErrors = useSectionErrors();
  const shrink = { inputLabel: { shrink: true } };
  const enabledTypes = values.appointment_types.filter((type) => type.enabled);
  const linkOptions = practiceOptions.filter((practice) => practice.id !== currentPracticeId);
  const appointmentTypesError = submitCount > 0 ? errorOf('appointment_types') : undefined;

  const dateValue = (value: string) => (value ? dayjs(value) : null);
  const setDate = (field: string) => (next: dayjs.Dayjs | null) => {
    void setFieldValue(field, next && next.isValid() ? next.format('YYYY-MM-DD') : '');
    void setFieldTouched(field, true, false);
  };

  return (
    <Stack spacing={2.5}>
      <Divider sx={{ my: 1 }}>
        <Box
          component="span"
          sx={(theme) => ({
            px: 2,
            py: 0.5,
            borderRadius: `${theme.tokens.radius.pill}px`,
            bgcolor: theme.tokens.control.sectionDividerPill,
            color: 'text.secondary',
            fontSize: 13,
            fontWeight: 500,
          })}
        >
          Additional Configuration
        </Box>
      </Divider>

      <FormSectionCard
        title={
          <>
            Rota groups
            <Optional />
          </>
        }
      >
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select one or more rota groups to associate with.
        </Typography>
        <RotaGroupSelect
          subAppId={subAppId}
          value={values.rota_group_ids}
          onChange={(ids) => setFieldValue('rota_group_ids', ids)}
        />
      </FormSectionCard>

      <FormSectionCard
        title={
          <>
            Linked Practices
            <Optional />
          </>
        }
      >
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select one or more practices from dropdown to link as a site.
        </Typography>
        <Autocomplete
          multiple
          options={linkOptions}
          value={linkOptions.filter((practice) => values.linked_practice_ids.includes(practice.id))}
          onChange={(_, next) =>
            setFieldValue(
              'linked_practice_ids',
              next.map((practice) => practice.id),
            )
          }
          getOptionLabel={(practice) => practice.practice_name}
          isOptionEqualToValue={(option, current) => option.id === current.id}
          noOptionsText="No practices found."
          renderValue={(items, getItemProps) =>
            items.map((practice, index) => {
              const { key, ...props } = getItemProps({ index });
              return (
                <Chip
                  key={key}
                  {...props}
                  size="small"
                  label={practice.practice_name}
                  sx={(theme) => ({ bgcolor: theme.tokens.surface.tealLight, color: 'primary.main' })}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Practice(s)"
              slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps.inputLabel, shrink: true } }}
            />
          )}
        />
      </FormSectionCard>

      <FormSectionCard
        title="Practice Succession Date"
        hasError={sectionErrors.has('succession')}
        expanded={submitCount > 0 && sectionErrors.has('succession') ? true : undefined}
      >
        <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label="Start Date"
              format="DD/MM/YYYY"
              value={dateValue(values.succession_start_date)}
              onChange={setDate('succession_start_date')}
              slotProps={{
                textField: {
                  id: 'succession_start_date',
                  required: true,
                  fullWidth: true,
                  error: Boolean(errorOf('succession_start_date')),
                  helperText: errorOf('succession_start_date'),
                  onBlur: () => setFieldTouched('succession_start_date', true),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.succession_ongoing}
                  sx={{ '&.Mui-checked': { color: 'primary.main' } }}
                  onChange={(event) => setFieldValue('succession_ongoing', event.target.checked)}
                />
              }
              label="Ongoing"
            />
          </Grid>
          {!values.succession_ongoing && (
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="End Date"
                format="DD/MM/YYYY"
                value={dateValue(values.succession_end_date)}
                onChange={setDate('succession_end_date')}
                minDate={dateValue(values.succession_start_date) ?? undefined}
                slotProps={{
                  textField: {
                    id: 'succession_end_date',
                    required: true,
                    fullWidth: true,
                    error: Boolean(errorOf('succession_end_date')),
                    helperText: errorOf('succession_end_date'),
                    onBlur: () => setFieldTouched('succession_end_date', true),
                  },
                }}
              />
            </Grid>
          )}
        </Grid>
      </FormSectionCard>

      <FieldArray name="workforce_allocations">
        {(helpers) => (
          <FormSectionCard
            title={
              <>
                Workforce Allocation Configuration
                <Optional />
              </>
            }
            hasError={sectionErrors.has('workforce')}
          >
            <Stack spacing={2}>
              {values.workforce_allocations.map((_, index) => {
                const path = `workforce_allocations.${index}`;
                return (
                  <RepeatableItemCard
                    key={index}
                    title={`Workforce Allocation ${index + 1}`}
                    icon={<BadgeOutlined fontSize="small" />}
                    onDelete={() => helpers.remove(index)}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          {...text(`${path}.staff_type`)}
                          select
                          label="Staff Type"
                          required
                          slotProps={{ ...shrink, select: { displayEmpty: true } }}
                        >
                          <MenuItem value="" disabled>
                            Select staff type
                          </MenuItem>
                          {STAFF_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          {...text(`${path}.frequency`)}
                          select
                          label="Frequency"
                          required
                          slotProps={{ ...shrink, select: { displayEmpty: true } }}
                        >
                          <MenuItem value="" disabled>
                            Select frequency
                          </MenuItem>
                          {FREQUENCIES.map((frequency) => (
                            <MenuItem key={frequency.value} value={frequency.value}>
                              {frequency.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          {...text(`${path}.hours`)}
                          type="number"
                          label="Hours"
                          required
                          placeholder="e.g. 8"
                          slotProps={{ ...shrink, htmlInput: { min: 0, step: 0.25 } }}
                        />
                      </Grid>
                    </Grid>
                  </RepeatableItemCard>
                );
              })}
              <Button
                variant="text"
                startIcon={<AddCircleOutline />}
                onClick={() => helpers.push({ staff_type: '', frequency: '', hours: '' })}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add hours for another staff type
              </Button>
            </Stack>
          </FormSectionCard>
        )}
      </FieldArray>

      <FormSectionCard
        title={
          <>
            Appointment Type Configuration
            <Optional mandatory />
          </>
        }
        hasError={Boolean(appointmentTypesError)}
      >
        <Alert severity="warning" sx={{ mb: 2 }}>
          Only enabled appointment types will be available for booking. You must configure at least one appointment type
          as default.
        </Alert>
        <Stack spacing={1.25} data-section-error={appointmentTypesError ? 'true' : undefined} tabIndex={-1}>
          {values.appointment_types.map((type, index) => (
            <ToggleOptionRow
              key={type.type}
              label={APPOINTMENT_TYPE_LABELS[type.type]}
              enabled={type.enabled}
              locked={type.locked}
              isDefault={type.is_default}
              onEnabledChange={(enabled) =>
                setFieldValue(
                  'appointment_types',
                  values.appointment_types.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, enabled, is_default: enabled ? item.is_default : false } : item,
                  ),
                )
              }
              onSetDefault={() =>
                setFieldValue(
                  'appointment_types',
                  values.appointment_types.map((item, itemIndex) => ({ ...item, is_default: itemIndex === index })),
                )
              }
            />
          ))}
        </Stack>
        {appointmentTypesError && (
          <Typography role="alert" sx={{ mt: 1, fontSize: 12, color: 'error.main' }}>
            {appointmentTypesError}
          </Typography>
        )}
      </FormSectionCard>

      <FieldArray name="slot_durations">
        {(helpers) => (
          <FormSectionCard title="Slot Duration Configuration" hasError={sectionErrors.has('slots')}>
            <Stack spacing={2}>
              {values.slot_durations.map((slot, index) => {
                const path = `slot_durations.${index}`;
                return (
                  <RepeatableItemCard
                    key={index}
                    title={`Slot Duration ${index + 1}`}
                    icon={<AccessTimeOutlined fontSize="small" />}
                    onDelete={index === 0 ? undefined : () => helpers.remove(index)}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          {...text(`${path}.role_id`)}
                          select
                          label="Role"
                          required
                          slotProps={{ ...shrink, select: { displayEmpty: true } }}
                        >
                          <MenuItem value="" disabled>
                            Select role
                          </MenuItem>
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          {...text(`${path}.appointment_type`)}
                          select
                          label="Appointment Type"
                          required
                          slotProps={{ ...shrink, select: { displayEmpty: true } }}
                        >
                          <MenuItem value="" disabled>
                            Select appointment type
                          </MenuItem>
                          {enabledTypes.map((type) => (
                            <MenuItem key={type.type} value={type.type}>
                              {APPOINTMENT_TYPE_LABELS[type.type]}
                            </MenuItem>
                          ))}
                          {slot.appointment_type &&
                            !enabledTypes.some((type) => type.type === slot.appointment_type) && (
                              <MenuItem value={slot.appointment_type} disabled>
                                {APPOINTMENT_TYPE_LABELS[slot.appointment_type]} (disabled)
                              </MenuItem>
                            )}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          {...text(`${path}.duration_minutes`)}
                          label="Duration (minutes)"
                          required
                          placeholder="e.g. 15"
                          helperText={errorOf(`${path}.duration_minutes`) ?? 'In minutes'}
                          onChange={(event) =>
                            setFieldValue(`${path}.duration_minutes`, event.target.value.replace(/\D/g, '').slice(0, 5))
                          }
                          slotProps={{ ...shrink, htmlInput: { inputMode: 'numeric' } }}
                        />
                      </Grid>
                    </Grid>
                  </RepeatableItemCard>
                );
              })}
              <Button
                variant="text"
                startIcon={<AddCircleOutline />}
                onClick={() => helpers.push({ role_id: '', appointment_type: '', duration_minutes: '' })}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add another slot duration configuration
              </Button>
            </Stack>
          </FormSectionCard>
        )}
      </FieldArray>

      <FormSectionCard title="Appointment Booking Configuration">
        <Grid container spacing={2.5}>
          {(['urgent_booking', 'routine_booking'] as const).map((field) => (
            <Grid key={field} size={{ xs: 12, md: 6 }}>
              <TextField
                {...text(field)}
                select
                label={field === 'urgent_booking' ? 'Urgent' : 'Routine'}
                slotProps={shrink}
              >
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

      <FormSectionCard title="Urgent Capacity Threshold" hasError={sectionErrors.has('urgent')}>
        <Box
          sx={(theme) => ({
            px: 2,
            py: 1,
            mb: 2.5,
            borderRadius: `${theme.tokens.radius.input}px`,
            border: `1px solid ${theme.tokens.border.medium}`,
          })}
        >
          {DAYS.map(({ key, label }) => (
            <OperatingHoursRow
              key={key}
              dayKey={`urgent-${key}`}
              label={label}
              hours={values.urgent_capacity[key]}
              onChange={(hours) => setFieldValue(`urgent_capacity.${key}`, hours)}
              // Time-order errors show as soon as the times change (no blur on these fields).
              error={getIn(formik.errors, `urgent_capacity.${key}`) as string | undefined}
            />
          ))}
        </Box>
        <TextField {...text('extra_appointments')} select label="Extra appointments" slotProps={shrink}>
          {EXTRA_APPOINTMENTS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </FormSectionCard>
    </Stack>
  );
}
