'use client';

import { useCallback, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { StatusChip } from '@/components/data/StatusChip';
import {
  CQC_ACTION_STATUS_LABELS,
  CQC_ACTION_STATUSES,
  CQC_PRIORITIES,
  CQC_RISK_LABELS,
  CQC_SUMMARY_AREA_LABELS,
  cqcApi,
  type CqcAction,
} from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { ActionDrawer } from './components/ActionDrawer';
import { useCqcPractice } from './CqcShell';
import { DueDate } from './format';

/** The single action plan: every gap in the checklists points to one action here. */
export function CqcActionPlanPage() {
  const practice = useCqcPractice();
  const [selected, setSelected] = useState<CqcAction | null>(null);

  const fetcher = useCallback<PagedFetcher<CqcAction>>(
    (params, signal) => cqcApi.actions(PUBLIC_SUB_APP_ID, practice.id, params, signal),
    [practice.id],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: 'id',
    errorText: 'Could not load the action plan.',
    errorToast: 'Failed to load CQC compliance',
  });

  const columns: DataTableColumn<CqcAction>[] = [
    { id: 'id', label: 'Action ID', sortKey: 'id', width: 100, render: (row) => row.id },
    {
      id: 'source',
      label: 'Source',
      render: (row) => (
        <>
          <Typography sx={{ fontSize: 14 }}>
            {row.source_area ? CQC_SUMMARY_AREA_LABELS[row.source_area] : '-'}
          </Typography>
          <Typography variant="caption">{row.source_check_id ?? ''}</Typography>
        </>
      ),
    },
    {
      id: 'priority',
      label: 'Priority',
      sortKey: 'priority',
      align: 'center',
      render: (row) => <StatusChip status={CQC_RISK_LABELS[row.priority]} variant="outlined" />,
    },
    {
      id: 'action',
      label: 'Gap / Required Action',
      render: (row) => (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{row.gap}</Typography>
          <Typography variant="caption">{row.required_action}</Typography>
        </>
      ),
    },
    {
      id: 'due',
      label: 'Due',
      sortKey: 'due_date',
      align: 'center',
      render: (row) => <DueDate date={row.due_date} resolved={row.status === 'CLOSED'} />,
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => <StatusChip status={CQC_ACTION_STATUS_LABELS[row.status]} variant="outlined" />,
    },
    {
      id: 'view',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <IconButton aria-label={`View ${row.id}`} onClick={() => setSelected(row)} sx={{ color: 'primary.main' }}>
          <VisibilityOutlined fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <FilterBar
        filters={[
          {
            id: 'status',
            label: 'Status',
            allLabel: 'All Statuses',
            options: CQC_ACTION_STATUSES.map((value) => ({ value, label: CQC_ACTION_STATUS_LABELS[value] })),
          },
          {
            id: 'priority',
            label: 'Priority',
            allLabel: 'All Priorities',
            options: CQC_PRIORITIES.map((value) => ({ value, label: CQC_RISK_LABELS[value] })),
          },
        ]}
        values={list.query.filters}
        onChange={list.setFilter}
        search={{
          value: list.query.search,
          onChange: list.setSearch,
          placeholder: 'Search by action, check or owner',
          label: 'Search',
        }}
        searchDebounceMs={400}
        onClear={list.clear}
        onRefresh={list.reload}
        refreshing={list.loading}
      />
      <DataTable<CqcAction>
        aria-label="CQC action plan"
        columns={columns}
        rows={list.rows}
        getRowId={(row) => row.id}
        ordering={list.query.ordering}
        onOrderingChange={list.setOrdering}
        getRowState={(row) =>
          row.status !== 'CLOSED' && (row.priority === 'HIGH' || row.priority === 'IMMEDIATE')
            ? 'incomplete'
            : undefined
        }
        incompleteLabel="Open High or Immediate priority action"
        page={list.query.page}
        rowsPerPage={list.query.pageSize}
        totalCount={list.count}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setPageSize}
        loading={list.loading}
        error={list.error}
        emptyMessage="No actions found. Try another search."
        minWidth={760}
      />
      <ActionDrawer
        action={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null);
          list.reload();
        }}
      />
    </Stack>
  );
}
