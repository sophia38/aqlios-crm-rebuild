'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { Role } from '@/lib/api/types';
import { usersApi } from '@/lib/api/users';
import { formatDate } from '@/lib/format';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { DeleteRoleDialog } from './DeleteRoleDialog';
import { CREATE_ROLE_HREF, roleHref, roleUsersHref } from './rolesRoutes';

export const ROLES_ICON = <GppGoodOutlined />;

/** Roles List (docs/super-admin/05-roles-and-permissions.md §1). Follows the Practice Management list. */
export function RolesListPage() {
  const fetcher = useCallback<PagedFetcher<Role>>(
    (params, signal) => usersApi.roles(PUBLIC_SUB_APP_ID, params, signal),
    [],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: '-created_at',
    errorText: 'Could not load roles.',
    errorToast: 'Failed to load roles',
  });
  const [deleting, setDeleting] = useState<Role | null>(null);

  // Tooltips use the live text; the accessible name also says which role.
  const action = (tooltip: string, label: string, icon: React.ReactNode, props: object) => (
    <Tooltip title={tooltip}>
      <IconButton aria-label={label} size="small" {...props}>
        {icon}
      </IconButton>
    </Tooltip>
  );

  const columns: DataTableColumn<Role>[] = [
    {
      id: 'name',
      label: 'Role Name',
      render: (role) => <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{role.name}</Typography>,
    },
    { id: 'users', label: 'Assigned Users', render: (role) => role.assigned_users_count },
    { id: 'created', label: 'Date Created', sortKey: 'created_at', render: (role) => formatDate(role.created_at) },
    { id: 'modified', label: 'Last Modified Date', render: (role) => formatDate(role.updated_at) },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (role) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          {action('View', `View ${role.name}`, <VisibilityOutlined fontSize="small" />, {
            component: Link,
            href: roleHref(role.id),
            sx: { color: 'primary.main' },
          })}
          {action('View Users', `View users of ${role.name}`, <GroupOutlined fontSize="small" />, {
            component: Link,
            href: roleUsersHref(role.id),
            sx: { color: 'primary.main' },
          })}
          {action('Delete', `Delete ${role.name}`, <DeleteOutline fontSize="small" />, {
            onClick: () => setDeleting(role),
            sx: { color: 'error.main' },
          })}
        </Stack>
      ),
    },
  ];

  return (
    <HubManagementLayout hubManagementBreadcrumbs={[{ label: 'Roles & Permissions' }, { label: 'Roles List' }]}>
      <ModulePageHeader
        icon={ROLES_ICON}
        title="Roles & Permissions"
        subtitle="Roles List"
        actions={
          <Button
            component={Link}
            href={CREATE_ROLE_HREF}
            variant="contained"
            startIcon={<AddCircleOutline />}
            sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
          >
            Add New Role
          </Button>
        }
      />
      <Stack spacing={2}>
        <FilterBar
          hideLabel
          filters={[]}
          values={{}}
          onChange={() => undefined}
          search={{
            value: list.query.search,
            onChange: list.setSearch,
            placeholder: 'Search by role name',
            label: 'Search',
          }}
          onClear={list.clear}
          onRefresh={list.reload}
          refreshing={list.loading}
        />
        <DataTable<Role>
          aria-label="Roles"
          columns={columns}
          rows={list.rows}
          getRowId={(role) => role.id}
          ordering={list.query.ordering}
          onOrderingChange={list.setOrdering}
          page={list.query.page}
          rowsPerPage={list.query.pageSize}
          totalCount={list.count}
          onPageChange={list.setPage}
          onRowsPerPageChange={list.setPageSize}
          loading={list.loading}
          error={list.error}
          emptyMessage="No roles found. Try another search."
        />
      </Stack>
      <DeleteRoleDialog
        role={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          list.reload();
        }}
      />
    </HubManagementLayout>
  );
}
