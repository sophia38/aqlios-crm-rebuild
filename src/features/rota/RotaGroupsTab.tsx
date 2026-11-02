'use client';

import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Add from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { StatusChip } from '@/components/data/StatusChip';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { rotaApi } from '@/lib/api/rota';
import type { RotaGroupDetail } from '@/lib/api/types';
import { useRoles } from '@/lib/useRoles';
import { RotaGroupFormModal } from './RotaGroupFormModal';

const EMPTY_FILTERS = { role: '', status: '' };

/** Rota Groups tab (docs/super-admin/06-rota-management.md, Tab 2). Filtered and paged in the browser. */
export function RotaGroupsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const roles = useRoles();
  const [groups, setGroups] = useState<RotaGroupDetail[]>([]);
  const [loadedKey, setLoadedKey] = useState(-1);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<{ group?: RotaGroupDetail } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    rotaApi
      .groups(PUBLIC_SUB_APP_ID, {}, controller.signal)
      .then((result) => {
        setGroups(result);
        setError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError('Could not load rota groups.');
        enqueueSnackbar('Failed to load rota groups', { variant: 'error' });
      })
      .finally(() => !controller.signal.aborted && setLoadedKey(reloadKey));
    return () => controller.abort();
  }, [reloadKey, enqueueSnackbar]);

  const term = search.trim().toLowerCase();
  const rows = groups
    .filter((group) => !filters.role || group.roles.some((role) => role.id === filters.role))
    .filter((group) => !filters.status || group.status === filters.status)
    .filter((group) => !term || group.name.toLowerCase().includes(term));

  const columns: DataTableColumn<RotaGroupDetail>[] = [
    {
      id: 'name',
      label: 'Group Name',
      render: (group) => (
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{group.name}</Typography>
      ),
    },
    { id: 'role', label: 'Role', render: (group) => group.roles.map((role) => role.name).join(', ') || '—' },
    {
      id: 'practices',
      label: 'No. of Practices',
      render: (group) => `${group.practices.length} ${group.practices.length === 1 ? 'site' : 'sites'}`,
    },
    { id: 'staff', label: 'No. of Staff', render: (group) => group.staff.length },
    {
      id: 'status',
      label: 'Status',
      render: (group) => <StatusChip status={group.status === 'ACTIVE' ? 'Active' : 'Inactive'} variant="outlined" />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (group) => (
        <Tooltip title="Edit">
          <IconButton
            size="small"
            aria-label={`Edit ${group.name}`}
            onClick={() => setEditing({ group })}
            sx={{ color: 'primary.main' }}
          >
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography component="h2" variant="pageTitle">
            ROTA Groups
          </Typography>
          <Typography variant="body2">Manage and assign rota groups</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setEditing({})}
          sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
        >
          Create Rota Group
        </Button>
      </Stack>
      <FilterBar
        filters={[
          {
            id: 'role',
            label: 'Role',
            allLabel: 'All Roles',
            options: roles.map((role) => ({ value: role.id, label: role.name })),
          },
          {
            id: 'status',
            label: 'Status',
            allLabel: 'All Statuses',
            options: [
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ],
          },
        ]}
        values={filters}
        onChange={(id, value) => {
          setFilters((current) => ({ ...current, [id]: value }));
          setPage(0);
        }}
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(0);
          },
          placeholder: 'Search rota groups by name...',
          label: 'Search',
        }}
        searchDebounceMs={200}
        onClear={() => {
          setFilters(EMPTY_FILTERS);
          setSearch('');
          setPage(0);
        }}
      />
      <DataTable<RotaGroupDetail>
        aria-label="Rota groups"
        columns={columns}
        rows={rows.slice(page * pageSize, page * pageSize + pageSize)}
        getRowId={(group) => group.id}
        page={page}
        rowsPerPage={pageSize}
        totalCount={rows.length}
        onPageChange={setPage}
        onRowsPerPageChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        loading={loadedKey !== reloadKey}
        error={error}
        emptyMessage="No rota groups found. Try another search."
      />
      <RotaGroupFormModal
        open={Boolean(editing)}
        group={editing?.group}
        roles={roles}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setReloadKey((key) => key + 1);
        }}
      />
    </Stack>
  );
}
