import dayjs from 'dayjs';
import type {
  AppointmentKind,
  DayKey,
  DutyType,
  PublishedSlot,
  RotaGap,
  RotaStaff,
  RotaTemplate,
  Shift,
  ShiftSlot,
  ShiftUrgency,
  SlotBid,
  StaffType,
} from '@/lib/api/types';
import { BANK_HOLIDAYS, hoursBetween, rotaPeople, rotaWeek } from './fixtures/rota';
import { roleForStaffType } from './fixtures/staff';
import { PERSONAS } from './fixtures/users';
import { approvedLeaveDays } from './leaveState';
import { currentPersona, getDb } from './store';

// Practice ROTA state (docs/plans/phase-5-practice-modules.md §5). The generated weekly rota stays
// as it is; assignments, scoped edits and deletes, published slots, bids and templates made in the
// demo are stored and laid over it, so the practice and vertical ROTA both show them.

/** An assignment made in the demo: one series per time slot. */
export interface AssignmentRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  role_name: string;
  staff_type: StaffType;
  practice_id: string;
  type: 'ONCE' | 'RECURRING';
  start_date: string;
  end_date: string | null;
  days: DayKey[];
  slots: ShiftSlot[];
  duty_type: DutyType;
  appointment_types: AppointmentKind[];
  urgencies: ShiftUrgency[];
  break_start: string;
  break_end: string;
}

/** An edit or delete of a series from `from` (inclusive) to `to` (inclusive; null = no end). */
export interface RotaOverride {
  series_id: string;
  from: string;
  to: string | null;
  deleted?: boolean;
  patch?: Partial<
    Pick<
      Shift,
      'start_time' | 'end_time' | 'duty_type' | 'appointment_types' | 'urgencies' | 'break_start' | 'break_end'
    >
  >;
}

export interface PublishedRecord {
  id: string;
  practice_id: string;
  start_date: string;
  repeat_until: string | null;
  start_time: string;
  end_time: string;
  duty_type: DutyType;
  rate_per_hour: number;
  /** Days before each slot when bidding closes. */
  closes_days_before: number;
}

export interface RotaDemoState {
  assignments: AssignmentRecord[];
  overrides: RotaOverride[];
  published: PublishedRecord[];
  bids: Record<string, SlotBid[]>;
  declines: Record<string, string[]>;
  /** Slot occurrence id → the staff member whose bid was accepted. */
  filled: Record<string, string>;
  templates: RotaTemplate[];
}

const DAY_KEYS: DayKey[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
export const dayKeyOf = (date: string) => DAY_KEYS[dayjs(date).day()];
export const mondayOf = (date: string) => {
  const day = dayjs(date);
  return day.subtract((day.day() + 6) % 7, 'day').format('YYYY-MM-DD');
};
const datesOfWeek = (weekStart: string) =>
  Array.from({ length: 7 }, (_, offset) => dayjs(weekStart).add(offset, 'day').format('YYYY-MM-DD'));

/** Seeded series start at the beginning of the demo year. */
const SEED_SERIES_START = '2026-01-05';
const SEED_PATTERNS: DayKey[][] = [['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']];

export const rota = () => getDb().rota;
export const people = () => {
  const { staff, roles, practices } = getDb();
  return rotaPeople(staff, roles, practices);
};

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

function applyOverrides(shift: Shift): Shift | null {
  let result = shift;
  for (const override of rota().overrides) {
    if (override.series_id !== shift.series_id) continue;
    if (shift.date < override.from || (override.to !== null && shift.date > override.to)) continue;
    if (override.deleted) return null;
    result = { ...result, ...override.patch };
  }
  return result;
}

const practiceName = (practiceId: string) =>
  getDb().practices.find((practice) => practice.id === practiceId)?.practice_name ?? '';

function occurrences(record: AssignmentRecord, dates: string[]): Shift[] {
  return dates
    .filter((date) =>
      record.type === 'ONCE'
        ? date === record.start_date
        : date >= record.start_date &&
          (!record.end_date || date <= record.end_date) &&
          record.days.includes(dayKeyOf(date)),
    )
    .flatMap((date) =>
      record.slots.map((slot, index) => ({
        id: `asg-${record.id}-${index}-${date}`,
        staff_id: record.staff_id,
        staff_name: record.staff_name,
        role_name: record.role_name,
        staff_type: record.staff_type,
        practice_id: record.practice_id,
        practice_name: practiceName(record.practice_id),
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duty_type: record.duty_type,
        series_id: `${record.id}:${index}`,
        recurring: record.type === 'RECURRING',
        series_start_date: record.start_date,
        series_end_date: record.end_date,
        repeat_days: record.days,
        appointment_types: record.appointment_types,
        urgencies: record.urgencies,
        break_start: record.break_start,
        break_end: record.break_end,
      })),
    );
}

/** Seeded slots: duty, rate and bidding close date. */
const seedSlotDetails = { duty_type: 'PM_SESSION' as DutyType, rate_per_hour: 85, closes_days_before: 2 };

function publishedOccurrences(dates: string[]): RotaGap[] {
  return rota().published.flatMap((record) =>
    dates
      .filter(
        (date) =>
          date === record.start_date ||
          (record.repeat_until !== null &&
            date > record.start_date &&
            date <= record.repeat_until &&
            dayKeyOf(date) === dayKeyOf(record.start_date)),
      )
      .map((date) => ({
        id: `pub-${record.id}-${date}`,
        kind: 'published' as const,
        date,
        start_time: record.start_time,
        end_time: record.end_time,
        label: 'Published Slot for Bidding',
        practice_id: record.practice_id,
        staff_id: null,
      })),
  );
}

/**
 * The practice-user persona's own sessions, so Leaves and ROTA's "my shifts" has something to show:
 * Tuesday and Thursday mornings at their first practice.
 */
function personaShifts(dates: string[]): Shift[] {
  const persona = PERSONAS['practice-user'];
  const { practices, roles } = getDb();
  const practice = practices[persona.practiceIndexes?.[0] ?? -1];
  if (!practice) return [];
  const days: DayKey[] = ['TUESDAY', 'THURSDAY'];
  return dates
    .filter((date) => days.includes(dayKeyOf(date)) && !BANK_HOLIDAYS[date] && date >= SEED_SERIES_START)
    .map((date) => ({
      id: `shift-${persona.userId}-${date}`,
      staff_id: persona.userId,
      staff_name: `${persona.firstName} ${persona.lastName}`,
      role_name: roleForStaffType(roles, 'GP').name,
      staff_type: 'SALARIED' as const,
      practice_id: practice.id,
      practice_name: practice.practice_name,
      date,
      start_time: '08:30',
      end_time: '13:00',
      duty_type: 'AM_SESSION' as const,
      series_id: `seed-${persona.userId}`,
      recurring: true,
      series_start_date: SEED_SERIES_START,
      series_end_date: null,
      repeat_days: days,
      appointment_types: ['FACE_TO_FACE_SURGERY', 'TELEPHONE_OR_AUDIO'],
      urgencies: ['ROUTINE', 'URGENT'],
      break_start: '',
      break_end: '',
    }));
}

/** The week as shown: the generated rota with the demo's assignments, edits and slots laid over it. */
export function weekWithChanges(weekStart: string): { shifts: Shift[]; gaps: RotaGap[] } {
  const { roles } = getDb();
  const dates = datesOfWeek(weekStart);
  const seeded = rotaWeek(people(), roles, weekStart);
  const seedShifts: Shift[] = seeded.shifts.map((shift) => ({
    ...shift,
    series_id: `seed-${shift.staff_id}`,
    recurring: true,
    series_start_date: SEED_SERIES_START,
    series_end_date: null,
    repeat_days: SEED_PATTERNS[0],
    appointment_types: ['FACE_TO_FACE_SURGERY', 'TELEPHONE_OR_AUDIO'],
    urgencies: ['ROUTINE', 'URGENT'],
    break_start: '',
    break_end: '',
  }));
  const added = rota().assignments.flatMap((record) => occurrences(record, dates));
  const planned = [...seedShifts, ...personaShifts(dates), ...added]
    .map(applyOverrides)
    .filter((shift): shift is Shift => shift !== null);
  // Approved leave (Leaves, phase 5 module 6) takes the person off the rota for those days.
  const onLeave = approvedLeaveDays(dates);
  const shifts = planned.filter((shift) => !onLeave.has(`${shift.staff_id}|${shift.date}`));
  // The leave block shows at each practice the person would have worked that day.
  const leaveGaps: RotaGap[] = planned
    .filter((shift) => onLeave.has(`${shift.staff_id}|${shift.date}`))
    .filter(
      (shift, index, list) =>
        list.findIndex(
          (other) =>
            other.staff_id === shift.staff_id && other.date === shift.date && other.practice_id === shift.practice_id,
        ) === index,
    )
    .map((shift) => ({
      id: `leave-request-${shift.staff_id}-${shift.practice_id}-${shift.date}`,
      kind: 'leave' as const,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      label: `${shift.staff_name} on leave`,
      practice_id: shift.practice_id,
      staff_id: shift.staff_id,
    }));
  const { filled } = rota();
  const gaps = [...seeded.gaps, ...leaveGaps, ...publishedOccurrences(dates)]
    .filter((gap) => gap.kind !== 'published' || !filled[gap.id])
    .map((gap) =>
      gap.kind === 'published'
        ? {
            ...gap,
            label: `Published Slot for Bidding · ${String(bidsFor(gap.id, gap.practice_id).length).padStart(2, '0')} Eligible Bids`,
          }
        : gap,
    );
  return { shifts, gaps };
}

export function findShift(shiftId: string) {
  const date = shiftId.match(/(\d{4}-\d{2}-\d{2})$/)?.[1];
  if (!date) return null;
  return weekWithChanges(mondayOf(date)).shifts.find((shift) => shift.id === shiftId) ?? null;
}

/** The scope as an override range for the shift's series. */
export function scopeRange(shift: Shift, scope: string): { from: string; to: string | null } {
  if (!shift.recurring || scope === 'CURRENT') return { from: shift.date, to: shift.date };
  if (scope === 'FOLLOWING') return { from: shift.date, to: null };
  return { from: '', to: null };
}

// ---------------------------------------------------------------- staff

/** Who can be put on a practice's rota: its rota people and its other active staff. */
export function assignableRotaStaff(practiceId: string | null, date: string): RotaStaff[] {
  const { roles, staff } = getDb();
  const list = people();
  const { shifts } = weekWithChanges(mondayOf(date));
  const hours = (id: string) =>
    shifts
      .filter((shift) => shift.staff_id === id)
      .reduce((sum, shift) => sum + hoursBetween(shift.start_time, shift.end_time), 0);
  const roleName = (roleId: string) => roles.find((role) => role.id === roleId)?.name ?? '';
  const fromRota: RotaStaff[] = list
    .filter((person) => !practiceId || person.practice.id === practiceId)
    .map((person) => ({
      id: person.staff.id,
      name: `${person.staff.first_name} ${person.staff.last_name}`,
      role_id: person.staff.role_id,
      role_name: roleName(person.staff.role_id),
      staff_type: person.staffType,
      working_hours: person.pattern === 0 ? '09:00 - 17:00' : person.pattern === 1 ? '08:00 - 13:00' : '13:00 - 18:30',
      total_hours: person.staffType === 'LOCUM' ? 20 : 40,
      assigned_hours: hours(person.staff.id),
    }));
  if (!practiceId) return fromRota;
  const others: RotaStaff[] = staff
    .filter(
      (member) =>
        member.status === 'ACTIVE' &&
        member.practice_ids.includes(practiceId) &&
        !fromRota.some((item) => item.id === member.id),
    )
    .map((member) => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      role_id: member.role_id,
      role_name: roleName(member.role_id),
      staff_type: 'SALARIED',
      working_hours: '09:00 - 17:00',
      total_hours: 40,
      assigned_hours: hours(member.id),
    }));
  // The practice-user persona works at their practices (live: "Ali Emis" on Main Practice's rota).
  const persona = PERSONAS['practice-user'];
  const index = getDb().practices.findIndex((practice) => practice.id === practiceId);
  const self: RotaStaff[] = persona.practiceIndexes?.includes(index)
    ? [
        {
          id: persona.userId,
          name: `${persona.firstName} ${persona.lastName}`,
          role_id: roles.find((role) => role.name === 'Clinician')?.id ?? '',
          role_name: 'Clinician',
          staff_type: 'SALARIED',
          working_hours: '09:00 - 17:00',
          total_hours: 40,
          assigned_hours: hours(persona.userId),
        },
      ]
    : [];
  return [...fromRota, ...others, ...self];
}

// ---------------------------------------------------------------- published slots and bids

function slotRecordOf(gapId: string): PublishedRecord | null {
  const match = gapId.match(/^pub-(.+)-\d{4}-\d{2}-\d{2}$/);
  return match ? (rota().published.find((record) => record.id === match[1]) ?? null) : null;
}

/** Seeded slots get one fictional bid from a colleague, so Accept Bid has something to show. */
function seededBids(gapId: string, practiceId: string | null): SlotBid[] {
  if (!gapId.startsWith('published-') || !practiceId) return [];
  const { roles } = getDb();
  const colleague = people().find(
    (person) => person.practice.id === practiceId && hash(`${gapId}:${person.staff.id}`) % 2 === 0,
  );
  if (!colleague) return [];
  return [
    {
      id: `bid-seed-${hash(gapId)}`,
      staff_id: colleague.staff.id,
      staff_name: `${colleague.staff.first_name} ${colleague.staff.last_name}`,
      role_name: roles.find((role) => role.id === colleague.staff.role_id)?.name ?? '',
      created_at: dayjs().subtract(1, 'day').toISOString(),
    },
  ];
}

export const bidsFor = (gapId: string, practiceId: string | null) => [
  ...seededBids(gapId, practiceId),
  ...(rota().bids[gapId] ?? []),
];

/** Open slots for a practice: today onwards, for the next 4 weeks. */
export function openSlots(practiceId: string): PublishedSlot[] {
  const today = dayjs().format('YYYY-MM-DD');
  const me = currentPersona().userId;
  const weeks = Array.from({ length: 5 }, (_, index) => dayjs(mondayOf(today)).add(index, 'week').format('YYYY-MM-DD'));
  return weeks
    .flatMap((week) => weekWithChanges(week).gaps)
    .filter((gap) => gap.kind === 'published' && gap.practice_id === practiceId && gap.date >= today)
    .filter((gap) => dayjs(gap.date).diff(dayjs(today), 'day') < 28)
    .map((gap) => {
      const record = slotRecordOf(gap.id);
      const details = record ?? seedSlotDetails;
      const bids = bidsFor(gap.id, gap.practice_id);
      return {
        id: gap.id,
        practice_id: practiceId,
        practice_name: practiceName(practiceId),
        date: gap.date,
        start_time: gap.start_time,
        end_time: gap.end_time,
        duty_type: details.duty_type,
        rate_per_hour: details.rate_per_hour,
        bidding_closes: dayjs(gap.date).subtract(details.closes_days_before, 'day').format('YYYY-MM-DD'),
        bids,
        my_bid: bids.some((bid) => bid.staff_id === me),
        declined: (rota().declines[gap.id] ?? []).includes(me),
      };
    })
    .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
}

export const isBankHoliday = (date: string) => Boolean(BANK_HOLIDAYS[date]);
