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
  CQC_RISK_LABELS,
  CQC_RISKS,
  CQC_STATUS_LABELS,
  CQC_STATUSES,
  cqcApi,
  type CqcAreaKey,
  type CqcCheck,
  type CqcChecksPage,
} from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { CasAlertRegister } from './components/CasAlertRegister';
import { CheckDrawer } from './components/CheckDrawer';
import { useCqcPractice } from './CqcShell';
import { DueDate } from './format';
import { isUnresolvedHighRisk } from './rating';

const ERROR_TEXT = 'Failed to load CQC compliance';

/** One checklist area: filters, the checks table and the edit drawer (CAS Alerts adds the alert register). */
export function CqcAreaPage({ area }: { area: CqcAreaKey }) {
  const practice = useCqcPractice();
  const [groups, setGroups] = useState<string[]>([]);
  const [selected, setSelected] = useState<CqcCheck | null>(null);

  const fetcher = useCallback<PagedFetcher<CqcCheck>>(
    async (params, signal) => {
      const result: CqcChecksPage = await cqcApi.checks(PUBLIC_SUB_APP_ID, practice.id, area, params, signal);
      if (!signal.aborted) setGroups(result.groups);
      return result;
    },
    [practice.id, area],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: 'id',
    errorText: 'Could not load the checks.',
    errorToast: ERROR_TEXT,
  });

  const columns: DataTableColumn<CqcCheck>[] = [
    { id: 'id', label: 'ID', sortKey: 'id', width: 90, render: (row) => row.id },
    {
      id: 'requirement',
      label: 'Requirement / Check',
      render: (row) => (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{row.requirement}</Typography>
          <Typography variant="caption">{row.group}</Typography>
        </>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => <StatusChip status={CQC_STATUS_LABELS[row.status]} variant="outlined" />,
    },
    {
      id: 'risk',
      label: 'Risk',
      align: 'center',
      render: (row) => (row.risk ? <StatusChip status={CQC_RISK_LABELS[row.risk]} variant="outlined" /> : '-'),
    },
    { id: 'owner', label: 'Owner', sortKey: 'owner', render: (row) => row.owner || '-' },
    {
      id: 'due',
      label: 'Due / Review',
      sortKey: 'due_date',
      align: 'center',
      render: (row) => <DueDate date={row.due_date} resolved={row.status !== 'GAP' && row.status !== 'IN_PROGRESS'} />,
    },
    { id: 'action', label: 'Action', align: 'center', render: (row) => row.action_id ?? '-' },
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
            id: 'group',
            label: 'Area',
            allLabel: 'All Areas',
            options: groups.map((group) => ({ value: group, label: group })),
          },
          {
            id: 'status',
            label: 'Status',
            allLabel: 'All Statuses',
            options: CQC_STATUSES.map((value) => ({ value, label: CQC_STATUS_LABELS[value] })),
          },
          {
            id: 'risk',
            label: 'Risk',
            allLabel: 'All Risks',
            options: CQC_RISKS.map((value) => ({ value, label: CQC_RISK_LABELS[value] })),
          },
        ]}
        values={list.query.filters}
        onChange={list.setFilter}
        search={{
          value: list.query.search,
          onChange: list.setSearch,
          placeholder: 'Search by ID, requirement or owner',
          label: 'Search',
        }}
        searchDebounceMs={400}
        onClear={list.clear}
        onRefresh={list.reload}
        refreshing={list.loading}
      />
      <DataTable<CqcCheck>
        aria-label="CQC checks"
        columns={columns}
        rows={list.rows}
        getRowId={(row) => row.id}
        ordering={list.query.ordering}
        onOrderingChange={list.setOrdering}
        getRowState={(row) => (isUnresolvedHighRisk(row) ? 'incomplete' : undefined)}
        incompleteLabel="Unresolved High or Immediate risk"
        page={list.query.page}
        rowsPerPage={list.query.pageSize}
        totalCount={list.count}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setPageSize}
        loading={list.loading}
        error={list.error}
        emptyMessage="No checks found. Try another search."
        minWidth={860}
      />
      {area === 'cas-alerts' && <CasAlertRegister />}
      <CheckDrawer
        check={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null);
          list.reload();
        }}
      />
    </Stack>
  );
}
