'use client';

import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Typography from '@mui/material/Typography';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { FormDrawer } from '@/components/modals/FormDrawer';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ticketsApi } from '@/lib/api/tickets';
import type { TicketLog } from '@/lib/api/types';
import { ActivityTimeline } from './ActivityTimeline';

/** Consultation Logs: a read-only right drawer with the white header used by every drawer (live: cyan). */
export function LogsDrawer({
  open,
  practiceId,
  ticketId,
  patientName,
  onClose,
}: {
  open: boolean;
  practiceId: string;
  ticketId: string;
  patientName: string;
  onClose: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [logs, setLogs] = useState<TicketLog[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    // Each opening loads the latest entries.
    setWasOpen(open);
    if (open) {
      setLogs(null);
      setFailed(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    ticketsApi
      .logs(PUBLIC_SUB_APP_ID, practiceId, ticketId, controller.signal)
      .then(setLogs)
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
        enqueueSnackbar('Failed to load the consultation logs', { variant: 'error' });
      });
    return () => controller.abort();
  }, [open, practiceId, ticketId, enqueueSnackbar]);

  return (
    <FormDrawer
      open={open}
      title="Consultation Logs"
      subtitle={`Full activity log for ${patientName}'s consultation`}
      onClose={onClose}
    >
      {failed ? (
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          Could not load the logs.
        </Typography>
      ) : logs === null ? (
        <LoadingSpinner message="Loading logs..." />
      ) : logs.length === 0 ? (
        <Typography variant="body2">No activity yet.</Typography>
      ) : (
        <ActivityTimeline entries={logs} />
      )}
    </FormDrawer>
  );
}
