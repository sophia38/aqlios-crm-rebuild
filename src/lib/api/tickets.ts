import { crmRequest } from './http';
import type {
  Paginated,
  SnomedConcept,
  Ticket,
  TicketDetail,
  TicketListParams,
  TicketLog,
  TicketMessage,
  TicketMessageChannel,
  TicketNote,
  TicketSnomedCode,
  TicketStaff,
  TicketStatus,
  TicketUrgency,
} from './types';

// No ticket call was captured. The paths follow the `public/v1` practice pattern and are all
// inferred (docs/plans/phase-5-practice-modules.md §2).
const base = (subAppId: string, practiceId: string) =>
  `/public/v1/sub-apps/${subAppId}/practices/${practiceId}/consultations/`;
const one = (subAppId: string, practiceId: string, ticketId: string) => `${base(subAppId, practiceId)}${ticketId}/`;

export const ticketsApi = {
  list: (subAppId: string, practiceId: string, params: TicketListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<Ticket>>(base(subAppId, practiceId), { query: { ...params }, signal }),
  get: (subAppId: string, practiceId: string, ticketId: string, signal?: AbortSignal) =>
    crmRequest<TicketDetail>(one(subAppId, practiceId, ticketId), { signal }),
  assignableStaff: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<TicketStaff[]>(`${base(subAppId, practiceId)}assignable-staff/`, { signal }),
  assign: (subAppId: string, practiceId: string, ticketId: string, input: { staff_id: string; reason?: string }) =>
    crmRequest<TicketDetail>(`${one(subAppId, practiceId, ticketId)}assign/`, { method: 'POST', body: input }),
  updateStatus: (
    subAppId: string,
    practiceId: string,
    ticketId: string,
    input: { status: TicketStatus; reason?: string },
  ) => crmRequest<TicketDetail>(`${one(subAppId, practiceId, ticketId)}status/`, { method: 'POST', body: input }),
  setUrgency: (subAppId: string, practiceId: string, ticketId: string, urgency: TicketUrgency) =>
    crmRequest<TicketDetail>(one(subAppId, practiceId, ticketId), { method: 'PATCH', body: { urgency } }),
  addNote: (
    subAppId: string,
    practiceId: string,
    ticketId: string,
    input: { text: string; shared_with_patient: boolean },
  ) => crmRequest<TicketNote>(`${one(subAppId, practiceId, ticketId)}notes/`, { method: 'POST', body: input }),
  addSnomedCode: (subAppId: string, practiceId: string, ticketId: string, input: { code: string; comment: string }) =>
    crmRequest<TicketSnomedCode>(`${one(subAppId, practiceId, ticketId)}snomed/`, { method: 'POST', body: input }),
  sendMessage: (
    subAppId: string,
    practiceId: string,
    ticketId: string,
    input: { body: string; channels: TicketMessageChannel[]; reply_allowed: boolean },
  ) => crmRequest<TicketMessage>(`${one(subAppId, practiceId, ticketId)}messages/`, { method: 'POST', body: input }),
  logs: (subAppId: string, practiceId: string, ticketId: string, signal?: AbortSignal) =>
    crmRequest<TicketLog[]>(`${one(subAppId, practiceId, ticketId)}logs/`, { signal }),
  searchSnomed: (search: string, signal?: AbortSignal) =>
    crmRequest<SnomedConcept[]>('/public/v1/snomed-codes/', { query: { search }, signal }),
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'New',
  MORE_INFO_REQUIRED: 'More Info Required',
  APPOINTMENT_PENDING: 'Appointment Pending',
  UNDER_CLINICAL_REVIEW: 'Under Clinical Review',
  REOPENED: 'Reopened',
  FORWARDED: 'Forwarded',
  FOLLOW_UP_REQUESTED: 'Follow Up Requested',
  APPOINTMENT_BOOKED: 'Appointment Booked',
  DNA: 'DNA',
  APPOINTMENT_CANCELLED: 'Appointment Cancelled',
  CLOSED: 'Completed',
};

export const TICKET_SOURCE_LABELS = { VOICE_AGENT: 'Voice Agent', WEB_TRIAGE: 'Web Triage' } as const;

export const TICKET_URGENCY_LABELS: Record<TicketUrgency, string> = {
  URGENT: 'Urgent',
  ROUTINE_ONE_WEEK: 'Routine (1 Week)',
  ROUTINE_TWO_WEEK: 'Routine (2 Weeks)',
};

export const TICKET_CHANNEL_LABELS: Record<TicketMessageChannel, string> = {
  SMS: 'SMS',
  EMAIL: 'Email',
  APP: 'Aqlios App',
  NHS_APP: 'NHS App',
};

export const SNOMED_MIN_SEARCH = 3;
export const TICKET_NOTE_MAX = 700;
export const TICKET_MESSAGE_MAX = 1000;
export const TICKET_REASON_MAX = 300;
export const SNOMED_COMMENT_MAX = 200;

export const isClosed = (ticket: Pick<Ticket, 'status'>) => ticket.status === 'CLOSED';
