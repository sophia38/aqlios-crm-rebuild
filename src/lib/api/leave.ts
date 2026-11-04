import dayjs from 'dayjs';
import { crmRequest } from './http';
import type {
  DayKey,
  LeaveApplyInput,
  LeaveRequest,
  LeaveRequestListParams,
  LeaveStatus,
  LeaveType,
  MyLeaveListParams,
  MyLeaveSummary,
  Paginated,
  StaffAccountDetails,
} from './types';

// All inferred (docs/plans/phase-5-practice-modules.md §6). The rebuild scopes "my leave" to the
// practice too, because entitlements and the rota belong to the practice record.
const base = (subAppId: string, practiceId: string) => `/public/v1/sub-apps/${subAppId}/practices/${practiceId}/`;

export const LEAVE_NOTE_MAX = 300;
export const LEAVE_REASON_MAX = 300;

export const leaveApi = {
  requests: (subAppId: string, practiceId: string, params: LeaveRequestListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<LeaveRequest>>(`${base(subAppId, practiceId)}leave-requests/`, {
      query: { ...params },
      signal,
    }),
  /** The Staff filter: everyone who can take leave at the practice. */
  staff: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<{ id: string; name: string; role_id: string; role_name: string }[]>(
      `${base(subAppId, practiceId)}leave-requests/staff/`,
      { signal },
    ),
  approve: (subAppId: string, practiceId: string, id: string) =>
    crmRequest<LeaveRequest>(`${base(subAppId, practiceId)}leave-requests/${id}/approve/`, { method: 'POST' }),
  reject: (subAppId: string, practiceId: string, id: string, reason?: string) =>
    crmRequest<LeaveRequest>(`${base(subAppId, practiceId)}leave-requests/${id}/reject/`, {
      method: 'POST',
      body: { reason },
    }),
  myRequests: (subAppId: string, practiceId: string, params: MyLeaveListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<LeaveRequest>>(`${base(subAppId, practiceId)}me/leave-requests/`, {
      query: { ...params },
      signal,
    }),
  mySummary: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<MyLeaveSummary>(`${base(subAppId, practiceId)}me/leave-balances/`, { signal }),
  apply: (subAppId: string, practiceId: string, input: LeaveApplyInput) =>
    crmRequest<LeaveRequest>(`${base(subAppId, practiceId)}me/leave-requests/`, { method: 'POST', body: input }),
  cancel: (subAppId: string, practiceId: string, id: string) =>
    crmRequest<LeaveRequest>(`${base(subAppId, practiceId)}me/leave-requests/${id}/cancel/`, { method: 'POST' }),
};

/** The captured filter options (8 types). */
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  BEREAVEMENT: 'Bereavement Leave',
  EMERGENCY: 'Emergency Leave',
  COMPASSIONATE: 'Compassionate Leave',
  TOIL: 'TOIL Leave (Time Off in Lieu)',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

/** Staff "Other Leaves Entitlement" names (Leave tab) → leave type. */
export const OTHER_LEAVE_TYPE_KEYS: Record<string, LeaveType> = {
  Maternity: 'MATERNITY',
  Paternity: 'PATERNITY',
  Bereavement: 'BEREAVEMENT',
  Compassionate: 'COMPASSIONATE',
  Emergency: 'EMERGENCY',
  TOIL: 'TOIL',
};

const DAY_KEYS: DayKey[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const minutes = (time: string) => {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
};

/** Contracted hours on each weekday, from the availability rows. */
export function scheduleOf(availability: StaffAccountDetails['availability']): Record<DayKey, number> {
  return Object.fromEntries(
    DAY_KEYS.map((key) => {
      const day = availability[key];
      const hours = day?.open && day.from && day.to ? Math.max(0, minutes(day.to) - minutes(day.from)) / 60 : 0;
      return [key, hours];
    }),
  ) as Record<DayKey, number>;
}

/** Weekly hours from the availability rows. */
export const weeklyHours = (availability: StaffAccountDetails['availability']) =>
  Object.values(scheduleOf(availability)).reduce((total, hours) => total + hours, 0);

/** Hours in one working day, from the contracted week (7.5 when no hours are set). */
export function dayLength(availability: StaffAccountDetails['availability']) {
  const worked = Object.values(scheduleOf(availability)).filter(Boolean);
  return worked.length ? worked.reduce((total, hours) => total + hours, 0) / worked.length : 7.5;
}

/**
 * Hours the person works between two dates (inclusive), skipping bank holidays. With no contracted
 * hours at all, every weekday counts as one standard day.
 */
export function workingHoursBetween(
  schedule: Record<DayKey, number>,
  bankHolidays: string[],
  start: string,
  end: string,
  dayHours = 7.5,
) {
  if (!start || !end || end < start) return 0;
  const contracted = Object.values(schedule).some(Boolean);
  let total = 0;
  for (let day = dayjs(start); !day.isAfter(dayjs(end), 'day'); day = day.add(1, 'day')) {
    if (bankHolidays.includes(day.format('YYYY-MM-DD'))) continue;
    const key = DAY_KEYS[day.day()];
    total += contracted ? schedule[key] : key === 'SATURDAY' || key === 'SUNDAY' ? 0 : dayHours;
  }
  return round(total);
}

export const round = (value: number) => Math.round(value * 100) / 100;

/** "28 days (210 h)" (phase 5 question 3). */
export const formatLeave = (hours: number, perDay: number) => {
  const days = round(hours / perDay);
  return `${days} ${days === 1 ? 'day' : 'days'} (${round(hours)} h)`;
};

/** The balance column: what's left, or "No fixed entitlement". */
export const formatBalance = (hours: number | null, perDay: number) =>
  hours === null ? 'No fixed entitlement' : formatLeave(hours, perDay);
