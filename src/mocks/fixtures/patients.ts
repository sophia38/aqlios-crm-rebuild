import {
  REGISTRATION_STATUSES,
  REGISTRATION_TYPES,
  type HealthRecordFile,
  type Patient,
  type PatientCarer,
  type PatientNote,
  type Practice,
} from '@/lib/api/types';
import { DEMO_PRACTICE_INDEXES } from './practices';
import { createRandom, isoDaysAgo, mockId, type Random } from './random';

// Fictional patients for the 3 demo practices (docs/plans/phase-5-practice-modules.md §1). NHS numbers
// use the 999 test range, phone numbers the Ofcom drama range (07700 900xxx) and emails example.com,
// so nothing can reach a real person. The other practices have no patients (live empty state).

export const PATIENTS_PER_DEMO_PRACTICE = 40;

// Alternates female, male (even indexes are female), so the sex at birth follows the name.
const FIRST_NAMES = [
  'Amelia',
  'Oliver',
  'Isla',
  'George',
  'Ava',
  'Noah',
  'Freya',
  'Arthur',
  'Ivy',
  'Leo',
  'Florence',
  'Oscar',
  'Willow',
  'Harry',
  'Rosie',
  'Jack',
  'Sophia',
  'Theo',
  'Evie',
  'Alfie',
  'Poppy',
  'Finley',
  'Ruby',
  'Hamza',
  'Aisha',
  'Mohammed',
  'Zara',
  'Rohan',
  'Priya',
  'Kofi',
  'Amara',
  'Tomasz',
  'Lena',
  'Callum',
  'Niamh',
  'Rhys',
] as const;
const MIDDLE_NAMES = {
  Female: ['', '', 'Grace', '', 'Rose', 'Marie', '', 'Ann'],
  Male: ['', 'James', '', 'Lee', '', 'John', '', 'Ali'],
} as const;
const LAST_NAMES = [
  'Ashworth',
  'Bramley',
  'Calloway',
  'Dunmore',
  'Ellison',
  'Fairbairn',
  'Gladwell',
  'Hartigan',
  'Ingram',
  'Jessop',
  'Kendrick',
  'Lowther',
  'Merriman',
  'Northcott',
  'Oakes',
  'Pemberton',
  'Quinlan',
  'Radley',
  'Stanworth',
  'Thackeray',
  'Underwood',
  'Vance',
  'Whitlock',
  'Yeoman',
  'Akhtar',
  'Begum',
  'Chaudhry',
  'Mensah',
  'Nowak',
  'Okafor',
  'Patel',
  'Rahman',
] as const;
const ETHNICITIES = [
  'White - British',
  'White - Irish',
  'Asian or Asian British - Pakistani',
  'Asian or Asian British - Indian',
  'Asian or Asian British - Bangladeshi',
  'Black or Black British - African',
  'Black or Black British - Caribbean',
  'Mixed - White and Asian',
  'Other ethnic group',
  'Not stated',
] as const;
const LANGUAGES = [
  'English',
  'English',
  'English',
  'English',
  'Urdu',
  'Polish',
  'Punjabi',
  'Bengali',
  'Arabic',
] as const;
const STREETS = [
  'Acacia Avenue',
  'Beech Grove',
  'Chestnut Close',
  'Dale Road',
  'Elm Street',
  'Foxglove Way',
  'Garden Terrace',
  'Hazel Court',
  'Ivy Lane',
  'Juniper Drive',
  'Larch Crescent',
  'Maple Walk',
  'Nursery Lane',
  'Orchard Rise',
] as const;
const CITIES = ['Leeds', 'Bradford', 'York', 'Wakefield', 'Harrogate', 'Huddersfield'] as const;
const POSTCODE_AREAS = ['LS6', 'LS8', 'BD9', 'YO10', 'WF1', 'HG2', 'HD3'] as const;
const RELATIONSHIPS = ['Parent', 'Spouse or partner', 'Son or daughter', 'Sibling', 'Guardian', 'Friend'] as const;
const STAFF_AUTHORS = ['Dr Hannah Whitcombe', 'Daniel Okoro', 'Sarah Lindqvist', 'Imran Siddiqui'] as const;
const NOTE_TEXTS = [
  'Prefers phone calls after 3pm. Works early shifts.',
  'Asked for repeat prescriptions to be sent to the pharmacy on the high street.',
  'Hard of hearing in the left ear. Speak clearly and face the patient.',
  'Moved address recently; confirm details at the next contact.',
  'Carer handles all appointment bookings. Contact the carer first.',
  'Needs a longer appointment slot for annual review.',
] as const;
const RECORD_NAMES = [
  'Discharge summary',
  'Blood test results',
  'Referral letter',
  'Vaccination record',
  'Hospital clinic letter',
  'ECG report',
] as const;

const pad = (value: number, length: number) => String(value).padStart(length, '0');

function nhsNumber(practiceIndex: number, index: number) {
  return `999${pad(practiceIndex, 2)}${pad(index * 37 + 11, 5).slice(-5)}`;
}

function phone(random: Random) {
  return `+44 7700 900${pad(random.int(0, 999), 3)}`;
}

function birthDate(random: Random, minAge: number, maxAge: number) {
  const year = 2026 - random.int(minAge, maxAge);
  return `${year}-${pad(random.int(1, 12), 2)}-${pad(random.int(1, 28), 2)}`;
}

function carerFor(random: Random, lastName: string, address: string): PatientCarer {
  const nameIndex = random.int(0, FIRST_NAMES.length - 1);
  const first = FIRST_NAMES[nameIndex];
  return {
    first_name: first,
    middle_name: '',
    last_name: random.bool(0.6) ? lastName : random.pick(LAST_NAMES),
    date_of_birth: birthDate(random, 25, 70),
    sex_at_birth: nameIndex % 2 === 0 ? 'Female' : 'Male',
    ethnicity: random.pick(ETHNICITIES),
    nhs_number: `999${pad(random.int(0, 9999999), 7)}`,
    address,
    relationship: random.pick(RELATIONSHIPS),
    phone_number: phone(random),
    email: `${first.toLowerCase()}.carer${random.int(1, 99)}@example.com`,
    verified: random.bool(0.7),
  };
}

export interface PatientSeed {
  patients: Patient[];
  notes: Record<string, PatientNote[]>;
  healthRecords: Record<string, HealthRecordFile[]>;
}

export function buildPatients(practices: Practice[]): PatientSeed {
  const patients: Patient[] = [];
  const notes: Record<string, PatientNote[]> = {};
  const healthRecords: Record<string, HealthRecordFile[]> = {};

  for (const practiceIndex of DEMO_PRACTICE_INDEXES) {
    const practice = practices[practiceIndex];
    if (!practice) continue;
    const random = createRandom(7000 + practiceIndex);
    for (let index = 0; index < PATIENTS_PER_DEMO_PRACTICE; index++) {
      const id = mockId(`patient:${practiceIndex}`, index);
      const nameIndex = (index * 7 + practiceIndex * 3) % FIRST_NAMES.length;
      const first = FIRST_NAMES[nameIndex];
      const sex = nameIndex % 2 === 0 ? 'Female' : 'Male';
      const last = LAST_NAMES[(index * 5 + practiceIndex) % LAST_NAMES.length];
      // Children and older patients are the ones with carers.
      const child = index % 6 === 0;
      const elderly = index % 9 === 4;
      const street = `${random.int(1, 140)} ${random.pick(STREETS)}`;
      const city = random.pick(CITIES);
      const postCode = `${random.pick(POSTCODE_AREAS)} ${random.int(1, 9)}${random.pick(['AB', 'DE', 'HN', 'PQ', 'RT', 'WX'])}`;
      const language = random.pick(LANGUAGES);
      const hasCarer = child || elderly || index % 11 === 3;
      // Cycle the types and statuses so every option shows up in each practice.
      const registrationType = REGISTRATION_TYPES[(index + practiceIndex) % REGISTRATION_TYPES.length];
      const registrationStatus = hasCarer
        ? REGISTRATION_STATUSES[index % 2]
        : REGISTRATION_STATUSES[[0, 0, 0, 2, 3][index % 5]];
      patients.push({
        id,
        practice_id: practice.id,
        first_name: first,
        middle_name: MIDDLE_NAMES[sex][index % MIDDLE_NAMES[sex].length],
        last_name: last,
        nhs_number: nhsNumber(practiceIndex, index),
        date_of_birth: child
          ? birthDate(random, 1, 15)
          : elderly
            ? birthDate(random, 75, 94)
            : birthDate(random, 18, 72),
        sex_at_birth: sex,
        ethnicity: random.pick(ETHNICITIES),
        phone_number: phone(random),
        email: random.bool(0.85) ? `${first}.${last}${index}`.toLowerCase() + '@example.com' : '',
        spoken_language: language,
        needs_interpreter: language === 'English' ? false : random.bool(0.6),
        interpreter_language: language === 'English' ? '' : language,
        needs_transport: elderly ? true : random.bool(0.1),
        address: { street_address: street, address_line_2: '', city, post_code: postCode },
        registration_type: registrationType,
        registration_status: registrationStatus,
        registered_at: isoDaysAgo(index * 9 + practiceIndex * 2, 10),
        carer: hasCarer ? carerFor(random, last, `${street}, ${city} ${postCode}`) : null,
        synced_with_clinical_system: false,
        archived: false,
        deregistration_reason:
          registrationStatus === 'PATIENT_NOT_REGISTERED' ? 'Moved out of the practice area' : null,
      });
      notes[id] =
        index % 4 === 0
          ? Array.from({ length: 1 + (index % 3) }, (_, noteIndex) => ({
              id: mockId(`patient-note:${id}`, noteIndex),
              text: NOTE_TEXTS[(index + noteIndex) % NOTE_TEXTS.length],
              added_by_name: STAFF_AUTHORS[(index + noteIndex) % STAFF_AUTHORS.length],
              created_at: isoDaysAgo(noteIndex * 12 + 2, 9 + noteIndex),
            }))
          : [];
      healthRecords[id] =
        index % 3 === 0
          ? Array.from({ length: 1 + (index % 4) }, (_, fileIndex) => {
              const name = RECORD_NAMES[(index + fileIndex) % RECORD_NAMES.length];
              return {
                id: mockId(`health-record:${id}`, fileIndex),
                file_name: `${name} - ${first} ${last}.pdf`,
                file_type: 'PDF',
                size_kb: random.int(80, 2400),
                date_added: isoDaysAgo(fileIndex * 30 + index, 11),
              };
            })
          : [];
    }
  }
  return { patients, notes, healthRecords };
}
