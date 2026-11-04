'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import CloudDownload from '@mui/icons-material/CloudDownloadOutlined';
import CloudUpload from '@mui/icons-material/CloudUploadOutlined';
import History from '@mui/icons-material/History';
import LockOpen from '@mui/icons-material/LockOpenOutlined';
import OpenInNew from '@mui/icons-material/OpenInNew';
import PublishedWithChanges from '@mui/icons-material/PublishedWithChangesOutlined';
import { LabelValueList } from '@/components/data/LabelValueList';
import { StatusChip } from '@/components/data/StatusChip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { GoBackLink } from '@/components/primitives/GoBackLink';
import { APPOINTMENT_PATH } from '@/features/appointments/appointmentRoutes';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { isClosed, TICKET_STATUS_LABELS, TICKET_URGENCY_LABELS, ticketsApi } from '@/lib/api/tickets';
import { AssignStaffCard } from './components/AssignStaffCard';
import { ChatCard } from './components/ChatCard';
import { ClinicalNotesCard } from './components/ClinicalNotesCard';
import { CopyNameButton } from './components/CopyNameButton';
import { LogsDrawer } from './components/LogsDrawer';
import { RecommendationsCard } from './components/RecommendationsCard';
import { SummaryCard, type SummaryTab } from './components/SummaryCard';
import { TicketLoadFallback } from './components/TicketLoadFallback';
import { TranscriptCard } from './components/TranscriptCard';
import { UpdateStatusModal } from './components/UpdateStatusModal';
import { formatDateTime } from './ticketFormat';
import { CLOSED_TICKETS_PATH, previousConsultationsPath, TICKETS_PATH } from './ticketsRoutes';
import { useTicketDetail } from './useTicketDetail';

/** Current Viewer chip, shared with Previous Consultations. */
export function ViewerChip({ name }: { name: string | null }) {
  return name ? <StatusChip status={`Current Viewer: ${name}`} tone="neutral" variant="outlined" /> : null;
}

/**
 * Consultation Details (docs/practice/02-tickets.md §2, plan §2b). `from="appointment"` is the same
 * page opened from Appointment (`appointment/consultation-review/{id}`, captured 2026-11-03).
 */
export function ConsultationDetailsPage({
  ticketId,
  from = 'tickets',
}: {
  ticketId: string;
  from?: 'tickets' | 'appointment';
}) {
  const router = useRouter();
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('xl'));
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  const fromAppointment = from === 'appointment';
  usePracticeCrumbs([
    fromAppointment ? { label: 'Appointment', href: APPOINTMENT_PATH } : { label: 'Tickets', href: TICKETS_PATH },
    { label: 'Consultation Details' },
  ]);

  const { state, update, refresh, reload } = useTicketDetail(practice.id, ticketId);
  const [tab, setTab] = useState<SummaryTab>('summary');
  const [logsOpen, setLogsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [busy, setBusy] = useState(false);

  if (state.status !== 'ready') return <TicketLoadFallback state={state} onRetry={reload} />;

  const { ticket } = state;
  const closed = isClosed(ticket);
  const unassigned = !ticket.assigned_staff;
  // Live: read-only until someone is assigned, and everything editable is disabled once closed.
  const locked = closed || unassigned;
  const placeholders = {
    patient_name: ticket.patient_name,
    practice_name: practice.practice_name,
    clinic_name: practice.practice_name,
    clinic_phone: practice.phone_number,
    doctor_name: ticket.assigned_staff?.name ?? '',
  };

  const reopen = async () => {
    setBusy(true);
    try {
      update(await ticketsApi.updateStatus(PUBLIC_SUB_APP_ID, practice.id, ticket.id, { status: 'REOPENED' }));
      setReopening(false);
      enqueueSnackbar('Case reopened', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to reopen the case', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const cards = {
    summary: (
      <SummaryCard
        practiceId={practice.id}
        ticket={ticket}
        locked={locked}
        tab={tab}
        onTabChange={setTab}
        onCodeAdded={(code) => update({ ...ticket, snomed_codes: [code, ...ticket.snomed_codes] })}
      />
    ),
    chat: (
      <ChatCard
        practiceId={practice.id}
        ticket={ticket}
        locked={locked}
        placeholders={placeholders}
        onRefresh={refresh}
        onSent={(message) => update({ ...ticket, messages: [...ticket.messages, message] })}
      />
    ),
    // Shown only with the Summary tab, as live.
    recommendations: tab === 'summary' && (
      <RecommendationsCard practiceId={practice.id} ticket={ticket} locked={locked} onSaved={update} />
    ),
    assign: (
      <AssignStaffCard
        key={ticket.assigned_staff?.id ?? 'none'}
        practiceId={practice.id}
        ticket={ticket}
        closed={closed}
        onAssigned={update}
      />
    ),
    details: (
      <FormSectionCard title="Details">
        <LabelValueList
          labelWidth={150}
          items={[
            { label: 'Request date & time', value: formatDateTime(ticket.created_at) },
            { label: 'Status', value: TICKET_STATUS_LABELS[ticket.status] },
            { label: 'Request Name', value: ticket.request_name },
            { label: 'Submitted by', value: ticket.submitted_by },
            { label: 'Assigned to', value: ticket.assigned_staff?.name ?? '' },
          ]}
        />
      </FormSectionCard>
    ),
    notes: (
      <ClinicalNotesCard
        practiceId={practice.id}
        ticket={ticket}
        locked={locked}
        placeholders={placeholders}
        onSaved={(note) => update({ ...ticket, notes: [note, ...ticket.notes] })}
      />
    ),
    transcript: <TranscriptCard ticket={ticket} />,
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <GoBackLink
          variant="pill"
          onClick={() => {
            // From Appointment, go back to the tab or view it was opened from.
            if (fromAppointment && window.history.length > 1) router.back();
            else
              router.push(
                practiceHref(fromAppointment ? APPOINTMENT_PATH : closed ? CLOSED_TICKETS_PATH : TICKETS_PATH),
              );
          }}
        >
          Back
        </GoBackLink>
      </Box>
      <ModulePageHeader
        title="Consultation Details"
        titleAdornment={<ViewerChip name={ticket.current_viewer_name} />}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<CloudDownload />}
              onClick={() => enqueueSnackbar('No clinical system is connected in this demo.', { variant: 'info' })}
            >
              Fetch from Clinical System
            </Button>
            <Tooltip title="No clinical system is connected in this demo">
              <span>
                <Button variant="outlined" startIcon={<CloudUpload />} disabled>
                  Send data to Clinical System
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="No clinical system is connected in this demo">
              <span>
                <Button variant="text" endIcon={<OpenInNew />} disabled>
                  Open in Clinical System
                </Button>
              </span>
            </Tooltip>
          </>
        }
      />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', mb: 2.5 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
            <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary' }}>
              {ticket.patient_name}
            </Typography>
            <CopyNameButton name={ticket.patient_name} />
          </Stack>
          <StatusChip
            status={TICKET_URGENCY_LABELS[ticket.urgency]}
            tone={ticket.urgency === 'URGENT' ? 'error' : 'neutral'}
            variant="outlined"
          />
          <Button
            component={Link}
            href={practiceHref(previousConsultationsPath(ticket.id))}
            variant="text"
            size="small"
            startIcon={<ChevronLeft />}
          >
            Previous Consultations
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<History />} onClick={() => setLogsOpen(true)}>
            View Logs
          </Button>
          <Button
            variant="contained"
            color="brand"
            size="small"
            startIcon={<PublishedWithChanges />}
            onClick={() => setStatusOpen(true)}
            disabled={locked}
          >
            Update Status
          </Button>
          <StatusChip status={TICKET_STATUS_LABELS[ticket.status]} variant="outlined" size="medium" />
          {closed && (
            <Button variant="contained" size="small" startIcon={<LockOpen />} onClick={() => setReopening(true)}>
              Reopen Case
            </Button>
          )}
        </Stack>
      </Stack>
      {closed ? (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          This case is closed. Please reopen it to make changes.
          {ticket.closed_by_name && ticket.closed_at
            ? ` Closed by ${ticket.closed_by_name} on ${formatDateTime(ticket.closed_at)}.`
            : ''}
          {ticket.closure_reason ? ` Reason: ${ticket.closure_reason}.` : ''}
        </Alert>
      ) : (
        unassigned && (
          <Alert severity="info" sx={{ mb: 2.5 }}>
            This consultation is unassigned and read-only. Assign a staff member to enable actions. Use the Assign Staff
            Member panel to assign it.
          </Alert>
        )
      )}
      {wide ? (
        <Grid container spacing={2.5}>
          <Grid size={7}>
            <Stack spacing={2.5}>
              {cards.summary}
              {cards.recommendations}
              {cards.notes}
              {cards.transcript}
            </Stack>
          </Grid>
          <Grid size={5}>
            <Stack spacing={2.5}>
              {cards.chat}
              {cards.assign}
              {cards.details}
            </Stack>
          </Grid>
        </Grid>
      ) : (
        // One column in the captured top-to-bottom order.
        <Stack spacing={2.5}>
          {cards.summary}
          {cards.chat}
          {cards.recommendations}
          {cards.assign}
          {cards.details}
          {cards.notes}
          {cards.transcript}
        </Stack>
      )}
      <LogsDrawer
        open={logsOpen}
        practiceId={practice.id}
        ticketId={ticket.id}
        patientName={ticket.patient_name}
        onClose={() => setLogsOpen(false)}
      />
      <UpdateStatusModal
        open={statusOpen}
        practiceId={practice.id}
        ticket={ticket}
        onClose={() => setStatusOpen(false)}
        onSaved={(saved) => {
          update(saved);
          setStatusOpen(false);
        }}
      />
      <ConfirmDialog
        open={reopening}
        title="Reopen Case"
        message={`Reopen ${ticket.patient_name}'s consultation? It will move back to Open Cases.`}
        confirmButtonText="Reopen Case"
        confirmButtonVariant="primary"
        confirmButtonLoading={busy}
        onClose={() => setReopening(false)}
        onConfirm={reopen}
      />
    </>
  );
}
