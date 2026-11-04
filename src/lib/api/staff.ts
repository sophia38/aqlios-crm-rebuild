import { crmRequest } from './http';
import type {
  Paginated,
  PayrollDocumentType,
  PensionScheme,
  PracticeStaff,
  PracticeStaffStatus,
  StaffAction,
  StaffDetail,
  StaffDetailTab,
  StaffDocument,
  StaffDocumentStatus,
  StaffImportInfo,
  StaffImportResult,
  StaffInviteInput,
  StaffListParams,
  StaffSummary,
} from './types';

// The list (`…/practices/{id}/staff?page&page_size&status`) and bulk-import info URLs were captured;
// everything else is inferred (docs/plans/phase-5-practice-modules.md §4). The live list uses the
// organisation id; the rebuild uses the practice id everywhere.
const base = (subAppId: string, practiceId: string) => `/public/v1/sub-apps/${subAppId}/practices/${practiceId}/staff/`;
const one = (subAppId: string, practiceId: string, staffId: string) => `${base(subAppId, practiceId)}${staffId}/`;

/** The signed-in user's own record (Profile). */
export const SELF_STAFF_ID = 'me';
export const STAFF_REASON_MAX = 300;
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const PASSWORD_RULE =
  'Password must be at least 12 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

export const staffApi = {
  list: (subAppId: string, practiceId: string, params: StaffListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<PracticeStaff>>(base(subAppId, practiceId), { query: { ...params }, signal }),
  summary: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<StaffSummary>(`${base(subAppId, practiceId)}summary/`, { signal }),
  roles: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<{ id: string; name: string }[]>(`${base(subAppId, practiceId)}roles/`, { signal }),
  invite: (subAppId: string, practiceId: string, input: StaffInviteInput) =>
    crmRequest<PracticeStaff>(`${base(subAppId, practiceId)}invite/`, { method: 'POST', body: input }),
  importInfo: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<StaffImportInfo>(`${base(subAppId, practiceId)}bulk-import/`, { signal }),
  bulkImport: (subAppId: string, practiceId: string, rows: Record<string, string>[]) =>
    crmRequest<StaffImportResult>(`${base(subAppId, practiceId)}bulk-import/`, { method: 'POST', body: { rows } }),
  action: (subAppId: string, practiceId: string, staffId: string, action: StaffAction, reason?: string) =>
    crmRequest<PracticeStaff>(`${one(subAppId, practiceId, staffId)}${action}/`, { method: 'POST', body: { reason } }),

  get: (subAppId: string, practiceId: string, staffId: string, signal?: AbortSignal) =>
    crmRequest<StaffDetail>(one(subAppId, practiceId, staffId), { signal }),
  /** One tab at a time, as the page saves the current tab. */
  update: <T extends StaffDetailTab>(
    subAppId: string,
    practiceId: string,
    staffId: string,
    tab: T,
    data: StaffDetail[T],
  ) => crmRequest<StaffDetail>(one(subAppId, practiceId, staffId), { method: 'PATCH', body: { tab, data } }),
  uploadDocument: (
    subAppId: string,
    practiceId: string,
    staffId: string,
    key: string,
    input: { file_name: string; issue_date?: string; expiry_date?: string },
  ) =>
    crmRequest<StaffDocument>(`${one(subAppId, practiceId, staffId)}documents/${key}/`, {
      method: 'POST',
      body: input,
    }),
  verifyDocument: (subAppId: string, practiceId: string, staffId: string, key: string) =>
    crmRequest<StaffDocument>(`${one(subAppId, practiceId, staffId)}documents/${key}/verify/`, { method: 'POST' }),
  rejectDocument: (subAppId: string, practiceId: string, staffId: string, key: string, reason: string) =>
    crmRequest<StaffDocument>(`${one(subAppId, practiceId, staffId)}documents/${key}/reject/`, {
      method: 'POST',
      body: { reason },
    }),
  uploadPayrollDocument: (
    subAppId: string,
    practiceId: string,
    staffId: string,
    type: PayrollDocumentType,
    fileName: string,
  ) =>
    crmRequest<StaffDetail>(`${one(subAppId, practiceId, staffId)}payroll-documents/${type}/`, {
      method: 'POST',
      body: { file_name: fileName },
    }),
  changePassword: (input: { current_password: string; new_password: string }) =>
    crmRequest<{ updated: true }>('/users/v1/me/password/', { method: 'POST', body: input }),
};

export const STAFF_STATUS_LABELS: Record<PracticeStaffStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  LOCKED: 'Locked',
  PENDING_INVITE: 'Pending Invite',
  INVITATION_EXPIRED: 'Invitation Expired',
  RESENT_INVITE: 'Resent Invite',
  PENDING_PROFILE: 'Pending Profile',
  PENDING_APPROVAL: 'Pending Approval',
  REJECTED: 'Rejected',
};

export const DOCUMENT_STATUS_LABELS: Record<StaffDocumentStatus, string> = {
  PENDING_UPLOAD: 'Pending Upload',
  PENDING_VERIFICATION: 'Pending Verification',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};

export const PAYROLL_DOCUMENT_LABELS: Record<PayrollDocumentType, string> = {
  P45: 'P45',
  HMRC_STARTER_CHECKLIST: 'HMRC Starter Checklist',
  TAX_CODE_UPDATE: 'Tax Code Update',
};

export const PENSION_LABELS: Record<PensionScheme, string> = {
  NONE: 'No Pension',
  NHS: 'NHS Pension',
  GP_SALARIED: 'GP Salaried Pension',
  NEST: 'NEST Pension',
};

/** Fix: live loads no options. */
export const LEAVING_REASONS = [
  'Resignation',
  'Retirement',
  'End of fixed-term contract',
  'Relocation',
  'Dismissal',
  'Redundancy',
  'Other',
] as const;

/** Fix: the live ranges overlap (13-16, Above 16, 16-45); phase 5 question 7. */
export const AGE_GROUPS = ['0-12', '13-15', '16-44', '45+'] as const;

export const OTHER_LEAVE_TYPES = [
  'Maternity',
  'Paternity',
  'Bereavement',
  'Compassionate',
  'Emergency',
  'TOIL',
] as const;

/** A document needs re-verification within 30 days. */
export const isReverificationDue = (document: StaffDocument, today = new Date()) =>
  Boolean(
    document.status === 'VERIFIED' &&
    document.reverification_due &&
    Date.parse(document.reverification_due) - today.getTime() < 30 * 24 * 3600 * 1000,
  );

/** Password rules (captured helper text). */
export const passwordMeetsRule = (value: string) =>
  value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
