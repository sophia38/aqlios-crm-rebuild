import dayjs from 'dayjs';
import type { Theme } from '@mui/material/styles';
import type { Appointment, AppointmentStatus } from '@/lib/api/types';

/** Stat card, chip and calendar block colours per status (the captured card colours). */
export function statusColors(theme: Theme, status: AppointmentStatus) {
  const { tone } = theme.tokens;
  switch (status) {
    case 'IN_PROGRESS':
      return { main: tone.info.main, bg: tone.info.strongBg };
    case 'DNA':
      return { main: tone.secondary.main, bg: tone.secondary.strongBg };
    case 'COMPLETED':
      return { main: tone.success.main, bg: tone.success.strongBg };
    case 'CANCELLED_BY_PATIENT':
    case 'CANCELLED_BY_STAFF':
      return { main: tone.error.main, bg: tone.error.strongBg };
    case 'RESCHEDULE_REQUESTED':
      return { main: tone.info.main, bg: tone.info.strongBg };
    default:
      return { main: tone.warning.main, bg: tone.warning.strongBg };
  }
}

/** "04/11/2026 14:05" (24-hour, as the rest of the app). */
export const formatAppointmentTime = (appointment: Appointment) =>
  `${dayjs(appointment.date).format('DD/MM/YYYY')} ${appointment.start_time}`;

/** "14:05 - 14:25 (20 mins)": the real length (fixes the live "1259 mins"). */
export const formatTimeRange = (appointment: Appointment) =>
  `${appointment.start_time} - ${appointment.end_time} (${appointment.duration_minutes} mins)`;

export const mondayOf = (date: string) => dayjs(date).subtract((dayjs(date).day() + 6) % 7, 'day');

/** "2 Nov - 8 Nov 2026" (captured week label). */
export function weekLabel(start: dayjs.Dayjs) {
  const end = start.add(6, 'day');
  return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`;
}

/** "3h 20m" until a pending request expires. */
export function expiresIn(expiresAt: string, now = dayjs()) {
  const minutes = Math.max(0, dayjs(expiresAt).diff(now, 'minute'));
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}
