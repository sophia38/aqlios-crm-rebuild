import dayjs from 'dayjs';
import type {
  ComplianceStatus,
  DayKey,
  Practice,
  PracticeStaffStatus,
  PracticeStaffType,
  Role,
  StaffAccountDetails,
  StaffCompetencies,
  StaffDocument,
  StaffLeaveEntitlement,
  StaffPayroll,
} from '@/lib/api/types';
import { DEMO_PRACTICE_INDEXES } from './practices';
import { isoDaysAgo, mockId } from './random';

// Fictional Staff on-boarding demo data (docs/plans/phase-5-practice-modules.md §4). Details and
// documents aren't stored: they're worked out from the staff id, and the mock handlers store changes.

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

// ---------------------------------------------------------------- compliance documents

interface DocumentDefinition {
  name: string;
  required?: boolean;
  expiry?: boolean;
  reverification?: boolean;
}

/** The 9 captured document groups and names (docs/practice/05-staff-onboarding.md, Compliance tab). */
const DOCUMENT_GROUPS: [string, DocumentDefinition[]][] = [
  [
    'Identity & Personal Documents',
    [
      { name: 'Proof of address 1', required: true },
      { name: 'Proof of address 2', required: true },
      { name: 'Proof of Identity', required: true },
    ],
  ],
  [
    'CV & Employment History and References',
    [
      { name: 'CV (10-year history with gap explanations)' },
      { name: 'Reference 1 (Employment)', required: true },
      { name: 'Reference 2 (Clinical)', required: true },
    ],
  ],
  [
    'Qualifications',
    [
      { name: 'Medical Qualifications (degree certificates)' },
      { name: 'Certificate of Training (CCT/CEGPR/Foundation)' },
      { name: 'Registration Certificate', required: true, reverification: true },
      { name: 'National Performers List Confirmation', required: true, reverification: true },
    ],
  ],
  ['DBS and Compliance', [{ name: 'DBS Certificate', required: true }, { name: 'DBS Update Service Confirmation' }]],
  ['Indemnity & Insurance', [{ name: 'Indemnity Certificate', expiry: true }]],
  ['Occupational Health', [{ name: 'Immunisation Record (Hep B, MMR, Varicella, BCG, HIV, Hep C)' }]],
  [
    'Mandatory Clinical Training Certificates',
    [
      'BLS / CPR & AED',
      'Safeguarding Children – Level 3',
      'Safeguarding Adults – Level 3',
      'Infection Prevention & Control',
      'Fire Safety Awareness',
      'Health & Safety / Risk Assessment',
      'Information Governance',
      'Equality, Diversity & Human Rights',
      'Manual Handling',
      'Conflict Resolution / De-escalation',
      'Mental Capacity Act & DOLS',
      'Prevent',
      'Lone Working / Personal Safety',
    ].map((name) => ({ name, expiry: true })),
  ],
  [
    'Recommended Clinical Training Certificates',
    [
      'Anaphylaxis & Emergency Drugs',
      'Vaccination & Immunisation Updates',
      'Phlebotomy & Venepuncture',
      'Chronic Disease Management',
      'Wound Care & Dressings',
      'Prescribing Governance / Medicines Management',
      'Chaperone Training',
      'Sepsis Recognition & Management',
      'Mental Health Awareness / Suicide Prevention',
      'Resilience & Stress Management',
      'Cervical Screening Programme',
    ].map((name) => ({ name })),
  ],
];

const keyOf = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const DOCUMENT_CATALOG = DOCUMENT_GROUPS.flatMap(([group, items]) =>
  items.map((item) => ({
    key: keyOf(item.name),
    group,
    name: item.name,
    required: Boolean(item.required),
    has_expiry: Boolean(item.expiry),
    reverification: Boolean(item.reverification),
  })),
);

/** The CQC share of each overall status (as the phase 4 dashboard). */
const COMPLIANCE_SHARES: [ComplianceStatus, number][] = [
  ['ACTIVE', 45],
  ['PENDING_UPLOAD', 20],
  ['PENDING_VERIFICATION', 15],
  ['REVERIFICATION_DUE', 8],
  ['EXPIRED', 8],
  ['REJECTED', 4],
];

/** The overall status a person's seeded documents are built to give. */
export function complianceTarget(staffId: string): ComplianceStatus {
  let roll = hash(`compliance:${staffId}`) % 100;
  for (const [status, share] of COMPLIANCE_SHARES) {
    if (roll < share) return status;
    roll -= share;
  }
  return 'ACTIVE';
}

const fileName = (name: string) => `${keyOf(name)}.pdf`;
const day = (now: dayjs.Dayjs, offset: number) => now.add(offset, 'day').format('YYYY-MM-DD');

/**
 * Seeded documents. Invitees have uploaded nothing yet (live: 38 Pending Upload). Everyone else has
 * their required documents verified, except for the one problem that gives their CQC status.
 */
export function seedDocuments(staffId: string, invitee: boolean, now = dayjs()): StaffDocument[] {
  const target = invitee ? 'PENDING_UPLOAD' : complianceTarget(staffId);
  const pick = (candidates: string[]) => candidates[hash(`${staffId}:${target}`) % candidates.length];
  const required = DOCUMENT_CATALOG.filter((item) => item.required).map((item) => item.key);
  const expiring = DOCUMENT_CATALOG.filter((item) => item.has_expiry).map((item) => item.key);
  const reverified = DOCUMENT_CATALOG.filter((item) => item.reverification).map((item) => item.key);
  const problem =
    target === 'PENDING_UPLOAD' || target === 'PENDING_VERIFICATION' || target === 'REJECTED'
      ? pick(required)
      : target === 'EXPIRED'
        ? pick(expiring)
        : target === 'REVERIFICATION_DUE'
          ? pick(reverified)
          : null;

  return DOCUMENT_CATALOG.map((item, index) => {
    const roll = hash(`${staffId}:${item.key}`);
    const blank: StaffDocument = {
      ...item,
      file_name: null,
      added_at: null,
      issue_date: null,
      expiry_date: null,
      reverification_due: null,
      status: 'PENDING_UPLOAD',
      rejection_reason: null,
    };
    // Optional documents: about 1 in 3 not uploaded (they don't count towards compliance).
    if (invitee || (!item.required && !item.has_expiry && roll % 3 === 0)) return blank;
    const added = 30 + (roll % 300);
    const uploaded: StaffDocument = {
      ...blank,
      file_name: fileName(item.name),
      added_at: isoDaysAgo(added % 60),
      issue_date: day(now, -added),
      expiry_date: item.has_expiry ? day(now, 120 + (roll % 600)) : null,
      reverification_due: item.reverification ? day(now, 60 + (roll % 300)) : null,
      status: 'VERIFIED',
    };
    if (item.key !== problem) return uploaded;
    switch (target) {
      case 'PENDING_UPLOAD':
        return blank;
      case 'PENDING_VERIFICATION':
        return { ...uploaded, status: 'PENDING_VERIFICATION' };
      case 'REJECTED':
        return {
          ...uploaded,
          status: 'REJECTED',
          rejection_reason: 'The scan is unreadable. Please upload a clearer copy.',
        };
      case 'EXPIRED':
        return { ...uploaded, status: 'EXPIRED', expiry_date: day(now, -(5 + (index % 40))) };
      default:
        // Re-verification due within the month.
        return { ...uploaded, reverification_due: day(now, 3 + (roll % 20)) };
    }
  });
}

/**
 * One overall status from the documents, worst first, so the Compliance tab and the CQC dashboard
 * always agree. Only required and expiring documents count.
 */
export function overallCompliance(documents: StaffDocument[], now = dayjs()): ComplianceStatus {
  const counted = documents.filter((item) => item.required || (item.has_expiry && item.file_name));
  const has = (test: (item: StaffDocument) => boolean) => counted.some(test);
  if (has((item) => item.status === 'REJECTED')) return 'REJECTED';
  if (has((item) => item.status === 'EXPIRED')) return 'EXPIRED';
  if (
    has(
      (item) =>
        item.status === 'VERIFIED' &&
        Boolean(item.reverification_due) &&
        dayjs(item.reverification_due).diff(now, 'day') < 30,
    )
  ) {
    return 'REVERIFICATION_DUE';
  }
  if (has((item) => item.required && item.status === 'PENDING_UPLOAD')) return 'PENDING_UPLOAD';
  if (has((item) => item.status === 'PENDING_VERIFICATION')) return 'PENDING_VERIFICATION';
  return 'ACTIVE';
}

// ---------------------------------------------------------------- staff records

/** A person who is on a practice's staff list but not (yet) a user elsewhere in the demo. */
export interface StaffSeed {
  id: string;
  practice_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: string;
  staff_type: PracticeStaffType;
  status: PracticeStaffStatus;
  invited_at: string;
}

const FIRST = ['Amara', 'Ben', 'Chloe', 'Daniel', 'Ella', 'Finn', 'Grace', 'Hari', 'Isla', 'Jonah', 'Kemi', 'Leo'];
const LAST = ['Ashby', 'Bennett', 'Collins', 'Darby', 'Ellis', 'Fowler', 'Gill', 'Hale', 'Iqbal', 'Jarvis', 'Kaur'];

/** 22 per demo practice, spread over every status (Pending Invite most, as live). */
const SEED_STATUSES: PracticeStaffStatus[] = [
  'ACTIVE',
  'ACTIVE',
  'ACTIVE',
  'INACTIVE',
  'LOCKED',
  'PENDING_INVITE',
  'PENDING_INVITE',
  'PENDING_INVITE',
  'PENDING_INVITE',
  'PENDING_INVITE',
  'INVITATION_EXPIRED',
  'INVITATION_EXPIRED',
  'RESENT_INVITE',
  'RESENT_INVITE',
  'PENDING_PROFILE',
  'PENDING_PROFILE',
  'PENDING_PROFILE',
  'PENDING_APPROVAL',
  'PENDING_APPROVAL',
  'PENDING_APPROVAL',
  'REJECTED',
  'ACTIVE',
];

export const SEED_STAFF_PER_DEMO_PRACTICE = SEED_STATUSES.length;

const ROLE_BY_TYPE: Partial<Record<PracticeStaffType, string>> = {
  GP: 'Clinician',
  ACP: 'Clinician',
  FCP: 'Clinician',
  Physiotherapist: 'Clinician',
  ME: 'Clinician',
  Pharmacist: 'Clinician',
  Nurse: 'Nurse',
  NP: 'Nurse',
  ANP: 'Nurse',
  Reception: 'Care navigator',
  'Prescription clerk': 'Care navigator',
  Administrative: 'Practice Manager',
  'Pharmacist technician': 'Care navigator',
  MDT: 'Clinician',
  'Duty Team': 'Clinician',
};

export const roleForStaffType = (roles: Role[], type: PracticeStaffType) =>
  roles.find((role) => role.name === (ROLE_BY_TYPE[type] ?? 'Care navigator')) ?? roles[0];

export function buildStaffSeeds(
  practices: Practice[],
  roles: Role[],
  types: readonly PracticeStaffType[],
): StaffSeed[] {
  const seeds: StaffSeed[] = [];
  for (const practiceIndex of DEMO_PRACTICE_INDEXES) {
    const practice = practices[practiceIndex];
    if (!practice) continue;
    SEED_STATUSES.forEach((status, index) => {
      const n = practiceIndex * SEED_STATUSES.length + index;
      const first = FIRST[n % FIRST.length];
      const last = LAST[(n * 5) % LAST.length];
      const type = types[(n * 7) % types.length];
      seeds.push({
        id: mockId(`practice-staff:${practice.id}`, index),
        practice_id: practice.id,
        // Some invites were sent before a name was known (live shows the email first).
        first_name: status === 'PENDING_INVITE' && index % 2 === 0 ? '' : first,
        last_name: status === 'PENDING_INVITE' && index % 2 === 0 ? '' : last,
        email: `${first}.${last}${n}`.toLowerCase() + '@nhs.demo',
        phone: `+44 7700 9${String(10000 + n).slice(-5)}`,
        role_id: roleForStaffType(roles, type).id,
        staff_type: type,
        status,
        invited_at: isoDaysAgo(2 + ((n * 11) % 90)),
      });
    });
  }
  return seeds;
}

/** A staff type for someone from the phase 2 staff list, from their role. */
export function staffTypeForRole(roleName: string, staffId: string): PracticeStaffType {
  const options: Record<string, PracticeStaffType[]> = {
    Clinician: ['GP', 'GP', 'ACP', 'Pharmacist'],
    Nurse: ['Nurse', 'ANP'],
    'Practice Manager': ['Administrative'],
    'Care navigator': ['Reception'],
    HR: ['Administrative'],
  };
  const list = options[roleName] ?? ['Administrative'];
  return list[hash(staffId) % list.length];
}

export const phoneFor = (staffId: string) => `+44 7700 9${String(hash(staffId) % 100000).padStart(5, '0')}`;

// ---------------------------------------------------------------- tab defaults

const DAYS: DayKey[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const STREETS = ['High Street', 'Church Road', 'Station Road', 'Mill Lane', 'Park Avenue', 'Victoria Road'];
const TOWNS = ['Ashford', 'Canterbury', 'Maidstone', 'Folkestone', 'Dover'];

/** Account Details from what we know; empty fields for people who haven't finished their profile. */
export function defaultAccount(
  person: { id: string; first_name: string; last_name: string; email: string; phone: string },
  complete: boolean,
): StaffAccountDetails {
  const roll = hash(`account:${person.id}`);
  const weekday = { open: true, from: '09:00', to: '17:00' };
  const closed = { open: false, from: '', to: '' };
  return {
    first_name: person.first_name,
    last_name: person.last_name,
    email: person.email,
    phone: person.phone,
    date_of_birth: complete ? `19${70 + (roll % 25)}-${String(1 + (roll % 12)).padStart(2, '0')}-14` : '',
    spoken_language: complete ? 'English' : '',
    performers_list_number: complete ? `G${String(1000000 + (roll % 8999999))}` : '',
    registration_number: complete ? String(7000000 + (roll % 999999)) : '',
    ppa_id: complete ? `PPA${String(roll % 99999).padStart(5, '0')}` : '',
    smartcard_status: complete ? 'HAS_SMARTCARD' : '',
    smartcard_number: complete ? String(900000000000 + (roll % 99999999)) : '',
    ni_number: complete ? `QQ${String(roll % 1000000).padStart(6, '0')}C` : '',
    dbs_status: complete ? 'HAS_DBS' : '',
    dbs_number: complete ? String(1000000000 + (roll % 999999999)).padStart(12, '0') : '',
    dbs_issue_date: complete
      ? dayjs()
          .subtract(1 + (roll % 3), 'year')
          .format('YYYY-MM-DD')
      : '',
    dbs_level: complete ? 'ENHANCED' : '',
    dbs_update_service: complete ? (roll % 2 ? 'YES' : 'NO') : '',
    address_line_1: complete ? `${1 + (roll % 120)} ${STREETS[roll % STREETS.length]}` : '',
    address_line_2: '',
    city: complete ? TOWNS[roll % TOWNS.length] : '',
    postcode: complete ? `TN2${roll % 10} ${1 + (roll % 9)}AB` : '',
    emergency_contacts: [],
    rota_group_ids: [],
    contract_start: complete
      ? dayjs()
          .subtract(1 + (roll % 6), 'year')
          .format('YYYY-MM-DD')
      : '',
    contract_end: '',
    ongoing_sla: complete,
    contract_type: complete ? (roll % 4 === 3 ? 'LOCUM' : 'SALARIED') : '',
    duty_types: complete && roll % 4 === 3 ? ['AM_SESSION', 'PM_SESSION'] : [],
    availability: Object.fromEntries(
      DAYS.map((key) => [key, complete && key !== 'SUNDAY' && key !== 'SATURDAY' ? weekday : closed]),
    ) as StaffAccountDetails['availability'],
    employment_start: '',
    employment_end: '',
    leaving_reason: '',
  };
}

/** 5.6 weeks of 7.5-hour days (statutory minimum, including bank holidays), and 5 sick days. */
export function defaultLeave(): StaffLeaveEntitlement {
  return { annual_hours: 210, sick_hours: 37.5, other: [] };
}

export function defaultCompetencies(roleName: string, staffType: string): StaffCompetencies {
  return { inbox: roleName, staff_type: staffType, age_groups: ['16-44', '45+'], items: [] };
}

export function defaultPayroll(): StaffPayroll {
  return {
    documents: (['P45', 'HMRC_STARTER_CHECKLIST', 'TAX_CODE_UPDATE'] as const).map((type) => ({
      type,
      file_name: null,
      added_at: null,
      verified_at: null,
      added_by: null,
      status: 'PENDING_UPLOAD' as const,
    })),
    pension: '',
    deduction_amount: '',
    deduction_reason: '',
    deduction_end: '',
    payment_amount: '',
    payment_reason: '',
    payment_end: '',
  };
}
