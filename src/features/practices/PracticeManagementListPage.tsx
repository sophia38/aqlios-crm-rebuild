'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import FolderSharedOutlined from '@mui/icons-material/FolderSharedOutlined';
import ListAltOutlined from '@mui/icons-material/ListAltOutlined';
import Refresh from '@mui/icons-material/Refresh';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { PracticeListToolbar } from '@/components/practice/PracticeListToolbar';
import type { Practice } from '@/lib/api/types';
import { profileHref } from './OnboardPracticePage';
import { PRACTICE_LIST_HREF } from './PracticeFormFrame';
import { usePracticeList } from './usePracticeList';

export const ONBOARD_HREF = `${PRACTICE_LIST_HREF}/practice-management/onboard`;

export function formatDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/** Shared columns: the Practice Management table and the grid's list view. */
export function practiceColumns(): DataTableColumn<Practice>[] {
  return [
    {
      id: 'name',
      label: 'Practice Name',
      render: (practice) => (
        <Box>
          <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{practice.practice_name}</Typography>
          <Typography variant="caption">{practice.email_address || '—'}</Typography>
        </Box>
      ),
    },
    { id: 'manager', label: 'Practice Manager', render: (practice) => practice.practice_manager_name || '—' },
    {
      id: 'users',
      label: 'No. of Users',
      sortKey: 'associated_users_count',
      render: (practice) => practice.associated_users_count,
    },
    { id: 'added', label: 'Date Added', sortKey: 'created_at', render: (practice) => formatDate(practice.created_at) },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (practice) => (
        <IconButton
          component={Link}
          href={profileHref(practice.id)}
          aria-label={`View ${practice.practice_name}`}
          sx={{ color: 'primary.main' }}
        >
          <VisibilityOutlined fontSize="small" />
        </IconButton>
      ),
    },
  ];
}

/** Practice Management list: reference screen for list pages (docs/super-admin/02-practice-onboarding.md). */
export function PracticeManagementListPage() {
  const list = usePracticeList({ pageSize: 10, ordering: '-created_at' });

  return (
    <HubManagementLayout hubManagementBreadcrumbs={[{ label: 'Practice Management' }, { label: 'Practice List' }]}>
      <ModulePageHeader
        icon={<FolderSharedOutlined />}
        title="Practice Management"
        subtitle="Practice List"
        actions={
          <Button
            component={Link}
            href={ONBOARD_HREF}
            variant="contained"
            startIcon={<AddCircleOutline />}
            sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
          >
            Onboard New Practice
          </Button>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<ListAltOutlined />}
          aria-current="page"
          sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, py: 0.75 })}
        >
          Practice List
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={list.reload}
          disabled={list.loading}
          sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, py: 0.75, bgcolor: 'background.paper' })}
        >
          Refresh
        </Button>
      </Stack>
      <PracticeListToolbar title="Practices List" search={list.query.search} onSearchChange={list.setSearch} />
      <DataTable<Practice>
        aria-label="Practices"
        columns={practiceColumns()}
        rows={list.rows}
        getRowId={(practice) => practice.id}
        getRowState={(practice) => (practice.status === 'INCOMPLETE' ? 'incomplete' : undefined)}
        incompleteLabel="Practice profile is incomplete"
        ordering={list.query.ordering}
        onOrderingChange={list.setOrdering}
        page={list.query.page}
        rowsPerPage={list.query.pageSize}
        rowsPerPageOptions={[10, 25, 50]}
        totalCount={list.count}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setPageSize}
        loading={list.loading}
        error={list.error}
        emptyMessage="No practices found. Try another search."
      />
    </HubManagementLayout>
  );
}
