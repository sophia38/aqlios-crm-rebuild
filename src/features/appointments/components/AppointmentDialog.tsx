'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CalendarMonth from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Close from '@mui/icons-material/Close';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import PersonOff from '@mui/icons-material/PersonOffOutlined';
import Videocam from '@mui/icons-material/VideocamOutlined';
import { LabelValueList } from '@/components/data/LabelValueList';
import { StatusChip } from '@/components/data/StatusChip';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/modals/ConfirmDialog';
import { patientPath } from '@/features/patients/patientsRoutes';
import { useCurrentPractice, usePracticeHref } from '@/features/practice/PracticeContext';
import {
  APPOINTMENT_KIND_LABELS,
  APPOINTMENT_REASON_MAX,
  APPOINTMENT_SEVERITY_LABELS,
  APPOINTMENT_STATUS_LABELS,
  appointmentsApi,
  hasStarted,
  isBookable,
} from '@/lib/api/appointments';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { Appointment } from '@/lib/api/types';
import { formatTimeRange } from '../appointmentFormat';
import { appointmentConsultationPath } from '../appointmentRoutes';

type Action = 'reschedule' | 'cancel' | 'complete' | 'dna';

/**
 * Appointment popup (docs/practice/03-appointment.md, plan §3): summary card with the actions, View
 * Request Details, Appointment Information and Patient Information. Times are 24-hour, and the time
 * shows the real length (fixes "03:00 AM (1259 mins)").
 */
export function AppointmentDialog({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onChanged: (appointment: Appointment) => void;
}) {
  const titleId = useId();
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (reason?: string) => {
    if (!appointment || !action) return;
    setBusy(true);
    const toasts: Record<Action, [string, string]> = {
      reschedule: ['Reschedule requested', 'Failed to request a reschedule'],
      cancel: ['Appointment cancelled', 'Failed to cancel the appointment'],
      complete: ['Appointment marked as completed', 'Failed to update the appointment'],
      dna: ['Appointment marked as DNA', 'Failed to update the appointment'],
    };
    try {
      const id = appointment.id;
      const saved =
        action === 'reschedule'
          ? await appointmentsApi.reschedule(PUBLIC_SUB_APP_ID, practice.id, id)
          : action === 'cancel'
            ? await appointmentsApi.cancel(PUBLIC_SUB_APP_ID, practice.id, id, reason ?? '')
            : action === 'complete'
              ? await appointmentsApi.complete(PUBLIC_SUB_APP_ID, practice.id, id)
              : await appointmentsApi.markDna(PUBLIC_SUB_APP_ID, practice.id, id);
      enqueueSnackbar(toasts[action][0], { variant: 'success' });
      setAction(null);
      onChanged(saved);
    } catch {
      enqueueSnackbar(toasts[action][1], { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const when = appointment ? `${dayjs(appointment.date).format('DD/MM/YYYY')} at ${appointment.start_time}` : '';
  const confirms: Record<Action, Omit<ConfirmDialogProps, 'open' | 'onClose' | 'onConfirm'>> = {
    reschedule: {
      title: 'Reschedule Appointment',
      message: `Ask ${appointment?.patient_name} to rebook their appointment on ${when}? The patient will be asked to choose a new time.`,
      confirmButtonText: 'Request Reschedule',
      confirmButtonVariant: 'primary',
    },
    cancel: {
      title: 'Cancel Appointment',
      message: `Cancel ${appointment?.patient_name}'s appointment on ${when}?`,
      confirmButtonText: 'Cancel Appointment',
      cancelButtonText: 'Keep Appointment',
      confirmButtonVariant: 'error',
      requireReason: {
        label: 'Reason',
        maxLength: APPOINTMENT_REASON_MAX,
        required: true,
        placeholder: 'Why is this appointment being cancelled?',
      },
    },
    complete: {
      title: 'Mark as Completed',
      message: `Record ${appointment?.patient_name}'s appointment on ${when} as completed?`,
      confirmButtonText: 'Mark as Completed',
      confirmButtonVariant: 'success',
    },
    dna: {
      title: 'Mark as DNA',
      message: `Record that ${appointment?.patient_name} did not attend their appointment on ${when}?`,
      confirmButtonText: 'Mark as DNA',
      confirmButtonVariant: 'warning',
    },
  };

  const video = appointment?.type === 'ONLINE_VIDEO';
  const bookable = appointment ? isBookable(appointment) : false;
  const started = appointment ? hasStarted(appointment) : false;

  return (
    <>
      <Dialog
        open={appointment !== null}
        onClose={onClose}
        aria-labelledby={titleId}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: (theme) => ({
              width: 450,
              maxWidth: 'calc(100% - 32px)',
              m: 2,
              borderRadius: `${theme.tokens.radius.base}px`,
              border: 'none',
            }),
          },
        }}
      >
        {appointment && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
              <Typography id={titleId} component="h2" sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary' }}>
                {appointment.request_name}
              </Typography>
              <IconButton aria-label="Close" onClick={onClose} size="small">
                <Close fontSize="small" />
              </IconButton>
            </Stack>

            {/* Summary card */}
            <Box
              sx={(theme) => ({
                p: 2,
                mb: 2,
                bgcolor: theme.tokens.surface.tealLight,
                borderRadius: `${theme.tokens.radius.input}px`,
              })}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Box
                  aria-hidden
                  sx={(theme) => ({
                    width: 52,
                    flexShrink: 0,
                    py: 0.75,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    borderRadius: `${theme.tokens.radius.input}px`,
                  })}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'primary.main' }}>
                    {dayjs(appointment.date).format('MMM')}
                  </Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: 'text.primary' }}>
                    {dayjs(appointment.date).format('D')}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {dayjs(appointment.date).format('ddd')}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
                    {appointment.patient_name}
                  </Typography>
                  <Typography variant="body2">{appointment.staff.name}</Typography>
                  <Typography variant="body2">{APPOINTMENT_KIND_LABELS[appointment.type]}</Typography>
                </Box>
                <StatusChip status={APPOINTMENT_STATUS_LABELS[appointment.status]} />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mt: 2 }}>
                {video && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Videocam />}
                    disabled={appointment.status !== 'IN_PROGRESS' || !appointment.meeting_link}
                    href={appointment.meeting_link ?? ''}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Appointment
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CalendarMonth />}
                  disabled={appointment.status !== 'UPCOMING'}
                  onClick={() => setAction('reschedule')}
                >
                  Reschedule
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutline />}
                  disabled={!bookable}
                  onClick={() => setAction('cancel')}
                >
                  Cancel Appointment
                </Button>
                {started && appointment.status !== 'COMPLETED' && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleOutline />}
                    onClick={() => setAction('complete')}
                  >
                    Mark as Completed
                  </Button>
                )}
                {started && appointment.status !== 'DNA' && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<PersonOff />}
                    onClick={() => setAction('dna')}
                  >
                    Mark as DNA
                  </Button>
                )}
              </Stack>
            </Box>

            <ButtonBase
              component={Link}
              href={practiceHref(appointmentConsultationPath(appointment.consultation_id))}
              sx={(theme) => ({
                width: '100%',
                justifyContent: 'space-between',
                textAlign: 'left',
                gap: 1,
                p: 1.5,
                mb: 2.5,
                border: `1px solid ${theme.palette.brand.main}`,
                borderRadius: `${theme.tokens.radius.input}px`,
                '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}` },
              })}
            >
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'primary.main' }}>
                  View Request Details
                </Typography>
                <Typography variant="caption">See full request history, messages and clinician updates</Typography>
              </Box>
              <ChevronRight sx={{ color: 'primary.main' }} />
            </ButtonBase>

            <Typography component="h3" sx={{ fontSize: 15, fontWeight: 600, mb: 1 }}>
              Appointment Information
            </Typography>
            <LabelValueList
              labelWidth={140}
              items={[
                { label: 'Date', value: dayjs(appointment.date).format('dddd, DD/MM/YYYY') },
                { label: 'Time', value: formatTimeRange(appointment) },
                { label: 'Request Type', value: APPOINTMENT_SEVERITY_LABELS[appointment.severity] },
                { label: 'Appointment Type', value: APPOINTMENT_KIND_LABELS[appointment.type] },
                ...(video
                  ? [
                      {
                        label: 'Meeting Link',
                        value: appointment.meeting_link && (
                          <Box
                            component="a"
                            href={appointment.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'secondary.dark' }}
                          >
                            Open meeting link
                          </Box>
                        ),
                      },
                    ]
                  : []),
                ...(appointment.cancellation_reason && appointment.status.startsWith('CANCELLED')
                  ? [{ label: 'Cancellation Reason', value: appointment.cancellation_reason }]
                  : []),
              ]}
            />

            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 2.5, mb: 1 }}>
              <Typography component="h3" sx={{ fontSize: 15, fontWeight: 600 }}>
                Patient Information
              </Typography>
              <Button
                component={Link}
                href={practiceHref(patientPath(appointment.patient_id))}
                size="small"
                variant="outlined"
                endIcon={<ChevronRight />}
              >
                View Full Profile
              </Button>
            </Stack>
            <LabelValueList
              labelWidth={140}
              items={[
                { label: 'Patient Name', value: appointment.patient_name },
                { label: 'Pronouns', value: appointment.patient_pronouns ?? '' },
                { label: 'Phone', value: appointment.patient_phone },
                { label: 'Email', value: appointment.patient_email },
              ]}
            />

            <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            </Stack>
          </Box>
        )}
      </Dialog>
      {action && (
        <ConfirmDialog
          open
          {...confirms[action]}
          confirmButtonLoading={busy}
          onClose={() => setAction(null)}
          onConfirm={run}
        />
      )}
    </>
  );
}
