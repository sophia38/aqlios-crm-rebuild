import { crmRequest } from './http';
import type { ListParams, Paginated } from './types';

// CQC Compliance: inspection readiness tracker (docs/plans/phase-6-cqc-compliance.md). The paths and
// shapes are inferred from the BA's "CQC Predicted Rating" workbook; there is no live API to read.

export type CqcAreaKey =
  | 'inspection-checklist'
  | 'estates-statutory'
  | 'clinical-searches'
  | 'cas-alerts'
  | 'surgery-audits'
  | 'risk-assessments'
  | 'policies';

/** Every area that counts towards the predicted rating (the survey is scored differently). */
export type CqcSummaryAreaKey = CqcAreaKey | 'national-patient-survey';

export const CQC_CHECK_AREAS: { key: CqcAreaKey; label: string; subtitle: string }[] = [
  {
    key: 'inspection-checklist',
    label: 'Inspection Checklist',
    subtitle: 'Gap checklist across the five CQC key questions and Outstanding evidence.',
  },
  {
    key: 'estates-statutory',
    label: 'Estates & Statutory',
    subtitle: 'Fire, health and safety, Legionella, infection control and other statutory checks.',
  },
  {
    key: 'clinical-searches',
    label: 'Clinical Searches',
    subtitle: 'Medicines monitoring and long-term condition searches, each patient actioned and closed.',
  },
  {
    key: 'cas-alerts',
    label: 'CAS Alerts',
    subtitle: 'Central Alerting System and patient-safety alert controls, plus the alert register.',
  },
  {
    key: 'surgery-audits',
    label: 'Surgery Audits',
    subtitle: 'Mandatory, enhanced and advisory audits, significant events and clinical audit cycles.',
  },
  {
    key: 'risk-assessments',
    label: 'Risk Assessments',
    subtitle: 'Site-specific risk assessments: suitable, approved, in date and reviewed.',
  },
  {
    key: 'policies',
    label: 'Policies',
    subtitle: 'Locally approved policies: current, owned, communicated and implemented.',
  },
];

export const CQC_SURVEY_AREA = {
  key: 'national-patient-survey' as const,
  label: 'National GP Patient Survey',
  subtitle: 'Practice results against the national result. An internal comparison, not an official CQC rating.',
};

export const CQC_SUMMARY_AREA_LABELS: Record<CqcSummaryAreaKey, string> = {
  ...Object.fromEntries(CQC_CHECK_AREAS.map((area) => [area.key, area.label])),
  'national-patient-survey': CQC_SURVEY_AREA.label,
} as Record<CqcSummaryAreaKey, string>;

export type CqcStatus = 'NOT_CHECKED' | 'GAP' | 'IN_PROGRESS' | 'COMPLETE' | 'OUTSTANDING' | 'NOT_APPLICABLE';
export const CQC_STATUSES: CqcStatus[] = [
  'NOT_CHECKED',
  'GAP',
  'IN_PROGRESS',
  'COMPLETE',
  'OUTSTANDING',
  'NOT_APPLICABLE',
];
export const CQC_STATUS_LABELS: Record<CqcStatus, string> = {
  NOT_CHECKED: 'Not checked',
  GAP: 'Gap',
  IN_PROGRESS: 'In progress',
  COMPLETE: 'Complete',
  OUTSTANDING: 'Outstanding evidence',
  NOT_APPLICABLE: 'Not applicable - justified',
};

export type CqcRisk = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export const CQC_RISKS: CqcRisk[] = ['IMMEDIATE', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];
export const CQC_RISK_LABELS: Record<CqcRisk, string> = {
  IMMEDIATE: 'Immediate',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  NONE: 'None',
};

export type CqcRating =
  | 'Inadequate risk'
  | 'Inadequate readiness'
  | 'Requires improvement'
  | 'Good-ready'
  | 'Outstanding-ready'
  | 'Not rated';

export interface CqcCheck {
  id: string;
  area: CqcAreaKey;
  /** The workbook's "Area" column: a CQC domain, a topic or a policy group. */
  group: string;
  requirement: string;
  completion: string;
  evidence: string;
  status: CqcStatus;
  risk: CqcRisk | null;
  due_date: string | null;
  completed_date: string | null;
  gap_action: string;
  owner: string;
  action_id: string | null;
  notes: string;
}

export type CqcCheckEdit = Pick<
  CqcCheck,
  'status' | 'risk' | 'evidence' | 'due_date' | 'completed_date' | 'gap_action' | 'owner' | 'notes'
>;

export interface CqcChecksPage extends Paginated<CqcCheck> {
  /** The groups in this area, for the Area filter. */
  groups: string[];
}

export interface CqcAreaSummary {
  area: CqcSummaryAreaKey;
  label: string;
  total: number;
  /** Complete, Outstanding evidence and Not applicable - justified (survey: measures entered). */
  complete: number;
  /** Gap and In progress (survey: measures scoring below 3). */
  gaps: number;
  not_checked: number;
  /** Unresolved Immediate or High risks. */
  high_risk: number;
  /** 0 to 1. */
  readiness: number;
  rating: CqcRating;
}

export interface CqcSummary {
  areas: CqcAreaSummary[];
  overall: Omit<CqcAreaSummary, 'area' | 'label'>;
}

export interface CqcSurveyMeasure {
  id: string;
  measure: string;
  direction: 'HIGHER' | 'LOWER';
  practice_result: number | null;
  national_result: number | null;
  previous_result: number | null;
  action: string;
  owner: string;
  /** Percentage points against the national result, positive is better. */
  difference: number | null;
  score: 1 | 2 | 3 | 4 | null;
  rating: CqcRating;
  /** Percentage points against last year, positive is better. */
  change: number | null;
}

export type CqcSurveyEdit = Pick<
  CqcSurveyMeasure,
  'practice_result' | 'national_result' | 'previous_result' | 'action' | 'owner'
>;

export interface CqcSurveyPage extends Paginated<CqcSurveyMeasure> {
  summary: { entered: number; total: number; average_score: number; readiness: number; rating: CqcRating };
}

export type CqcApplicable = 'YES' | 'NO_JUSTIFIED' | 'UNDER_REVIEW';
export const CQC_APPLICABLE_LABELS: Record<CqcApplicable, string> = {
  YES: 'Yes',
  NO_JUSTIFIED: 'No - justified',
  UNDER_REVIEW: 'Under review',
};
export type CqcAlertAction = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'NOT_APPLICABLE';
export const CQC_ALERT_ACTION_LABELS: Record<CqcAlertAction, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETE: 'Complete',
  NOT_APPLICABLE: 'Not applicable',
};
export type CqcSignOff = 'NOT_CHECKED' | 'SIGNED_OFF' | 'ACTION_NEEDED';
export const CQC_SIGN_OFF_LABELS: Record<CqcSignOff, string> = {
  NOT_CHECKED: 'Not checked',
  SIGNED_OFF: 'Signed off',
  ACTION_NEEDED: 'Action needed',
};

export interface CqcAlert {
  id: string;
  reference: string;
  title: string;
  received_date: string | null;
  applicable: CqcApplicable;
  clinical_owner: string;
  action_deadline: string | null;
  patients_affected: number | null;
  action_status: CqcAlertAction;
  closure_evidence: string;
  closed_date: string | null;
  sign_off: CqcSignOff;
  notes: string;
}

export type CqcAlertInput = Omit<CqcAlert, 'id'>;

export type CqcPriority = Exclude<CqcRisk, 'NONE'>;
export const CQC_PRIORITIES: CqcPriority[] = ['IMMEDIATE', 'HIGH', 'MEDIUM', 'LOW'];

export type CqcActionStatus = 'OPEN' | 'IN_PROGRESS' | 'AWAITING_EVIDENCE' | 'EFFECTIVENESS_REVIEW' | 'CLOSED';
export const CQC_ACTION_STATUSES: CqcActionStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_EVIDENCE',
  'EFFECTIVENESS_REVIEW',
  'CLOSED',
];
export const CQC_ACTION_STATUS_LABELS: Record<CqcActionStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  AWAITING_EVIDENCE: 'Awaiting evidence',
  EFFECTIVENESS_REVIEW: 'Effectiveness review',
  CLOSED: 'Closed',
};

export interface CqcAction {
  /** `ACT-001`. */
  id: string;
  source_area: CqcSummaryAreaKey | null;
  source_check_id: string | null;
  priority: CqcPriority;
  gap: string;
  required_action: string;
  owner: string;
  opened_date: string;
  due_date: string | null;
  status: CqcActionStatus;
  completion_evidence: string;
  effectiveness_check: string;
  closed_date: string | null;
}

export type CqcActionEdit = Pick<
  CqcAction,
  | 'priority'
  | 'gap'
  | 'required_action'
  | 'owner'
  | 'due_date'
  | 'status'
  | 'completion_evidence'
  | 'effectiveness_check'
>;

export type CqcCheckFilters = { group?: string; status?: string; risk?: string };

const path = (subAppId: string, practiceId: string, rest: string) =>
  `/public/v1/sub-apps/${subAppId}/practices/${practiceId}/cqc/${rest}`;

export const cqcApi = {
  summary: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<CqcSummary>(path(subAppId, practiceId, 'summary/'), { signal }),

  checks: (
    subAppId: string,
    practiceId: string,
    area: CqcAreaKey,
    params: ListParams & CqcCheckFilters,
    signal?: AbortSignal,
  ) => crmRequest<CqcChecksPage>(path(subAppId, practiceId, `areas/${area}/checks/`), { query: params, signal }),

  updateCheck: (subAppId: string, practiceId: string, id: string, body: CqcCheckEdit) =>
    crmRequest<CqcCheck>(path(subAppId, practiceId, `checks/${id}/`), { method: 'PATCH', body }),

  survey: (subAppId: string, practiceId: string, params: ListParams, signal?: AbortSignal) =>
    crmRequest<CqcSurveyPage>(path(subAppId, practiceId, 'survey-measures/'), { query: params, signal }),

  updateSurveyMeasure: (subAppId: string, practiceId: string, id: string, body: CqcSurveyEdit) =>
    crmRequest<CqcSurveyMeasure>(path(subAppId, practiceId, `survey-measures/${id}/`), { method: 'PATCH', body }),

  alerts: (subAppId: string, practiceId: string, params: ListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<CqcAlert>>(path(subAppId, practiceId, 'alerts/'), { query: params, signal }),

  createAlert: (subAppId: string, practiceId: string, body: CqcAlertInput) =>
    crmRequest<CqcAlert>(path(subAppId, practiceId, 'alerts/'), { method: 'POST', body }),

  updateAlert: (subAppId: string, practiceId: string, id: string, body: CqcAlertInput) =>
    crmRequest<CqcAlert>(path(subAppId, practiceId, `alerts/${id}/`), { method: 'PATCH', body }),

  actions: (
    subAppId: string,
    practiceId: string,
    params: ListParams & { status?: string; priority?: string },
    signal?: AbortSignal,
  ) => crmRequest<Paginated<CqcAction>>(path(subAppId, practiceId, 'actions/'), { query: params, signal }),

  updateAction: (subAppId: string, practiceId: string, id: string, body: CqcActionEdit) =>
    crmRequest<CqcAction>(path(subAppId, practiceId, `actions/${id}/`), { method: 'PATCH', body }),
};
