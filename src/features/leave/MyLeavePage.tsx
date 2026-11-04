'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AccessTime from '@mui/icons-material/AccessTime';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import BeachAccess from '@mui/icons-material/BeachAccessOutlined';
import ChildFriendly from '@mui/icons-material/ChildFriendlyOutlined';
import EventBusy from '@mui/icons-material/EventBusyOutlined';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import MedicalServices from '@mui/icons-material/MedicalServicesOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VolunteerActivism from '@mui/icons-material/VolunteerActivismOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { LabelValueList } from '@/components/data/LabelValueList';
import { StatsStrip } from '@/components/data/StatsStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useCurrentPractice, usePracticeCrumbs } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { formatLeave, LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS, leaveApi, round } from '@/lib/api/leave';
import {
  LEAVE_STATUSES,
  LEAVE_TYPES,
  type LeaveRequest,
  type LeaveType,
  type MyLeaveListParams,
  type MyLeaveSummary,
} from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { selectSession, useAppSelector } from '@/store';
import { ApplyLeaveDrawer } from './components/ApplyLeaveDrawer';
import { LeaveDetailsDialog } from './components/LeaveDetailsDialog';
import { MyShiftsCard } from './components/MyShiftsCard';
import { leaveDate } from './leaveFormat';

/** The six captured balance cards, in the captured order. */
const CARDS: { type: LeaveType; icon: React.ReactNode }[] = [
  { type: 'ANNUAL', icon: <BeachAccess /> },
  { type: 'SICK', icon: <MedicalServices /> },
  { type: 'TOIL', icon: <AccessTime /> },
  { type: 'BEREAVEMENT', icon: <FavoriteBorder /> },
  { type: 'COMPASSIONATE', icon: <VolunteerActivism /> },
  { type: 'MATERNITY', icon: <ChildFriendly /> },
];

/**
 * Leaves and ROTA (docs/practice/07-leaves-and-leaves-rota.md §2, plan §6b): the signed-in user's
 * balances and leave requests, Apply For Leave (staff only, as live), and their shifts this week and
 * next (question 8).
 */
export function MyLeavePage() {
  const practice = useCurrentPractice();
  const user = useAppSelector(selectSession).user;
  const { enqueueSnackbar } = useSnackbar();
  const [summary, setSummary] = useState<MyLeaveSummary | null>(null);
  const [missing, setMissing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [applying, setApplying] = useState(false);
  usePracticeCrumbs([{ label: 'Leaves and ROTA' }]);

  useEffect(() => {
    const controller = new AbortController();
    leaveApi
      .mySummary(PUBLIC_SUB_APP_ID, practice.id, controller.signal)
      .then((result) => {
        setSummary(result);
        setMissing(false);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.code === 404) setMissing(true);
        else enqueueSnackbar('Failed to load your leave balances', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practice.id, reloadKey, enqueueSnackbar]);

  const reload = () => setReloadKey((key) => key + 1);

  return (
    <Stack spacing={2.5}>
      <Box
        sx={(theme) => ({
          p: { xs: 2, md: 3 },
          bgcolor: 'background.paper',
          borderRadius: `${theme.tokens.radius.card}px`,
          border: `1px solid ${theme.tokens.border.medium}`,
        })}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2.5 }}
        >
          <Box>
            <Typography component="h1" sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary' }}>
              Leave History
            </Typography>
            <Typography variant="body2">Manage your leave requests here.</Typography>
          </Box>
          {/* Live shows it only to staff (non-admin users); kept. */}
          {!user?.isAdmin && summary && (
            <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => setApplying(true)}>
              Apply For Leave
            </Button>
          )}
        </Stack>
        {missing ? (
          <Alert severity="info">
            You&apos;re not on this practice&apos;s staff list, so there&apos;s no leave to show.
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            <BalanceCards summary={summary} />
            <MyLeaveTable key={reloadKey} onChanged={reload} />
          </Stack>
        )}
      </Box>
      {user && !missing && <MyShiftsCard practiceId={practice.id} staffId={user.id} />}
      {summary && (
        <ApplyLeaveDrawer
          open={applying}
          summary={summary}
          onClose={() => setApplying(false)}
          onApplied={() => {
            setApplying(false);
            reload();
          }}
        />
      )}
    </Stack>
  );
}

function BalanceCards({ summary }: { summary: MyLeaveSummary | null }) {
  const theme = useTheme();
  const perDay = summary?.day_hours ?? 7.5;
  return (
    <StatsStrip
      variant="pill"
      items={CARDS.map(({ type, icon }) => {
        const balance = summary?.balances.find((item) => item.leave_type === type);
        const pending = balance?.pending_hours ? ` · ${formatLeave(balance.pending_hours, perDay)} pending` : '';
        const fixed = balance && balance.entitlement_hours !== null && balance.remaining_hours !== null;
        const hours = fixed ? balance.remaining_hours! : (balance?.taken_hours ?? 0);
        return {
          label: LEAVE_TYPE_LABELS[type],
          // Phase 5 question 3: days from the contracted day, with the hours underneath.
          value: `${round(hours / perDay)} days`,
          caption: !balance
            ? 'Approval Required'
            : fixed
              ? `${round(hours)} h left of ${round(balance.entitlement_hours!)} h${pending}`
              : `${round(hours)} h taken · No fixed entitlement${pending}`,
          color: theme.tokens.leave.type[type],
          tint: theme.tokens.leave.cardBg,
          icon,
        };
      })}
    />
  );
}

function MyLeaveTable({ onChanged }: { onChanged: () => void }) {
  const theme = useTheme();
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const [viewing, setViewing] = useState<LeaveRequest | null>(null);
  const [cancelling, setCancelling] = useState<LeaveRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback<PagedFetcher<LeaveRequest>>(
    (params, signal) => leaveApi.myRequests(PUBLIC_SUB_APP_ID, practice.id, params as MyLeaveListParams, signal),
    [practice.id],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: '-requested_at',
    errorText: 'Could not load your leave requests.',
    errorToast: 'Failed to load your leave requests',
  });

  const cancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await leaveApi.cancel(PUBLIC_SUB_APP_ID, practice.id, cancelling.id);
      enqueueSnackbar('Leave request cancelled.', { variant: 'success' });
      setCancelling(null);
      onChanged();
    } catch {
      enqueueSnackbar('Unable to cancel leave request. Please try again.', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const nowrap = (content: React.ReactNode) => <Box sx={{ whiteSpace: 'nowrap' }}>{content}</Box>;
  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      id: 'type',
      label: 'Leave Type',
      render: (row) => <Box sx={{ minWidth: 120 }}>{LEAVE_TYPE_LABELS[row.leave_type]}</Box>,
    },
    { id: 'start', label: 'Start Date', sortKey: 'start_date', render: (row) => nowrap(leaveDate(row.start_date)) },
    { id: 'end', label: 'End Date', sortKey: 'end_date', render: (row) => nowrap(leaveDate(row.end_date)) },
    {
      id: 'duration',
      label: 'Duration',
      render: (row) => <Box sx={{ minWidth: 100 }}>{formatLeave(row.duration_hours, row.day_hours)}</Box>,
    },
    { id: 'reason', label: 'Reason', render: (row) => <Box sx={{ minWidth: 140 }}>{row.notes || '—'}</Box> },
    {
      id: 'requested',
      label: 'Requested Date',
      sortKey: 'requested_at',
      render: (row) => nowrap(leaveDate(row.requested_at)),
    },
    { id: 'updated', label: 'Last Updated', sortKey: 'updated_at', render: (row) => nowrap(leaveDate(row.updated_at)) },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <StatusChip
          status={LEAVE_STATUS_LABELS[row.status]}
          tone={row.status === 'CANCELLED' ? 'neutral' : undefined}
          variant="outlined"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Action',
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton aria-label="View" size="small" onClick={() => setViewing(row)} sx={{ color: 'primary.main' }}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status === 'PENDING' && (
            <Tooltip title="Cancel request">
              <IconButton
                aria-label="Cancel request"
                size="small"
                onClick={() => setCancelling(row)}
                sx={{ color: theme.tokens.tone.error.main }}
              >
                <EventBusy fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const dateFilter = (id: 'from' | 'to', label: string) => {
    const value = list.query.filters[id];
    return (
      <DatePicker
        label={label}
        value={value ? dayjs(value) : null}
        format="DD/MM/YYYY"
        onChange={(next) => list.setFilter(id, next && next.isValid() ? next.format('YYYY-MM-DD') : '')}
        slotProps={{
          textField: { size: 'small', sx: { width: 170, '& .MuiInputBase-root': { fontSize: 13 } } },
          field: { clearable: true },
        }}
      />
    );
  };
  const filtered = Object.values(list.query.filters).some(Boolean);

  return (
    <Stack spacing={2.5}>
      <FilterBar
        filters={[
          {
            id: 'leave_type',
            label: 'Leave Type',
            allLabel: 'All Types',
            options: LEAVE_TYPES.map((type) => ({ value: type, label: LEAVE_TYPE_LABELS[type] })),
          },
          {
            id: 'status',
            label: 'Status',
            allLabel: 'All Statuses',
            options: LEAVE_STATUSES.map((status) => ({ value: status, label: LEAVE_STATUS_LABELS[status] })),
          },
        ]}
        values={list.query.filters}
        onChange={list.setFilter}
        onClear={list.clear}
        leading={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {dateFilter('from', 'From')}
            {dateFilter('to', 'To')}
          </Box>
        }
      />
      <DataTable
        aria-label="My leave requests"
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
        emptyMessage={filtered ? 'No leave requests found. Try other filters.' : 'No leave requests yet.'}
        minWidth={1040}
      />
      <LeaveDetailsDialog request={viewing} onClose={() => setViewing(null)} />
      {cancelling && (
        <ConfirmDialog
          open
          title="Cancel Request"
          message={
            <>
              <strong>Cancel this leave request?</strong> This will withdraw your pending request. Your manager will no
              longer be able to approve or reject it. This action cannot be undone.
            </>
          }
          cancelButtonText="Keep Request"
          confirmButtonText="Cancel Leave"
          confirmButtonVariant="error"
          confirmButtonLoading={busy}
          onClose={() => setCancelling(null)}
          onConfirm={() => void cancel()}
        >
          <Box
            sx={(t) => ({
              mt: 2,
              p: 1.5,
              borderRadius: `${t.tokens.radius.input}px`,
              border: `1px solid ${t.tokens.border.medium}`,
            })}
          >
            <LabelValueList
              dense
              labelWidth={90}
              items={[
                { label: 'Leave Type', value: LEAVE_TYPE_LABELS[cancelling.leave_type] },
                {
                  label: 'Dates',
                  value: `${leaveDate(cancelling.start_date)} – ${leaveDate(cancelling.end_date)} · ${formatLeave(
                    cancelling.duration_hours,
                    cancelling.day_hours,
                  )}`,
                },
              ]}
            />
          </Box>
        </ConfirmDialog>
      )}
    </Stack>
  );
}
