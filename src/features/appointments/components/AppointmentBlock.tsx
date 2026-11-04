'use client';

import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { APPOINTMENT_KIND_LABELS, APPOINTMENT_STATUS_LABELS } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/api/types';
import { statusColors } from '../appointmentFormat';

/** An appointment in the calendar grid: tinted by status, with the patient, time and type. */
export function AppointmentBlock({
  appointment,
  compact,
  onClick,
}: {
  appointment: Appointment;
  compact: boolean;
  onClick: (appointment: Appointment) => void;
}) {
  const cancelled = appointment.status.startsWith('CANCELLED');
  return (
    <ButtonBase
      onClick={() => onClick(appointment)}
      aria-label={`View appointment for ${appointment.patient_name}, ${appointment.start_time} - ${appointment.end_time}, ${APPOINTMENT_STATUS_LABELS[appointment.status]}`}
      sx={(theme) => {
        const colors = statusColors(theme, appointment.status);
        return {
          width: '100%',
          height: '100%',
          display: 'block',
          textAlign: 'left',
          overflow: 'hidden',
          px: 0.75,
          py: 0.25,
          bgcolor: colors.bg,
          borderLeft: `3px solid ${colors.main}`,
          borderRadius: `${theme.tokens.rota.shiftRadius}px`,
          '&:hover': { boxShadow: theme.tokens.shadow.menu },
          '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
        };
      }}
    >
      <Typography
        noWrap
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: 'text.primary',
          textDecoration: cancelled ? 'line-through' : 'none',
        }}
      >
        {appointment.start_time} {appointment.patient_name}
      </Typography>
      {!compact && (
        <>
          <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>
            {APPOINTMENT_KIND_LABELS[appointment.type]} · {appointment.staff.name}
          </Typography>
          <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>
            {APPOINTMENT_STATUS_LABELS[appointment.status]}
          </Typography>
        </>
      )}
    </ButtonBase>
  );
}
