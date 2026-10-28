'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { StatusChip } from '@/components/data/StatusChip';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { GoBackLink } from '@/components/primitives/GoBackLink';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { practiceManagementApi } from '@/lib/api/practiceManagement';
import type { RoleUser, StaffStatus } from '@/lib/api/types';
import { usersApi } from '@/lib/api/users';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { ROLES_ICON } from './RolesListPage';
import { ROLES_HREF } from './rolesRoutes';

const STATUS_LABEL: Record<NonNullable<StaffStatus>, string> = {
  ACTIVE: 'Active',
  PENDING_INVITE: 'Pending Invite',
};

type PracticeOption = { id: string; practice_name: string };

/** Practice filter: searched on the server instead of the live `page_size=1000` list (REBUILD-PLAN.md §8). */
function PracticeFilter({
  value,
  onChange,
}: {
  value: PracticeOption | null;
  onChange: (value: PracticeOption | null) => void;
}) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<PracticeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      practiceManagementApi
        .practices(PUBLIC_SUB_APP_ID, { page_size: 20, search: input.trim() || undefined }, controller.signal)
        .then((result) => setOptions(result.results))
        .catch(() => undefined)
        .finally(() => !controller.signal.aborted && setLoading(false));
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  return (
    <Autocomplete
      size="small"
      options={options}
      value={value}
      loading={loading}
      onChange={(_, next) => onChange(next)}
      onInputChange={(_, next, reason) => reason === 'input' && setInput(next)}
      getOptionLabel={(option) => option.practice_name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={(items) => items}
      noOptionsText="No practices found"
      sx={{ minWidth: 220, flex: '0 1 280px' }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Practice"
          placeholder="All"
          slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps.inputLabel, shrink: true } }}
          sx={{ '& .MuiInputBase-root': { fontSize: 13 } }}
        />
      )}
    />
  );
}

/** Associated Users List (docs/super-admin/05-roles-and-permissions.md §2). */
export function AssociatedUsersPage({ roleId }: { roleId: string }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [missing, setMissing] = useState(false);
  const [practice, setPractice] = useState<PracticeOption | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    usersApi.role(PUBLIC_SUB_APP_ID, roleId, controller.signal).catch((error) => {
      if (error instanceof ApiError && error.code === 404) setMissing(true);
    });
    return () => controller.abort();
  }, [roleId]);

  const fetcher = useCallback<PagedFetcher<RoleUser>>(
    (params, signal) => usersApi.roleUsers(PUBLIC_SUB_APP_ID, roleId, params, signal),
    [roleId],
  );
  const errorToast = useCallback(
    (error: unknown) =>
      error instanceof ApiError && error.code === 403
        ? "You do not have permission to view this role's users."
        : 'Failed to load associated users',
    [],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    errorText: 'Could not load associated users.',
    errorToast,
  });

  if (missing) {
    return (
      <AccessDenied
        title="Role not found"
        message="This role was not found. It may have been deleted."
        backHref={ROLES_HREF}
        backLabel="Go to Roles List"
      />
    );
  }

  const columns: DataTableColumn<RoleUser>[] = [
    {
      id: 'name',
      label: 'Staff Name',
      render: (user) => (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
            {user.first_name} {user.last_name}
          </Typography>
          <Typography variant="caption">{user.email}</Typography>
        </Box>
      ),
    },
    {
      id: 'practice',
      label: 'Practice',
      width: 280,
      render: (user) => {
        const names = user.practices.map((item) => item.practice_name).join(', ');
        return (
          <Tooltip title={names}>
            <Typography noWrap sx={{ fontSize: 14, maxWidth: 260 }}>
              {names || '—'}
            </Typography>
          </Tooltip>
        );
      },
    },
    { id: 'role', label: 'Role', render: (user) => user.role.name },
    {
      id: 'status',
      label: 'Status',
      render: (user) => <StatusChip status={user.status ? STATUS_LABEL[user.status] : ''} size="medium" />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (user) => (
        <Tooltip title="View">
          <IconButton
            onClick={() =>
              enqueueSnackbar('Staff details are rebuilt in phase 5, with Staff On-boarding.', { variant: 'info' })
            }
            aria-label={`View ${user.first_name} ${user.last_name}`}
            size="small"
            sx={{ color: 'primary.main' }}
          >
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <HubManagementLayout
      hubManagementBreadcrumbs={[
        { label: 'Roles & Permissions', href: ROLES_HREF },
        { label: 'Associated Users List' },
      ]}
    >
      <GoBackLink onClick={() => router.push(ROLES_HREF)} />
      <Box sx={{ mt: 2 }}>
        <ModulePageHeader icon={ROLES_ICON} title="Roles & Permissions" subtitle="Associated Users List" />
      </Box>
      <Stack spacing={2}>
        <FilterBar
          hideLabel
          filters={[]}
          values={list.query.filters}
          onChange={() => undefined}
          search={{
            value: list.query.search,
            onChange: list.setSearch,
            placeholder: 'Search by name or email...',
            label: 'Search',
          }}
          onClear={() => {
            setPractice(null);
            list.clear();
          }}
          onRefresh={list.reload}
          refreshing={list.loading}
        >
          <PracticeFilter
            value={practice}
            onChange={(next) => {
              setPractice(next);
              list.setFilter('practice_id', next?.id ?? '');
            }}
          />
        </FilterBar>
        <DataTable<RoleUser>
          aria-label="Associated users"
          columns={columns}
          rows={list.rows}
          getRowId={(user) => user.id}
          page={list.query.page}
          rowsPerPage={list.query.pageSize}
          totalCount={list.count}
          onPageChange={list.setPage}
          onRowsPerPageChange={list.setPageSize}
          loading={list.loading}
          error={list.error}
          emptyMessage="No users found. Try another search."
        />
      </Stack>
    </HubManagementLayout>
  );
}
