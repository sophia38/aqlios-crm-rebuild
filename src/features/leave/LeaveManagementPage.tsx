'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import History from '@mui/icons-material/History';
import PendingActions from '@mui/icons-material/PendingActionsOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { StatusChip } from '@/components/data/StatusChip';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { useRoles } from '@/features/staff/components/InviteStaffModal';
import { useCurrentPractice, usePracticeCrumbs } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import {
  formatBalance,
  formatLeave,
  LEAVE_REASON_MAX,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  leaveApi,
} from '@/lib/api/leave';
import { LEAVE_TYPES, type LeaveRequest, type LeaveRequestListParams } from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { LeaveDetailsDialog } from './components/LeaveDetailsDialog';
import { LeaveWarnings } from './components/LeaveWarnings';
import { leaveDate } from './leaveFormat';

type Tab = LeaveRequestListParams['tab'];

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: 'requests', label: 'Leave Requests', icon: <PendingActions /> },
  { value: 'history', label: 'Leaves History', icon: <History /> },
];

/**
 * Leave Management (docs/practice/07-leaves-and-leaves-rota.md §1, plan §6a): Leave Requests and
 * Leaves History, kept in `?tab=` (live keeps it in page state).
 */
export function LeaveManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tab: Tab = useSearchParams().get('tab') === 'history' ? 'history' : 'requests';
  usePracticeCrumbs([{ label: 'Leave Management' }]);

  return (
    <Stack spacing={2.5}>
      <Box>
        <SegmentedTabs<Tab>
          aria-label="Leave lists"
          value={tab}
          onChange={(next) =>
            router.replace(next === 'requests' ? pathname : `${pathname}?tab=${next}`, { scroll: false })
          }
          items={TABS}
        />
      </Box>
      <Box
        sx={(theme) => ({
          p: { xs: 2, md: 3 },
          bgcolor: 'background.paper',
          borderRadius: `${theme.tokens.radius.card}px`,
          border: `1px solid ${theme.tokens.border.medium}`,
        })}
      >
        <Typography component="h1" sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary', mb: 2.5 }}>
          Leave Management
        </Typography>
        {/* A fresh table per tab, so filters and paging start again. */}
        <LeaveTable key={tab} tab={tab} />
      </Box>
    </Stack>
  );
}

type StaffOption = { id: string; name: string };
type Pending = { action: 'approve' | 'reject'; request: LeaveRequest };

/** Everyone who can take leave here (the Staff filter). */
function useLeaveStaff(practiceId: string) {
  const [staff, setStaff] = useState<StaffOption[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    leaveApi
      .staff(PUBLIC_SUB_APP_ID, practiceId, controller.signal)
      .then(setStaff)
      .catch(() => undefined);
    return () => controller.abort();
  }, [practiceId]);
  return staff;
}

function LeaveTable({ tab }: { tab: Tab }) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const roles = useRoles();
  const staff = useLeaveStaff(practice.id);
  const [viewing, setViewing] = useState<LeaveRequest | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const history = tab === 'history';

  const fetcher = useCallback<PagedFetcher<LeaveRequest>>(
    (params, signal) =>
      leaveApi.requests(PUBLIC_SUB_APP_ID, practice.id, { ...params, tab } as LeaveRequestListParams, signal),
    [practice.id, tab],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: history ? '-updated_at' : 'start_date',
    errorText: 'Could not load leave requests.',
    errorToast: 'Failed to load leave requests',
  });

  const decide = async (reason?: string) => {
    if (!pending) return;
    const approve = pending.action === 'approve';
    setBusy(true);
    try {
      if (approve) await leaveApi.approve(PUBLIC_SUB_APP_ID, practice.id, pending.request.id);
      else await leaveApi.reject(PUBLIC_SUB_APP_ID, practice.id, pending.request.id, reason?.trim() || undefined);
      enqueueSnackbar(approve ? 'Leave request approved' : 'Leave request rejected', { variant: 'success' });
      setPending(null);
      list.reload();
    } catch (error) {
      enqueueSnackbar(
        error instanceof ApiError && error.code === 400
          ? error.message
          : approve
            ? 'Failed to approve the leave request'
            : 'Failed to reject the leave request',
        { variant: 'error' },
      );
    } finally {
      setBusy(false);
    }
  };

  const pill = (
    label: string,
    color: 'primary' | 'success' | 'error',
    onClick: () => void,
    ariaLabel: string,
    disabledReason?: string,
  ) => {
    const button = (
      <Button
        size="small"
        variant="outlined"
        color={color}
        aria-label={ariaLabel}
        disabled={Boolean(disabledReason)}
        onClick={onClick}
        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, minWidth: 0, px: 1.5 })}
      >
        {label}
      </Button>
    );
    // A disabled button doesn't fire hover events, so the tooltip sits on a wrapper.
    return disabledReason ? (
      <Tooltip title={disabledReason}>
        <span>{button}</span>
      </Tooltip>
    ) : (
      button
    );
  };

  const nowrap = (content: React.ReactNode) => <Box sx={{ whiteSpace: 'nowrap' }}>{content}</Box>;
  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      id: 'staff',
      label: 'Staff Name',
      sortKey: 'staff_name',
      render: (row) => (
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', minWidth: 140 }}>
          {row.staff_name}
        </Typography>
      ),
    },
    { id: 'role', label: 'Role', render: (row) => row.role_name },
    {
      id: 'type',
      label: 'Leave Type',
      render: (row) => <Box sx={{ minWidth: 120 }}>{LEAVE_TYPE_LABELS[row.leave_type]}</Box>,
    },
    ...(history
      ? []
      : [
          {
            id: 'balance',
            label: 'Balance',
            render: (row: LeaveRequest) => (
              <Box sx={{ minWidth: 110 }}>{formatBalance(row.balance_hours, row.day_hours)}</Box>
            ),
          },
        ]),
    { id: 'start', label: 'Start Date', sortKey: 'start_date', render: (row) => nowrap(leaveDate(row.start_date)) },
    { id: 'end', label: 'End Date', sortKey: 'end_date', render: (row) => nowrap(leaveDate(row.end_date)) },
    {
      id: 'duration',
      label: 'Duration',
      sortKey: 'duration_hours',
      render: (row) => <Box sx={{ minWidth: 100 }}>{formatLeave(row.duration_hours, row.day_hours)}</Box>,
    },
    ...(history
      ? [
          {
            id: 'status',
            label: 'Status',
            render: (row: LeaveRequest) => <StatusChip status={LEAVE_STATUS_LABELS[row.status]} variant="outlined" />,
          },
        ]
      : [
          {
            id: 'notes',
            label: 'Notes',
            render: (row: LeaveRequest) => <Box sx={{ minWidth: 140 }}>{row.notes || '—'}</Box>,
          },
          {
            id: 'warnings',
            label: 'Warnings',
            render: (row: LeaveRequest) => (
              <Box sx={{ minWidth: 150 }}>
                <LeaveWarnings warnings={row.warnings} />
              </Box>
            ),
          },
        ]),
    {
      id: 'actions',
      label: 'Action',
      align: 'center',
      render: (row) => {
        // Fix (phase 5 question 5): live lets an approver decide their own leave.
        const own = row.is_own ? "You can't approve or reject your own leave request" : undefined;
        return (
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
            {pill('View', 'primary', () => setViewing(row), `View leave request from ${row.staff_name}`)}
            {!history && (
              <>
                {pill(
                  'Approve',
                  'success',
                  () => setPending({ action: 'approve', request: row }),
                  `Approve leave request from ${row.staff_name}`,
                  own,
                )}
                {pill(
                  'Reject',
                  'error',
                  () => setPending({ action: 'reject', request: row }),
                  `Reject leave request from ${row.staff_name}`,
                  own,
                )}
              </>
            )}
          </Stack>
        );
      },
    },
  ];

  const staffValue = staff.find((option) => option.id === list.query.filters.staff_id) ?? null;
  const filtered = Boolean(list.query.search || Object.values(list.query.filters).some(Boolean));
  const subject = pending ? `${pending.request.staff_name} — ${LEAVE_TYPE_LABELS[pending.request.leave_type]}` : '';

  return (
    <Stack spacing={2.5}>
      <FilterBar
        filters={[
          {
            id: 'role_id',
            label: 'Role',
            allLabel: 'All Roles',
            options: (roles ?? []).map((role) => ({ value: role.id, label: role.name })),
          },
          ...(history
            ? [
                {
                  id: 'status',
                  label: 'Status',
                  allLabel: 'All Statuses',
                  options: (['APPROVED', 'REJECTED'] as const).map((status) => ({
                    value: status,
                    label: LEAVE_STATUS_LABELS[status],
                  })),
                },
              ]
            : [
                {
                  id: 'leave_type',
                  label: 'Leave Type',
                  allLabel: 'All Types',
                  options: LEAVE_TYPES.map((type) => ({ value: type, label: LEAVE_TYPE_LABELS[type] })),
                },
              ]),
        ]}
        values={list.query.filters}
        onChange={list.setFilter}
        search={{
          value: list.query.search,
          onChange: list.setSearch,
          label: 'Search',
          placeholder: 'Search by staff name and role',
        }}
        onClear={list.clear}
        leading={
          <Autocomplete
            size="small"
            options={staff}
            value={staffValue}
            onChange={(_, option) => list.setFilter('staff_id', option?.id ?? '')}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="No staff found"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Staff"
                placeholder={staffValue ? undefined : 'All Staff'}
                slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps.inputLabel, shrink: true } }}
              />
            )}
            sx={{ minWidth: 200, '& .MuiInputBase-root': { fontSize: 13 } }}
          />
        }
      />
      <DataTable
        aria-label={history ? 'Leaves History' : 'Leave Requests'}
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
        emptyMessage={
          filtered
            ? 'No leave requests found. Try another search.'
            : history
              ? 'No leave history found.'
              : 'No leave requests waiting.'
        }
        minWidth={history ? 900 : 1180}
      />
      <LeaveDetailsDialog request={viewing} onClose={() => setViewing(null)} />
      {pending && (
        <ConfirmDialog
          open
          title={pending.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
          subtitle={subject}
          message={
            pending.action === 'approve' ? 'Approve a pending leave request.' : 'Reject a pending leave request.'
          }
          warning={
            pending.action === 'approve' && pending.request.warnings.length ? (
              <LeaveWarnings warnings={pending.request.warnings} />
            ) : undefined
          }
          confirmButtonText={pending.action === 'approve' ? 'Approve' : 'Reject'}
          confirmButtonVariant={pending.action === 'approve' ? 'success' : 'error'}
          confirmButtonLoading={busy}
          requireReason={
            pending.action === 'reject'
              ? {
                  label: 'Reason (Optional)',
                  maxLength: LEAVE_REASON_MAX,
                  placeholder: 'State reason of rejection here...',
                }
              : undefined
          }
          onClose={() => setPending(null)}
          onConfirm={(reason) => void decide(reason)}
        />
      )}
    </Stack>
  );
}
