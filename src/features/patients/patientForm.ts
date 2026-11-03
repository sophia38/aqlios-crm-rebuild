import dayjs from 'dayjs';
import * as Yup from 'yup';
import type { PatientDetail, PatientInput } from '@/lib/api/types';

// Edit Details (docs/plans/phase-5-practice-modules.md §1b). The live edit form wasn't captured, so it
// uses the read-only card's fields, with checks for name, date of birth, phone and email.

export type YesNo = '' | 'YES' | 'NO';

export interface PatientFormValues {
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  sex_at_birth: string;
  ethnicity: string;
  phone_number: string;
  email: string;
  spoken_language: string;
  needs_interpreter: YesNo;
  interpreter_language: string;
  needs_transport: YesNo;
  street_address: string;
  address_line_2: string;
  city: string;
  post_code: string;
}

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
/** "+44" followed by 9–10 digits (spaces allowed), as on the practice forms. */
const UK_PHONE = /^\+44\s*(\d\s*){9,10}$/;
const isBlankPhone = (value?: string) => !value || value.replace(/[\s+]/g, '') === '44';

const toYesNo = (value: boolean | null): YesNo => (value === null ? '' : value ? 'YES' : 'NO');
const fromYesNo = (value: YesNo) => (value === '' ? null : value === 'YES');

export const yesNoLabel = (value: boolean | null) => (value === null ? '' : value ? 'Yes' : 'No');

export function patientFormValues(patient: PatientDetail): PatientFormValues {
  return {
    first_name: patient.first_name,
    middle_name: patient.middle_name,
    last_name: patient.last_name,
    date_of_birth: patient.date_of_birth,
    sex_at_birth: patient.sex_at_birth,
    ethnicity: patient.ethnicity,
    phone_number: patient.phone_number,
    email: patient.email,
    spoken_language: patient.spoken_language,
    needs_interpreter: toYesNo(patient.needs_interpreter),
    interpreter_language: patient.interpreter_language,
    needs_transport: toYesNo(patient.needs_transport),
    ...patient.address,
  };
}

export function patientFormInput(values: PatientFormValues): PatientInput {
  const trim = (value: string) => value.trim();
  return {
    first_name: trim(values.first_name),
    middle_name: trim(values.middle_name),
    last_name: trim(values.last_name),
    date_of_birth: values.date_of_birth,
    sex_at_birth: values.sex_at_birth,
    ethnicity: trim(values.ethnicity),
    phone_number: trim(values.phone_number),
    email: trim(values.email),
    spoken_language: trim(values.spoken_language),
    needs_interpreter: fromYesNo(values.needs_interpreter),
    interpreter_language: values.needs_interpreter === 'YES' ? trim(values.interpreter_language) : '',
    needs_transport: fromYesNo(values.needs_transport),
    address: {
      street_address: trim(values.street_address),
      address_line_2: trim(values.address_line_2),
      city: trim(values.city),
      post_code: trim(values.post_code).toUpperCase(),
    },
  };
}

export const patientFormSchema = Yup.object({
  first_name: Yup.string()
    .trim()
    .required('First name is required')
    .max(50, 'First name must be 50 characters or fewer'),
  middle_name: Yup.string().trim().max(50, 'Middle name must be 50 characters or fewer'),
  last_name: Yup.string().trim().required('Last name is required').max(50, 'Last name must be 50 characters or fewer'),
  date_of_birth: Yup.string()
    .required('Date of birth is required')
    .test('valid', 'Enter a valid date of birth', (value) => {
      const date = dayjs(value, 'YYYY-MM-DD', true);
      return date.isValid() && !date.isAfter(dayjs(), 'day') && date.year() >= 1900;
    }),
  sex_at_birth: Yup.string().required('Sex at birth is required'),
  ethnicity: Yup.string().trim().max(100),
  phone_number: Yup.string()
    .test('required', 'Phone number is required', (value) => !isBlankPhone(value))
    .test('format', 'Enter a valid UK phone number', (value) => isBlankPhone(value) || UK_PHONE.test(value ?? '')),
  email: Yup.string().trim().email('Enter a valid email'),
  spoken_language: Yup.string().trim().max(50),
  needs_interpreter: Yup.string(),
  interpreter_language: Yup.string()
    .trim()
    .when('needs_interpreter', {
      is: 'YES',
      then: (schema) => schema.required('Interpreter language is required'),
    }),
  needs_transport: Yup.string(),
  street_address: Yup.string().trim().max(100),
  address_line_2: Yup.string().trim().max(100),
  city: Yup.string().trim().max(50),
  post_code: Yup.string()
    .trim()
    .matches(UK_POSTCODE, { message: 'Enter a valid UK postcode', excludeEmptyString: true }),
});
