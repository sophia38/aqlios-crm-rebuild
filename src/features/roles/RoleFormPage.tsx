'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, useFormikContext } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import EditOutlined from '@mui/icons-material/EditOutlined';
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined';
import Search from '@mui/icons-material/Search';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { HubManagementLayout, type Crumb } from '@/components/layout/HubManagementLayout';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import type { Permission, Role, RoleInput } from '@/lib/api/types';
import { usersApi } from '@/lib/api/users';
import { BASE_PATH } from '@/lib/basePath';
import { PermissionTree } from './components/PermissionTree';
import { roleHref, ROLES_HREF } from './rolesRoutes';

const DESCRIPTION_MAX = 100;

const pill = (theme: Theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 });

/** Catalog order, so ticking and unticking the same box leaves the form unchanged (not "dirty"). */
const inCatalogOrder = (catalog: Permission[], ids: string[]) => {
  const wanted = new Set(ids);
  return catalog.filter((permission) => wanted.has(permission.id)).map((permission) => permission.id);
};

const schema = Yup.object({
  name: Yup.string().trim().required('Role name is required.'),
  description: Yup.string().max(DESCRIPTION_MAX, `Role description must be ${DESCRIPTION_MAX} characters or fewer.`),
});

type Mode = 'view' | 'edit' | 'create';

type Loaded =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready'; role: Role | null; catalog: Permission[]; granted: string[]; version: number };

const UPDATE_ERRORS: Record<number, string> = {
  400: 'Invalid data. Please check the role details and try again.',
  403: 'You do not have permission to update this role.',
};

/**
 * Role Detail, Edit Role (same URL) and Create New Role
 * (docs/super-admin/05-roles-and-permissions.md §3–4). Follows the reference form layout.
 */
export function RoleFormPage({ roleId: initialRoleId }: { roleId?: string }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const [editing, setEditing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // After Create, the page becomes the new role's detail in place (no reload, so the toast stays).
  const [createdId, setCreatedId] = useState<string>();
  const roleId = initialRoleId ?? createdId;
  const mode: Mode = !roleId ? 'create' : editing ? 'edit' : 'view';

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      usersApi.permissionCatalog(PUBLIC_SUB_APP_ID, signal),
      roleId ? usersApi.role(PUBLIC_SUB_APP_ID, roleId, signal) : Promise.resolve(null),
      roleId ? usersApi.rolePermissions(PUBLIC_SUB_APP_ID, roleId, signal) : Promise.resolve({ permission_ids: [] }),
    ])
      .then(([catalog, role, granted]) =>
        setLoaded((current) => ({
          status: 'ready',
          catalog,
          role,
          granted: granted.permission_ids,
          version: current.status === 'ready' ? current.version + 1 : 0,
        })),
      )
      .catch((error) => {
        if (signal.aborted) return;
        if (error instanceof ApiError && error.code === 404) {
          setLoaded({ status: 'missing' });
          return;
        }
        setLoaded({ status: 'error' });
        enqueueSnackbar('Failed to load role', { variant: 'error' });
      });
    return () => controller.abort();
  }, [roleId, reloadKey, enqueueSnackbar]);

  const crumbs: Crumb[] = [
    { label: 'Roles & Permissions', href: ROLES_HREF },
    { label: mode === 'create' ? 'Create New Role' : mode === 'edit' ? 'Edit Role' : 'Role Detail' },
  ];

  if (loaded.status === 'missing') {
    return (
      <AccessDenied
        title="Role not found"
        message="This role was not found. It may have been deleted."
        backHref={ROLES_HREF}
        backLabel="Go to Roles List"
      />
    );
  }

  if (loaded.status !== 'ready') {
    return (
      <HubManagementLayout hubManagementBreadcrumbs={crumbs}>
        {loaded.status === 'loading' ? (
          <LoadingSpinner message="Loading role..." />
        ) : (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
            <Typography variant="body2">Could not load this role.</Typography>
            <Button variant="outlined" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </Button>
          </Stack>
        )}
      </HubManagementLayout>
    );
  }

  const { role, catalog, granted } = loaded;
  const initialValues: RoleInput = {
    name: role?.name ?? '',
    description: role?.description ?? '',
    permission_ids: inCatalogOrder(catalog, granted),
  };

  const submit = async (values: RoleInput) => {
    const input = { ...values, name: values.name.trim(), description: values.description.trim() };
    try {
      if (role) {
        await usersApi.updateRole(PUBLIC_SUB_APP_ID, role.id, input);
        enqueueSnackbar('Role updated successfully', { variant: 'success' });
        setEditing(false);
        setReloadKey((key) => key + 1);
      } else {
        const createdRole = await usersApi.createRole(PUBLIC_SUB_APP_ID, input);
        enqueueSnackbar('Role created successfully', { variant: 'success' });
        setCreatedId(createdRole.id);
        // A new role has no pre-built page, so the address changes without a navigation; a refresh
        // is then served by the static fallback (src/app/not-found.tsx).
        window.history.replaceState(null, '', `${BASE_PATH}${roleHref(createdRole.id)}/`);
      }
    } catch (error) {
      return error;
    }
  };

  return (
    <HubManagementLayout hubManagementBreadcrumbs={crumbs}>
      <Formik
        // A new key per completed load, so the form always starts from the data just fetched.
        key={`${role?.id ?? 'new'}-${loaded.version}-${mode}`}
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          const error = await submit(values);
          if (!error) return;
          const fieldError =
            error instanceof ApiError
              ? (error.errors as { field?: string; message?: string }[]).find((item) => item.field === 'name')
              : undefined;
          if (fieldError?.message) helpers.setFieldError('name', fieldError.message);
          const code = error instanceof ApiError ? error.code : 500;
          enqueueSnackbar(
            role ? (UPDATE_ERRORS[code] ?? 'Failed to update role') : (fieldError?.message ?? 'Failed to create role'),
            { variant: 'error' },
          );
        }}
      >
        <RoleForm
          mode={mode}
          catalog={catalog}
          roleName={role?.name}
          onEdit={() => setEditing(true)}
          onCancel={() => (role ? setEditing(false) : router.push(ROLES_HREF))}
        />
      </Formik>
    </HubManagementLayout>
  );
}

function RoleForm({
  mode,
  catalog,
  roleName,
  onEdit,
  onCancel,
}: {
  mode: Mode;
  catalog: Permission[];
  roleName?: string;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const formik = useFormikContext<RoleInput>();
  const [search, setSearch] = useState('');
  const readOnly = mode === 'view';
  const nameError = (formik.touched.name || formik.submitCount > 0) && formik.errors.name;

  const title = { view: 'Role Detail', edit: 'Editing role details', create: 'Create New Role' }[mode];
  const subtitle =
    mode === 'view' ? roleName : mode === 'create' ? 'Create new role by entering the information below.' : undefined;

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit} sx={{ maxWidth: 640, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <GppGoodOutlined aria-hidden sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" variant="pageTitle">
              {title}
            </Typography>
            {subtitle && <Typography variant="body2">{subtitle}</Typography>}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
          {readOnly ? (
            <Button variant="contained" color="brand" startIcon={<EditOutlined />} onClick={onEdit} sx={pill}>
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={formik.isSubmitting}
                sx={(theme) => ({ ...pill(theme), bgcolor: 'background.paper' })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="brand"
                loading={formik.isSubmitting}
                disabled={mode === 'edit' && !formik.dirty}
                sx={pill}
              >
                Save Changes
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      <Stack spacing={2.5}>
        <FormSectionCard title="Role Details" hasError={Boolean(nameError)}>
          <Stack spacing={2.5}>
            <TextField
              id="name"
              name="name"
              label="Role Name"
              required
              placeholder="Enter role name (must be unique)"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(nameError)}
              helperText={nameError || undefined}
              slotProps={{ input: { readOnly }, inputLabel: { shrink: true } }}
              variant={readOnly ? 'filled' : 'outlined'}
            />
            <TextField
              id="description"
              name="description"
              label="Role Description"
              placeholder="Brief description of your role..."
              multiline
              minRows={3}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              helperText={`${formik.values.description.length} / ${DESCRIPTION_MAX}`}
              slotProps={{
                input: { readOnly },
                htmlInput: { maxLength: DESCRIPTION_MAX },
                inputLabel: { shrink: true },
                formHelperText: { sx: { textAlign: 'right' } },
              }}
              variant={readOnly ? 'filled' : 'outlined'}
            />
          </Stack>
        </FormSectionCard>

        <FormSectionCard
          title="Permissions"
          actions={
            <TextField
              size="small"
              label="Search"
              placeholder="Search permissions"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth={false}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={(theme) => ({
                width: { xs: 160, sm: 220 },
                '& .MuiOutlinedInput-root': { borderRadius: `${theme.tokens.radius.pill}px` },
              })}
            />
          }
        >
          <PermissionTree
            catalog={catalog}
            selected={formik.values.permission_ids}
            onChange={(ids) => formik.setFieldValue('permission_ids', inCatalogOrder(catalog, ids))}
            mode={readOnly ? 'view' : 'edit'}
            search={search}
          />
        </FormSectionCard>
      </Stack>
    </Box>
  );
}
