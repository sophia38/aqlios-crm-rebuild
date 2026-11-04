'use client';

import { useCallback, useState } from 'react';
import { FieldArray, Formik, getIn } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Add from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { FieldLabel, FormDrawer } from '@/components/modals/FormDrawer';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceSettingsApi, settingsApi } from '@/lib/api/settings';
import type { Competency, Role } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { selectSession, useAppSelector } from '@/store';
import { digits, useRoles } from './settingsShared';

interface Values {
  name: string;
  description: string;
  roles: Role[];
  slot_duration_minutes: string;
  sub_types: string[];
}

const schema = Yup.object({
  name: Yup.string().trim().required('Competency type name is required'),
  roles: Yup.array().min(1, 'Select at least one role'),
  slot_duration_minutes: Yup.string()
    .required('Slot duration is required')
    .test('range', 'Enter a duration from 1 to 480 minutes', (value) => Number(value) >= 1 && Number(value) <= 480),
  sub_types: Yup.array()
    .of(Yup.string())
    .test('one', 'Add at least one sub-type', (items) => Boolean(items?.some((item) => item?.trim()))),
});

/**
 * Competency (docs/super-admin/09-settings.md §3): table, Add/Edit drawer and Delete confirm. With
 * `practiceId` it's the practice's Competency (plan §8): the vertical rows are listed too, and practice
 * users can't edit or delete them (captured tooltips).
 */
export function CompetencySection({ practiceId }: { practiceId?: string } = {}) {
  const { enqueueSnackbar } = useSnackbar();
  const roles = useRoles();
  const isAdmin = Boolean(useAppSelector(selectSession).user?.isAdmin);
  const locked = (item: Competency) => Boolean(practiceId) && !item.practice_id && !isAdmin;
  const fetcher = useCallback<PagedFetcher<Competency>>(
    (params, signal) =>
      practiceId
        ? practiceSettingsApi.competencies(PUBLIC_SUB_APP_ID, practiceId, params, signal)
        : settingsApi.competencies(PUBLIC_SUB_APP_ID, params, signal),
    [practiceId],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: '-created_at',
    errorText: 'Could not load competencies.',
    errorToast: 'Failed to load competencies',
  });
  const [editing, setEditing] = useState<{ competency?: Competency } | null>(null);
  const [deleting, setDeleting] = useState<Competency | null>(null);
  const [busy, setBusy] = useState(false);

  const columns: DataTableColumn<Competency>[] = [
    {
      id: 'name',
      label: 'Competency Type',
      render: (item) => (
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{item.name}</Typography>
      ),
    },
    { id: 'role', label: 'Role', render: (item) => item.role_names.join(', ') || '—' },
    { id: 'sub', label: 'Sub Types', width: 220, render: (item) => item.sub_types.join(', ') },
    { id: 'duration', label: 'Slot Duration', render: (item) => `${item.slot_duration_minutes} mins` },
    { id: 'staff', label: 'Staff Assigned', align: 'center', render: (item) => item.staff_assigned },
    { id: 'added', label: 'Date Added', sortKey: 'created_at', render: (item) => formatDate(item.created_at) },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (item) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          {/* The span lets the tooltip show on a disabled button. */}
          <Tooltip title={locked(item) ? 'Can be edited via vertical settings' : 'Edit'}>
            <span>
              <IconButton
                size="small"
                aria-label={`Edit ${item.name}`}
                disabled={locked(item)}
                onClick={() => setEditing({ competency: item })}
                sx={{ color: 'primary.main' }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={locked(item) ? 'Can be deleted via vertical settings' : 'Delete'}>
            <span>
              <IconButton
                size="small"
                aria-label={`Delete ${item.name}`}
                disabled={locked(item)}
                onClick={() => setDeleting(item)}
                sx={{ color: 'error.main' }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      if (practiceId) await practiceSettingsApi.deleteCompetency(PUBLIC_SUB_APP_ID, practiceId, deleting.id);
      else await settingsApi.deleteCompetency(PUBLIC_SUB_APP_ID, deleting.id);
      enqueueSnackbar('Competency deleted successfully', { variant: 'success' });
      setDeleting(null);
      list.reload();
    } catch {
      enqueueSnackbar('Failed to delete competency', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="brand"
        startIcon={<Add />}
        onClick={() => setEditing({})}
        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3, mb: 2.5 })}
      >
        Add Competency
      </Button>
      <DataTable<Competency>
        aria-label="Competencies"
        columns={columns}
        rows={list.rows}
        getRowId={(item) => item.id}
        ordering={list.query.ordering}
        onOrderingChange={list.setOrdering}
        page={list.query.page}
        rowsPerPage={list.query.pageSize}
        totalCount={list.count}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setPageSize}
        loading={list.loading}
        error={list.error}
        emptyMessage="No competencies found. Add one to get started."
        minWidth={900}
      />
      <CompetencyDrawer
        open={Boolean(editing)}
        competency={editing?.competency}
        practiceId={practiceId}
        roles={roles}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          list.reload();
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Competency"
        message={<>Are you sure you want to delete &quot;{deleting?.name}&quot;?</>}
        confirmButtonText="Delete Competency"
        confirmButtonLoading={busy}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </Box>
  );
}

function CompetencyDrawer({
  open,
  competency,
  practiceId,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  competency?: Competency;
  practiceId?: string;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const initialValues: Values = {
    name: competency?.name ?? '',
    description: competency?.description ?? '',
    roles: roles.filter((role) => competency?.role_ids.includes(role.id)),
    slot_duration_minutes: competency ? String(competency.slot_duration_minutes) : '',
    sub_types: competency?.sub_types.length ? competency.sub_types : [''],
  };

  return (
    <Formik
      key={`${open}-${competency?.id ?? 'new'}-${roles.length}`}
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values) => {
        const input = {
          name: values.name.trim(),
          description: values.description.trim(),
          role_ids: values.roles.map((role) => role.id),
          slot_duration_minutes: Number(values.slot_duration_minutes),
          sub_types: values.sub_types.map((item) => item.trim()).filter(Boolean),
        };
        try {
          if (practiceId) {
            if (competency)
              await practiceSettingsApi.updateCompetency(PUBLIC_SUB_APP_ID, practiceId, competency.id, input);
            else await practiceSettingsApi.createCompetency(PUBLIC_SUB_APP_ID, practiceId, input);
          } else if (competency) await settingsApi.updateCompetency(PUBLIC_SUB_APP_ID, competency.id, input);
          else await settingsApi.createCompetency(PUBLIC_SUB_APP_ID, input);
          enqueueSnackbar(competency ? 'Competency updated successfully' : 'Competency created successfully', {
            variant: 'success',
          });
          onSaved();
        } catch {
          enqueueSnackbar('Failed to save competency', { variant: 'error' });
        }
      }}
    >
      {(formik) => {
        const errorOf = (path: string) => {
          const error = getIn(formik.errors, path);
          const shown = formik.submitCount > 0 || Boolean(getIn(formik.touched, path));
          return shown && typeof error === 'string' ? error : undefined;
        };
        return (
          <FormDrawer
            open={open}
            title={competency ? 'Edit Competency' : 'Add Competency'}
            subtitle="Define a competency type and its associated sub-types."
            onClose={onClose}
            onSubmit={() => formik.handleSubmit()}
            submitLabel="Save Competency"
            submitting={formik.isSubmitting}
          >
            <Box>
              <FieldLabel htmlFor="competency-name" required>
                Competency Type Name
              </FieldLabel>
              <TextField
                id="competency-name"
                name="name"
                placeholder="e.g. Respiratory"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(errorOf('name'))}
                helperText={errorOf('name')}
              />
            </Box>
            <Box>
              <FieldLabel htmlFor="competency-description">Description (optional)</FieldLabel>
              <TextField
                id="competency-description"
                name="description"
                placeholder="Describe this competency type..."
                multiline
                minRows={3}
                value={formik.values.description}
                onChange={formik.handleChange}
                sx={(theme) => ({ '& .MuiInputBase-root': { bgcolor: theme.tokens.control.textareaFill } })}
              />
            </Box>
            <Box>
              <FieldLabel htmlFor="competency-roles" required>
                Roles
              </FieldLabel>
              <Autocomplete
                multiple
                id="competency-roles"
                options={roles}
                value={formik.values.roles}
                onChange={(_, value) => formik.setFieldValue('roles', value)}
                onBlur={() => formik.setFieldTouched('roles', true)}
                getOptionLabel={(role) => role.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={formik.values.roles.length ? undefined : 'Select Roles'}
                    error={Boolean(errorOf('roles'))}
                    helperText={errorOf('roles')}
                  />
                )}
              />
            </Box>
            <Box>
              <FieldLabel htmlFor="competency-duration" required>
                Slot Duration
              </FieldLabel>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  id="competency-duration"
                  name="slot_duration_minutes"
                  placeholder="e.g. 30"
                  value={formik.values.slot_duration_minutes}
                  onChange={(event) => formik.setFieldValue('slot_duration_minutes', digits(event.target.value, 3))}
                  onBlur={formik.handleBlur}
                  error={Boolean(errorOf('slot_duration_minutes'))}
                  helperText={errorOf('slot_duration_minutes')}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
                <TextField select value="MINS" sx={{ width: 120 }} slotProps={{ htmlInput: { 'aria-label': 'Unit' } }}>
                  <MenuItem value="MINS">Mins</MenuItem>
                </TextField>
              </Stack>
            </Box>
            <FieldArray name="sub_types">
              {(helpers) => (
                <Box>
                  <FieldLabel htmlFor="competency-subtype-0" required>
                    Sub Types
                  </FieldLabel>
                  <Stack spacing={1.25}>
                    {formik.values.sub_types.map((value, index) => (
                      <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <TextField
                          id={`competency-subtype-${index}`}
                          name={`sub_types.${index}`}
                          placeholder={`Sub-type ${index + 1}`}
                          value={value}
                          onChange={formik.handleChange}
                          slotProps={{ htmlInput: { 'aria-label': `Sub-type ${index + 1}` } }}
                        />
                        {formik.values.sub_types.length > 1 && (
                          <IconButton aria-label={`Remove sub-type ${index + 1}`} onClick={() => helpers.remove(index)}>
                            <Close fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                  {typeof formik.errors.sub_types === 'string' && formik.submitCount > 0 && (
                    <Typography role="alert" sx={{ mt: 0.75, fontSize: 12, color: 'error.main' }}>
                      {formik.errors.sub_types}
                    </Typography>
                  )}
                  <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1.5 }}>
                    <Button
                      variant="contained"
                      color="brand"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => helpers.push('')}
                      sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 2 })}
                    >
                      Add Sub-type
                    </Button>
                  </Stack>
                </Box>
              )}
            </FieldArray>
          </FormDrawer>
        );
      }}
    </Formik>
  );
}
