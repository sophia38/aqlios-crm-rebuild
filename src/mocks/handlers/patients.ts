import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import {
  REGISTRATION_STATUSES,
  REGISTRATION_TYPES,
  type PatientDetail,
  type PatientInput,
  type PatientMessageChannel,
  type PatientNote,
} from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import { currentPersona, getDb, saveDb, visiblePractices } from '../store';
import { created, fail, forbidden, ok, paginate, unauthorized } from '../respond';

// Patient mocks (docs/plans/phase-5-practice-modules.md §1). Only the list path was captured.

const patients = (path = '') => `*${CRM_API}/public/v1/sub-apps/:subAppId/practices/:practiceId/patients/${path}`;

const NOTE_MAX = 1000;
const FEEDBACK_MAX = 1000;
const MESSAGE_MAX = 2000;
const REASON_MAX = 300;

function guard(practiceId: string) {
  if (!getDb().session.signedIn) return unauthorized();
  if (!visiblePractices().some((practice) => practice.id === practiceId)) return forbidden();
  return null;
}

function findPatient(practiceId: string, patientId: string) {
  return getDb().patients.find((patient) => patient.id === patientId && patient.practice_id === practiceId);
}

function detail(patientId: string): PatientDetail {
  const db = getDb();
  const patient = db.patients.find((item) => item.id === patientId)!;
  return { ...patient, notes: db.patientNotes[patientId] ?? [], health_records: db.healthRecords[patientId] ?? [] };
}

const digits = (value: string) => value.replace(/\D/g, '');

function validate(input: PatientInput) {
  const errors: { field: string; message: string }[] = [];
  const blank = (key: keyof PatientInput) => key in input && !String(input[key] ?? '').trim();
  if (blank('first_name')) errors.push({ field: 'first_name', message: 'First name is required' });
  if (blank('last_name')) errors.push({ field: 'last_name', message: 'Last name is required' });
  if (blank('date_of_birth')) errors.push({ field: 'date_of_birth', message: 'Date of birth is required' });
  if ('phone_number' in input && digits(input.phone_number ?? '').length < 11) {
    errors.push({ field: 'phone_number', message: 'Enter a valid UK phone number' });
  }
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push({ field: 'email', message: 'Enter a valid email' });
  }
  if ('nhs_number' in input && input.nhs_number && digits(input.nhs_number).length !== 10) {
    errors.push({ field: 'nhs_number', message: 'NHS number must be 10 digits' });
  }
  if (input.registration_type && !REGISTRATION_TYPES.includes(input.registration_type)) {
    errors.push({ field: 'registration_type', message: 'Registration type is not valid' });
  }
  if (input.registration_status && !REGISTRATION_STATUSES.includes(input.registration_status)) {
    errors.push({ field: 'registration_status', message: 'Registration status is not valid' });
  }
  return errors;
}

const authorName = () => {
  const persona = currentPersona();
  return `${persona.firstName} ${persona.lastName}`;
};

export const patientHandlers = [
  http.get(patients(), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const search = query.get('search')?.trim().toLowerCase();
    const searchDigits = search ? digits(search) : '';
    const type = query.get('registration_type');
    const date = query.get('registration_date');
    const results = getDb()
      .patients.filter((patient) => patient.practice_id === practiceId && !patient.archived)
      .filter((patient) => !type || patient.registration_type === type)
      .filter((patient) => !date || patient.registered_at.slice(0, 10) === date)
      .filter((patient) => {
        if (!search) return true;
        const name = `${patient.first_name} ${patient.middle_name} ${patient.last_name}`.toLowerCase();
        return (
          name.includes(search) ||
          patient.email.toLowerCase().includes(search) ||
          (searchDigits.length >= 3 &&
            (patient.nhs_number.includes(searchDigits) || digits(patient.phone_number).includes(searchDigits)))
        );
      })
      .sort((a, b) => b.registered_at.localeCompare(a.registered_at));
    return ok(paginate(request, results));
  }),

  http.get(patients(':patientId/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const patient = findPatient(practiceId, String(params.patientId));
    if (!patient) return fail(404, 'Patient not found');
    return ok(detail(patient.id));
  }),

  http.patch(patients(':patientId/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const patient = findPatient(practiceId, String(params.patientId));
    if (!patient) return fail(404, 'Patient not found');
    if (patient.archived) return fail(400, 'Archived patients cannot be changed');
    const input = (await request.json()) as PatientInput;
    const errors = validate(input);
    if (errors.length) return fail(400, errors[0].message, errors);
    Object.assign(patient, input, input.nhs_number !== undefined ? { nhs_number: digits(input.nhs_number) } : {});
    if (input.registration_status && input.registration_status !== 'PATIENT_NOT_REGISTERED') {
      patient.deregistration_reason = null;
    }
    saveDb();
    return ok(detail(patient.id), 'Patient updated successfully');
  }),

  http.post(patients(':patientId/archive/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const patient = findPatient(practiceId, String(params.patientId));
    if (!patient) return fail(404, 'Patient not found');
    patient.archived = true;
    saveDb();
    return ok(patient, 'Patient archived successfully');
  }),

  http.post(patients(':patientId/deregister/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const patient = findPatient(practiceId, String(params.patientId));
    if (!patient) return fail(404, 'Patient not found');
    const { reason } = (await request.json()) as { reason?: string };
    const text = String(reason ?? '').trim();
    if (!text) return fail(400, 'Reason is required', [{ field: 'reason', message: 'Reason is required' }]);
    if (text.length > REASON_MAX) return fail(400, `Reason must be ${REASON_MAX} characters or fewer`);
    patient.registration_status = 'PATIENT_NOT_REGISTERED';
    patient.deregistration_reason = text;
    saveDb();
    return ok(detail(patient.id), 'Patient deregistered successfully');
  }),

  http.post(patients(':patientId/notes/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const patient = findPatient(practiceId, String(params.patientId));
    if (!patient) return fail(404, 'Patient not found');
    const { text } = (await request.json()) as { text?: string };
    const body = String(text ?? '').trim();
    if (!body) return fail(400, 'Note is required');
    if (body.length > NOTE_MAX) return fail(400, `Note must be ${NOTE_MAX} characters or fewer`);
    const db = getDb();
    const list = (db.patientNotes[patient.id] ??= []);
    const note: PatientNote = {
      id: mockId(`patient-note:${patient.id}:new`, Date.now()),
      text: body,
      added_by_name: authorName(),
      created_at: new Date().toISOString(),
    };
    list.unshift(note);
    saveDb();
    return created(note, 'Note added successfully');
  }),

  http.delete(patients(':patientId/notes/:noteId/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const patient = findPatient(practiceId, String(params.patientId));
    if (!patient) return fail(404, 'Patient not found');
    const db = getDb();
    const list = db.patientNotes[patient.id] ?? [];
    const index = list.findIndex((note) => note.id === params.noteId);
    if (index < 0) return fail(404, 'Note not found');
    list.splice(index, 1);
    saveDb();
    return ok({ id: String(params.noteId) }, 'Note deleted successfully');
  }),

  http.post(patients(':patientId/call-feedback/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    if (!findPatient(practiceId, String(params.patientId))) return fail(404, 'Patient not found');
    const { feedback } = (await request.json()) as { feedback?: string };
    const text = String(feedback ?? '').trim();
    if (!text) return fail(400, 'Feedback is required');
    if (text.length > FEEDBACK_MAX) return fail(400, `Feedback must be ${FEEDBACK_MAX} characters or fewer`);
    return created({ id: mockId('call-feedback', Date.now()) }, 'Feedback saved successfully');
  }),

  http.post(patients(':patientId/messages/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const patient = findPatient(practiceId, String(params.patientId));
    if (!patient) return fail(404, 'Patient not found');
    const { channel, body } = (await request.json()) as { channel?: PatientMessageChannel; body?: string };
    const text = String(body ?? '').trim();
    if (channel !== 'SMS' && channel !== 'EMAIL') return fail(400, 'Channel is not valid');
    if (channel === 'EMAIL' && !patient.email) return fail(400, 'The patient has no email address');
    if (!text) return fail(400, 'Message is required');
    if (text.length > MESSAGE_MAX) return fail(400, `Message must be ${MESSAGE_MAX} characters or fewer`);
    // Nothing is sent in the demo: the message is accepted and dropped.
    return created({ id: mockId('patient-message', Date.now()) }, 'Message sent successfully');
  }),

  // Live reads these from the clinical system (the call never returned in the capture). Tickets
  // (phase 5, module 2) fill this in; until then every patient has none.
  http.get(patients(':patientId/consultations/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    if (!findPatient(practiceId, String(params.patientId))) return fail(404, 'Patient not found');
    return ok([]);
  }),
];
