'use client';

import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { PracticeFilterSelect, type PracticeOption } from '@/components/data/PracticeFilterSelect';
import { StatsStrip } from '@/components/data/StatsStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { COMPLIANCE_FILTER_OPTIONS, COMPLIANCE_STATUS_LABELS, complianceApi } from '@/lib/api/compliance';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { ComplianceRow, ComplianceSummary, Paginated } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';

const TIMEOUT_MS = 15000;
const EMPTY_SUMMARY: ComplianceSummary = {
  total_staff: 0,
  compliant: 0,
  pending_upload: 0,
  awaiting_verification: 0,
  reverification_due: 0,
  expired: 0,
  rejected: 0,
};

/**
 * CQC Compliance dashboard (docs/super-admin/08-cqc-compliance.md). Built from the live page's code,
 * which no role could open; super-admin can see it here, and a 401 never logs anyone out.
 */
export function ComplianceDashboardPage() {
  const theme = useTheme();
  const [summary, setSummary] = useState<ComplianceSummary>(EMPTY_SUMMARY);
  const [practice, setPractice] = useState<PracticeOption | null>(null);

  const fetcher = useCallback<PagedFetcher<ComplianceRow>>(async (params, signal) => {
    // Give up after 15s so the timeout message can show (live copy).
    const result = await complianceApi.dashboard(
      PUBLIC_SUB_APP_ID,
      params,
      AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
    );
    if (!signal.aborted) setSummary(result.summary);
    return result as Paginated<ComplianceRow>;
  }, []);
  const errorToast = useCallback(
    (error: unknown) =>
      error instanceof DOMException && error.name === 'TimeoutError'
        ? 'Request timed out. Please check your connection and try again.'
        : 'Failed to load compliance dashboard',
    [],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    errorText: 'Failed to load compliance dashboard',
    errorToast,
  });

  const { tone } = theme.tokens;
  const columns: DataTableColumn<ComplianceRow>[] = [
    {
      id: 'name',
      label: 'Staff Name',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
            {`${row.first_name} ${row.last_name}`.trim() || row.email}
          </Typography>
          <Typography variant="caption">{row.role_name}</Typography>
        </Box>
      ),
    },
    { id: 'practice', label: 'Practice', align: 'center', render: (row) => row.practice_name || '-' },
    {
      id: 'status',
      label: 'Compliance Status',
      align: 'center',
      render: (row) => <StatusChip status={COMPLIANCE_STATUS_LABELS[row.compliance_status]} variant="outlined" />,
    },
    {
      id: 'waiting',
      label: 'Waiting Since',
      align: 'center',
      render: (row) => (row.waiting_since ? formatDate(row.waiting_since) : '-'),
    },
    { id: 'updated', label: 'Last Updated', align: 'center', render: (row) => formatDate(row.last_updated) },
  ];

  return (
    <HubManagementLayout hubManagementBreadcrumbs={[{ label: 'CQC Compliance' }, { label: 'Compliance Dashboard' }]}>
      <ModulePageHeader icon={<VerifiedOutlined />} title="CQC Compliance" subtitle="Compliance Dashboard" />
      <Stack spacing={2.5}>
        <StatsStrip
          variant="cards"
          items={[
            {
              label: 'Total Staff',
              value: summary.total_staff,
              color: theme.palette.primary.main,
              caption: 'Across All Practices',
            },
            { label: 'Compliant', value: summary.compliant, color: tone.success.main },
            {
              label: 'Pending Upload',
              value: summary.pending_upload,
              color: tone.warning.main,
              caption: 'Waiting on action',
            },
            {
              label: 'Awaiting Verification',
              value: summary.awaiting_verification,
              color: tone.info.main,
              caption: 'Uploaded but not verified',
            },
            { label: 'Re-verification Due', value: summary.reverification_due, color: tone.warning.main },
            { label: 'Expired', value: summary.expired, color: tone.error.main, caption: 'Require re-upload' },
          ]}
        />
        <FilterBar
          filters={[
            {
              id: 'verification_status',
              label: 'Compliance Status',
              allLabel: 'All Statuses',
              options: COMPLIANCE_FILTER_OPTIONS.map((value) => ({ value, label: COMPLIANCE_STATUS_LABELS[value] })),
            },
          ]}
          values={{ ...list.query.filters, practice: practice?.id ?? '' }}
          onChange={list.setFilter}
          search={{
            value: list.query.search,
            onChange: list.setSearch,
            placeholder: 'Search by name, role or skill...',
            label: 'Search',
          }}
          searchDebounceMs={400}
          onClear={() => {
            setPractice(null);
            list.clear();
          }}
        >
          <PracticeFilterSelect
            value={practice}
            allLabel="All Practices"
            onChange={(next) => {
              setPractice(next);
              list.setFilter('practice_id', next?.id ?? '');
            }}
          />
        </FilterBar>
        <DataTable<ComplianceRow>
          aria-label="Staff compliance"
          columns={columns}
          rows={list.rows}
          getRowId={(row) => row.id}
          page={list.query.page}
          rowsPerPage={list.query.pageSize}
          totalCount={list.count}
          onPageChange={list.setPage}
          onRowsPerPageChange={list.setPageSize}
          loading={list.loading}
          error={list.error}
          emptyMessage="No staff found. Adjust your filters or search term."
        />
      </Stack>
    </HubManagementLayout>
  );
}
