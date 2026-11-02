'use client';

import { useEffect, useState } from 'react';
import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import type { PracticeOption } from '@/components/data/PracticeFilterSelect';
import { AppSwitch } from '@/components/forms/AppSwitch';
import { FormModal } from '@/components/modals/FormModal';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { practiceManagementApi } from '@/lib/api/practiceManagement';
import { rotaApi } from '@/lib/api/rota';
import type { Role, RotaGroupDetail } from '@/lib/api/types';
import { usersApi } from '@/lib/api/users';

type StaffOption = { id: string; name: string };

interface Values {
  name: string;
  description: string;
  active: boolean;
  practices: PracticeOption[];
  roles: { id: string; name: string }[];
  staff: StaffOption[];
}

const DESCRIPTION_MAX = 300;
const PUNCTUATION = /^[A-Za-z0-9\s.,;:'"!?()&/-]*$/;

const schema = Yup.object({
  name: Yup.string().trim().required('Group name is required'),
  description: Yup.string()
    .max(DESCRIPTION_MAX)
    .matches(PUNCTUATION, 'Only alphanumeric text and standard punctuation are accepted.'),
  practices: Yup.array().min(1, 'Select at least one practice'),
  roles: Yup.array().min(1, 'Select at least one role'),
  staff: Yup.array().min(1, 'Select at least one staff member'),
});

/** Practices searched on the server as the user types. */
function usePracticeSearch(input: string) {
  const [options, setOptions] = useState<PracticeOption[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      practiceManagementApi
        .practices(PUBLIC_SUB_APP_ID, { page_size: 20, search: input.trim() || undefined }, controller.signal)
        .then((result) =>
          setOptions(result.results.map((item) => ({ id: item.id, practice_name: item.practice_name }))),
        )
        .catch(() => undefined);
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input]);
  return options;
}

/** Staff who have any of the chosen roles. */
function useStaffForRoles(roleIds: string[]) {
  const [staff, setStaff] = useState<Record<string, StaffOption[]>>({});
  const wanted = [...roleIds].sort().join(',');
  useEffect(() => {
    if (!wanted) return;
    const controller = new AbortController();
    for (const roleId of wanted.split(',')) {
      usersApi
        .roleUsers(PUBLIC_SUB_APP_ID, roleId, { page_size: 100 }, controller.signal)
        .then((result) =>
          setStaff((current) => ({
            ...current,
            [roleId]: result.results.map((user) => ({ id: user.id, name: `${user.first_name} ${user.last_name}` })),
          })),
        )
        .catch(() => undefined);
    }
    return () => controller.abort();
  }, [wanted]);
  return roleIds.flatMap((id) => staff[id] ?? []);
}

/**
 * Create / Edit Rota Group: the reference modal (docs/super-admin/06-rota-management.md). Roles unlock
 * once a practice is chosen, staff once a role is chosen; the submit stays disabled until valid.
 */
export function RotaGroupFormModal({
  open,
  group,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  group?: RotaGroupDetail;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [practiceInput, setPracticeInput] = useState('');
  const practiceOptions = usePracticeSearch(practiceInput);

  return (
    <Formik<Values>
      key={`${open}-${group?.id ?? 'new'}`}
      initialValues={{
        name: group?.name ?? '',
        description: group?.description ?? '',
        active: group ? group.status === 'ACTIVE' : true,
        practices: group?.practices ?? [],
        roles: group?.roles ?? [],
        staff: group?.staff ?? [],
      }}
      validationSchema={schema}
      validateOnMount
      onSubmit={async (values, helpers) => {
        const input = {
          name: values.name.trim(),
          description: values.description.trim(),
          status: values.active ? ('ACTIVE' as const) : ('INACTIVE' as const),
          practice_ids: values.practices.map((item) => item.id),
          role_ids: values.roles.map((item) => item.id),
          staff_ids: values.staff.map((item) => item.id),
        };
        try {
          if (group) await rotaApi.updateGroup(PUBLIC_SUB_APP_ID, group.id, input);
          else await rotaApi.createGroup(PUBLIC_SUB_APP_ID, input);
          enqueueSnackbar(group ? 'Rota group updated successfully' : 'Rota group created successfully', {
            variant: 'success',
          });
          onSaved();
        } catch (error) {
          const nameError =
            error instanceof ApiError
              ? (error.errors as { field?: string; message?: string }[]).find((item) => item.field === 'name')
              : undefined;
          if (nameError?.message) helpers.setFieldError('name', nameError.message);
          enqueueSnackbar(nameError?.message ?? 'Failed to save rota group', { variant: 'error' });
        }
      }}
    >
      {(formik) => (
        <GroupFields
          open={open}
          editing={Boolean(group)}
          formik={formik}
          roles={roles}
          practiceOptions={practiceOptions}
          onPracticeInput={setPracticeInput}
          onClose={onClose}
        />
      )}
    </Formik>
  );
}

function GroupFields({
  open,
  editing,
  formik,
  roles,
  practiceOptions,
  onPracticeInput,
  onClose,
}: {
  open: boolean;
  editing: boolean;
  formik: import('formik').FormikProps<Values>;
  roles: Role[];
  practiceOptions: PracticeOption[];
  onPracticeInput: (value: string) => void;
  onClose: () => void;
}) {
  const { values, errors, touched, setFieldValue, setFieldTouched } = formik;
  const staffOptions = useStaffForRoles(values.roles.map((role) => role.id));
  const errorOf = (field: keyof Values) =>
    formik.submitCount > 0 || touched[field] ? (errors[field] as string | undefined) : undefined;
  const noPractice = values.practices.length === 0;
  const noRole = values.roles.length === 0;

  return (
    <FormModal
      open={open}
      title={editing ? 'Edit Rota Group' : 'Create Rota Group'}
      subtitle="Add basic information and select practices and staff to create a rota group."
      onClose={onClose}
      onSubmit={() => formik.handleSubmit()}
      submitLabel={editing ? 'Save Changes' : 'Create Group'}
      submitIcon={editing ? undefined : <EventAvailableOutlined />}
      submitDisabled={!formik.isValid}
      submitting={formik.isSubmitting}
    >
      <TextField
        id="group-name"
        name="name"
        label="Group Name"
        required
        placeholder="e.g. North London Emergency Pool"
        value={values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(errorOf('name'))}
        helperText={errorOf('name')}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        id="group-description"
        name="description"
        label="Description (Optional)"
        multiline
        minRows={2}
        value={values.description}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(errorOf('description'))}
        helperText={
          <Stack direction="row" component="span" sx={{ justifyContent: 'space-between', gap: 2 }}>
            <span>{errorOf('description') ?? 'Only alphanumeric text and standard punctuation are accepted.'}</span>
            <span>
              {values.description.length}/{DESCRIPTION_MAX}
            </span>
          </Stack>
        }
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: DESCRIPTION_MAX } }}
      />
      <Autocomplete
        multiple
        id="group-practices"
        options={practiceOptions}
        value={values.practices}
        filterOptions={(items) => items}
        onInputChange={(_, next, reason) => reason === 'input' && onPracticeInput(next)}
        onChange={(_, next) => {
          setFieldValue('practices', next);
          if (next.length === 0) {
            setFieldValue('roles', []);
            setFieldValue('staff', []);
          }
        }}
        onBlur={() => setFieldTouched('practices', true)}
        getOptionLabel={(option) => option.practice_name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="No practices found"
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Practices"
            required
            error={Boolean(errorOf('practices'))}
            helperText={errorOf('practices')}
          />
        )}
      />
      <Autocomplete
        multiple
        id="group-roles"
        options={roles.map((role) => ({ id: role.id, name: role.name }))}
        value={values.roles}
        disabled={noPractice}
        onChange={(_, next) => {
          setFieldValue('roles', next);
          const allowed = new Set(next.map((role) => role.id));
          if (allowed.size === 0) setFieldValue('staff', []);
        }}
        onBlur={() => setFieldTouched('roles', true)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Roles"
            required
            error={Boolean(errorOf('roles')) && !noPractice}
            helperText={noPractice ? 'Select practice first' : errorOf('roles')}
          />
        )}
      />
      <Autocomplete
        multiple
        id="group-staff"
        options={staffOptions}
        value={values.staff}
        disabled={noRole}
        onChange={(_, next) => setFieldValue('staff', next)}
        onBlur={() => setFieldTouched('staff', true)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="No staff found for these roles"
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Staff"
            required
            error={Boolean(errorOf('staff')) && !noRole}
            helperText={noRole ? 'Select role first' : errorOf('staff')}
          />
        )}
      />
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          p: 1.5,
          bgcolor: theme.tokens.surface.mintWash,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          borderRadius: `${theme.tokens.radius.input}px`,
        })}
      >
        <Box>
          <Typography id="group-active-label" sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
            Active Status
          </Typography>
          <Typography variant="body2">Set this rota group as active or inactive</Typography>
        </Box>
        <AppSwitch
          checked={values.active}
          onChange={(event) => setFieldValue('active', event.target.checked)}
          slotProps={{ input: { 'aria-labelledby': 'group-active-label' } }}
        />
      </Box>
    </FormModal>
  );
}
