'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormik, type FormikProps } from 'formik';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Add from '@mui/icons-material/Add';
import CalendarToday from '@mui/icons-material/CalendarTodayOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import Search from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { StatusChip } from '@/components/data/StatusChip';
import { AppSwitch } from '@/components/forms/AppSwitch';
import { RotaGroupSelect } from '@/components/forms/RotaGroupSelect';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { FormDrawer } from '@/components/modals/FormDrawer';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { APPOINTMENT_KIND_LABELS } from '@/lib/api/appointments';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { DUTY_TYPE_LABELS, rotaApi, SHIFT_URGENCY_LABELS } from '@/lib/api/rota';
import {
  APPOINTMENT_KINDS,
  type AppointmentKind,
  type AssignmentScope,
  type DayKey,
  type DutyType,
  type RotaStaff,
  type Shift,
  type ShiftUrgency,
} from '@/lib/api/types';
import { useRoles } from '@/lib/useRoles';
import { CapacityCard } from './CapacityCard';

const DAYS: { key: DayKey; letter: string; name: string }[] = [
  { key: 'MONDAY', letter: 'M', name: 'Monday' },
  { key: 'TUESDAY', letter: 'T', name: 'Tuesday' },
  { key: 'WEDNESDAY', letter: 'W', name: 'Wednesday' },
  { key: 'THURSDAY', letter: 'T', name: 'Thursday' },
  { key: 'FRIDAY', letter: 'F', name: 'Friday' },
  { key: 'SATURDAY', letter: 'S', name: 'Saturday' },
  { key: 'SUNDAY', letter: 'S', name: 'Sunday' },
];
const DAY_BY_INDEX: DayKey[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DUTIES = Object.keys(DUTY_TYPE_LABELS) as DutyType[];
const URGENCIES = Object.keys(SHIFT_URGENCY_LABELS) as ShiftUrgency[];
const SCOPES: { value: AssignmentScope; label: string }[] = [
  { value: 'CURRENT', label: 'Current Assignment' },
  { value: 'FOLLOWING', label: 'Current and Following Assignment' },
  { value: 'ALL', label: 'All Assignments' },
];

const minutes = (time: string) => {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
};
const hoursOf = (slots: { start_time: string; end_time: string }[]) =>
  slots.reduce(
    (sum, slot) =>
      slot.start_time && slot.end_time
        ? sum + Math.max(0, minutes(slot.end_time) - minutes(slot.start_time)) / 60
        : sum,
    0,
  );
const round = (value: number) => Math.round(value * 100) / 100;

const slotSchema = Yup.object({
  start_time: Yup.string().required('Start time is required'),
  end_time: Yup.string()
    .required('End time is required')
    .test('after', 'End time must be after the start time', function check(value) {
      return !value || !this.parent.start_time || value > this.parent.start_time;
    }),
});
const breakTest = Yup.string().test('break', 'Enter a break inside the shift (start before end)', function check() {
  const {
    break_start: start,
    break_end: end,
    slots,
  } = this.parent as {
    break_start: string;
    break_end: string;
    slots: { start_time: string; end_time: string }[];
  };
  if (!start && !end) return true;
  if (!start || !end || end <= start) return false;
  return slots.some((slot) => start >= slot.start_time && end <= slot.end_time);
});
const shared = {
  duty_type: Yup.string().required('Duty Type is required'),
  appointment_types: Yup.array().min(1, 'Appointment Type is required'),
  urgencies: Yup.array().min(1, 'Routine / Urgent is required'),
  break_end: breakTest,
};

/** What opened the drawer: an empty slot (with the dragged range) or a shift. */
export type AssignmentTarget =
  { kind: 'new'; date: string; start: string; end: string } | { kind: 'edit'; shift: Shift };

/**
 * Assign Staff / Publish Slot / Edit Assignment (COMPONENTS.md → AssignmentDrawer; captured in
 * docs/practice/06-rota-management.md). Used by the practice and the vertical ROTA. Fixes: duty
 * type is required, the date chip shows the clicked day, and submit stays disabled until valid.
 */
export function AssignmentDrawer({
  target,
  practice,
  canPublish,
  onClose,
  onSaved,
}: {
  target: AssignmentTarget | null;
  /** The practice the slot belongs to (the vertical ROTA passes the selected practice, if any). */
  practice: { id: string; practice_name: string } | null;
  /** Managers can publish a slot for bidding. */
  canPublish: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<'assign' | 'publish'>('assign');
  const open = target !== null;
  const editing = target?.kind === 'edit';
  const date = target ? (target.kind === 'new' ? target.date : target.shift.date) : '';
  const title = editing ? 'Edit Assignment' : mode === 'publish' ? 'Publish Slot' : 'Assign Staff';

  return (
    <FormDrawer
      open={open}
      title={title}
      onClose={() => {
        setMode('assign');
        onClose();
      }}
    >
      {target && (
        <Stack spacing={2.5}>
          {!editing && canPublish && (
            <SegmentedTabs<'assign' | 'publish'>
              aria-label="Assign or publish"
              fullWidth
              value={mode}
              onChange={setMode}
              items={[
                { value: 'assign', label: 'Assign Staff' },
                { value: 'publish', label: 'Publish Slot' },
              ]}
            />
          )}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
            <StatusChip
              status={dayjs(date).format('ddd, D MMM YYYY')}
              tone="primary"
              variant="outlined"
              icon={<CalendarToday fontSize="inherit" />}
            />
            {(practice || target.kind === 'edit') && (
              <Typography variant="body2">
                {target.kind === 'edit' ? target.shift.practice_name : practice?.practice_name}
              </Typography>
            )}
          </Stack>
          {target.kind === 'edit' ? (
            <EditForm key={target.shift.id} shift={target.shift} onClose={onClose} onSaved={onSaved} />
          ) : !practice ? (
            <Alert severity="info">Select a practice in the side panel first, then choose a slot.</Alert>
          ) : mode === 'publish' ? (
            <PublishForm
              key={`${date}-${target.start}`}
              target={target}
              practiceId={practice.id}
              onClose={onClose}
              onSaved={onSaved}
            />
          ) : (
            <AssignForm
              key={`${date}-${target.start}`}
              target={target}
              practiceId={practice.id}
              onClose={onClose}
              onSaved={onSaved}
            />
          )}
        </Stack>
      )}
    </FormDrawer>
  );
}

// ---------------------------------------------------------------- shared fields

type ShiftFields = {
  duty_type: DutyType | '';
  appointment_types: AppointmentKind[];
  urgencies: ShiftUrgency[];
  break_start: string;
  break_end: string;
};

function errorOf<V>(formik: FormikProps<V>, name: string) {
  const pick = (source: unknown) =>
    name.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], source);
  const touched = pick(formik.touched);
  const error = pick(formik.errors);
  return (touched || formik.submitCount > 0) && typeof error === 'string' ? error : undefined;
}

function TimeInput<V>({
  formik,
  name,
  label,
  disabled,
}: {
  formik: FormikProps<V>;
  name: string;
  label: string;
  disabled?: boolean;
}) {
  const error = errorOf(formik, name);
  return (
    <TextField
      type="time"
      size="small"
      label={label}
      {...formik.getFieldProps(name)}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error}
      slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 900 } }}
      sx={{ flex: 1, minWidth: 120 }}
    />
  );
}

function multiSelect<V, T extends string>(
  formik: FormikProps<V>,
  name: string,
  label: string,
  options: T[],
  labels: Record<T, string>,
) {
  const value = (formik.values as Record<string, T[]>)[name];
  const error = errorOf(formik, name);
  return (
    <TextField
      select
      fullWidth
      required
      label={label}
      value={value}
      onChange={(event) => void formik.setFieldValue(name, event.target.value as unknown as T[])}
      onBlur={() => void formik.setFieldTouched(name, true)}
      error={Boolean(error)}
      helperText={error}
      slotProps={{
        select: { multiple: true, renderValue: (selected) => (selected as T[]).map((item) => labels[item]).join(', ') },
      }}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          <Checkbox size="small" checked={value.includes(option)} />
          <ListItemText primary={labels[option]} />
        </MenuItem>
      ))}
    </TextField>
  );
}

function ShiftDetailsFields<V extends ShiftFields>({ formik }: { formik: FormikProps<V> }) {
  const dutyError = errorOf(formik, 'duty_type');
  return (
    <>
      <TextField
        select
        fullWidth
        required
        label="Duty Type for this shift"
        {...formik.getFieldProps('duty_type')}
        error={Boolean(dutyError)}
        helperText={dutyError}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="" disabled>
          Select duty type
        </MenuItem>
        {DUTIES.map((duty) => (
          <MenuItem key={duty} value={duty}>
            {DUTY_TYPE_LABELS[duty]}
          </MenuItem>
        ))}
      </TextField>
      {multiSelect(formik, 'appointment_types', 'Appointment Type', [...APPOINTMENT_KINDS], APPOINTMENT_KIND_LABELS)}
      {multiSelect(formik, 'urgencies', 'Routine / Urgent', URGENCIES, SHIFT_URGENCY_LABELS)}
      <Box>
        <FormLabel sx={{ fontSize: 13 }}>Enter break hours</FormLabel>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mt: 1 }}>
          <TimeInput formik={formik} name="break_start" label="Break from" />
          <Typography sx={{ pt: 1 }}>to</Typography>
          <TimeInput formik={formik} name="break_end" label="Break to" />
        </Stack>
      </Box>
    </>
  );
}

function Footer({
  submitLabel,
  disabled,
  submitting,
  onCancel,
  onSubmit,
  extra,
}: {
  submitLabel: string;
  disabled: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={(theme) => ({
        position: 'sticky',
        bottom: 0,
        py: 2,
        bgcolor: 'background.paper',
        borderTop: `1px solid ${theme.tokens.border.medium}`,
        justifyContent: 'flex-end',
      })}
    >
      {extra}
      <Box sx={{ flex: 1 }} />
      <Button variant="outlined" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="contained" onClick={onSubmit} disabled={disabled} loading={submitting}>
        {submitLabel}
      </Button>
    </Stack>
  );
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.code === 400 ? error.message : fallback;

// ---------------------------------------------------------------- Assign Staff

interface AssignValues extends ShiftFields {
  staff_id: string;
  type: 'ONCE' | 'RECURRING';
  start_date: string;
  end_date: string;
  days: DayKey[];
  slots: { start_time: string; end_time: string }[];
}

const assignSchema = Yup.object({
  staff_id: Yup.string().required('Select a staff member'),
  start_date: Yup.string().required('Start Date is required'),
  end_date: Yup.string().when('type', {
    is: 'RECURRING',
    then: (field) =>
      field
        .required('End Date is required')
        .test('after', 'End Date must be on or after the Start Date', function check(value) {
          return !value || value >= this.parent.start_date;
        }),
  }),
  days: Yup.array().when('type', { is: 'RECURRING', then: (field) => field.min(1, 'Choose at least one day') }),
  slots: Yup.array()
    .of(slotSchema)
    .min(1)
    .test('overlap', 'Shift slots must not overlap', (slots) => {
      const sorted = [...(slots ?? [])].sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
      return sorted.every(
        (slot, index) => index === 0 || String(slot.start_time) >= String(sorted[index - 1].end_time),
      );
    }),
  ...shared,
});

function AssignForm({
  target,
  practiceId,
  onClose,
  onSaved,
}: {
  target: Extract<AssignmentTarget, { kind: 'new' }>;
  practiceId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [staff, setStaff] = useState<RotaStaff[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    rotaApi
      .availableStaff(PUBLIC_SUB_APP_ID, target.date, controller.signal, practiceId)
      .then(setStaff)
      .catch(() => {
        if (controller.signal.aborted) return;
        setStaff([]);
        enqueueSnackbar('Failed to load staff', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, target.date, enqueueSnackbar]);

  const formik = useFormik<AssignValues>({
    initialValues: {
      staff_id: '',
      type: 'ONCE',
      start_date: target.date,
      end_date: dayjs(target.date).add(4, 'week').format('YYYY-MM-DD'),
      days: [DAY_BY_INDEX[dayjs(target.date).day()]],
      slots: [{ start_time: target.start, end_time: target.end }],
      duty_type: '',
      appointment_types: [],
      urgencies: [],
      break_start: '',
      break_end: '',
    },
    validationSchema: assignSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      try {
        await rotaApi.assign(PUBLIC_SUB_APP_ID, {
          staff_id: values.staff_id,
          practice_id: practiceId,
          type: values.type,
          start_date: values.start_date,
          end_date: values.type === 'RECURRING' ? values.end_date : undefined,
          days: values.type === 'RECURRING' ? values.days : undefined,
          slots: values.slots,
          duty_type: values.duty_type as DutyType,
          appointment_types: values.appointment_types,
          urgencies: values.urgencies,
          break_start: values.break_start || undefined,
          break_end: values.break_end || undefined,
        });
        enqueueSnackbar('Staff assigned', { variant: 'success' });
        onSaved();
      } catch (error) {
        enqueueSnackbar(errorMessage(error, 'Failed to assign staff'), { variant: 'error' });
      }
    },
  });

  const { values, setFieldValue } = formik;
  const shown = useMemo(
    () => (staff ?? []).filter((member) => member.name.toLowerCase().includes(search.trim().toLowerCase())),
    [staff, search],
  );
  const hours = round(hoursOf(values.slots));
  const slotsError = typeof formik.errors.slots === 'string' && formik.submitCount ? formik.errors.slots : undefined;

  return (
    <>
      <TextField
        size="small"
        label="Search"
        placeholder="Search staff..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Box>
        <Typography component="h3" sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>
          AVAILABLE STAFF ({shown.length})
        </Typography>
        <Stack spacing={1} role="radiogroup" aria-label="Available staff" sx={{ maxHeight: 260, overflowY: 'auto' }}>
          {staff === null ? (
            <Typography variant="body2">Loading staff...</Typography>
          ) : shown.length === 0 ? (
            <Typography variant="body2">No staff available</Typography>
          ) : (
            shown.map((member) => (
              <CapacityCard
                key={member.id}
                title={member.name}
                subtitle={member.working_hours}
                chip={member.role_name}
                assigned={member.assigned_hours}
                total={member.total_hours}
                selected={values.staff_id === member.id}
                onSelect={() => void setFieldValue('staff_id', member.id)}
              />
            ))
          )}
        </Stack>
      </Box>
      <Box>
        <FormLabel sx={{ fontSize: 13 }} required>
          Assignment Type
        </FormLabel>
        <Box sx={{ mt: 1 }}>
          <SegmentedTabs<'ONCE' | 'RECURRING'>
            aria-label="Assignment Type"
            size="small"
            value={values.type}
            onChange={(next) => void setFieldValue('type', next)}
            items={[
              { value: 'ONCE', label: 'Once' },
              { value: 'RECURRING', label: 'Recurring' },
            ]}
          />
        </Box>
      </Box>
      <Stack direction="row" spacing={1.5}>
        <DatePicker
          label="Start Date"
          value={dayjs(values.start_date)}
          format="DD/MM/YYYY"
          minDate={dayjs()}
          onChange={(next) => next?.isValid() && void setFieldValue('start_date', next.format('YYYY-MM-DD'))}
          slotProps={{ textField: { size: 'small', required: true, sx: { flex: 1 } } }}
        />
        {values.type === 'RECURRING' && (
          <DatePicker
            label="End Date"
            value={values.end_date ? dayjs(values.end_date) : null}
            format="DD/MM/YYYY"
            minDate={dayjs(values.start_date)}
            onChange={(next) => void setFieldValue('end_date', next?.isValid() ? next.format('YYYY-MM-DD') : '')}
            slotProps={{
              textField: {
                size: 'small',
                required: true,
                error: Boolean(errorOf(formik, 'end_date')),
                helperText: errorOf(formik, 'end_date'),
                sx: { flex: 1 },
              },
            }}
          />
        )}
      </Stack>
      {values.type === 'RECURRING' && (
        <DayCircles
          value={values.days}
          onChange={(days) => void setFieldValue('days', days)}
          error={errorOf(formik, 'days')}
        />
      )}
      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <FormLabel sx={{ fontSize: 13 }} required>
            Number of hours to assign for this shift
          </FormLabel>
          <StatusChip status={`${hours}h`} tone="primary" variant="outlined" />
        </Stack>
        <Stack spacing={1}>
          {values.slots.map((_, index) => (
            <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <TimeInput formik={formik} name={`slots.${index}.start_time`} label="From" />
              <Typography sx={{ pt: 1 }}>to</Typography>
              <TimeInput formik={formik} name={`slots.${index}.end_time`} label="To" />
              {values.slots.length > 1 && (
                <IconButton
                  aria-label={`Remove shift slot ${index + 1}`}
                  onClick={() =>
                    void setFieldValue(
                      'slots',
                      values.slots.filter((__, other) => other !== index),
                    )
                  }
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              )}
            </Stack>
          ))}
          {slotsError && (
            <Typography role="alert" sx={{ fontSize: 12, color: 'error.main' }}>
              {slotsError}
            </Typography>
          )}
          <Box>
            <Button
              size="small"
              startIcon={<Add />}
              disabled={values.slots.length >= 3}
              onClick={() => {
                const last = values.slots.at(-1);
                const start = last?.end_time || '13:00';
                const end = dayjs(`2000-01-01T${start}`).add(1, 'hour').format('HH:mm');
                void setFieldValue('slots', [...values.slots, { start_time: start, end_time: end }]);
              }}
            >
              Add shift slot
            </Button>
          </Box>
        </Stack>
      </Box>
      <ShiftDetailsFields formik={formik} />
      <Footer
        submitLabel="Assign Staff"
        disabled={!formik.isValid}
        submitting={formik.isSubmitting}
        onCancel={onClose}
        onSubmit={() => void formik.submitForm()}
      />
    </>
  );
}

function DayCircles({
  value,
  onChange,
  disabled = false,
  error,
}: {
  value: DayKey[];
  onChange?: (days: DayKey[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <Box role="group" aria-label="Repeat every week">
      <FormLabel sx={{ fontSize: 13 }}>Repeat every week</FormLabel>
      <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
        {DAYS.map((day) => {
          const on = value.includes(day.key);
          return (
            <ButtonBase
              key={day.key}
              aria-label={day.name}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onChange?.(on ? value.filter((item) => item !== day.key) : [...value, day.key])}
              sx={(theme) => ({
                width: 34,
                height: 34,
                borderRadius: '50%',
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${theme.palette.primary.main}`,
                bgcolor: on ? theme.palette.primary.main : 'transparent',
                color: on ? theme.palette.primary.contrastText : theme.palette.primary.main,
                opacity: disabled ? 0.6 : 1,
                '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
              })}
            >
              {day.letter}
            </ButtonBase>
          );
        })}
      </Stack>
      {error && (
        <Typography role="alert" sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------- Edit Assignment

interface EditValues extends ShiftFields {
  scope: AssignmentScope;
  slots: { start_time: string; end_time: string }[];
}

const editSchema = Yup.object({ slots: Yup.array().of(slotSchema), ...shared });

function EditForm({ shift, onClose, onSaved }: { shift: Shift; onClose: () => void; onSaved: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const past = shift.date < dayjs().format('YYYY-MM-DD');
  const formik = useFormik<EditValues>({
    initialValues: {
      scope: 'CURRENT',
      slots: [{ start_time: shift.start_time, end_time: shift.end_time }],
      duty_type: shift.duty_type ?? '',
      appointment_types: shift.appointment_types ?? [],
      urgencies: shift.urgencies ?? [],
      break_start: shift.break_start ?? '',
      break_end: shift.break_end ?? '',
    },
    validationSchema: editSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      try {
        await rotaApi.updateAssignment(PUBLIC_SUB_APP_ID, shift.id, values.scope, {
          start_time: values.slots[0].start_time,
          end_time: values.slots[0].end_time,
          duty_type: values.duty_type as DutyType,
          appointment_types: values.appointment_types,
          urgencies: values.urgencies,
          break_start: values.break_start || undefined,
          break_end: values.break_end || undefined,
        });
        enqueueSnackbar('Assignment updated', { variant: 'success' });
        onSaved();
      } catch (error) {
        enqueueSnackbar(errorMessage(error, 'Failed to update the assignment'), { variant: 'error' });
      }
    },
  });

  const remove = async () => {
    setBusy(true);
    try {
      await rotaApi.deleteAssignment(PUBLIC_SUB_APP_ID, shift.id, formik.values.scope);
      enqueueSnackbar('Assignment deleted', { variant: 'success' });
      setDeleting(false);
      onSaved();
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Failed to delete the assignment'), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const scopeLabel = SCOPES.find((item) => item.value === formik.values.scope)?.label.toLowerCase();

  return (
    <>
      {past && <Alert severity="info">This shift is in the past, so it can&apos;t be changed.</Alert>}
      <Box>
        <Typography component="h3" sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>
          ASSIGNED STAFF (1)
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          sx={(theme) => ({
            alignItems: 'center',
            p: 1.5,
            borderRadius: `${theme.tokens.radius.input}px`,
            bgcolor: theme.tokens.surface.tealLight,
          })}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{shift.staff_name}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
              <StatusChip status={shift.role_name} tone="primary" variant="outlined" />
              <Typography variant="caption">
                {shift.start_time} - {shift.end_time}
              </Typography>
            </Stack>
          </Box>
          <IconButton
            aria-label={`Delete ${shift.staff_name}'s assignment`}
            disabled={past}
            onClick={() => setDeleting(true)}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutline />
          </IconButton>
        </Stack>
      </Box>
      {shift.recurring && (
        <RadioGroup
          aria-label="Apply changes to"
          value={formik.values.scope}
          onChange={(event) => void formik.setFieldValue('scope', event.target.value as AssignmentScope)}
        >
          {SCOPES.map((scope) => (
            <FormControlLabel
              key={scope.value}
              value={scope.value}
              control={<Radio size="small" />}
              label={scope.label}
              disabled={past}
            />
          ))}
        </RadioGroup>
      )}
      <Box>
        <FormLabel sx={{ fontSize: 13 }}>Assignment Type</FormLabel>
        <Box sx={{ mt: 1 }}>
          <StatusChip status={shift.recurring ? 'Recurring' : 'Once'} tone="neutral" variant="outlined" />
        </Box>
      </Box>
      {shift.recurring && (
        <>
          <Typography variant="body2">
            {dayjs(shift.series_start_date).format('DD/MM/YYYY')} to{' '}
            {shift.series_end_date ? dayjs(shift.series_end_date).format('DD/MM/YYYY') : 'no end date'}
          </Typography>
          <DayCircles value={shift.repeat_days ?? []} disabled />
        </>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TimeInput formik={formik} name="slots.0.start_time" label="From" disabled={past} />
        <Typography sx={{ pt: 1 }}>to</Typography>
        <TimeInput formik={formik} name="slots.0.end_time" label="To" disabled={past} />
      </Stack>
      <ShiftDetailsFields formik={formik} />
      <Footer
        submitLabel="Save changes"
        disabled={past || !formik.isValid || !formik.dirty}
        submitting={formik.isSubmitting}
        onCancel={onClose}
        onSubmit={() => void formik.submitForm()}
      />
      <ConfirmDialog
        open={deleting}
        title="Delete Assignment"
        message={`Delete ${shift.staff_name}'s ${shift.recurring ? scopeLabel : 'assignment'} (${dayjs(shift.date).format('DD/MM/YYYY')}, ${shift.start_time} - ${shift.end_time})?`}
        confirmButtonText="Delete Assignment"
        confirmButtonVariant="error"
        confirmButtonLoading={busy}
        onClose={() => setDeleting(false)}
        onConfirm={() => void remove()}
      />
    </>
  );
}

// ---------------------------------------------------------------- Publish Slot

interface PublishValues {
  slots: { start_time: string; end_time: string }[];
  staff_type: '' | 'SALARIED' | 'LOCUM';
  rota_group_ids: string[];
  role_ids: string[];
  duty_type: DutyType | '';
  rate_per_hour: string;
  bidding_closes: string;
  repeat_weekly: boolean;
  repeat_until: string;
  notify: ('APP' | 'SMS' | 'EMAIL')[];
}

function PublishForm({
  target,
  practiceId,
  onClose,
  onSaved,
}: {
  target: Extract<AssignmentTarget, { kind: 'new' }>;
  practiceId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const roles = useRoles();
  const schema = Yup.object({
    slots: Yup.array().of(slotSchema),
    duty_type: Yup.string().required('Duty Type is required'),
    rate_per_hour: Yup.number()
      .typeError('Enter the rate in pounds per hour')
      .required('Rate is required')
      .moreThan(0, 'Rate must be more than £0')
      .max(500, 'Rate must be £500 per hour or less'),
    bidding_closes: Yup.string()
      .required('Bidding Timeline is required')
      .test('range', 'Bidding must close between today and the slot date', (value) =>
        Boolean(value && value >= dayjs().format('YYYY-MM-DD') && value <= target.date),
      ),
    repeat_until: Yup.string().when('repeat_weekly', {
      is: true,
      then: (field) =>
        field
          .required('Repeat Until is required')
          .test('after', 'Repeat Until must be after the slot date', (value) => Boolean(value && value > target.date)),
    }),
  });
  const formik = useFormik<PublishValues>({
    initialValues: {
      slots: [{ start_time: target.start, end_time: target.end }],
      staff_type: '',
      rota_group_ids: [],
      role_ids: [],
      duty_type: '',
      rate_per_hour: '',
      bidding_closes: target.date,
      repeat_weekly: true,
      repeat_until: dayjs(target.date).add(4, 'week').format('YYYY-MM-DD'),
      notify: [],
    },
    validationSchema: schema,
    validateOnMount: true,
    onSubmit: async (values) => {
      try {
        await rotaApi.publishSlot(PUBLIC_SUB_APP_ID, {
          practice_id: practiceId,
          date: target.date,
          start_time: values.slots[0].start_time,
          end_time: values.slots[0].end_time,
          staff_type: values.staff_type,
          rota_group_ids: values.rota_group_ids,
          role_ids: values.role_ids,
          duty_type: values.duty_type as DutyType,
          rate_per_hour: Number(values.rate_per_hour),
          bidding_closes: values.bidding_closes,
          repeat_weekly: values.repeat_weekly,
          repeat_until: values.repeat_weekly ? values.repeat_until : undefined,
          notify: values.notify,
        });
        enqueueSnackbar('Slot published', { variant: 'success' });
        onSaved();
      } catch (error) {
        enqueueSnackbar(errorMessage(error, 'Failed to publish the slot'), { variant: 'error' });
      }
    },
  });
  const { values, setFieldValue } = formik;
  const dutyError = errorOf(formik, 'duty_type');
  const rateError = errorOf(formik, 'rate_per_hour');

  return (
    <>
      <Typography variant="body2">Create proposal and publish unallocated slot.</Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TimeInput formik={formik} name="slots.0.start_time" label="From" />
        <Typography sx={{ pt: 1 }}>to</Typography>
        <TimeInput formik={formik} name="slots.0.end_time" label="To" />
      </Stack>
      <TextField
        select
        fullWidth
        label="Staff Contract"
        {...formik.getFieldProps('staff_type')}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">Any contract</MenuItem>
        <MenuItem value="SALARIED">Salaried</MenuItem>
        <MenuItem value="LOCUM">Locum</MenuItem>
      </TextField>
      <RotaGroupSelect
        subAppId={PUBLIC_SUB_APP_ID}
        value={values.rota_group_ids}
        onChange={(ids) => void setFieldValue('rota_group_ids', ids)}
      />
      <TextField
        select
        fullWidth
        label="Roles"
        value={values.role_ids}
        onChange={(event) => void setFieldValue('role_ids', event.target.value as unknown as string[])}
        slotProps={{
          select: {
            multiple: true,
            displayEmpty: true,
            renderValue: (selected) =>
              (selected as string[]).length
                ? roles
                    .filter((role) => (selected as string[]).includes(role.id))
                    .map((role) => role.name)
                    .join(', ')
                : 'Any role',
          },
          inputLabel: { shrink: true },
        }}
      >
        {roles.map((role) => (
          <MenuItem key={role.id} value={role.id}>
            <Checkbox size="small" checked={values.role_ids.includes(role.id)} />
            <ListItemText primary={role.name} />
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        fullWidth
        required
        label="Duty Type"
        {...formik.getFieldProps('duty_type')}
        error={Boolean(dutyError)}
        helperText={dutyError}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="" disabled>
          Select duty type
        </MenuItem>
        {DUTIES.map((duty) => (
          <MenuItem key={duty} value={duty}>
            {DUTY_TYPE_LABELS[duty]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        required
        label="Rate per hour"
        {...formik.getFieldProps('rate_per_hour')}
        error={Boolean(rateError)}
        helperText={rateError ?? 'Shown to staff on the Shift Bidding tab.'}
        slotProps={{
          input: { startAdornment: <InputAdornment position="start">£</InputAdornment> },
          htmlInput: { inputMode: 'decimal' },
        }}
      />
      <DatePicker
        label="Bidding Timeline"
        value={values.bidding_closes ? dayjs(values.bidding_closes) : null}
        format="DD/MM/YYYY"
        minDate={dayjs()}
        maxDate={dayjs(target.date)}
        onChange={(next) => void setFieldValue('bidding_closes', next?.isValid() ? next.format('YYYY-MM-DD') : '')}
        slotProps={{
          textField: {
            fullWidth: true,
            required: true,
            error: Boolean(errorOf(formik, 'bidding_closes')),
            helperText: errorOf(formik, 'bidding_closes') ?? 'The last day staff can bid.',
          },
        }}
      />
      <FormControlLabel
        control={
          <AppSwitch
            checked={values.repeat_weekly}
            onChange={(event) => void setFieldValue('repeat_weekly', event.target.checked)}
          />
        }
        label={
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Repeat Slot</Typography>
            <Typography variant="caption">Choose to publish same slot for next week.</Typography>
          </Box>
        }
      />
      {values.repeat_weekly && (
        <DatePicker
          label="Repeat Until"
          value={values.repeat_until ? dayjs(values.repeat_until) : null}
          format="DD/MM/YYYY"
          minDate={dayjs(target.date).add(1, 'day')}
          onChange={(next) => void setFieldValue('repeat_until', next?.isValid() ? next.format('YYYY-MM-DD') : '')}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
              error: Boolean(errorOf(formik, 'repeat_until')),
              helperText: errorOf(formik, 'repeat_until'),
            },
          }}
        />
      )}
      <Box>
        <FormLabel sx={{ fontSize: 13 }}>Notification Preferences</FormLabel>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Choose how members of this group are notified about new shifts.
        </Typography>
        <FormGroup row>
          {(
            [
              ['APP', 'Aqlios App'],
              ['SMS', 'SMS'],
              ['EMAIL', 'Email'],
            ] as const
          ).map(([value, label]) => (
            <FormControlLabel
              key={value}
              label={label}
              control={
                <Checkbox
                  checked={values.notify.includes(value)}
                  onChange={(event) =>
                    void setFieldValue(
                      'notify',
                      event.target.checked ? [...values.notify, value] : values.notify.filter((item) => item !== value),
                    )
                  }
                />
              }
            />
          ))}
        </FormGroup>
      </Box>
      <Footer
        submitLabel="Publish Slot"
        disabled={!formik.isValid}
        submitting={formik.isSubmitting}
        onCancel={onClose}
        onSubmit={() => void formik.submitForm()}
      />
    </>
  );
}
