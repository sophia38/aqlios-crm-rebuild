import { crmRequest } from './http';
import type {
  ListParams,
  RotaGroupDetail,
  RotaGroupInput,
  RotaPractice,
  RotaStaff,
  RotaWeek,
  RotaWeekParams,
  StaffActivityResponse,
} from './types';

// Vertical ROTA (docs/plans/phase-4-vertical-modules.md §4). The available-practices, available-staff
// and rota-groups GETs were captured; the rest is inferred.
const rota = (subAppId: string) => `/rota/v1/sub-apps/${subAppId}`;
const groups = (subAppId: string) => `/public/v1/sub-apps/${subAppId}/rota-groups/`;

export const rotaApi = {
  availablePractices: (subAppId: string, weekStart: string, signal?: AbortSignal) =>
    crmRequest<RotaPractice[]>(`${rota(subAppId)}/available-practices`, { query: { week_start: weekStart }, signal }),
  availableStaff: (subAppId: string, date: string, signal?: AbortSignal) =>
    crmRequest<RotaStaff[]>(`${rota(subAppId)}/available-staff`, { query: { date }, signal }),
  week: (subAppId: string, params: RotaWeekParams, signal?: AbortSignal) =>
    crmRequest<RotaWeek>(`${rota(subAppId)}/assignments`, { query: { ...params }, signal }),
  groups: (subAppId: string, params: { status?: string } = {}, signal?: AbortSignal) =>
    crmRequest<RotaGroupDetail[]>(groups(subAppId), { query: params, signal }),
  createGroup: (subAppId: string, input: RotaGroupInput) =>
    crmRequest<RotaGroupDetail>(groups(subAppId), { method: 'POST', body: input }),
  updateGroup: (subAppId: string, groupId: string, input: RotaGroupInput) =>
    crmRequest<RotaGroupDetail>(`${groups(subAppId)}${groupId}/`, { method: 'PATCH', body: input }),
  activity: (
    subAppId: string,
    params: ListParams & { date: string; staff_id?: string; practice_id?: string; status?: string },
    signal?: AbortSignal,
  ) => crmRequest<StaffActivityResponse>(`/activity/v1/sub-apps/${subAppId}/staff-activity`, { query: params, signal }),
};

export const DUTY_TYPE_LABELS: Record<import('./types').DutyType, string> = {
  ON_CALL: 'On Call',
  CARE_HOME_WARD_ROUND: 'Care-home / Ward Round',
  EXTENDED_ACCESS: 'Extended Access',
  NURSING: 'Nursing',
  ADMIN_SESSION: 'Admin Session',
  NEIGHBOURHOOD_SHIFT: 'Neighbourhood Shift',
  REMOTE_WORK: 'Remote Working',
  PPT_PLT_CPD: 'PPT / PLT / CPD',
  AM_SESSION: 'AM Session',
  PM_SESSION: 'PM Session',
};
