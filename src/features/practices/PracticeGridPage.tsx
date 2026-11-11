'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { ViewModeToggle } from '@/components/navigation/ViewModeToggle';
import { PracticeCard, STAGE_LABELS } from '@/components/practice/PracticeCard';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi, practiceSlug } from '@/lib/api/practiceManagement';
import type { PracticeOverview, PracticeStage } from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { setPracticeViewMode } from '@/store/uiSlice';
import { selectSession, selectUi, useAppDispatch, useAppSelector } from '@/store';
import { ONBOARD_HREF, practiceColumns } from './PracticeManagementListPage';

type StageTab = 'ALL' | PracticeStage;

const SORTS = [
  { value: '', label: 'Listed order' },
  { value: 'practice_name', label: 'Name A–Z' },
  { value: '-practice_name', label: 'Name Z–A' },
  { value: '-rota_coverage', label: 'Coverage, highest first' },
  { value: 'rota_coverage', label: 'Coverage, lowest first' },
];

const EMPTY_COUNTS: Record<PracticeStage, number> = { LIVE: 0, ONBOARDING: 0, REVIEW: 0 };

function overviewColumns(): DataTableColumn<PracticeOverview>[] {
  const base = practiceColumns().filter((column) => column.id !== 'actions') as DataTableColumn<PracticeOverview>[];
  return [
    ...base.slice(0, 1),
    { id: 'stage', label: 'Status', render: (practice) => <StatusChip status={STAGE_LABELS[practice.stage]} dot /> },
    ...base.slice(1),
    {
      id: 'coverage',
      label: 'Rota Coverage',
      sortKey: 'rota_coverage',
      render: (practice) => (practice.rota_coverage === null ? '—' : `${practice.rota_coverage}%`),
    },
  ];
}

/**
 * Practices grid (Figma "Public GP Flows" 9107:73594; reference screen for card grids): stage tabs
 * with counts, sort, list/grid toggle, then practice cards with staff, rotas and this week's coverage.
 */
export function PracticeGridPage({ vertical }: { vertical: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectSession);
  const { practiceViewMode } = useAppSelector(selectUi);
  const isAdmin = Boolean(user?.isAdmin);
  const [stageCounts, setStageCounts] = useState(EMPTY_COUNTS);

  const fetcher = useCallback<PagedFetcher<PracticeOverview>>(
    (params, signal) =>
      practiceManagementApi.practiceOverview(PUBLIC_SUB_APP_ID, params, signal).then((page) => {
        setStageCounts(page.stage_counts);
        return page;
      }),
    [],
  );
  const list = usePagedList(fetcher, {
    pageSize: 12,
    errorText: 'Could not load practices.',
    errorToast: 'Failed to load practices',
  });
  const stage = (list.query.filters.stage || 'ALL') as StageTab;
  const total = stageCounts.LIVE + stageCounts.ONBOARDING + stageCounts.REVIEW;

  const open = (practice: PracticeOverview) => {
    // Practice users record their current practice on the server, as live; the URL stays the source of truth.
    if (user && !isAdmin) {
      void practiceManagementApi.selectBusiness(PUBLIC_SUB_APP_ID, user.id, practice.id).catch(() => undefined);
    }
    router.push(`/verticals/${vertical}/practices/${practiceSlug(practice.practice_name)}/dashboard`);
  };

  const emptyMessage = !isAdmin
    ? "You aren't linked to any practice yet. Ask your administrator."
    : stage === 'ALL'
      ? 'No practices found.'
      : `No ${STAGE_LABELS[stage].toLowerCase()} practices found. Try another tab.`;

  const tabs = [
    { value: 'ALL' as StageTab, label: 'All', count: total },
    ...(['LIVE', 'ONBOARDING', 'REVIEW'] as const).map((value) => ({
      value: value as StageTab,
      label: STAGE_LABELS[value],
      count: stageCounts[value],
    })),
  ];

  return (
    <HubManagementLayout>
      <ModulePageHeader
        icon={<GridViewOutlined />}
        title="Public Practice"
        subtitle="Practice List"
        actions={
          isAdmin && (
            <Button
              component={Link}
              href={ONBOARD_HREF}
              variant="contained"
              startIcon={<AddCircleOutline />}
              sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
            >
              Onboard New Practice
            </Button>
          )
        }
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <SegmentedTabs
          aria-label="Filter practices by status"
          size="small"
          items={tabs}
          value={stage}
          onChange={(value) => list.setFilter('stage', value === 'ALL' ? '' : value)}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <TextField
            select
            size="small"
            value={list.query.ordering ?? ''}
            onChange={(event) => list.setOrdering(event.target.value)}
            slotProps={{
              // "Sort:" inside the field is its visible label, as in Figma.
              select: {
                displayEmpty: true,
                renderValue: (value) => `Sort: ${SORTS.find((sort) => sort.value === value)?.label ?? ''}`,
                inputProps: { 'aria-label': 'Sort practices' },
              },
            }}
            sx={(theme) => ({
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: `${theme.tokens.radius.pill}px`,
                bgcolor: 'background.paper',
              },
            })}
          >
            {SORTS.map((sort) => (
              <MenuItem key={sort.value} value={sort.value}>
                {sort.label}
              </MenuItem>
            ))}
          </TextField>
          <ViewModeToggle value={practiceViewMode} onChange={(mode) => dispatch(setPracticeViewMode(mode))} />
        </Box>
      </Box>

      <Typography
        role="status"
        sx={(theme) => ({ mb: 1.5, fontSize: 13, color: theme.tokens.shell.inkMuted, minHeight: 20 })}
      >
        {!list.loading && !list.error && (
          <>
            <Box component="strong" sx={(theme) => ({ color: theme.tokens.shell.ink })}>
              {list.count}
            </Box>{' '}
            of {total} practices
          </>
        )}
      </Typography>

      {practiceViewMode === 'list' ? (
        <DataTable<PracticeOverview>
          aria-label="Practices"
          columns={overviewColumns()}
          rows={list.rows}
          getRowId={(practice) => practice.id}
          ordering={list.query.ordering}
          onOrderingChange={list.setOrdering}
          page={list.query.page}
          rowsPerPage={list.query.pageSize}
          rowsPerPageOptions={[12, 24, 48]}
          totalCount={list.count}
          onPageChange={list.setPage}
          onRowsPerPageChange={list.setPageSize}
          loading={list.loading}
          error={list.error}
          emptyMessage={emptyMessage}
          onRowClick={open}
        />
      ) : (
        <Box>
          {list.error && !list.loading ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: 'error.main', mb: 2 }}>{list.error}</Typography>
              <Button variant="outlined" onClick={list.reload}>
                Try again
              </Button>
            </Paper>
          ) : !list.loading && list.rows.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 6 }}>
              {emptyMessage}
            </Typography>
          ) : (
            <Box
              component="ul"
              aria-label="Practices"
              aria-busy={list.loading || undefined}
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                // Figma uses 4 columns here (an exception to the 3-column grid rule, docs/design-tokens.md).
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                  xl: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              {list.loading
                ? Array.from({ length: list.query.pageSize }, (_, index) => (
                    <li key={index}>
                      <Skeleton
                        variant="rounded"
                        height={112}
                        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.tile}px` })}
                      />
                    </li>
                  ))
                : list.rows.map((practice) => (
                    <li key={practice.id}>
                      <PracticeCard
                        name={practice.practice_name}
                        odsCode={practice.ods_code}
                        city={practice.city}
                        stage={practice.stage}
                        staffCount={practice.staff_count}
                        rotaCount={practice.rota_count}
                        coverage={practice.rota_coverage}
                        onSelect={() => open(practice)}
                      />
                    </li>
                  ))}
            </Box>
          )}
          <TablePagination
            component="div"
            count={list.count}
            page={list.query.page}
            rowsPerPage={list.query.pageSize}
            rowsPerPageOptions={[12, 24, 48]}
            onPageChange={(_, page) => list.setPage(page)}
            onRowsPerPageChange={(event) => list.setPageSize(Number(event.target.value))}
            sx={(theme) => ({ borderTop: `1px solid ${theme.tokens.border.medium}`, mt: 3 })}
          />
        </Box>
      )}
    </HubManagementLayout>
  );
}
