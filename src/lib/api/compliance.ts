import { crmRequest } from './http';
import type { ComplianceDashboard, ComplianceDashboardApi, ComplianceStatus, ListParams } from './types';

// CQC Compliance (docs/plans/phase-4-vertical-modules.md §5). The URL and query params were read from
// the live page's code; the response shape is inferred from the fields that code reads.

export const complianceApi = {
  dashboard: async (
    subAppId: string,
    params: ListParams & { practice_id?: string; verification_status?: string },
    signal?: AbortSignal,
  ): Promise<ComplianceDashboard> => {
    const data = await crmRequest<ComplianceDashboardApi>(`/public/v1/sub-apps/${subAppId}/staff/dashboard/`, {
      query: params,
      signal,
    });
    // The API misspells the status field; the rest of the app only sees `compliance_status`.
    return {
      ...data,
      results: data.results.map(({ complaince_status, ...row }) => ({ ...row, compliance_status: complaince_status })),
    };
  },
};

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  ACTIVE: 'Compliant',
  PENDING_UPLOAD: 'Pending Upload',
  PENDING_VERIFICATION: 'Awaiting Verification',
  REVERIFICATION_DUE: 'Re-verification Due',
  EXPIRED: 'Expired',
  REJECTED: 'Rejected',
};

/** The Compliance Status filter (live: no Rejected option). */
export const COMPLIANCE_FILTER_OPTIONS: ComplianceStatus[] = [
  'ACTIVE',
  'PENDING_UPLOAD',
  'PENDING_VERIFICATION',
  'REVERIFICATION_DUE',
  'EXPIRED',
];
