'use client';

import { useCallback, useState } from 'react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import FindReplace from '@mui/icons-material/FindReplaceOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { formatFileSize, HR_POLICY_CATEGORY_LABELS, hrPoliciesApi } from '@/lib/api/hrPolicies';
import { HR_POLICY_CATEGORIES, type HrPolicy, type HrPolicyCategory, type HrPolicyListParams } from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { PolicyDetailsDialog } from './components/PolicyDetailsDialog';
import { UploadPolicyModal } from './components/UploadPolicyModal';
import { HrCard, HrPoliciesFrame } from './HrPoliciesFrame';

/** The captured empty state, also used on Ask HR's Upload a Policy prompt. */
export function PoliciesEmptyState({
  icon,
  title,
  text,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: { xs: 4, md: 6 }, px: 2 }}>
      <Box
        aria-hidden
        sx={(theme) => ({
          width: 56,
          height: 56,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: theme.tokens.neutral[100],
          color: 'text.secondary',
          '& svg': { fontSize: 28 },
        })}
      >
        {icon}
      </Box>
      <Typography component="h2" sx={{ fontSize: 16, fontWeight: 600, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ maxWidth: 440 }}>
        {text}
      </Typography>
      <Button variant="contained" startIcon={<CloudUploadOutlined />} onClick={onAction}>
        {actionLabel}
      </Button>
    </Stack>
  );
}

/** Single-select category pills (captured: All plus 10 categories; the active one is mint with a teal border). */
function CategoryChips({
  value,
  onChange,
}: {
  value: HrPolicyCategory | '';
  onChange: (value: HrPolicyCategory | '') => void;
}) {
  const items: { value: HrPolicyCategory | ''; label: string }[] = [
    { value: '', label: 'All' },
    ...HR_POLICY_CATEGORIES.map((category) => ({ value: category, label: HR_POLICY_CATEGORY_LABELS[category] })),
  ];
  return (
    <Box
      component="ul"
      aria-label="Filter by category"
      sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <li key={item.value || 'all'}>
            <ButtonBase
              aria-pressed={selected}
              onClick={() => onChange(item.value)}
              sx={(theme) => ({
                px: 1.75,
                py: 0.75,
                fontSize: 13,
                fontWeight: selected ? 600 : 500,
                borderRadius: `${theme.tokens.radius.pill}px`,
                border: `1px solid ${selected ? theme.palette.primary.main : theme.tokens.border.medium}`,
                bgcolor: selected ? theme.tokens.surface.tealLight : 'background.paper',
                color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
                '&:hover': { bgcolor: theme.tokens.surface.tealLight },
                '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
              })}
            >
              {item.label}
            </ButtonBase>
          </li>
        );
      })}
    </Box>
  );
}

/**
 * Policy Library (docs/practice/08-hr-policies-and-settings.md §1, plan §7): category pills and the
 * practice's policies with View · Replace · Delete.
 */
export function PolicyLibraryPage() {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const [category, setCategory] = useState<HrPolicyCategory | ''>('');
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState<HrPolicy | null>(null);
  const [viewing, setViewing] = useState<HrPolicy | null>(null);
  const [deleting, setDeleting] = useState<HrPolicy | null>(null);
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback<PagedFetcher<HrPolicy>>(
    (params, signal) => hrPoliciesApi.list(PUBLIC_SUB_APP_ID, practice.id, params as HrPolicyListParams, signal),
    [practice.id],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: 'title',
    errorText: 'Could not load policies.',
    errorToast: 'Failed to load policies',
  });

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await hrPoliciesApi.remove(PUBLIC_SUB_APP_ID, practice.id, deleting.id);
      enqueueSnackbar('Policy deleted.', { variant: 'success' });
      setDeleting(null);
      list.reload();
    } catch {
      enqueueSnackbar("We couldn't delete this policy.", { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<HrPolicy>[] = [
    {
      id: 'title',
      label: 'Title',
      sortKey: 'title',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{row.title}</Typography>
          <Typography variant="caption">
            {row.file_name} · {formatFileSize(row.file_size)}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Category',
      sortKey: 'category',
      render: (row) => HR_POLICY_CATEGORY_LABELS[row.category],
    },
    { id: 'owner', label: 'Owner', render: (row) => row.owner_name ?? '—' },
    {
      id: 'effective_date',
      label: 'Effective Date',
      sortKey: 'effective_date',
      render: (row) => (row.effective_date ? dayjs(row.effective_date).format('DD/MM/YYYY') : '—'),
    },
    { id: 'version', label: 'Version', sortKey: 'version', render: (row) => `v${row.version}` },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title="View">
            <IconButton aria-label="View" size="small" onClick={() => setViewing(row)}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Replace">
            <IconButton aria-label="Replace" size="small" onClick={() => setReplacing(row)}>
              <FindReplace fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton aria-label="Delete" size="small" color="error" onClick={() => setDeleting(row)}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const libraryEmpty = !list.loading && !list.error && list.count === 0 && !category;

  return (
    <HrPoliciesFrame tab="library">
      <HrCard
        title="Policy Library"
        subtitle="The staff handbook and HR policies the assistant answers from."
        action={
          <Button variant="contained" startIcon={<CloudUploadOutlined />} onClick={() => setUploading(true)}>
            Upload Policy
          </Button>
        }
      >
        <Stack spacing={2.5}>
          <CategoryChips
            value={category}
            onChange={(next) => {
              setCategory(next);
              list.setFilter('category', next);
            }}
          />
          {libraryEmpty ? (
            <PoliciesEmptyState
              icon={<DescriptionOutlined />}
              title="No Policies Yet"
              text="Upload your staff handbook and HR policies. Staff can then ask questions and get answers with the exact clause cited."
              actionLabel="Upload Policy"
              onAction={() => setUploading(true)}
            />
          ) : (
            <DataTable
              aria-label="Policy Library"
              columns={columns}
              rows={list.rows}
              getRowId={(row) => row.id}
              ordering={list.query.ordering}
              onOrderingChange={list.setOrdering}
              page={list.query.page}
              rowsPerPage={list.query.pageSize}
              totalCount={list.count}
              onPageChange={list.setPage}
              onRowsPerPageChange={list.setPageSize}
              loading={list.loading}
              error={list.error}
              emptyMessage="No policies found in this category. Try another category."
              minWidth={860}
            />
          )}
        </Stack>
      </HrCard>

      <UploadPolicyModal
        open={uploading || Boolean(replacing)}
        policy={replacing}
        onClose={() => {
          setUploading(false);
          setReplacing(null);
        }}
        onSaved={() => {
          setUploading(false);
          setReplacing(null);
          list.reload();
        }}
      />
      <PolicyDetailsDialog policy={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete policy?"
        message={`"${deleting?.title ?? ''}" and all its versions will be removed from the library, and the assistant will stop answering from it.`}
        confirmButtonText="Delete"
        confirmButtonVariant="error"
        confirmButtonLoading={busy}
        onClose={() => !busy && setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </HrPoliciesFrame>
  );
}
