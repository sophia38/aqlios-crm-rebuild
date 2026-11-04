import { crmRequest } from './http';
import type { HrAnswer, HrPolicy, HrPolicyCategory, HrPolicyInput, HrPolicyListParams, Paginated } from './types';

// All inferred (docs/plans/phase-5-practice-modules.md §7). The demo stores uploaded files as names only.
const base = (subAppId: string, practiceId: string) =>
  `/public/v1/sub-apps/${subAppId}/practices/${practiceId}/hr-policies/`;

export const HR_QUESTION_MAX = 1000;
export const HR_DESCRIPTION_MAX = 500;
export const HR_POLICY_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const HR_POLICY_ACCEPT = [
  '.pdf',
  '.docx',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const hrPoliciesApi = {
  list: (subAppId: string, practiceId: string, params: HrPolicyListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<HrPolicy>>(base(subAppId, practiceId), { query: { ...params }, signal }),
  /** The Owner select: the practice's staff. */
  owners: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<{ id: string; name: string; role_name: string }[]>(`${base(subAppId, practiceId)}owners/`, { signal }),
  create: (subAppId: string, practiceId: string, input: HrPolicyInput) =>
    crmRequest<HrPolicy>(base(subAppId, practiceId), { method: 'POST', body: input }),
  /** A new file and details: the version goes up by one. */
  replace: (subAppId: string, practiceId: string, id: string, input: HrPolicyInput) =>
    crmRequest<HrPolicy>(`${base(subAppId, practiceId)}${id}/replace/`, { method: 'POST', body: input }),
  remove: (subAppId: string, practiceId: string, id: string) =>
    crmRequest<{ id: string }>(`${base(subAppId, practiceId)}${id}/`, { method: 'DELETE' }),
  ask: (subAppId: string, practiceId: string, question: string) =>
    crmRequest<HrAnswer>(`${base(subAppId, practiceId)}ask/`, { method: 'POST', body: { question } }),
};

/** The captured chip and select labels. */
export const HR_POLICY_CATEGORY_LABELS: Record<HrPolicyCategory, string> = {
  STAFF_HANDBOOK: 'Staff handbook',
  LEAVE: 'Leave',
  SICKNESS: 'Sickness',
  FAMILY_LEAVE: 'Family leave',
  EXPENSES: 'Expenses',
  CONDUCT: 'Conduct & disciplinary',
  GRIEVANCE: 'Grievance',
  HEALTH_SAFETY: 'Health & safety',
  EQUALITY: 'Equality',
  OTHER: 'Other',
};

/** The captured suggestion buttons on Ask HR. */
export const HR_SUGGESTED_QUESTIONS = [
  'How much annual leave do I get?',
  'What is the sickness reporting procedure?',
  'How do I raise a grievance?',
  'What is the expenses policy?',
];

/** "Annual leave policy, section 2.1". */
export const citeSource = (source: { policy_title: string; section: string }) =>
  `${source.policy_title}, section ${source.section}`;

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
