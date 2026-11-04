import dayjs from 'dayjs';
import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import { dayLength, LEAVE_NOTE_MAX, LEAVE_REASON_MAX, round, scheduleOf } from '@/lib/api/leave';
import { LEAVE_TYPES, type LeaveApplyInput, type LeaveRequest, type LeaveType } from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import { BANK_HOLIDAY_DATES, balanceFor, hoursFor, leaveRecords, presentLeave, type LeaveRecord } from '../leaveState';
import { currentPersona, getDb, saveDb, visiblePractices } from '../store';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';
import { leavePeople } from './staff';

// Leave mocks (docs/plans/phase-5-practice-modules.md §6). All inferred.

const practicePath = (path: string) => `*${CRM_API}/public/v1/sub-apps/:subAppId/practices/:practiceId/${path}`;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function guard(practiceId: string) {
  if (!getDb().session.signedIn) return unauthorized();
  if (!visiblePractices().some((practice) => practice.id === practiceId)) return forbidden();
  return null;
}

const actorName = () => {
  const persona = currentPersona();
  return `${persona.firstName} ${persona.lastName}`;
};

const me = (practiceId: string) => leavePeople(practiceId).find((person) => person.id === currentPersona().userId);

/** Pending requests (Leave Requests) or decided ones (Leaves History), filtered and searched. */
function listFor(request: Request, practiceId: string): LeaveRequest[] {
  const query = new URL(request.url).searchParams;
  const history = query.get('tab') === 'history';
  const status = query.get('status');
  const staffId = query.get('staff_id');
  const roleId = query.get('role_id');
  const type = query.get('leave_type');
  const search = query.get('search')?.trim().toLowerCase();
  const rows = leaveRecords(practiceId)
    .filter((record) => (history ? ['APPROVED', 'REJECTED'].includes(record.status) : record.status === 'PENDING'))
    .filter((record) => !status || record.status === status)
    .filter((record) => !staffId || record.staff_id === staffId)
    .filter((record) => !roleId || record.role_id === roleId)
    .filter((record) => !type || record.leave_type === type)
    .map(presentLeave)
    .filter((row) => !search || `${row.staff_name} ${row.role_name}`.toLowerCase().includes(search));
  return order(request, rows, history ? '-updated_at' : 'start_date');
}

function findPending(practiceId: string, id: string) {
  const record = leaveRecords(practiceId).find((item) => item.id === id);
  if (!record) return { error: fail(404, 'Leave request not found') };
  if (record.status !== 'PENDING') return { error: fail(400, 'This leave request has already been decided.') };
  return { record };
}

function applyProblems(practiceId: string, input: Partial<LeaveApplyInput>) {
  const person = me(practiceId);
  if (!person) return 'You are not on this practice’s staff list.';
  if (!LEAVE_TYPES.includes(input.leave_type as LeaveType)) return 'Leave Type is required';
  const start = String(input.start_date ?? '');
  const end = String(input.end_date ?? '');
  if (!DATE.test(start)) return 'Start Date is required';
  if (!DATE.test(end)) return 'End Date is required';
  if (end < start) return "End Date can't be before Start Date";
  if (input.leave_type !== 'SICK' && start < dayjs().format('YYYY-MM-DD')) return "Start Date can't be in the past";
  if (String(input.notes ?? '').length > LEAVE_NOTE_MAX) return `Note must be ${LEAVE_NOTE_MAX} characters or fewer`;
  const hours = Number(input.duration_hours);
  const available = hoursFor(person, start, end);
  if (!available) return "You don't work on these dates";
  if (!(hours > 0)) return 'Duration must be more than 0';
  if (hours > available) return `Duration can't be more than the ${available} h you work in these dates`;
  const overlaps = leaveRecords(practiceId).some(
    (record) =>
      record.staff_id === person.id &&
      ['PENDING', 'APPROVED'].includes(record.status) &&
      record.start_date <= end &&
      record.end_date >= start,
  );
  if (overlaps) return 'You already have leave booked in these dates.';
  return null;
}

export const leaveHandlers = [
  http.get(practicePath('leave-requests/'), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    return ok(paginate(request, listFor(request, practiceId)));
  }),

  // The Staff filter: everyone who can take leave here, including the super-admin.
  http.get(practicePath('leave-requests/staff/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    return ok(
      leavePeople(practiceId)
        .map(({ id, name, role_id, role_name }) => ({ id, name, role_id, role_name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }),

  http.post(practicePath('leave-requests/:id/approve/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const { record, error } = findPending(practiceId, String(params.id));
    if (error) return error;
    if (record.staff_id === currentPersona().userId) return fail(400, "You can't approve your own leave request.");
    Object.assign(record, { status: 'APPROVED', decided_by: actorName(), updated_at: new Date().toISOString() });
    saveDb();
    return ok(presentLeave(record), 'Leave request approved');
  }),

  http.post(practicePath('leave-requests/:id/reject/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const { record, error } = findPending(practiceId, String(params.id));
    if (error) return error;
    if (record.staff_id === currentPersona().userId) return fail(400, "You can't reject your own leave request.");
    const { reason } = (await request.json().catch(() => ({}))) as { reason?: string };
    const text = String(reason ?? '').trim();
    if (text.length > LEAVE_REASON_MAX) return fail(400, `Reason must be ${LEAVE_REASON_MAX} characters or fewer`);
    Object.assign(record, {
      status: 'REJECTED',
      decided_by: actorName(),
      rejection_reason: text || null,
      updated_at: new Date().toISOString(),
    });
    saveDb();
    return ok(presentLeave(record), 'Leave request rejected');
  }),

  http.get(practicePath('me/leave-requests/'), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const from = query.get('from');
    const to = query.get('to');
    const type = query.get('leave_type');
    const status = query.get('status');
    const rows = leaveRecords(practiceId)
      .filter((record) => record.staff_id === currentPersona().userId)
      .filter((record) => !from || record.end_date >= from)
      .filter((record) => !to || record.start_date <= to)
      .filter((record) => !type || record.leave_type === type)
      .filter((record) => !status || record.status === status)
      .map(presentLeave);
    return ok(paginate(request, order(request, rows, '-requested_at')));
  }),

  http.get(practicePath('me/leave-balances/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const person = me(practiceId);
    if (!person) return fail(404, 'You are not on this practice’s staff list.');
    const year = dayjs().year();
    return ok({
      day_hours: round(dayLength(person.availability)),
      schedule: scheduleOf(person.availability),
      bank_holidays: BANK_HOLIDAY_DATES,
      year,
      balances: LEAVE_TYPES.map((type) => balanceFor(practiceId, person, type, year)),
    });
  }),

  http.post(practicePath('me/leave-requests/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const input = (await request.json()) as Partial<LeaveApplyInput>;
    const problem = applyProblems(practiceId, input);
    if (problem) return fail(400, problem);
    const person = me(practiceId)!;
    const now = new Date().toISOString();
    const records = leaveRecords(practiceId);
    const record: LeaveRecord = {
      id: mockId(`leave:${practiceId}:new`, Date.now() + records.length),
      practice_id: practiceId,
      staff_id: person.id,
      staff_name: person.name,
      role_id: person.role_id,
      role_name: person.role_name,
      leave_type: input.leave_type as LeaveType,
      start_date: String(input.start_date),
      end_date: String(input.end_date),
      duration_hours: round(Number(input.duration_hours)),
      notes: String(input.notes ?? '').trim(),
      status: 'PENDING',
      requested_at: now,
      updated_at: now,
      decided_by: null,
      rejection_reason: null,
    };
    records.push(record);
    saveDb();
    return created(presentLeave(record), 'Leave request submitted');
  }),

  http.post(practicePath('me/leave-requests/:id/cancel/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const record = leaveRecords(practiceId).find(
      (item) => item.id === String(params.id) && item.staff_id === currentPersona().userId,
    );
    if (!record) return fail(404, 'Leave request not found');
    if (record.status !== 'PENDING') return fail(400, 'Only pending requests can be cancelled.');
    Object.assign(record, { status: 'CANCELLED', updated_at: new Date().toISOString() });
    saveDb();
    return ok(presentLeave(record), 'Leave request cancelled');
  }),
];
