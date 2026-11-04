import dayjs from 'dayjs';
import type {
  Appointment,
  AppointmentKind,
  AppointmentRequest,
  AppointmentStatus,
  Patient,
  Practice,
  TicketDetail,
  TicketStaff,
} from '@/lib/api/types';
import { mockId } from './random';

// Fictional appointment demo data (docs/plans/phase-5-practice-modules.md §3). Like ROTA shifts,
// appointments aren't stored: each day's list is worked out from the date, and the status follows
// the clock. Changes (cancel, reschedule, outcome) are stored as overrides by the mock handlers.

/** Minutes per appointment type. */
const DURATIONS: Record<AppointmentKind, number[]> = {
  FACE_TO_FACE_SURGERY: [10, 15, 20],
  TELEPHONE_OR_AUDIO: [10, 15],
  FACE_TO_FACE_HOME_VISIT: [30, 45],
  WRITTEN_INCLUDING_ONLINE: [10],
  ONLINE_VIDEO: [15, 20],
};
const KINDS: AppointmentKind[] = [
  'FACE_TO_FACE_SURGERY',
  'FACE_TO_FACE_SURGERY',
  'TELEPHONE_OR_AUDIO',
  'ONLINE_VIDEO',
  'FACE_TO_FACE_SURGERY',
  'TELEPHONE_OR_AUDIO',
  'FACE_TO_FACE_HOME_VISIT',
  'ONLINE_VIDEO',
  'WRITTEN_INCLUDING_ONLINE',
];
const PATIENT_CANCEL_REASONS = [
  'Patient called to say they no longer need the appointment.',
  'Patient is away that week and will book again on their return.',
];
const STAFF_CANCEL_REASONS = [
  'Clinician unwell; the patient was offered another day.',
  'Clinic room unavailable; the patient was called to rebook.',
];

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** An appointment before any change: the seeded status for past cancellations, otherwise the clock decides. */
export interface AppointmentSeed extends Omit<Appointment, 'status'> {
  seeded_status: 'CANCELLED_BY_PATIENT' | 'CANCELLED_BY_STAFF' | 'DNA' | null;
}

export interface AppointmentContext {
  practice: Practice;
  /** The practice's consultations: each appointment books one. */
  tickets: TicketDetail[];
  patients: Map<string, Patient>;
  staff: TicketStaff[];
}

/** Appointment ids carry their date, so one can be found without listing the week. */
export const appointmentId = (date: string, index: number) => `appt-${date}-${index}`;
export const dateOfAppointmentId = (id: string) => id.match(/^appt-(\d{4}-\d{2}-\d{2})-\d+$/)?.[1] ?? null;

/** 3–8 appointments on weekdays and 0–2 on Saturday mornings (extended access), none on Sundays. */
export function appointmentsOn(context: AppointmentContext, date: string): AppointmentSeed[] {
  const { practice, tickets, patients, staff } = context;
  if (!tickets.length || !staff.length) return [];
  const weekday = dayjs(date).day();
  if (weekday === 0) return [];
  const roll = hash(`${practice.id}:${date}`);
  const count = weekday === 6 ? roll % 3 : 3 + (roll % 6);
  // Spread the day between 08:00 and 17:30 (Saturdays 09:00–12:30), in 10-minute steps.
  const [first, last] = weekday === 6 ? [9 * 60, 12 * 60 + 30] : [8 * 60, 17 * 60 + 30];
  const steps = (last - first) / 10;

  return Array.from({ length: count }, (_, index) => {
    const seed = hash(`${practice.id}:${date}:${index}`);
    const ticket = tickets[seed % tickets.length];
    const patient = patients.get(ticket.patient_id);
    const type = KINDS[(seed >>> 3) % KINDS.length];
    const durations = DURATIONS[type];
    const duration = durations[(seed >>> 7) % durations.length];
    const startMinutes = first + Math.floor((((seed >>> 11) % 1000) / 1000) * steps) * 10;
    const member = ticket.assigned_staff ?? ticket.recommended_staff ?? staff[(seed >>> 5) % staff.length];
    const id = appointmentId(date, index);
    const cancel = (seed >>> 13) % 13;
    return {
      id,
      practice_id: practice.id,
      consultation_id: ticket.id,
      request_name: ticket.request_name,
      patient_id: ticket.patient_id,
      patient_name: ticket.patient_name,
      patient_pronouns: null,
      patient_phone: patient?.phone_number ?? '',
      patient_email: patient?.email ?? '',
      staff: member,
      type,
      severity: ticket.urgency === 'URGENT' ? 'URGENT' : 'ROUTINE',
      date,
      start_time: clock(startMinutes),
      end_time: clock(startMinutes + duration),
      duration_minutes: duration,
      meeting_link: type === 'ONLINE_VIDEO' ? `https://example.com/aqlios-video/${id}` : null,
      cancellation_reason:
        cancel === 0
          ? PATIENT_CANCEL_REASONS[seed % PATIENT_CANCEL_REASONS.length]
          : cancel === 1
            ? STAFF_CANCEL_REASONS[seed % STAFF_CANCEL_REASONS.length]
            : null,
      seeded_status: cancel === 0 ? 'CANCELLED_BY_PATIENT' : cancel === 1 ? 'CANCELLED_BY_STAFF' : null,
    };
  });
}

/** Status from the clock: past is Completed (about 1 in 7 DNA), now is In Progress, later is Upcoming. */
export function clockStatus(seed: AppointmentSeed, now = dayjs()): AppointmentStatus {
  if (seed.seeded_status) return seed.seeded_status;
  const start = dayjs(`${seed.date}T${seed.start_time}`);
  const end = dayjs(`${seed.date}T${seed.end_time}`);
  if (now.isBefore(start)) return 'UPCOMING';
  if (now.isBefore(end)) return 'IN_PROGRESS';
  return hash(seed.id) % 7 === 0 ? 'DNA' : 'COMPLETED';
}

const REQUEST_REASONS = [
  'Patient asked to see a female clinician.',
  'Continuity of care: the patient usually sees this GP.',
  'The recommended clinician is on leave that day.',
  'Patient prefers a clinician who speaks Polish.',
  'Needs a nurse-led review rather than a GP.',
  'An earlier slot is free with another clinician.',
];

/**
 * About 10 alternative-booking requests per demo practice, built around the time the demo data is
 * first created: 4 pending, 3 approved (2 today), 2 rejected (1 today) and 1 expired.
 */
export function buildAppointmentRequests(contexts: AppointmentContext[], now = dayjs()): AppointmentRequest[] {
  const requests: AppointmentRequest[] = [];
  const startOfDay = now.startOf('day');
  // A moment earlier today (or just now, straight after midnight).
  const earlierToday = (fraction: number) => startOfDay.add(now.diff(startOfDay) * fraction, 'millisecond');
  const plan: { status: AppointmentRequest['status']; created: dayjs.Dayjs; decided: dayjs.Dayjs | null }[] = [
    { status: 'PENDING', created: now.subtract(25, 'minute'), decided: null },
    { status: 'PENDING', created: now.subtract(2, 'hour'), decided: null },
    { status: 'PENDING', created: now.subtract(5, 'hour'), decided: null },
    { status: 'PENDING', created: now.subtract(9, 'hour'), decided: null },
    { status: 'APPROVED', created: earlierToday(0.4), decided: earlierToday(0.6) },
    { status: 'APPROVED', created: earlierToday(0.2), decided: earlierToday(0.3) },
    { status: 'APPROVED', created: now.subtract(3, 'day'), decided: now.subtract(3, 'day').add(2, 'hour') },
    { status: 'REJECTED', created: earlierToday(0.5), decided: earlierToday(0.7) },
    { status: 'REJECTED', created: now.subtract(6, 'day'), decided: now.subtract(6, 'day').add(1, 'hour') },
    // Never decided: shown as Expired once its 24 hours have passed.
    { status: 'PENDING', created: now.subtract(2, 'day'), decided: null },
  ];

  for (const { practice, tickets, staff } of contexts) {
    if (!tickets.length || staff.length < 3) continue;
    const navigators = staff.filter((member) => member.role !== 'Clinician');
    const deciders = staff.filter((member) => member.role === 'Practice Manager');
    plan.forEach((entry, index) => {
      const ticket = tickets[(index * 7 + 3) % tickets.length];
      const original = ticket.recommended_staff ?? staff[index % staff.length];
      // Prefer clinical staff as the alternative; small practices fall back to anyone else.
      const others = staff.filter((member) => member.id !== original.id);
      const clinical = others.filter((member) => member.role === 'Clinician' || member.role === 'Nurse');
      const alternatives = clinical.length ? clinical : others;
      const requested = alternatives[(index * 5) % alternatives.length];
      // Someone asks for the change on the patient's behalf: never the requested alternative.
      const askers = (navigators.length ? navigators : staff).filter((member) => member.id !== requested.id);
      const requestedBy = askers.length ? askers[index % askers.length] : requested;
      const decider = (deciders.length ? deciders : staff)[0];
      requests.push({
        id: mockId(`appointment-request:${practice.id}`, index),
        practice_id: practice.id,
        consultation_id: ticket.id,
        patient_id: ticket.patient_id,
        patient_name: ticket.patient_name,
        original_staff: original,
        requested_staff: requested,
        reason: REQUEST_REASONS[index % REQUEST_REASONS.length],
        requested_by: requestedBy,
        created_at: entry.created.toISOString(),
        expires_at: entry.created.add(24, 'hour').toISOString(),
        status: entry.status,
        decided_at: entry.decided?.toISOString() ?? null,
        decided_by_name: entry.decided ? decider.name : null,
        rejection_reason: entry.status === 'REJECTED' ? 'The recommended clinician has capacity that day.' : null,
      });
    });
  }
  return requests;
}
