import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import {
  SNOMED_COMMENT_MAX,
  SNOMED_MIN_SEARCH,
  TICKET_MESSAGE_MAX,
  TICKET_NOTE_MAX,
  TICKET_REASON_MAX,
} from '@/lib/api/tickets';
import {
  TICKET_OPEN_STATUSES,
  TICKET_URGENCIES,
  type Ticket,
  type TicketDetail,
  type TicketMessage,
  type TicketMessageChannel,
  type TicketNote,
  type TicketSnomedCode,
  type TicketStatus,
  type TicketUrgency,
} from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import { assignableStaff, SNOMED_CONCEPTS } from '../fixtures/tickets';
import { currentPersona, getDb, saveDb, visiblePractices } from '../store';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';

// Ticket mocks (docs/plans/phase-5-practice-modules.md §2). No ticket call was captured.

const consultations = (path = '') =>
  `*${CRM_API}/public/v1/sub-apps/:subAppId/practices/:practiceId/consultations/${path}`;

const CHANNELS: TicketMessageChannel[] = ['SMS', 'EMAIL', 'APP', 'NHS_APP'];

function guard(practiceId: string) {
  if (!getDb().session.signedIn) return unauthorized();
  if (!visiblePractices().some((practice) => practice.id === practiceId)) return forbidden();
  return null;
}

function findTicket(practiceId: string, ticketId: string) {
  return getDb().tickets.find((ticket) => ticket.id === ticketId && ticket.practice_id === practiceId);
}

/** The list row: the detail without its heavy parts. */
function summary(ticket: TicketDetail): Ticket {
  return {
    id: ticket.id,
    practice_id: ticket.practice_id,
    patient_id: ticket.patient_id,
    patient_name: ticket.patient_name,
    patient_age: ticket.patient_age,
    patient_sex: ticket.patient_sex,
    source: ticket.source,
    urgency: ticket.urgency,
    complaint_type: ticket.complaint_type,
    status: ticket.status,
    created_at: ticket.created_at,
    recommended_staff: ticket.recommended_staff,
    assigned_staff: ticket.assigned_staff,
    closed_at: ticket.closed_at,
    closed_by_name: ticket.closed_by_name,
    closure_reason: ticket.closure_reason,
  };
}

function actor() {
  const persona = currentPersona();
  return { name: `${persona.firstName} ${persona.lastName}`, role: persona.isAdmin ? 'Super Admin' : 'GP' };
}

function log(ticketId: string, event: string) {
  const db = getDb();
  const { name, role } = actor();
  const list = (db.ticketLogs[ticketId] ??= []);
  list.unshift({
    id: mockId(`ticket-log:${ticketId}:new`, Date.now() + list.length),
    actor: name,
    user_name: name,
    role,
    event,
    created_at: new Date().toISOString(),
  });
}

/** Actions other than assigning need an assigned, open ticket (live: read-only otherwise). */
function editable(ticket: TicketDetail) {
  if (ticket.status === 'CLOSED') return fail(400, 'This case is closed. Reopen it to make changes.');
  if (!ticket.assigned_staff) return fail(400, 'Assign a staff member to enable actions.');
  return null;
}

export const ticketHandlers = [
  http.get(consultations(), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const caseParam = query.get('case');
    const closed = caseParam === 'closed';
    const search = query.get('search')?.trim().toLowerCase();
    const status = query.get('status');
    const date = query.get('date');
    const patientId = query.get('patient_id');
    const exclude = query.get('exclude');
    const results = getDb()
      .tickets.filter((ticket) => ticket.practice_id === practiceId)
      // No `case`: both open and closed (Previous Consultations).
      .filter((ticket) => !caseParam || (ticket.status === 'CLOSED') === closed)
      .filter((ticket) => !status || ticket.status === status)
      .filter((ticket) => !date || ticket.created_at.slice(0, 10) === date)
      .filter((ticket) => !patientId || ticket.patient_id === patientId)
      .filter((ticket) => !exclude || ticket.id !== exclude)
      .filter(
        (ticket) =>
          !search ||
          [ticket.patient_name, ticket.complaint_type, ticket.assigned_staff?.name, ticket.recommended_staff?.name]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(search)),
      )
      .map(summary);
    return ok(paginate(request, order(request, results, closed ? '-closed_at' : '-created_at')));
  }),

  http.get(consultations('assignable-staff/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const db = getDb();
    return ok(assignableStaff(db.staff, db.roles, practiceId));
  }),

  http.get(consultations(':ticketId/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const ticket = findTicket(practiceId, String(params.ticketId));
    if (!ticket) return fail(404, 'Consultation not found');
    // Opening a ticket records you as its viewer, as live.
    ticket.current_viewer_name = actor().name;
    saveDb();
    return ok(ticket);
  }),

  http.patch(consultations(':ticketId/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const ticket = findTicket(practiceId, String(params.ticketId));
    if (!ticket) return fail(404, 'Consultation not found');
    const blocked = editable(ticket);
    if (blocked) return blocked;
    const { urgency } = (await request.json()) as { urgency?: TicketUrgency };
    if (!urgency || !TICKET_URGENCIES.includes(urgency)) return fail(400, 'Urgency is not valid');
    if (urgency !== ticket.urgency) {
      ticket.urgency = urgency;
      ticket.urgency_changed_by_clinician = true;
      log(ticket.id, 'Urgency Changed');
      saveDb();
    }
    return ok(ticket, 'Consultation updated successfully');
  }),

  http.post(consultations(':ticketId/assign/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const ticket = findTicket(practiceId, String(params.ticketId));
    if (!ticket) return fail(404, 'Consultation not found');
    if (ticket.status === 'CLOSED') return fail(400, 'This case is closed. Reopen it to make changes.');
    const { staff_id: staffId, reason } = (await request.json()) as { staff_id?: string; reason?: string };
    const db = getDb();
    const member = assignableStaff(db.staff, db.roles, practiceId).find((item) => item.id === staffId);
    if (!member) return fail(400, 'Staff is required', [{ field: 'staff_id', message: 'Staff is required' }]);
    const text = String(reason ?? '').trim();
    if (text.length > TICKET_REASON_MAX) return fail(400, `Reason must be ${TICKET_REASON_MAX} characters or fewer`);
    ticket.assigned_staff = member;
    log(ticket.id, text ? `Staff Assigned: ${member.name}. Reason: ${text}` : `Staff Assigned: ${member.name}`);
    saveDb();
    return ok(ticket, 'Staff assigned successfully');
  }),

  http.post(consultations(':ticketId/status/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const ticket = findTicket(practiceId, String(params.ticketId));
    if (!ticket) return fail(404, 'Consultation not found');
    const { status, reason } = (await request.json()) as { status?: TicketStatus; reason?: string };
    const reopening = ticket.status === 'CLOSED';
    if (reopening && status !== 'REOPENED') return fail(400, 'This case is closed. Reopen it to make changes.');
    if (!reopening) {
      const blocked = editable(ticket);
      if (blocked) return blocked;
    }
    if (!status || (status !== 'CLOSED' && !TICKET_OPEN_STATUSES.includes(status as never))) {
      return fail(400, 'Status is not valid');
    }
    const text = String(reason ?? '').trim();
    if (status === 'CLOSED') {
      if (!text) {
        return fail(400, 'Reason for closure is required', [
          { field: 'reason', message: 'Reason for closure is required' },
        ]);
      }
      if (text.length > TICKET_REASON_MAX) return fail(400, `Reason must be ${TICKET_REASON_MAX} characters or fewer`);
      ticket.closed_at = new Date().toISOString();
      ticket.closed_by_name = actor().name;
      ticket.closure_reason = text;
      log(ticket.id, `Case Closed: ${text}`);
    } else {
      ticket.closed_at = null;
      ticket.closed_by_name = null;
      ticket.closure_reason = null;
      log(ticket.id, reopening ? 'Case Reopened' : `Status Updated: ${status}`);
    }
    ticket.status = status;
    saveDb();
    return ok(ticket, 'Status updated successfully');
  }),

  http.post(consultations(':ticketId/notes/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const ticket = findTicket(practiceId, String(params.ticketId));
    if (!ticket) return fail(404, 'Consultation not found');
    const blocked = editable(ticket);
    if (blocked) return blocked;
    const { text, shared_with_patient: shared } = (await request.json()) as {
      text?: string;
      shared_with_patient?: boolean;
    };
    const body = String(text ?? '').trim();
    if (!body) return fail(400, 'Note is required');
    if (body.length > TICKET_NOTE_MAX) return fail(400, `Note must be ${TICKET_NOTE_MAX} characters or fewer`);
    const note: TicketNote = {
      id: mockId(`ticket-note:${ticket.id}:new`, Date.now()),
      text: body,
      shared_with_patient: Boolean(shared),
      added_by_name: actor().name,
      created_at: new Date().toISOString(),
    };
    ticket.notes.unshift(note);
    log(ticket.id, 'Clinical Note Added');
    saveDb();
    return created(note, 'Notes saved successfully');
  }),

  http.post(consultations(':ticketId/snomed/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const ticket = findTicket(practiceId, String(params.ticketId));
    if (!ticket) return fail(404, 'Consultation not found');
    const blocked = editable(ticket);
    if (blocked) return blocked;
    const { code, comment } = (await request.json()) as { code?: string; comment?: string };
    const concept = SNOMED_CONCEPTS.find((item) => item.code === code);
    if (!concept) return fail(400, 'Select a SNOMED code');
    if (ticket.snomed_codes.some((item) => item.code === concept.code)) return fail(400, 'This code is already saved');
    const text = String(comment ?? '').trim();
    if (text.length > SNOMED_COMMENT_MAX) return fail(400, `Comment must be ${SNOMED_COMMENT_MAX} characters or fewer`);
    const saved: TicketSnomedCode = {
      id: mockId(`ticket-snomed:${ticket.id}:new`, Date.now()),
      ...concept,
      comment: text,
      created_at: new Date().toISOString(),
    };
    ticket.snomed_codes.unshift(saved);
    log(ticket.id, `SNOMED Code Added: ${concept.code}`);
    saveDb();
    return created(saved, 'SNOMED code added successfully');
  }),

  http.post(consultations(':ticketId/messages/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const ticket = findTicket(practiceId, String(params.ticketId));
    if (!ticket) return fail(404, 'Consultation not found');
    const blocked = editable(ticket);
    if (blocked) return blocked;
    const input = (await request.json()) as {
      body?: string;
      channels?: TicketMessageChannel[];
      reply_allowed?: boolean;
    };
    const text = String(input.body ?? '').trim();
    const channels = (input.channels ?? []).filter((channel) => CHANNELS.includes(channel));
    if (!text) return fail(400, 'Message is required');
    if (text.length > TICKET_MESSAGE_MAX) return fail(400, `Message must be ${TICKET_MESSAGE_MAX} characters or fewer`);
    if (!channels.length) return fail(400, 'Choose at least one way to send the message');
    // Nothing is sent in the demo: the message is only added to the conversation.
    const message: TicketMessage = {
      id: mockId(`ticket-message:${ticket.id}:new`, Date.now()),
      sender: 'STAFF',
      sender_name: actor().name,
      body: text,
      channels,
      reply_allowed: Boolean(input.reply_allowed),
      created_at: new Date().toISOString(),
    };
    ticket.messages.push(message);
    log(ticket.id, 'Message Sent to Patient');
    saveDb();
    return created(message, 'Message sent successfully');
  }),

  http.get(consultations(':ticketId/logs/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const ticket = findTicket(practiceId, String(params.ticketId));
    if (!ticket) return fail(404, 'Consultation not found');
    return ok(getDb().ticketLogs[ticket.id] ?? []);
  }),

  http.get(`*${CRM_API}/public/v1/snomed-codes/`, ({ request }) => {
    if (!getDb().session.signedIn) return unauthorized();
    const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase() ?? '';
    if (search.length < SNOMED_MIN_SEARCH) return ok([]);
    return ok(SNOMED_CONCEPTS.filter((item) => item.term.toLowerCase().includes(search) || item.code.includes(search)));
  }),
];
