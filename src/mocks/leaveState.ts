import dayjs from 'dayjs';
import {
  formatLeave,
  LEAVE_TYPE_LABELS,
  OTHER_LEAVE_TYPE_KEYS,
  round,
  scheduleOf,
  workingHoursBetween,
  dayLength,
} from '@/lib/api/leave';
import type { LeaveBalance, LeaveRequest, LeaveStatus, LeaveType, LeaveWarning } from '@/lib/api/types';
import { mockId } from './fixtures/random';
import { BANK_HOLIDAYS } from './fixtures/rota';
import { PERSONAS } from './fixtures/users';
import { leavePeople, type LeavePerson } from './handlers/staff';
import { mondayOf, people, weekWithChanges } from './rotaState';
import { currentPersona, getDb, saveDb } from './store';

// Leave mock state (docs/plans/phase-5-practice-modules.md §6). About 15 fictional requests per
// practice, seeded the first time its leave is read, across every type and status. Durations and
// balances are in hours and come from each person's contracted week.

export interface LeaveRecord {
  id: string;
  practice_id: string;
  staff_id: string;
  staff_name: string;
  role_id: string;
  role_name: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration_hours: number;
  notes: string;
  status: LeaveStatus;
  requested_at: string;
  updated_at: string;
  decided_by: string | null;
  rejection_reason: string | null;
}

export const BANK_HOLIDAY_DATES = Object.keys(BANK_HOLIDAYS);

/** [type, status, days from today, working days, who: a staff index, 'admin' or 'self', notes]. */
type SeedRow = [LeaveType, LeaveStatus, number, number, number | 'admin' | 'self', string];
const SEED_ROWS: SeedRow[] = [
  // Live has two pending annual leave requests from the super-admin ("aqlios admin").
  ['ANNUAL', 'PENDING', 12, 5, 'admin', 'Family holiday booked in the spring.'],
  ['ANNUAL', 'PENDING', 26, 3, 'admin', ''],
  ['TOIL', 'PENDING', 9, 1, 0, 'Covering the late clinic last month.'],
  ['ANNUAL', 'PENDING', 16, 4, 1, 'Moving house.'],
  ['SICK', 'PENDING', -2, 1, 2, 'Migraine; back the next day.'],
  ['ANNUAL', 'APPROVED', 22, 5, 3, ''],
  ['ANNUAL', 'APPROVED', -40, 3, 4, ''],
  ['SICK', 'APPROVED', -15, 2, 0, 'Flu.'],
  ['BEREAVEMENT', 'APPROVED', -60, 3, 1, ''],
  ['PATERNITY', 'APPROVED', 30, 10, 5, 'Baby due at the end of the month.'],
  ['MATERNITY', 'APPROVED', -90, 30, 6, ''],
  ['COMPASSIONATE', 'REJECTED', 14, 2, 2, 'Supporting a relative after surgery.'],
  ['EMERGENCY', 'REJECTED', -5, 1, 3, 'Boiler broke down.'],
  ['ANNUAL', 'REJECTED', 35, 10, 4, 'Two weeks abroad.'],
  ['ANNUAL', 'CANCELLED', 50, 2, 0, ''],
  // The practice-user persona's own leave (Leaves and ROTA).
  ['ANNUAL', 'APPROVED', -30, 2, 'self', ''],
  ['SICK', 'APPROVED', -12, 1, 'self', 'Cold.'],
  ['ANNUAL', 'PENDING', 19, 3, 'self', 'Long weekend away.'],
];

const isWorkday = (person: LeavePerson, date: dayjs.Dayjs) =>
  !BANK_HOLIDAYS[date.format('YYYY-MM-DD')] &&
  workingHoursBetween(scheduleOf(person.availability), [], date.format('YYYY-MM-DD'), date.format('YYYY-MM-DD')) > 0;

/** The first working day on or after `from`, and the day `days` working days later. */
function workingRange(person: LeavePerson, from: dayjs.Dayjs, days: number) {
  let start = from;
  while (!isWorkday(person, start)) start = start.add(1, 'day');
  let end = start;
  for (let counted = 1; counted < days;) {
    end = end.add(1, 'day');
    if (isWorkday(person, end)) counted += 1;
  }
  return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') };
}

export const hoursFor = (person: LeavePerson, start: string, end: string) =>
  workingHoursBetween(scheduleOf(person.availability), BANK_HOLIDAY_DATES, start, end, dayLength(person.availability));

function seedPractice(practiceId: string): LeaveRecord[] {
  const everyone = leavePeople(practiceId);
  const admin = everyone.find((person) => person.id === PERSONAS['super-admin'].userId);
  const self = everyone.find((person) => person.id === PERSONAS['practice-user'].userId);
  // Rota people first, so pending requests show real rota clashes.
  const onRota = new Set(
    people()
      .filter((person) => person.practice.id === practiceId)
      .map((p) => p.staff.id),
  );
  const staff = everyone
    .filter((person) => person !== admin && person !== self)
    .sort((a, b) => Number(onRota.has(b.id)) - Number(onRota.has(a.id)));
  const today = dayjs().startOf('day');
  return SEED_ROWS.flatMap(([type, status, offset, days, who, notes], index) => {
    const person = who === 'admin' ? admin : who === 'self' ? self : staff[who % Math.max(staff.length, 1)];
    if (!person) return [];
    const { start, end } = workingRange(person, today.add(offset, 'day'), days);
    const requested = dayjs(start).subtract(10 + (index % 7), 'day');
    const requestedAt = (requested.isAfter(today) ? today.subtract(1, 'day') : requested).hour(9).toISOString();
    const decided = status === 'APPROVED' || status === 'REJECTED';
    return [
      {
        id: mockId(`leave:${practiceId}`, index),
        practice_id: practiceId,
        staff_id: person.id,
        staff_name: person.name,
        role_id: person.role_id,
        role_name: person.role_name,
        leave_type: type,
        start_date: start,
        end_date: end,
        // A TOIL day is usually part of a day.
        duration_hours: type === 'TOIL' ? 4 : hoursFor(person, start, end),
        notes,
        status,
        requested_at: requestedAt,
        updated_at: decided || status === 'CANCELLED' ? dayjs(requestedAt).add(2, 'day').toISOString() : requestedAt,
        decided_by: decided ? 'Practice Manager' : null,
        rejection_reason:
          status === 'REJECTED' && index % 2 === 0 ? 'Not enough cover on the rota for these dates.' : null,
      },
    ];
  });
}

/** A practice's leave requests, seeded on first read. */
export function leaveRecords(practiceId: string, save = true): LeaveRecord[] {
  const db = getDb();
  if (!db.leave[practiceId]) {
    db.leave[practiceId] = seedPractice(practiceId);
    if (save) saveDb();
  }
  return db.leave[practiceId];
}

/** Every practice's leave requests (the rota needs them all: people work at more than one practice). */
function allLeaveRecords(): LeaveRecord[] {
  const db = getDb();
  const unseeded = db.practices.some((practice) => !db.leave[practice.id]);
  const records = db.practices.flatMap((practice) => leaveRecords(practice.id, false));
  if (unseeded) saveDb();
  return records;
}

/** Hours of a type the person is entitled to each year (null: no fixed entitlement). */
export function entitlementHours(person: LeavePerson, type: LeaveType): number | null {
  if (type === 'ANNUAL') return person.entitlement.annual_hours;
  if (type === 'SICK') return person.entitlement.sick_hours;
  const other = person.entitlement.other.find((item) => OTHER_LEAVE_TYPE_KEYS[item.leave_type] === type);
  return other ? other.hours : null;
}

const inYear = (record: LeaveRecord, year: number) => dayjs(record.start_date).year() === year;

export function balanceFor(practiceId: string, person: LeavePerson, type: LeaveType, year: number, excludeId?: string) {
  const mine = leaveRecords(practiceId).filter(
    (record) =>
      record.staff_id === person.id && record.leave_type === type && inYear(record, year) && record.id !== excludeId,
  );
  const sum = (status: LeaveStatus) =>
    round(
      mine.filter((record) => record.status === status).reduce((total, record) => total + record.duration_hours, 0),
    );
  const entitlement = entitlementHours(person, type);
  const taken = sum('APPROVED');
  const balance: LeaveBalance = {
    leave_type: type,
    entitlement_hours: entitlement,
    taken_hours: taken,
    pending_hours: sum('PENDING'),
    remaining_hours: entitlement === null ? null : round(entitlement - taken),
  };
  return balance;
}

/** Shifts the person has in the period, at any practice (up to 8 weeks, to keep it quick). */
function rotaClashes(record: LeaveRecord) {
  const last = dayjs(record.start_date).add(8, 'week');
  const end = dayjs(record.end_date).isAfter(last) ? last : dayjs(record.end_date);
  const weeks: string[] = [];
  for (let week = dayjs(mondayOf(record.start_date)); !week.isAfter(end); week = week.add(1, 'week')) {
    weeks.push(week.format('YYYY-MM-DD'));
  }
  return weeks
    .flatMap((week) => weekWithChanges(week).shifts)
    .filter(
      (shift) => shift.staff_id === record.staff_id && shift.date >= record.start_date && shift.date <= record.end_date,
    ).length;
}

export function presentLeave(record: LeaveRecord): LeaveRequest {
  const person = leavePeople(record.practice_id).find((item) => item.id === record.staff_id);
  const perDay = person ? dayLength(person.availability) : 7.5;
  const balance = person
    ? balanceFor(record.practice_id, person, record.leave_type, dayjs(record.start_date).year(), record.id)
        .remaining_hours
    : null;
  const warnings: LeaveWarning[] = [];
  if (record.status === 'PENDING') {
    const clashes = rotaClashes(record);
    if (clashes) {
      warnings.push({
        kind: 'ROTA_CLASH',
        message: `${clashes} ${clashes === 1 ? 'shift' : 'shifts'} on the rota in this period`,
      });
    }
    if (balance !== null && record.duration_hours > balance) {
      warnings.push({
        kind: 'LOW_BALANCE',
        message: `${formatLeave(round(record.duration_hours - balance), perDay)} over the ${LEAVE_TYPE_LABELS[
          record.leave_type
        ].toLowerCase()} balance`,
      });
    }
  }
  return {
    ...record,
    staff_name: person?.name ?? record.staff_name,
    role_name: person?.role_name ?? record.role_name,
    day_hours: round(perDay),
    balance_hours: balance,
    warnings,
    is_own: record.staff_id === currentPersona().userId,
  };
}

/**
 * Approved leave on the rota: `{staffId}|{date}` → the person's name. Approved leave replaces that
 * day's shifts, at every practice, with a leave block.
 */
export function approvedLeaveDays(dates: string[]) {
  const days = new Map<string, string>();
  for (const record of allLeaveRecords()) {
    if (record.status !== 'APPROVED') continue;
    for (const date of dates) {
      if (date >= record.start_date && date <= record.end_date)
        days.set(`${record.staff_id}|${date}`, record.staff_name);
    }
  }
  return days;
}
