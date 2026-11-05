'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatsStrip } from '@/components/data/StatsStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { cqcApi, type CqcAreaSummary, type CqcSummary } from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { useCqcPractice } from './CqcShell';
import {
  GOOD_READINESS,
  INADEQUATE_READINESS,
  OUTSTANDING_AREAS_NEEDED,
  OUTSTANDING_READINESS,
  formatPercent,
} from './rating';

const noop = () => undefined;

const GUIDE = [
  {
    rating: 'Inadequate risk',
    rule: 'Any unresolved Immediate or High risk.',
    action: 'Control harm immediately and escalate through governance.',
    limit: 'CQC judgement uses evidence and professional judgement.',
  },
  {
    rating: 'Inadequate readiness',
    rule: `Readiness below ${formatPercent(INADEQUATE_READINESS)}.`,
    action: 'Control harm immediately and escalate through governance.',
    limit: 'CQC judgement uses evidence and professional judgement.',
  },
  {
    rating: 'Requires improvement',
    rule: `Any open gap or in-progress item, or readiness below ${formatPercent(GOOD_READINESS)}.`,
    action: 'Complete actions and verify effectiveness.',
    limit: 'A high percentage cannot cancel a serious safety risk.',
  },
  {
    rating: 'Good-ready',
    rule: `At least ${formatPercent(GOOD_READINESS)} complete, no open gaps and no unresolved High or Immediate risk.`,
    action: 'Maintain controls and sample them in practice.',
    limit: 'Good requires reliable implementation, not paperwork alone.',
  },
  {
    rating: 'Outstanding-ready',
    rule: `At least ${formatPercent(OUTSTANDING_READINESS)}, no gaps and Outstanding evidence in the area. Overall needs at least ${OUTSTANDING_AREAS_NEEDED} areas that are Outstanding-ready.`,
    action: 'Show exceptional outcomes, equity, sustainability and external or patient corroboration.',
    limit: 'No workbook can guarantee Outstanding.',
  },
];

/** CQC Compliance overview: the predicted rating, the headline numbers and one row per area. */
export function CqcOverview() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { vertical } = useParams<{ vertical: string }>();
  const practice = useCqcPractice();
  const [summary, setSummary] = useState<CqcSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    cqcApi
      .summary(PUBLIC_SUB_APP_ID, practice.id, controller.signal)
      .then(setSummary)
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
        enqueueSnackbar('Failed to load CQC compliance', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practice.id, enqueueSnackbar]);

  if (error) return <Typography color="text.secondary">Could not load CQC compliance.</Typography>;
  if (!summary) return <LoadingSpinner message="Loading CQC compliance..." />;

  const { overall, areas } = summary;
  const { tone } = theme.tokens;
  const base = `/verticals/${vertical}/cqc-compliance`;

  const columns: DataTableColumn<CqcAreaSummary>[] = [
    {
      id: 'area',
      label: 'Area',
      render: (row) => (
        <Typography
          component={Link}
          href={`${base}/${row.area}`}
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: 'text.primary',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {row.label}
        </Typography>
      ),
    },
    { id: 'total', label: 'Total', align: 'center', render: (row) => row.total },
    { id: 'complete', label: 'Complete', align: 'center', render: (row) => row.complete },
    { id: 'gaps', label: 'Gaps', align: 'center', render: (row) => row.gaps },
    { id: 'notChecked', label: 'Not Checked', align: 'center', render: (row) => row.not_checked },
    { id: 'risk', label: 'High Risk', align: 'center', render: (row) => row.high_risk },
    {
      id: 'readiness',
      label: 'Readiness',
      width: 130,
      render: (row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <LinearProgress
            variant="determinate"
            value={Math.round(row.readiness * 100)}
            aria-label={`${row.label} readiness`}
            sx={{ flex: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'right' }}>
            {formatPercent(row.readiness)}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'rating',
      label: 'Rating',
      align: 'center',
      render: (row) => <StatusChip status={row.rating} variant="outlined" />,
    },
  ];

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          p: 2.5,
          borderRadius: `${theme.tokens.radius.card}px`,
          bgcolor: theme.tokens.surface.subtleFill,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="body2">Overall predicted rating</Typography>
          <Typography component="p" variant="h6">
            {practice.practice_name}
          </Typography>
        </Box>
        <StatusChip status={overall.rating} size="medium" />
      </Box>
      <StatsStrip
        variant="cards"
        items={[
          {
            label: 'Overall Readiness',
            value: formatPercent(overall.readiness),
            color: theme.palette.primary.main,
            caption: `${overall.complete} of ${overall.total} checks`,
          },
          { label: 'Total Checks', value: overall.total, color: tone.info.main },
          { label: 'Complete / Exceptional', value: overall.complete, color: tone.success.main },
          { label: 'Open Or Progressing Gaps', value: overall.gaps, color: tone.warning.main },
          { label: 'Not Checked', value: overall.not_checked, color: theme.tokens.neutral[500] },
          {
            label: 'High / Immediate Unresolved',
            value: overall.high_risk,
            color: tone.error.main,
            caption: 'Override the percentage',
          },
        ]}
      />
      <DataTable<CqcAreaSummary>
        aria-label="CQC areas"
        columns={columns}
        rows={areas}
        getRowId={(row) => row.area}
        getRowState={(row) => (row.high_risk > 0 ? 'incomplete' : undefined)}
        incompleteLabel="Has unresolved High or Immediate risks"
        page={0}
        rowsPerPage={10}
        totalCount={areas.length}
        onPageChange={noop}
        onRowsPerPageChange={noop}
        emptyMessage="No areas found."
      />
      <Alert severity="info">
        Rating safeguard: unresolved Immediate or High risks override the percentage complete. The National GP Patient
        Survey rating is an internal comparison with the national result, not an official CQC rating.
      </Alert>
      <FormSectionCard title="How the predicted rating works" defaultExpanded={false}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          This is a management warning system, not a CQC scoring engine.
        </Typography>
        <Stack component="dl" spacing={2} sx={{ m: 0 }}>
          {GUIDE.map((item) => (
            <Box key={item.rating}>
              <Box component="dt" sx={{ mb: 0.5 }}>
                <StatusChip status={item.rating} variant="outlined" />
              </Box>
              <Box component="dd" sx={{ m: 0 }}>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {item.rule}
                </Typography>
                <Typography variant="body2">What to do: {item.action}</Typography>
                <Typography variant="body2">Limit: {item.limit}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </FormSectionCard>
    </Stack>
  );
}
