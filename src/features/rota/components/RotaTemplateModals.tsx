'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Add from '@mui/icons-material/Add';
import BorderColor from '@mui/icons-material/BorderColorOutlined';
import ContentCopy from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PracticeFilterSelect, type PracticeOption } from '@/components/data/PracticeFilterSelect';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { FormModal } from '@/components/modals/FormModal';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { rotaApi, TEMPLATE_NAME_MAX } from '@/lib/api/rota';
import type { RotaGroupDetail, RotaStaff, RotaTemplate } from '@/lib/api/types';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.code === 400 ? error.message : fallback;
const date = (value: string) => dayjs(value).format('DD/MM/YYYY');

/**
 * Create Rota Template (captured 2026-11-03): a reusable pattern copied from the existing rota. The
 * practice is fixed at practice level and chosen at vertical level.
 */
export function CreateTemplateModal({
  open,
  practice,
  weekStart,
  onClose,
  onCreated,
}: {
  open: boolean;
  practice: PracticeOption | null;
  /** The visible week, used as the default date range. */
  weekStart: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [chosenPractice, setChosenPractice] = useState<PracticeOption | null>(practice);
  const [staff, setStaff] = useState<RotaStaff[]>([]);
  const [groups, setGroups] = useState<RotaGroupDetail[]>([]);
  const target = practice ?? chosenPractice;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    rotaApi
      .groups(PUBLIC_SUB_APP_ID, { status: 'active' }, controller.signal)
      .then(setGroups)
      .catch(() => undefined);
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open || !target) return;
    const controller = new AbortController();
    rotaApi
      .availableStaff(PUBLIC_SUB_APP_ID, weekStart, controller.signal, target.id)
      .then(setStaff)
      .catch(() => !controller.signal.aborted && enqueueSnackbar('Failed to load staff', { variant: 'error' }));
    return () => controller.abort();
  }, [open, target, weekStart, enqueueSnackbar]);

  const formik = useFormik({
    initialValues: {
      name: '',
      rota_group_id: '',
      staff_ids: [] as string[],
      start_date: weekStart,
      end_date: dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD'),
      include_bank_holidays: false,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string()
        .trim()
        .required('Template Name is required')
        .max(TEMPLATE_NAME_MAX, `Template Name must be ${TEMPLATE_NAME_MAX} characters or fewer`),
      staff_ids: Yup.array().min(1, 'Select at least one staff member'),
      start_date: Yup.string().required('Start Date is required'),
      end_date: Yup.string()
        .required('End Date is required')
        .test('after', 'End Date must be on or after the Start Date', function check(value) {
          return !value || value >= this.parent.start_date;
        })
        .test('length', 'Choose up to 4 weeks', function check(value) {
          return !value || dayjs(value).diff(dayjs(this.parent.start_date), 'day') < 28;
        }),
    }),
    validateOnMount: true,
    onSubmit: async (values, helpers) => {
      if (!target) return;
      try {
        await rotaApi.createTemplate(PUBLIC_SUB_APP_ID, {
          name: values.name.trim(),
          practice_id: target.id,
          rota_group_id: values.rota_group_id || null,
          staff_ids: values.staff_ids,
          start_date: values.start_date,
          end_date: values.end_date,
          include_bank_holidays: values.include_bank_holidays,
        });
        enqueueSnackbar('Template created', { variant: 'success' });
        helpers.resetForm();
        onCreated();
      } catch (error) {
        enqueueSnackbar(errorMessage(error, 'Failed to create the template'), { variant: 'error' });
      }
    },
  });
  const fieldError = (name: 'name' | 'staff_ids' | 'end_date') =>
    formik.touched[name] && typeof formik.errors[name] === 'string' ? (formik.errors[name] as string) : undefined;

  return (
    <FormModal
      open={open}
      title="Create Rota Template"
      subtitle="Create a reusable rota template from existing schedules to quickly apply recurring staffing patterns in future rota periods."
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      onSubmit={() => void formik.submitForm()}
      submitLabel="Create Template"
      submitIcon={<Add />}
      submitDisabled={!formik.isValid || !target}
      submitting={formik.isSubmitting}
    >
      <Stack spacing={2}>
        <TextField
          fullWidth
          required
          label="Template Name"
          {...formik.getFieldProps('name')}
          error={Boolean(fieldError('name'))}
          helperText={fieldError('name') ?? `${formik.values.name.length}/${TEMPLATE_NAME_MAX} characters`}
          slotProps={{ htmlInput: { maxLength: TEMPLATE_NAME_MAX } }}
        />
        <TextField
          select
          fullWidth
          label="Rota Group (Optional)"
          {...formik.getFieldProps('rota_group_id')}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">None</MenuItem>
          {groups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {group.name}
            </MenuItem>
          ))}
        </TextField>
        {practice ? (
          <TextField fullWidth required disabled label="Select Practice" value={practice.practice_name} />
        ) : (
          <PracticeFilterSelect
            label="Select Practice"
            value={chosenPractice}
            onChange={(next) => {
              setChosenPractice(next);
              void formik.setFieldValue('staff_ids', []);
            }}
          />
        )}
        <TextField
          select
          fullWidth
          required
          label="Select Staff"
          value={formik.values.staff_ids}
          onChange={(event) => void formik.setFieldValue('staff_ids', event.target.value as unknown as string[])}
          onBlur={() => void formik.setFieldTouched('staff_ids', true)}
          disabled={!target}
          error={Boolean(fieldError('staff_ids'))}
          helperText={fieldError('staff_ids') ?? (target ? undefined : 'Select a practice first')}
          slotProps={{
            select: {
              multiple: true,
              renderValue: (selected) =>
                staff
                  .filter((member) => (selected as string[]).includes(member.id))
                  .map((member) => member.name)
                  .join(', '),
            },
          }}
        >
          {staff.map((member) => (
            <MenuItem key={member.id} value={member.id}>
              <Checkbox size="small" checked={formik.values.staff_ids.includes(member.id)} />
              <ListItemText primary={member.name} secondary={member.role_name} />
            </MenuItem>
          ))}
        </TextField>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 1 }}>Select date range from existing rota *</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <DatePicker
              label="Start Date"
              value={dayjs(formik.values.start_date)}
              format="DD/MM/YYYY"
              onChange={(next) => next?.isValid() && void formik.setFieldValue('start_date', next.format('YYYY-MM-DD'))}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
            <DatePicker
              label="End Date"
              value={dayjs(formik.values.end_date)}
              format="DD/MM/YYYY"
              onChange={(next) => {
                if (next?.isValid()) void formik.setFieldValue('end_date', next.format('YYYY-MM-DD'));
                void formik.setFieldTouched('end_date', true, false);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: Boolean(fieldError('end_date')),
                  helperText: fieldError('end_date'),
                },
              }}
            />
          </Stack>
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={formik.values.include_bank_holidays}
              onChange={(event) => void formik.setFieldValue('include_bank_holidays', event.target.checked)}
            />
          }
          label="Include Bank Holidays in Template"
        />
      </Stack>
    </FormModal>
  );
}

/**
 * Choose Rota Template (captured 2026-11-03): the practice's templates with Edit and Delete, then a
 * start date and "Clear existing shifts" to apply the chosen one. Fix: only this practice's
 * templates (live lists other practices' too), and the icon buttons have labels.
 */
export function ApplyTemplateModal({
  open,
  practiceId,
  onClose,
  onApplied,
}: {
  open: boolean;
  /** At vertical level: every practice's templates. */
  practiceId: string | null;
  onClose: () => void;
  onApplied: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [templates, setTemplates] = useState<RotaTemplate[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [start, setStart] = useState(() =>
    dayjs()
      .add(7 - ((dayjs().day() + 6) % 7), 'day')
      .format('YYYY-MM-DD'),
  );
  const [clear, setClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<RotaTemplate | null>(null);
  const [newName, setNewName] = useState('');
  const [deleting, setDeleting] = useState<RotaTemplate | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    rotaApi
      .templates(PUBLIC_SUB_APP_ID, practiceId ?? undefined, controller.signal)
      .then(setTemplates)
      .catch(() => {
        if (controller.signal.aborted) return;
        setTemplates([]);
        enqueueSnackbar('Failed to load rota templates', { variant: 'error' });
      });
    return () => controller.abort();
  }, [open, practiceId, reloadKey, enqueueSnackbar]);

  const template = templates?.find((item) => item.id === chosen) ?? null;
  const length = template ? dayjs(template.end_date).diff(dayjs(template.start_date), 'day') : 0;
  const startValid = dayjs(start).isValid() && start >= dayjs().format('YYYY-MM-DD');

  const close = () => {
    setChosen(null);
    setClear(false);
    onClose();
  };

  const apply = async () => {
    if (!template) return;
    setBusy(true);
    try {
      const { created } = await rotaApi.applyTemplate(PUBLIC_SUB_APP_ID, template.id, {
        start_date: start,
        clear_existing: clear,
      });
      enqueueSnackbar(`Template applied: ${created} ${created === 1 ? 'shift' : 'shifts'} added`, {
        variant: 'success',
      });
      close();
      onApplied();
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Failed to apply the template'), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const run = async (action: () => Promise<unknown>, success: string, failure: string) => {
    setBusy(true);
    try {
      await action();
      enqueueSnackbar(success, { variant: 'success' });
      setRenaming(null);
      setDeleting(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      enqueueSnackbar(errorMessage(error, failure), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <FormModal
        open={open}
        title="Choose Rota Template"
        subtitle="Apply an existing rota template to generate future schedules using predefined staffing patterns and session assignments."
        onClose={close}
        onSubmit={() => void apply()}
        submitLabel="Apply Template"
        submitIcon={<ContentCopy />}
        submitDisabled={!template || !startValid}
        submitting={busy && !renaming && !deleting}
      >
        <Stack spacing={2}>
          {templates === null ? (
            <Typography variant="body2">Loading templates...</Typography>
          ) : templates.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 3 }}>
              No rota templates yet. Create one from the rota first.
            </Typography>
          ) : (
            <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {templates.map((item) => {
                const selected = item.id === chosen;
                const staffCount = new Set(item.shifts.map((shift) => shift.staff_id)).size;
                return (
                  <Box
                    component="li"
                    key={item.id}
                    aria-label={item.name}
                    sx={(theme) => ({
                      p: 1.5,
                      borderRadius: `${theme.tokens.radius.input}px`,
                      border: `1px solid ${selected ? theme.palette.primary.main : theme.tokens.border.medium}`,
                      bgcolor: selected ? theme.tokens.surface.tealLight : 'background.paper',
                    })}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography
                        sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere' }}
                      >
                        {item.name}
                      </Typography>
                      <Tooltip title="Edit template">
                        <IconButton
                          size="small"
                          aria-label={`Edit template ${item.name}`}
                          onClick={() => {
                            setRenaming(item);
                            setNewName(item.name);
                          }}
                        >
                          <BorderColor fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete template">
                        <IconButton
                          size="small"
                          aria-label={`Delete template ${item.name}`}
                          onClick={() => setDeleting(item)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant={selected ? 'contained' : 'outlined'}
                        aria-pressed={selected}
                        onClick={() => setChosen(selected ? null : item.id)}
                      >
                        {selected ? 'Chosen' : 'Choose'}
                      </Button>
                    </Stack>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      {item.practice_name} · {date(item.start_date)} to {date(item.end_date)} · {item.shifts.length}{' '}
                      {item.shifts.length === 1 ? 'Shift' : 'Shifts'} · {staffCount}{' '}
                      {staffCount === 1 ? 'Staff Member' : 'Staff Members'}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          )}
          {template && (
            <>
              <DatePicker
                label="Apply from"
                value={dayjs(start)}
                format="DD/MM/YYYY"
                minDate={dayjs()}
                onChange={(next) => next?.isValid() && setStart(next.format('YYYY-MM-DD'))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    helperText: `The template covers ${length + 1} days: ${date(start)} to ${date(dayjs(start).add(length, 'day').format('YYYY-MM-DD'))}.`,
                  },
                }}
              />
              <FormControlLabel
                control={<Checkbox checked={clear} onChange={(event) => setClear(event.target.checked)} />}
                label="Clear existing shifts before applying template"
              />
              {clear && (
                <Alert severity="warning">
                  Existing shifts for the template&apos;s staff at this practice in these dates will be removed.
                </Alert>
              )}
            </>
          )}
        </Stack>
      </FormModal>
      <FormModal
        open={renaming !== null}
        title="Edit Template"
        onClose={() => setRenaming(null)}
        onSubmit={() =>
          renaming &&
          void run(
            () => rotaApi.renameTemplate(PUBLIC_SUB_APP_ID, renaming.id, newName.trim()),
            'Template updated',
            'Failed to update the template',
          )
        }
        submitLabel="Save Changes"
        submitDisabled={!newName.trim() || newName.trim().length > TEMPLATE_NAME_MAX}
        submitting={busy}
      >
        <TextField
          fullWidth
          required
          label="Template Name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          error={!newName.trim()}
          helperText={
            newName.trim() ? `${newName.length}/${TEMPLATE_NAME_MAX} characters` : 'Template Name is required'
          }
          slotProps={{ htmlInput: { maxLength: TEMPLATE_NAME_MAX } }}
        />
      </FormModal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete Template"
        message={deleting && `Delete the "${deleting.name}" template? Shifts already applied from it stay on the rota.`}
        confirmButtonText="Delete Template"
        confirmButtonVariant="error"
        confirmButtonLoading={busy}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          void run(
            () => rotaApi.deleteTemplate(PUBLIC_SUB_APP_ID, deleting.id),
            'Template deleted',
            'Failed to delete the template',
          ).then(() => {
            if (deleting.id === chosen) setChosen(null);
          })
        }
      />
    </>
  );
}
