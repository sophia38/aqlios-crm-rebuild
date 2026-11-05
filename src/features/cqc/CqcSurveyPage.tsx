'use client';

import { useCallback, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatsStrip } from '@/components/data/StatsStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { cqcApi, type CqcSurveyMeasure, type CqcSurveyPage } from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { SurveyMeasureDrawer } from './components/SurveyMeasureDrawer';
import { useCqcPractice } from './CqcShell';
import { formatPoints } from './format';
import { formatPercent } from './rating';

const EMPTY_SUMMARY: CqcSurveyPage['summary'] = {
  entered: 0,
  total: 0,
  average_score: 0,
  readiness: 0,
  rating: 'Not rated',
};

const percent = (value: number | null) => (value === null ? '-' : `${value}%`);

/** National GP Patient Survey: practice results against the national result, scored 1 to 4. */
export function CqcSurveyPage() {
  const theme = useTheme();
  const practice = useCqcPractice();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [selected, setSelected] = useState<CqcSurveyMeasure | null>(null);

  const fetcher = useCallback<PagedFetcher<CqcSurveyMeasure>>(
    async (params, signal) => {
      const result = await cqcApi.survey(PUBLIC_SUB_APP_ID, practice.id, params, signal);
      if (!signal.aborted) setSummary(result.summary);
      return result;
    },
    [practice.id],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    errorText: 'Could not load the survey measures.',
    errorToast: 'Failed to load CQC compliance',
  });

  const { tone } = theme.tokens;
  const columns: DataTableColumn<CqcSurveyMeasure>[] = [
    {
      id: 'measure',
      label: 'Measure',
      render: (row) => (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{row.measure}</Typography>
          <Typography variant="caption">
            {row.id} · {row.direction === 'LOWER' ? 'Lower is better' : 'Higher is better'}
          </Typography>
        </>
      ),
    },
    { id: 'practice', label: 'Practice', align: 'center', render: (row) => percent(row.practice_result) },
    { id: 'national', label: 'National', align: 'center', render: (row) => percent(row.national_result) },
    { id: 'difference', label: 'Diff.', align: 'center', render: (row) => formatPoints(row.difference) },
    { id: 'score', label: 'Score', align: 'center', render: (row) => row.score ?? '-' },
    {
      id: 'rating',
      label: 'Rating',
      align: 'center',
      render: (row) => <StatusChip status={row.rating} variant="outlined" />,
    },
    { id: 'change', label: 'Change', align: 'center', render: (row) => formatPoints(row.change) },
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
      <StatsStrip
        variant="cards"
        items={[
          {
            label: 'Measures Entered',
            value: `${summary.entered} / ${summary.total}`,
            color: theme.palette.primary.main,
          },
          {
            label: 'Average Score',
            value: summary.average_score.toFixed(1),
            color: tone.info.main,
            caption: 'Out of 4',
          },
          { label: 'Readiness', value: formatPercent(summary.readiness), color: tone.success.main },
        ]}
      />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Typography variant="body2">Predicted survey rating</Typography>
        <StatusChip status={summary.rating} size="medium" />
      </Stack>
      <Typography variant="body2">
        Scoring: difference to national of +5pp or more scores 4; within -3pp scores 3; -3 to -10pp scores 2; below
        -10pp scores 1. The rating comes from the average score.
      </Typography>
      <DataTable<CqcSurveyMeasure>
        aria-label="National GP Patient Survey measures"
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
        emptyMessage="No measures found."
        minWidth={780}
      />
      <SurveyMeasureDrawer
        measure={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null);
          list.reload();
        }}
      />
    </Stack>
  );
}
