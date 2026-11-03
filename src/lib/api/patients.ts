import { crmRequest } from './http';
import type {
  Paginated,
  Patient,
  PatientConsultation,
  PatientDetail,
  PatientInput,
  PatientListParams,
  PatientMessageChannel,
  PatientNote,
  RegistrationStatus,
  RegistrationType,
} from './types';

// The list path was captured (GET …/practices/{practiceId}/patients/?page&page_size); everything
// else follows the same `public/v1` pattern and is inferred (docs/plans/phase-5-practice-modules.md §1).
const base = (subAppId: string, practiceId: string) =>
  `/public/v1/sub-apps/${subAppId}/practices/${practiceId}/patients/`;
const one = (subAppId: string, practiceId: string, patientId: string) => `${base(subAppId, practiceId)}${patientId}/`;

export const patientsApi = {
  list: (subAppId: string, practiceId: string, params: PatientListParams, signal?: AbortSignal) =>
    crmRequest<Paginated<Patient>>(base(subAppId, practiceId), { query: { ...params }, signal }),
  get: (subAppId: string, practiceId: string, patientId: string, signal?: AbortSignal) =>
    crmRequest<PatientDetail>(one(subAppId, practiceId, patientId), { signal }),
  update: (subAppId: string, practiceId: string, patientId: string, input: PatientInput) =>
    crmRequest<PatientDetail>(one(subAppId, practiceId, patientId), { method: 'PATCH', body: input }),
  archive: (subAppId: string, practiceId: string, patientId: string) =>
    crmRequest<Patient>(`${one(subAppId, practiceId, patientId)}archive/`, { method: 'POST' }),
  deregister: (subAppId: string, practiceId: string, patientId: string, reason: string) =>
    crmRequest<PatientDetail>(`${one(subAppId, practiceId, patientId)}deregister/`, {
      method: 'POST',
      body: { reason },
    }),
  addNote: (subAppId: string, practiceId: string, patientId: string, text: string) =>
    crmRequest<PatientNote>(`${one(subAppId, practiceId, patientId)}notes/`, { method: 'POST', body: { text } }),
  deleteNote: (subAppId: string, practiceId: string, patientId: string, noteId: string) =>
    crmRequest<{ id: string }>(`${one(subAppId, practiceId, patientId)}notes/${noteId}/`, { method: 'DELETE' }),
  saveCallFeedback: (subAppId: string, practiceId: string, patientId: string, feedback: string) =>
    crmRequest<{ id: string }>(`${one(subAppId, practiceId, patientId)}call-feedback/`, {
      method: 'POST',
      body: { feedback },
    }),
  sendMessage: (
    subAppId: string,
    practiceId: string,
    patientId: string,
    input: { channel: PatientMessageChannel; body: string },
  ) => crmRequest<{ id: string }>(`${one(subAppId, practiceId, patientId)}messages/`, { method: 'POST', body: input }),
  consultations: (subAppId: string, practiceId: string, patientId: string, signal?: AbortSignal) =>
    crmRequest<PatientConsultation[]>(`${one(subAppId, practiceId, patientId)}consultations/`, { signal }),
};

export const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  EMERGENCY: 'Emergency',
  IMMEDIATELY_NECESSARY: 'Immediately Necessary',
  PRIVATE: 'Private',
  REGULAR: 'Regular',
  TEMPORARY: 'Temporary',
  DUMMY: 'Dummy',
  OTHER: 'Other',
  CONTRACEPTIVE_SERVICES: 'Contraceptive Services',
  MATERNITY_SERVICES: 'Maternity Services',
  CHILD_HEALTH_SERVICES: 'Child Health Services',
  WALK_IN: 'Walk-In',
  GYNAECOLOGY: 'Gynaecology',
  RHEUMATOLOGY: 'Rheumatology',
  DERMATOLOGY: 'Dermatology',
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PATIENT_REGISTERED_AND_CARER_CORRECT: 'Patient Registered and Carer Correct',
  PATIENT_REGISTERED_BUT_CARER_INCORRECT: 'Patient Registered but Carer Incorrect',
  NOT_KNOWN: 'Not Known',
  PATIENT_NOT_REGISTERED: 'Patient Not Registered',
};

export const SEX_AT_BIRTH_OPTIONS = ['Male', 'Female', 'Indeterminate', 'Not known'] as const;

export const patientName = (patient: Pick<Patient, 'first_name' | 'middle_name' | 'last_name'>) =>
  [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');

/** "9991234567" → "999 123 4567" (the captured display format). */
export const formatNhsNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : value;
};

/** Whole years between an ISO date of birth and today. */
export function ageFrom(dateOfBirth: string, today = new Date()) {
  const birth = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
