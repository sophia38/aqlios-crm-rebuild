'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { GoBackLink } from '@/components/primitives/GoBackLink';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { TICKET_SOURCE_LABELS, TICKET_STATUS_LABELS, ticketsApi } from '@/lib/api/tickets';
import type { Ticket, TicketDetail } from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { ViewerChip } from './ConsultationDetailsPage';
import { TicketLoadFallback } from './components/TicketLoadFallback';
import { formatDateTime } from './ticketFormat';
import { ticketPath, TICKETS_PATH } from './ticketsRoutes';
import { useTicketDetail } from './useTicketDetail';

/**
 * Previous Consultations (captured 2026-11-03: its own page with a Requested Date filter). Live loads
 * these from the clinical system and never returned; the demo lists the patient's other tickets.
 */
export function PreviousConsultationsPage({ ticketId }: { ticketId: string }) {
  const practice = useCurrentPractice();
  usePracticeCrumbs([
    { label: 'Tickets', href: TICKETS_PATH },
    { label: 'Consultation Details', href: ticketPath(ticketId) },
    { label: 'Previous Consultations' },
  ]);
  const { state, reload } = useTicketDetail(practice.id, ticketId);
  if (state.status !== 'ready') return <TicketLoadFallback state={state} onRetry={reload} />;
  return <PreviousConsultationsList ticket={state.ticket} />;
}

function PreviousConsultationsList({ ticket }: { ticket: TicketDetail }) {
  const router = useRouter();
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const fetcher = useCallback<PagedFetcher<Ticket>>(
    (params, signal) =>
      ticketsApi.list(
        PUBLIC_SUB_APP_ID,
        practice.id,
        { ...params, patient_id: ticket.patient_id, exclude: ticket.id, ordering: '-created_at' },
        signal,
      ),
    [practice.id, ticket.patient_id, ticket.id],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    errorText: 'Could not load previous consultations.',
    errorToast: 'Failed to load previous consultations',
  });
  const date = list.query.filters.date ?? '';

  const columns: DataTableColumn<Ticket>[] = [
    { id: 'request', label: 'Request', render: (item) => item.complaint_type },
    {
      id: 'date',
      label: 'Requested Date',
      render: (item) => <Box sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.created_at)}</Box>,
    },
    { id: 'source', label: 'Source', render: (item) => TICKET_SOURCE_LABELS[item.source] },
    { id: 'staff', label: 'Assigned to', render: (item) => item.assigned_staff?.name ?? '-' },
    {
      id: 'status',
      label: 'Status',
      render: (item) => <StatusChip status={TICKET_STATUS_LABELS[item.status]} variant="outlined" />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (item) => (
        <Tooltip title="View consultation">
          <IconButton
            component={Link}
            href={practiceHref(ticketPath(item.id))}
            aria-label={`View consultation ${item.complaint_type} from ${formatDateTime(item.created_at)}`}
            size="small"
            sx={{ color: 'primary.main' }}
          >
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <GoBackLink variant="pill" onClick={() => router.push(practiceHref(ticketPath(ticket.id)))}>
          Back
        </GoBackLink>
      </Box>
      <ModulePageHeader
        title="Previous Consultations"
        subtitle={ticket.patient_name}
        titleAdornment={<ViewerChip name={ticket.current_viewer_name} />}
      />
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Filters:</Typography>
          <DatePicker
            label="Requested Date"
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
        </Stack>
        <DataTable
          aria-label="Previous consultations"
          columns={columns}
          rows={list.rows}
          getRowId={(item) => item.id}
          page={list.query.page}
          rowsPerPage={list.query.pageSize}
          totalCount={list.count}
          onPageChange={list.setPage}
          onRowsPerPageChange={list.setPageSize}
          loading={list.loading}
          error={list.error}
          emptyMessage={
            date ? 'No consultations found. Try another date.' : 'No previous consultations for this patient.'
          }
          minWidth={820}
        />
      </Stack>
    </>
  );
}
