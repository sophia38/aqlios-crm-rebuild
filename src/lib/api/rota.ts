import { crmRequest } from './http';
import type {
  AssignmentInput,
  AssignmentScope,
  AssignmentUpdate,
  ListParams,
  PublishedSlot,
  PublishSlotInput,
  RotaTemplate,
  RotaTemplateInput,
  Shift,
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
  /** `practice_id` limits it to that practice's rota staff (practice ROTA, and practice users). */
  availableStaff: (subAppId: string, date: string, signal?: AbortSignal, practiceId?: string) =>
    crmRequest<RotaStaff[]>(`${rota(subAppId)}/available-staff`, {
      query: { date, practice_id: practiceId },
      signal,
    }),
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
    params: ListParams & { date: string; staff_id?: string; practice_id?: string; status?: string; duty_type?: string },
    signal?: AbortSignal,
  ) => crmRequest<StaffActivityResponse>(`/activity/v1/sub-apps/${subAppId}/staff-activity`, { query: params, signal }),

  // Phase 5 (practice ROTA, all inferred). Edits and deletes take the captured scope.
  assign: (subAppId: string, input: AssignmentInput) =>
    crmRequest<Shift[]>(`${rota(subAppId)}/assignments`, { method: 'POST', body: input }),
  updateAssignment: (subAppId: string, shiftId: string, scope: AssignmentScope, input: AssignmentUpdate) =>
    crmRequest<Shift>(`${rota(subAppId)}/assignments/${shiftId}`, { method: 'PATCH', query: { scope }, body: input }),
  deleteAssignment: (subAppId: string, shiftId: string, scope: AssignmentScope) =>
    crmRequest<{ id: string }>(`${rota(subAppId)}/assignments/${shiftId}`, { method: 'DELETE', query: { scope } }),

  publishedSlots: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<PublishedSlot[]>(`${rota(subAppId)}/published-slots`, { query: { practice_id: practiceId }, signal }),
  publishSlot: (subAppId: string, input: PublishSlotInput) =>
    crmRequest<PublishedSlot[]>(`${rota(subAppId)}/published-slots`, { method: 'POST', body: input }),
  claimSlot: (subAppId: string, slotId: string) =>
    crmRequest<PublishedSlot>(`${rota(subAppId)}/published-slots/${slotId}/claim`, { method: 'POST' }),
  declineSlot: (subAppId: string, slotId: string) =>
    crmRequest<PublishedSlot>(`${rota(subAppId)}/published-slots/${slotId}/decline`, { method: 'POST' }),
  acceptBid: (subAppId: string, slotId: string, bidId: string) =>
    crmRequest<Shift>(`${rota(subAppId)}/published-slots/${slotId}/bids/${bidId}/accept`, { method: 'POST' }),

  templates: (subAppId: string, practiceId?: string, signal?: AbortSignal) =>
    crmRequest<RotaTemplate[]>(`${rota(subAppId)}/rota-templates`, { query: { practice_id: practiceId }, signal }),
  createTemplate: (subAppId: string, input: RotaTemplateInput) =>
    crmRequest<RotaTemplate>(`${rota(subAppId)}/rota-templates`, { method: 'POST', body: input }),
  renameTemplate: (subAppId: string, templateId: string, name: string) =>
    crmRequest<RotaTemplate>(`${rota(subAppId)}/rota-templates/${templateId}`, { method: 'PATCH', body: { name } }),
  deleteTemplate: (subAppId: string, templateId: string) =>
    crmRequest<{ id: string }>(`${rota(subAppId)}/rota-templates/${templateId}`, { method: 'DELETE' }),
  applyTemplate: (subAppId: string, templateId: string, input: { start_date: string; clear_existing: boolean }) =>
    crmRequest<{ created: number }>(`${rota(subAppId)}/rota-templates/${templateId}/apply`, {
      method: 'POST',
      body: input,
    }),
};

export const TEMPLATE_NAME_MAX = 30;

export const SHIFT_URGENCY_LABELS = { ROUTINE: 'Routine (1 week)', URGENT: 'Urgent' } as const;

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
