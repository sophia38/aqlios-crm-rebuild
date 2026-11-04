import { crmRequest } from './http';
import type {
  Appointment,
  AppointmentKind,
  AppointmentListParams,
  AppointmentRequest,
  AppointmentRequestListParams,
  AppointmentRequestRange,
  AppointmentRequestStatus,
  AppointmentRequestSummary,
  AppointmentSeverity,
  AppointmentStatus,
  AppointmentSummary,
  Paginated,
} from './types';

// No appointment call was captured. The paths follow the `public/v1` practice pattern and are all
// inferred (docs/plans/phase-5-practice-modules.md §3).
const practiceBase = (subAppId: string, practiceId: string) =>
  `/public/v1/sub-apps/${subAppId}/practices/${practiceId}/`;
const appointments = (subAppId: string, practiceId: string) => `${practiceBase(subAppId, practiceId)}appointments/`;
const requests = (subAppId: string, practiceId: string) => `${practiceBase(subAppId, practiceId)}appointment-requests/`;

export const APPOINTMENT_REASON_MAX = 300;

export const appointmentsApi = {
  list: (subAppId: string, practiceId: string, params: AppointmentListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<Appointment>>(appointments(subAppId, practiceId), { query: { ...params }, signal }),
  /** Stat cards for the Table View: the same filters as the list, without Status. */
  summary: (subAppId: string, practiceId: string, params: AppointmentListParams, signal?: AbortSignal) =>
    crmRequest<AppointmentSummary>(`${appointments(subAppId, practiceId)}summary/`, { query: { ...params }, signal }),
  get: (subAppId: string, practiceId: string, appointmentId: string, signal?: AbortSignal) =>
    crmRequest<Appointment>(`${appointments(subAppId, practiceId)}${appointmentId}/`, { signal }),
  cancel: (subAppId: string, practiceId: string, appointmentId: string, reason: string) =>
    crmRequest<Appointment>(`${appointments(subAppId, practiceId)}${appointmentId}/cancel/`, {
      method: 'POST',
      body: { reason },
    }),
  reschedule: (subAppId: string, practiceId: string, appointmentId: string) =>
    crmRequest<Appointment>(`${appointments(subAppId, practiceId)}${appointmentId}/reschedule/`, { method: 'POST' }),
  complete: (subAppId: string, practiceId: string, appointmentId: string) =>
    crmRequest<Appointment>(`${appointments(subAppId, practiceId)}${appointmentId}/complete/`, { method: 'POST' }),
  markDna: (subAppId: string, practiceId: string, appointmentId: string) =>
    crmRequest<Appointment>(`${appointments(subAppId, practiceId)}${appointmentId}/dna/`, { method: 'POST' }),

  listRequests: (subAppId: string, practiceId: string, params: AppointmentRequestListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<AppointmentRequest>>(requests(subAppId, practiceId), { query: { ...params }, signal }),
  requestSummary: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<AppointmentRequestSummary>(`${requests(subAppId, practiceId)}summary/`, { signal }),
  approveRequest: (subAppId: string, practiceId: string, requestId: string) =>
    crmRequest<AppointmentRequest>(`${requests(subAppId, practiceId)}${requestId}/approve/`, { method: 'POST' }),
  rejectRequest: (subAppId: string, practiceId: string, requestId: string, reason?: string) =>
    crmRequest<AppointmentRequest>(`${requests(subAppId, practiceId)}${requestId}/reject/`, {
      method: 'POST',
      body: { reason },
    }),
};

export const APPOINTMENT_KIND_LABELS: Record<AppointmentKind, string> = {
  FACE_TO_FACE_SURGERY: 'Face to Face Surgery',
  TELEPHONE_OR_AUDIO: 'Telephone or Audio',
  FACE_TO_FACE_HOME_VISIT: 'Face to Face Home Visit',
  WRITTEN_INCLUDING_ONLINE: 'Written Including Online',
  ONLINE_VIDEO: 'Online (Video)',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  UPCOMING: 'Upcoming',
  IN_PROGRESS: 'In Progress',
  DNA: 'DNA',
  COMPLETED: 'Completed',
  CANCELLED_BY_PATIENT: 'Cancelled by Patient',
  CANCELLED_BY_STAFF: 'Cancelled by Staff',
  RESCHEDULE_REQUESTED: 'Reschedule Requested',
};

export const APPOINTMENT_SEVERITY_LABELS: Record<AppointmentSeverity, string> = {
  URGENT: 'Urgent',
  ROUTINE: 'Routine',
};

export const APPOINTMENT_REQUEST_STATUS_LABELS: Record<AppointmentRequestStatus, string> = {
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};

export const APPOINTMENT_REQUEST_RANGE_LABELS: Record<AppointmentRequestRange, string> = {
  today: 'Today',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
};

/** The appointment can still be moved or cancelled. */
export const isBookable = (appointment: Appointment) =>
  appointment.status === 'UPCOMING' || appointment.status === 'RESCHEDULE_REQUESTED';

/** The appointment has started, so its outcome (Completed or DNA) can be recorded or corrected. */
export const hasStarted = (appointment: Appointment) =>
  appointment.status === 'IN_PROGRESS' || appointment.status === 'COMPLETED' || appointment.status === 'DNA';
