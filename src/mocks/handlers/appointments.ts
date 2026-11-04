import dayjs from 'dayjs';
import { http } from 'msw/http';
import { APPOINTMENT_REASON_MAX } from '@/lib/api/appointments';
import { CRM_API } from '@/lib/api/config';
import type { Appointment, AppointmentRequest, AppointmentStatus } from '@/lib/api/types';
import {
  appointmentsOn,
  clockStatus,
  dateOfAppointmentId,
  type AppointmentContext,
  type AppointmentSeed,
} from '../fixtures/appointments';
import { assignableStaff } from '../fixtures/tickets';
import { currentPersona, getDb, saveDb, visiblePractices } from '../store';
import { fail, forbidden, ok, order, paginate, unauthorized } from '../respond';

// Appointment mocks (docs/plans/phase-5-practice-modules.md §3). No appointment call was captured.

const practicePath = (path: string) => `*${CRM_API}/public/v1/sub-apps/:subAppId/practices/:practiceId/${path}`;

const CANCELLED: AppointmentStatus[] = ['CANCELLED_BY_PATIENT', 'CANCELLED_BY_STAFF'];

function guard(practiceId: string) {
  if (!getDb().session.signedIn) return unauthorized();
  if (!visiblePractices().some((practice) => practice.id === practiceId)) return forbidden();
  return null;
}

function contextFor(practiceId: string): AppointmentContext | null {
  const db = getDb();
  const practice = db.practices.find((item) => item.id === practiceId);
  if (!practice) return null;
  return {
    practice,
    tickets: db.tickets.filter((ticket) => ticket.practice_id === practiceId),
    patients: new Map(db.patients.filter((item) => item.practice_id === practiceId).map((item) => [item.id, item])),
    staff: assignableStaff(db.staff, db.roles, practiceId),
  };
}

const changeKey = (practiceId: string, appointmentId: string) => `${practiceId}:${appointmentId}`;

/** The appointment as shown: the clock status, unless it was changed in the demo. */
function present(seed: AppointmentSeed): Appointment {
  const rest: Omit<AppointmentSeed, 'seeded_status'> & { seeded_status?: unknown } = { ...seed };
  delete rest.seeded_status;
  const change = getDb().appointmentChanges[changeKey(seed.practice_id, seed.id)];
  if (!change) return { ...rest, status: clockStatus(seed) };
  return { ...rest, status: change.status, cancellation_reason: change.reason ?? rest.cancellation_reason };
}

/** The days a list covers: the week from `week_start`, or one `date` (default today). */
function daysOf(query: URLSearchParams) {
  const weekStart = query.get('week_start');
  if (weekStart)
    return Array.from({ length: 7 }, (_, offset) => dayjs(weekStart).add(offset, 'day').format('YYYY-MM-DD'));
  return [query.get('date') || dayjs().format('YYYY-MM-DD')];
}

function filtered(practiceId: string, query: URLSearchParams, withStatus: boolean) {
  const context = contextFor(practiceId);
  if (!context) return [];
  const search = query.get('search')?.trim().toLowerCase();
  const type = query.get('type');
  const severity = query.get('severity');
  const staffId = query.get('staff_id');
  const status = withStatus ? query.get('status') : null;
  return daysOf(query)
    .flatMap((date) => appointmentsOn(context, date))
    .map(present)
    .filter((item) => !type || item.type === type)
    .filter((item) => !severity || item.severity === severity)
    .filter((item) => !staffId || item.staff.id === staffId)
    .filter((item) => !status || item.status === status)
    .filter((item) => {
      if (!search) return true;
      // Phone numbers match with or without spaces.
      const digits = search.replace(/\s/g, '');
      return (
        item.patient_name.toLowerCase().includes(search) ||
        item.patient_email.toLowerCase().includes(search) ||
        (digits !== '' && item.patient_phone.replace(/\s/g, '').includes(digits))
      );
    });
}

function findAppointment(practiceId: string, appointmentId: string) {
  const date = dateOfAppointmentId(appointmentId);
  const context = contextFor(practiceId);
  if (!date || !context) return null;
  return appointmentsOn(context, date).find((item) => item.id === appointmentId) ?? null;
}

/** Saves a change and returns the updated appointment. */
function change(seed: AppointmentSeed, status: AppointmentStatus, reason: string | null = null) {
  getDb().appointmentChanges[changeKey(seed.practice_id, seed.id)] = { status, reason };
  saveDb();
  return present(seed);
}

const actorName = () => {
  const persona = currentPersona();
  return `${persona.firstName} ${persona.lastName}`;
};

/** Pending requests expire 24 hours after they're made. */
function presentRequest(request: AppointmentRequest): AppointmentRequest {
  if (request.status === 'PENDING' && dayjs(request.expires_at).isBefore(dayjs())) {
    return { ...request, status: 'EXPIRED' };
  }
  return request;
}

const decidedToday = (request: AppointmentRequest) =>
  Boolean(request.decided_at && dayjs(request.decided_at).isSame(dayjs(), 'day'));

const RANGE_DAYS: Record<string, number> = { today: 0, last_7_days: 6, last_30_days: 29 };

function withAppointment(
  handler: (seed: AppointmentSeed, request: Request) => Response | Promise<Response>,
): Parameters<typeof http.post>[1] {
  return async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const seed = findAppointment(practiceId, String(params.appointmentId));
    if (!seed) return fail(404, 'Appointment not found');
    return handler(seed, request);
  };
}

function withRequest(
  handler: (item: AppointmentRequest, request: Request) => Response | Promise<Response>,
): Parameters<typeof http.post>[1] {
  return async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const item = getDb().appointmentRequests.find(
      (entry) => entry.id === params.requestId && entry.practice_id === practiceId,
    );
    if (!item) return fail(404, 'Request not found');
    if (presentRequest(item).status !== 'PENDING')
      return fail(400, 'This request has already been decided or has expired.');
    return handler(item, request);
  };
}

export const appointmentHandlers = [
  http.get(practicePath('appointments/'), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    // `ordering=start` / `-start`: date and time together.
    const desc = query.get('ordering') === '-start';
    const sorted = filtered(practiceId, query, true).sort((a, b) => {
      const result = `${a.date}T${a.start_time}`.localeCompare(`${b.date}T${b.start_time}`);
      return desc ? -result : result;
    });
    return ok(paginate(request, sorted));
  }),

  http.get(practicePath('appointments/summary/'), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const items = filtered(practiceId, new URL(request.url).searchParams, false);
    const count = (statuses: AppointmentStatus[]) => items.filter((item) => statuses.includes(item.status)).length;
    return ok({
      upcoming: count(['UPCOMING', 'RESCHEDULE_REQUESTED']),
      in_progress: count(['IN_PROGRESS']),
      dna: count(['DNA']),
      completed: count(['COMPLETED']),
      cancelled: count(CANCELLED),
    });
  }),

  http.get(practicePath('appointments/:appointmentId/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const seed = findAppointment(practiceId, String(params.appointmentId));
    return seed ? ok(present(seed)) : fail(404, 'Appointment not found');
  }),

  http.post(
    practicePath('appointments/:appointmentId/cancel/'),
    withAppointment(async (seed, request) => {
      const current = present(seed);
      if (current.status !== 'UPCOMING' && current.status !== 'RESCHEDULE_REQUESTED') {
        return fail(400, 'Only upcoming appointments can be cancelled.');
      }
      const { reason } = (await request.json()) as { reason?: string };
      const text = String(reason ?? '').trim();
      if (!text) return fail(400, 'Reason is required', [{ field: 'reason', message: 'Reason is required' }]);
      if (text.length > APPOINTMENT_REASON_MAX) {
        return fail(400, `Reason must be ${APPOINTMENT_REASON_MAX} characters or fewer`);
      }
      return ok(change(seed, 'CANCELLED_BY_STAFF', text), 'Appointment cancelled successfully');
    }),
  ),

  http.post(
    practicePath('appointments/:appointmentId/reschedule/'),
    withAppointment((seed) => {
      if (present(seed).status !== 'UPCOMING') return fail(400, 'Only upcoming appointments can be rescheduled.');
      return ok(change(seed, 'RESCHEDULE_REQUESTED'), 'Reschedule requested successfully');
    }),
  ),

  ...(['complete', 'dna'] as const).map((action) =>
    http.post(
      practicePath(`appointments/:appointmentId/${action}/`),
      withAppointment((seed) => {
        const current = present(seed);
        if (!['IN_PROGRESS', 'COMPLETED', 'DNA'].includes(current.status)) {
          return fail(400, 'The outcome can be recorded once the appointment has started.');
        }
        return ok(change(seed, action === 'complete' ? 'COMPLETED' : 'DNA'), 'Appointment updated successfully');
      }),
    ),
  ),

  http.get(practicePath('appointment-requests/'), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const requestedBy = query.get('requested_by');
    const status = query.get('status');
    const range = query.get('range');
    const since = range && range in RANGE_DAYS ? dayjs().subtract(RANGE_DAYS[range], 'day').startOf('day') : null;
    const results = getDb()
      .appointmentRequests.filter((item) => item.practice_id === practiceId)
      .map(presentRequest)
      .filter((item) => !requestedBy || item.requested_by.id === requestedBy)
      .filter((item) => !status || item.status === status)
      .filter((item) => !since || !dayjs(item.created_at).isBefore(since));
    return ok(paginate(request, order(request, results, '-created_at')));
  }),

  http.get(practicePath('appointment-requests/summary/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const items = getDb()
      .appointmentRequests.filter((item) => item.practice_id === practiceId)
      .map(presentRequest);
    return ok({
      pending: items.filter((item) => item.status === 'PENDING').length,
      approved_today: items.filter((item) => item.status === 'APPROVED' && decidedToday(item)).length,
      rejected_today: items.filter((item) => item.status === 'REJECTED' && decidedToday(item)).length,
    });
  }),

  http.post(
    practicePath('appointment-requests/:requestId/approve/'),
    withRequest((item) => {
      Object.assign(item, { status: 'APPROVED', decided_at: new Date().toISOString(), decided_by_name: actorName() });
      saveDb();
      return ok(item, 'Request approved successfully');
    }),
  ),

  http.post(
    practicePath('appointment-requests/:requestId/reject/'),
    withRequest(async (item, request) => {
      const { reason } = (await request.json()) as { reason?: string };
      const text = String(reason ?? '').trim();
      if (text.length > APPOINTMENT_REASON_MAX) {
        return fail(400, `Reason must be ${APPOINTMENT_REASON_MAX} characters or fewer`);
      }
      Object.assign(item, {
        status: 'REJECTED',
        decided_at: new Date().toISOString(),
        decided_by_name: actorName(),
        rejection_reason: text || null,
      });
      saveDb();
      return ok(item, 'Request rejected successfully');
    }),
  ),
];
