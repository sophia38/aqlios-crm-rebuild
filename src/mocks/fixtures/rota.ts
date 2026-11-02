import dayjs from 'dayjs';
import type { DutyType, Practice, Role, RotaGap, RotaGroup, Shift, StaffActivity, StaffType } from '@/lib/api/types';
import { mockId } from './random';
import type { StaffMember } from './users';

// Fictional ROTA demo data (docs/plans/phase-4-vertical-modules.md §4). Shifts, leave, published slots
// and holidays aren't stored: they're worked out from the date, so every week has the same kind of
// data whenever the demo is opened, and nothing drifts.

export interface RotaGroupRecord extends RotaGroup {
  description: string;
  practice_ids: string[];
  role_ids: string[];
  staff_ids: string[];
}

/** A staff member who appears on the rota, with their home practice and contract. */
export interface RotaPerson {
  staff: StaffMember;
  practice: Practice;
  staffType: StaffType;
  /** 0 = 09:00–17:00, 1 = 08:00–13:00, 2 = 13:00–18:30 */
  pattern: number;
}

const ROTA_ROLES = ['Clinician', 'Nurse', 'Practice Manager'];
const ROTA_SIZE = 18;
const ROTA_PRACTICES = 6;
const PATTERNS = [
  ['09:00', '17:00'],
  ['08:00', '13:00'],
  ['13:00', '18:30'],
] as const;
const DUTIES: DutyType[] = [
  'AM_SESSION',
  'PM_SESSION',
  'ON_CALL',
  'ADMIN_SESSION',
  'NURSING',
  'CARE_HOME_WARD_ROUND',
  'NEIGHBOURHOOD_SHIFT',
  'REMOTE_WORK',
  'PPT_PLT_CPD',
  'EXTENDED_ACCESS',
];

/** England and Wales bank holidays in the demo's range. */
const BANK_HOLIDAYS: Record<string, string> = {
  '2026-08-31': 'Summer bank holiday',
  '2026-12-25': 'Christmas Day',
  '2026-12-28': 'Boxing Day (substitute day)',
  '2027-01-01': "New Year's Day",
  '2027-03-26': 'Good Friday',
  '2027-03-29': 'Easter Monday',
};

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

export const hoursBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm)) / 60;
};

export function rotaPeople(staff: StaffMember[], roles: Role[], practices: Practice[]): RotaPerson[] {
  // Round-robin across the rota roles, so every role is on the rota (the seed lists staff by role).
  const pools = ROTA_ROLES.map((name) => {
    const roleId = roles.find((role) => role.name === name)?.id;
    return staff.filter((member) => member.role_id === roleId && member.status === 'ACTIVE');
  });
  const picked: StaffMember[] = [];
  for (let round = 0; picked.length < ROTA_SIZE && pools.some((pool) => pool.length > round); round += 1) {
    for (const pool of pools) if (pool[round] && picked.length < ROTA_SIZE) picked.push(pool[round]);
  }
  return picked.map((member, index) => ({
    staff: member,
    practice: practices[index % ROTA_PRACTICES],
    staffType: index % 4 === 3 ? 'LOCUM' : 'SALARIED',
    pattern: Math.floor(index / 3) % 3,
  }));
}

export function buildRotaGroupRecords(people: RotaPerson[], roles: Role[], practices: Practice[]): RotaGroupRecord[] {
  const roleId = (name: string) => roles.find((role) => role.name === name)?.id ?? '';
  return [
    {
      name: 'Primary Rota Group',
      description: 'Day-to-day cover across the main practices.',
      practice_ids: practices.slice(0, 15).map((practice) => practice.id),
      role_ids: [roleId('Clinician'), roleId('Practice Manager'), roleId('Nurse')],
      staff_ids: people.slice(0, 10).map((person) => person.staff.id),
    },
    {
      name: 'Duty Rosters',
      description: 'On-call and duty doctor cover.',
      practice_ids: practices.slice(15, 20).map((practice) => practice.id),
      role_ids: [roleId('Clinician'), roleId('Care navigator')],
      staff_ids: [],
    },
    {
      name: 'Croft Hall Rota Group',
      description: '',
      practice_ids: practices.slice(2, 4).map((practice) => practice.id),
      role_ids: [roleId('Clinician'), roleId('HR')],
      staff_ids: people.slice(10, 13).map((person) => person.staff.id),
    },
  ].map((group, index) => ({ id: mockId('rota-group', index), status: 'ACTIVE' as const, ...group }));
}

const nameOf = (member: StaffMember) => `${member.first_name} ${member.last_name}`;

/** Shifts and gaps for the 7 days from `weekStart` (a Monday, YYYY-MM-DD). */
export function rotaWeek(people: RotaPerson[], roles: Role[], weekStart: string) {
  const shifts: Shift[] = [];
  const gaps: RotaGap[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = dayjs(weekStart).add(offset, 'day').format('YYYY-MM-DD');
    const weekday = offset < 5;
    if (BANK_HOLIDAYS[date]) {
      gaps.push({
        id: `holiday-${date}`,
        kind: 'holiday',
        date,
        start_time: '08:00',
        end_time: '18:30',
        label: BANK_HOLIDAYS[date],
        practice_id: null,
        staff_id: null,
      });
      continue;
    }
    people.forEach((person, index) => {
      const roll = hash(`${person.staff.id}:${date}`);
      const works = weekday ? roll % 5 !== 0 : index % 9 === 0;
      const onLeave = weekday && roll % 5 === 0 && index % 4 === 1;
      const [start, end] = weekday ? PATTERNS[person.pattern] : ['09:00', '13:00'];
      if (onLeave) {
        gaps.push({
          id: `leave-${person.staff.id}-${date}`,
          kind: 'leave',
          date,
          start_time: '09:00',
          end_time: '17:00',
          label: `${nameOf(person.staff)} on leave`,
          practice_id: person.practice.id,
          staff_id: person.staff.id,
        });
        return;
      }
      if (!works) return;
      shifts.push({
        id: `shift-${person.staff.id}-${date}`,
        staff_id: person.staff.id,
        staff_name: nameOf(person.staff),
        role_name: roles.find((role) => role.id === person.staff.role_id)?.name ?? '',
        staff_type: person.staffType,
        practice_id: person.practice.id,
        practice_name: person.practice.practice_name,
        date,
        start_time: start,
        end_time: end,
        duty_type: weekday ? DUTIES[roll % DUTIES.length] : 'EXTENDED_ACCESS',
      });
    });
    // A published (open for bidding) afternoon slot on Wednesdays at two practices.
    if (offset === 2) {
      for (const person of people.slice(0, 3).filter((_, index) => index !== 1)) {
        gaps.push({
          id: `published-${person.practice.id}-${date}`,
          kind: 'published',
          date,
          start_time: '14:00',
          end_time: '17:00',
          label: 'Published slot',
          practice_id: person.practice.id,
          staff_id: null,
        });
      }
    }
  }
  return { shifts, gaps };
}

/** Staff activity for one day, worked out from that day's rota and the current time. */
export function activityFor(people: RotaPerson[], roles: Role[], date: string, now = dayjs()): StaffActivity[] {
  const weekStart = dayjs(date)
    .subtract((dayjs(date).day() + 6) % 7, 'day')
    .format('YYYY-MM-DD');
  const { shifts, gaps } = rotaWeek(people, roles, weekStart);
  const today = now.format('YYYY-MM-DD');
  const clock = now.format('HH:mm');
  const records: StaffActivity[] = [];
  for (const person of people) {
    const shift = shifts.find((item) => item.staff_id === person.staff.id && item.date === date);
    const leave = gaps.find((item) => item.kind === 'leave' && item.staff_id === person.staff.id && item.date === date);
    if (!shift && !leave) continue;
    const roll = hash(`activity:${person.staff.id}:${date}`);
    const base = {
      id: `activity-${person.staff.id}-${date}`,
      staff_id: person.staff.id,
      staff_name: nameOf(person.staff),
      staff_code: String(1000 + (hash(person.staff.id) % 9000)),
      practice_name: person.practice.practice_name,
      date,
    };
    if (leave || !shift) {
      records.push({
        ...base,
        duty_type: 'AM_SESSION',
        status: 'ON_LEAVE',
        login_time: null,
        logout_time: null,
        allocated_hours: 0,
      });
      continue;
    }
    const allocated = hoursBetween(shift.start_time, shift.end_time);
    const loginAt = dayjs(`${date}T${shift.start_time}`)
      .subtract(roll % 15, 'minute')
      .format('HH:mm');
    const logoutAt = dayjs(`${date}T${shift.end_time}`)
      .add(roll % 20, 'minute')
      .format('HH:mm');
    let status: StaffActivity['status'] = 'INACTIVE';
    let login: string | null = null;
    let logout: string | null = null;
    if (date < today) {
      login = loginAt;
      logout = logoutAt;
    } else if (date === today && clock >= shift.start_time) {
      login = roll % 4 === 0 ? null : loginAt;
      const finished = clock >= shift.end_time;
      logout = login && finished ? logoutAt : null;
      status = login && !finished ? 'ACTIVE' : 'INACTIVE';
    }
    records.push({
      ...base,
      duty_type: shift.duty_type,
      status,
      login_time: login,
      logout_time: logout,
      allocated_hours: allocated,
    });
  }
  return records;
}
