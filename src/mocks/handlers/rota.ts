import { http } from 'msw/http';
import dayjs from 'dayjs';
import { CRM_API } from '@/lib/api/config';
import type { RotaGroupDetail, RotaGroupInput, RotaPractice, RotaStaff } from '@/lib/api/types';
import { activityFor, hoursBetween, rotaPeople, rotaWeek, type RotaGroupRecord } from '../fixtures/rota';
import { mockId } from '../fixtures/random';
import { currentPersona, getDb, saveDb } from '../store';
import { created, fail, forbidden, ok, paginate, unauthorized } from '../respond';

// Vertical ROTA mocks (docs/plans/phase-4-vertical-modules.md §4). ✔ = URL captured live; the
// assignments, rota group writes and staff activity endpoints are inferred.

const crm = (path: string) => `*${CRM_API}${path}`;
const rota = (path: string) => crm(`/rota/v1/sub-apps/:subAppId/${path}`);
const groups = (path = '') => crm(`/public/v1/sub-apps/:subAppId/rota-groups/${path}`);

function guard(adminOnly = true) {
  if (!getDb().session.signedIn) return unauthorized();
  if (adminOnly && !currentPersona().isAdmin) return forbidden();
  return null;
}

const people = () => {
  const { staff, roles, practices } = getDb();
  return rotaPeople(staff, roles, practices);
};

/** Hours covered by shifts per day, counting overlaps once. */
function coveredHours(shifts: { date: string; start_time: string; end_time: string }[]) {
  const byDay = new Map<string, [string, string][]>();
  for (const shift of shifts)
    byDay.set(shift.date, [...(byDay.get(shift.date) ?? []), [shift.start_time, shift.end_time]]);
  let total = 0;
  for (const spans of byDay.values()) {
    spans.sort((a, b) => a[0].localeCompare(b[0]));
    let [start, end] = spans[0];
    for (const [nextStart, nextEnd] of spans.slice(1)) {
      if (nextStart <= end) {
        if (nextEnd > end) end = nextEnd;
      } else {
        total += hoursBetween(start, end);
        [start, end] = [nextStart, nextEnd];
      }
    }
    total += hoursBetween(start, end);
  }
  return total;
}

const mondayOf = (date: string) => {
  const day = dayjs(date);
  return day.subtract((day.day() + 6) % 7, 'day').format('YYYY-MM-DD');
};

function toDetail(group: RotaGroupRecord): RotaGroupDetail {
  const { practices, roles, staff } = getDb();
  return {
    id: group.id,
    name: group.name,
    status: group.status,
    description: group.description,
    practices: group.practice_ids
      .map((id) => practices.find((practice) => practice.id === id))
      .filter((practice) => practice !== undefined)
      .map((practice) => ({ id: practice.id, practice_name: practice.practice_name })),
    roles: group.role_ids
      .map((id) => roles.find((role) => role.id === id))
      .filter((role) => role !== undefined)
      .map((role) => ({ id: role.id, name: role.name })),
    staff: group.staff_ids
      .map((id) => staff.find((member) => member.id === id))
      .filter((member) => member !== undefined)
      .map((member) => ({ id: member.id, name: `${member.first_name} ${member.last_name}` })),
  };
}

function validateGroup(input: Partial<RotaGroupInput>, excludeId?: string) {
  const errors: { field: string; message: string }[] = [];
  const name = String(input.name ?? '').trim();
  if (!name) errors.push({ field: 'name', message: 'Group name is required' });
  else if (
    getDb().rotaGroups.some((group) => group.id !== excludeId && group.name.toLowerCase() === name.toLowerCase())
  ) {
    errors.push({ field: 'name', message: 'A rota group with this name already exists.' });
  }
  if (!input.practice_ids?.length) errors.push({ field: 'practice_ids', message: 'Select at least one practice' });
  if (!input.role_ids?.length) errors.push({ field: 'role_ids', message: 'Select at least one role' });
  if (!input.staff_ids?.length) errors.push({ field: 'staff_ids', message: 'Select at least one staff member' });
  if (String(input.description ?? '').length > 300) {
    errors.push({ field: 'description', message: 'Description must be 300 characters or fewer' });
  }
  return errors;
}

export const rotaHandlers = [
  // ✔ Rota groups (also used by the practice profile's Rota groups select, for any signed-in user).
  http.get(groups(), ({ request }) => {
    const denied = guard(false);
    if (denied) return denied;
    const status = new URL(request.url).searchParams.get('status');
    return ok(
      getDb()
        .rotaGroups.filter((group) => !status || group.status === status.toUpperCase())
        .map(toDetail),
    );
  }),

  http.post(groups(), async ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const input = (await request.json()) as RotaGroupInput;
    const errors = validateGroup(input);
    if (errors.length) return fail(400, errors[0].message, errors);
    const group: RotaGroupRecord = {
      id: mockId('rota-group-new', Date.now()),
      name: input.name.trim(),
      status: input.status,
      description: input.description?.trim() ?? '',
      practice_ids: input.practice_ids,
      role_ids: input.role_ids,
      staff_ids: input.staff_ids,
    };
    getDb().rotaGroups.push(group);
    saveDb();
    return created(toDetail(group), 'Rota group created successfully');
  }),

  http.patch(groups(':groupId/'), async ({ params, request }) => {
    const denied = guard();
    if (denied) return denied;
    const group = getDb().rotaGroups.find((item) => item.id === params.groupId);
    if (!group) return fail(404, 'Rota group not found.');
    const input = (await request.json()) as RotaGroupInput;
    const errors = validateGroup(input, group.id);
    if (errors.length) return fail(400, errors[0].message, errors);
    Object.assign(group, {
      name: input.name.trim(),
      status: input.status,
      description: input.description?.trim() ?? '',
      practice_ids: input.practice_ids,
      role_ids: input.role_ids,
      staff_ids: input.staff_ids,
    });
    saveDb();
    return ok(toDetail(group), 'Rota group updated successfully');
  }),

  // ✔ Practices with their weekly capacity.
  http.get(rota('available-practices'), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const weekStart = mondayOf(new URL(request.url).searchParams.get('week_start') ?? dayjs().format('YYYY-MM-DD'));
    const { practices, roles } = getDb();
    const { shifts } = rotaWeek(people(), roles, weekStart);
    const result: RotaPractice[] = practices.map((practice) => {
      const hours = practice.operating_hours.filter((day) => day.practice_state === 'OPEN');
      const monday = practice.operating_hours.find((day) => day.day === 'MONDAY');
      return {
        id: practice.id,
        practice_name: practice.practice_name,
        opening_time: monday?.opening_time?.slice(0, 5) ?? '08:00',
        closing_time: monday?.closing_time?.slice(0, 5) ?? '18:30',
        total_hours: hours.reduce(
          (sum, day) =>
            sum + hoursBetween((day.opening_time ?? '00:00').slice(0, 5), (day.closing_time ?? '00:00').slice(0, 5)),
          0,
        ),
        // Opening time covered by at least one shift (overlapping shifts count once), so it never
        // exceeds the total.
        assigned_hours: coveredHours(shifts.filter((shift) => shift.practice_id === practice.id)),
      };
    });
    return ok(result);
  }),

  // ✔ Staff on the rota, with their hours for the week of `date`.
  http.get(rota('available-staff'), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const date = new URL(request.url).searchParams.get('date') ?? dayjs().format('YYYY-MM-DD');
    const { roles } = getDb();
    const list = people();
    const { shifts } = rotaWeek(list, roles, mondayOf(date));
    const result: RotaStaff[] = list.map((person) => ({
      id: person.staff.id,
      name: `${person.staff.first_name} ${person.staff.last_name}`,
      role_id: person.staff.role_id,
      role_name: roles.find((role) => role.id === person.staff.role_id)?.name ?? '',
      staff_type: person.staffType,
      working_hours: person.pattern === 0 ? '09:00 - 17:00' : person.pattern === 1 ? '08:00 - 13:00' : '13:00 - 18:30',
      total_hours: person.staffType === 'LOCUM' ? 20 : 40,
      assigned_hours: shifts
        .filter((shift) => shift.staff_id === person.staff.id)
        .reduce((sum, shift) => sum + hoursBetween(shift.start_time, shift.end_time), 0),
    }));
    return ok(result);
  }),

  // ~ Shifts and gaps for a week, with the toolbar filters.
  http.get(rota('assignments'), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const { roles, rotaGroups } = getDb();
    const list = people();
    const week = rotaWeek(list, roles, mondayOf(query.get('week_start') ?? dayjs().format('YYYY-MM-DD')));
    const group = rotaGroups.find((item) => item.id === query.get('rota_group_id'));
    const person = (staffId: string) => list.find((item) => item.staff.id === staffId);
    const keep = (staffId: string | null, practiceId: string | null) => {
      if (query.get('practice_id') && practiceId && practiceId !== query.get('practice_id')) return false;
      if (!staffId) return !query.get('staff_id') && !query.get('role_id') && !query.get('staff_type') && !group;
      const who = person(staffId);
      if (query.get('staff_id') && staffId !== query.get('staff_id')) return false;
      if (query.get('role_id') && who?.staff.role_id !== query.get('role_id')) return false;
      if (query.get('staff_type') && who?.staffType !== query.get('staff_type')) return false;
      if (group && !group.staff_ids.includes(staffId)) return false;
      return true;
    };
    return ok({
      shifts: week.shifts.filter(
        (shift) =>
          keep(shift.staff_id, shift.practice_id) &&
          (!query.get('duty_type') || shift.duty_type === query.get('duty_type')),
      ),
      gaps: week.gaps.filter((gap) => gap.kind === 'holiday' || keep(gap.staff_id, gap.practice_id)),
    });
  }),

  // ~ Staff activity for one day.
  http.get(crm('/activity/v1/sub-apps/:subAppId/staff-activity'), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const date = query.get('date') ?? dayjs().format('YYYY-MM-DD');
    const { roles, practices } = getDb();
    const search = query.get('search')?.trim().toLowerCase();
    const practiceName = practices.find((practice) => practice.id === query.get('practice_id'))?.practice_name;
    const scoped = activityFor(people(), roles, date)
      .filter((record) => !query.get('staff_id') || record.staff_id === query.get('staff_id'))
      .filter((record) => !query.get('practice_id') || record.practice_name === practiceName);
    const stats = {
      active: scoped.filter((record) => record.status === 'ACTIVE').length,
      inactive: scoped.filter((record) => record.status === 'INACTIVE').length,
      on_leave: scoped.filter((record) => record.status === 'ON_LEAVE').length,
    };
    const results = scoped
      .filter((record) => !query.get('status') || record.status === query.get('status'))
      .filter((record) => !search || record.staff_name.toLowerCase().includes(search));
    return ok({ ...paginate(request, results), stats });
  }),
];
