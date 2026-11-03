'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import Inbox from '@mui/icons-material/InboxOutlined';
import Outbox from '@mui/icons-material/OutboxOutlined';
import PersonAddAlt from '@mui/icons-material/PersonAddAltOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { StatusChip } from '@/components/data/StatusChip';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { TICKET_SOURCE_LABELS, TICKET_STATUS_LABELS, ticketsApi } from '@/lib/api/tickets';
import { TICKET_OPEN_STATUSES, type Ticket, type TicketListParams } from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { AssignStaffModal } from './components/AssignStaffModal';
import { CopyNameButton } from './components/CopyNameButton';
import { RecommendedStaffCell } from './components/RecommendedStaffCell';
import { SeverityFlag } from './components/SeverityFlag';
import { formatDateTime } from './ticketFormat';
import { ticketPath } from './ticketsRoutes';

type Cases = 'open' | 'closed';

/**
 * Tickets list (docs/practice/02-tickets.md §1, plan §2a). Follows the Practice Management list.
 * The tab is kept in `?cases=closed` so it can be linked (live keeps it in page state).
 */
export function TicketListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const cases: Cases = useSearchParams().get('cases') === 'closed' ? 'closed' : 'open';
  usePracticeCrumbs([{ label: 'Tickets' }]);

  return (
    <>
      <ModulePageHeader
        title="Tickets"
        subtitle="View and manage all tickets from your department as a care navigator."
      />
      <Stack spacing={2.5}>
        <Box>
          <SegmentedTabs<Cases>
            aria-label="Cases"
            tone="brand"
            value={cases}
            onChange={(next) =>
              router.replace(next === 'open' ? pathname : `${pathname}?cases=closed`, { scroll: false })
            }
            items={[
              { value: 'open', label: 'Open Cases', icon: <Inbox /> },
              { value: 'closed', label: 'Closed Cases', icon: <Outbox /> },
            ]}
          />
        </Box>
        {/* A fresh table per tab, so filters and paging start again (as live). */}
        <TicketTable key={cases} cases={cases} />
      </Stack>
    </>
  );
}

function TicketTable({ cases }: { cases: Cases }) {
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  const closed = cases === 'closed';

  const fetcher = useCallback<PagedFetcher<Ticket>>(
    (params, signal) =>
      ticketsApi.list(PUBLIC_SUB_APP_ID, practice.id, { ...params, case: cases } as TicketListParams, signal),
    [practice.id, cases],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: closed ? '-closed_at' : undefined,
    errorText: 'Could not load tickets.',
    errorToast: 'Failed to load tickets',
  });
  const [approving, setApproving] = useState<Ticket | null>(null);
  const [reassigning, setReassigning] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = Boolean(list.query.search || Object.values(list.query.filters).some(Boolean));
  const date = list.query.filters.date ?? '';

  const approve = async () => {
    const staff = approving?.recommended_staff;
    if (!approving || !staff) return;
    setBusy(true);
    try {
      await ticketsApi.assign(PUBLIC_SUB_APP_ID, practice.id, approving.id, { staff_id: staff.id });
      enqueueSnackbar('Staff assigned', { variant: 'success' });
      setApproving(null);
      list.reload();
    } catch {
      enqueueSnackbar('Failed to assign staff', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const nameCell = (ticket: Ticket) => (
    <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', whiteSpace: 'nowrap' }}>
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
        {ticket.patient_name}
      </Typography>
      <CopyNameButton name={ticket.patient_name} />
    </Stack>
  );

  const viewButton = (ticket: Ticket) => (
    <Tooltip title="View consultation">
      <IconButton
        component={Link}
        href={practiceHref(ticketPath(ticket.id))}
        aria-label={`View consultation for ${ticket.patient_name}`}
        size="small"
        sx={{ color: 'primary.main' }}
      >
        <VisibilityOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const openColumns: DataTableColumn<Ticket>[] = [
    {
      id: 'severity',
      label: 'Severity',
      align: 'center',
      render: (ticket) => <SeverityFlag urgency={ticket.urgency} />,
    },
    {
      id: 'source',
      label: 'Source',
      render: (ticket) => <Box sx={{ whiteSpace: 'nowrap' }}>{TICKET_SOURCE_LABELS[ticket.source]}</Box>,
    },
    { id: 'staff', label: 'Recommended Staff', render: (ticket) => <RecommendedStaffCell ticket={ticket} /> },
    {
      id: 'date',
      label: 'Date & Time',
      sortKey: 'created_at',
      render: (ticket) => <Box sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(ticket.created_at)}</Box>,
    },
    {
      id: 'complaint',
      label: 'Complaint Type',
      render: (ticket) => (
        <Tooltip title={ticket.complaint_type}>
          <Box sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ticket.complaint_type}
          </Box>
        </Tooltip>
      ),
    },
    { id: 'patient', label: 'Patient Name', render: nameCell },
    {
      id: 'age',
      label: 'Age & Gender',
      render: (ticket) => (
        <StatusChip status={`${ticket.patient_sex} (${ticket.patient_age})`} tone="neutral" variant="outlined" />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (ticket) => <StatusChip status={TICKET_STATUS_LABELS[ticket.status]} variant="outlined" />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (ticket) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          {viewButton(ticket)}
          {/* Assigned rows show only 👁, as live. */}
          {!ticket.assigned_staff && (
            <>
              <Tooltip title="Approve recommended staff">
                <span>
                  <IconButton
                    aria-label={`Approve recommended staff for ${ticket.patient_name}`}
                    size="small"
                    disabled={!ticket.recommended_staff}
                    onClick={() => setApproving(ticket)}
                    sx={(theme) => ({ color: theme.tokens.tone.success.main })}
                  >
                    <CheckCircleOutline fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Assign to Alternative Staff">
                <IconButton
                  aria-label={`Assign ${ticket.patient_name}'s consultation to alternative staff`}
                  size="small"
                  onClick={() => setReassigning(ticket)}
                  sx={{ color: 'text.secondary' }}
                >
                  <PersonAddAlt fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
  ];

  const closedColumns: DataTableColumn<Ticket>[] = [
    { id: 'patient', label: 'Patient Name', render: nameCell },
    {
      id: 'source',
      label: 'Source',
      render: (ticket) => <Box sx={{ whiteSpace: 'nowrap' }}>{TICKET_SOURCE_LABELS[ticket.source]}</Box>,
    },
    { id: 'type', label: 'Case Type', render: (ticket) => ticket.complaint_type },
    {
      id: 'closed',
      label: 'Date Closed',
      sortKey: 'closed_at',
      render: (ticket) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>{ticket.closed_at ? formatDateTime(ticket.closed_at) : '-'}</Box>
      ),
    },
    {
      id: 'by',
      label: 'Closed By',
      render: (ticket) => <Box sx={{ whiteSpace: 'nowrap' }}>{ticket.closed_by_name ?? '-'}</Box>,
    },
    { id: 'reason', label: 'Reason for Closure', render: (ticket) => ticket.closure_reason ?? '-' },
    { id: 'actions', label: 'Actions', align: 'center', render: viewButton },
  ];

  return (
    <>
      <FilterBar
        filters={
          closed
            ? []
            : [
                {
                  id: 'status',
                  label: 'Status',
                  allLabel: 'All',
                  options: TICKET_OPEN_STATUSES.map((status) => ({
                    value: status,
                    label: TICKET_STATUS_LABELS[status],
                  })),
                },
              ]
        }
        values={{ status: list.query.filters.status ?? '', date }}
        onChange={list.setFilter}
        search={{ value: list.query.search, onChange: list.setSearch, label: 'Search', placeholder: 'Search here...' }}
        onClear={list.clear}
      >
        <DatePicker
          label="Date Submitted"
          value={date ? dayjs(date) : null}
          format="DD/MM/YYYY"
          onChange={(next) => {
            if (next === null) list.setFilter('date', '');
            else if (next.isValid()) list.setFilter('date', next.format('YYYY-MM-DD'));
          }}
          slotProps={{
            textField: {
              size: 'small',
              slotProps: { inputLabel: { shrink: true } },
              sx: { width: 190, '& .MuiPickersInputBase-root': { fontSize: 13 } },
            },
            field: { clearable: true },
          }}
        />
      </FilterBar>
      <DataTable
        aria-label={closed ? 'Closed cases' : 'Open cases'}
        columns={closed ? closedColumns : openColumns}
        rows={list.rows}
        getRowId={(ticket) => ticket.id}
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
          filtered ? 'No tickets found. Try another search.' : closed ? 'No closed cases yet.' : 'No open cases.'
        }
        minWidth={closed ? 980 : 1240}
      />
      <ConfirmDialog
        open={approving !== null}
        title="Approve Recommended Staff"
        message={approving?.recommended_staff && `Assign ${approving.recommended_staff.name} to this consultation?`}
        confirmButtonText="Assign Staff"
        confirmButtonVariant="success"
        confirmButtonLoading={busy}
        onClose={() => setApproving(null)}
        onConfirm={approve}
      />
      <AssignStaffModal
        practiceId={practice.id}
        ticket={reassigning}
        onClose={() => setReassigning(null)}
        onAssigned={() => {
          setReassigning(null);
          list.reload();
        }}
      />
    </>
  );
}
