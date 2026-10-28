import type {
  AppointmentConfiguration,
  AppointmentTypeKey,
  OperatingHours,
  PracticeManager,
  PublicPractice,
  RotaGroup,
  SlaConfiguration,
} from '@/lib/api/types';
import { mockId } from './random';

// Fictional lookup data for the practice screens (docs/plans/phase-3-reference-screens.md, "Demo data added").

const MANAGER_NAMES = [
  'Amira Begum',
  'Ben Clarke',
  'Chloe Davies',
  'Daniel Evans',
  'Ella Foster',
  'Farhan Gill',
  'Grace Okafor',
  'Hannah Moss',
  'Isaac Hughes',
  'Jordan Hale',
  'Kavya Iyer',
  'Liam Carter',
  'Maya Jones',
  'Noah King',
  'Olivia Lewis',
  'Priya Nair',
  'Quinn Murphy',
  'Rhys Owen',
  'Sara Patel',
  'Tom Ellis',
  'Uma Quinn',
  'Victor Reid',
  'Willow Shaw',
  'Yusuf Taylor',
  'Zara Walsh',
];

export function buildPracticeManagers(): PracticeManager[] {
  return MANAGER_NAMES.map((name, index) => ({
    id: mockId('manager', index),
    full_name: name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@aqlios.demo`,
  })).sort((a, b) => a.full_name.localeCompare(b.full_name, 'en', { sensitivity: 'base' }));
}

const ODS_TOWNS = ['Leeds', 'Harrogate', 'Wakefield', 'Halifax', 'Ilkley', 'Otley', 'Skipton', 'Ripon'];
const ODS_KINDS = ['Road Practice', 'City Medical Practice', 'Health Centre', 'Family Doctors', 'Surgery'];

export function buildOdsDirectory(): PublicPractice[] {
  return ODS_TOWNS.flatMap((town, townIndex) =>
    ODS_KINDS.map((kind, kindIndex) => {
      const index = townIndex * ODS_KINDS.length + kindIndex;
      const lateStart = index % 3 === 0;
      return {
        name: `The ${town} ${kind}`,
        ods_code: `B8${String(2000 + index * 17).padStart(4, '0')}`,
        pcn_code: `U${String(10000 + index * 1931).slice(0, 5)}`,
        phone_number: `+44 1423 ${String(500000 + index * 1237).slice(0, 6)}`,
        website: `${town.toLowerCase()}${kind.toLowerCase().replace(/\s+/g, '')}.nhs.demo`,
        address_line_1: `${10 + index} ${town} Road`,
        postcode: `HG${(index % 9) + 1} ${(index % 8) + 1}AY`,
        opening_time: lateStart ? '09:00' : '08:00',
        closing_time: lateStart ? '17:00' : '18:30',
      };
    }),
  );
}

// The three captured rota group names are product configuration, not personal data.
export function buildRotaGroups(): RotaGroup[] {
  return ['Primary Rota Group', 'Duty Rosters', 'Croft Hall Rota Group'].map((name, index) => ({
    id: mockId('rota-group', index),
    name,
    status: 'ACTIVE',
  }));
}

export const APPOINTMENT_TYPE_KEYS: AppointmentTypeKey[] = [
  'FACE_TO_FACE_SURGERY',
  'TELEPHONE_OR_AUDIO',
  'FACE_TO_FACE_HOME_VISIT',
  'WRITTEN_INCLUDING_ONLINE',
  'ADMIN_WORK',
];

const WEEK: OperatingHours['day'][] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/** Configured practice: one default type, one slot duration. `null` config = never set up (incomplete). */
export function buildAppointmentConfiguration(clinicianRoleId: string): AppointmentConfiguration {
  return {
    appointment_types: APPOINTMENT_TYPE_KEYS.map((type) => ({
      type,
      enabled: type === 'FACE_TO_FACE_SURGERY' || type === 'ADMIN_WORK',
      is_default: type === 'FACE_TO_FACE_SURGERY',
      locked: type === 'ADMIN_WORK',
    })),
    slot_durations: [{ role_id: clinicianRoleId, appointment_type: 'FACE_TO_FACE_SURGERY', duration_minutes: 30 }],
    urgent_booking: 'BOTH',
    routine_booking: 'BOTH',
  };
}

/** A practice that hasn't been configured yet: no default type and no slot durations. */
export function emptyAppointmentConfiguration(): AppointmentConfiguration {
  return {
    appointment_types: APPOINTMENT_TYPE_KEYS.map((type) => ({
      type,
      enabled: type === 'ADMIN_WORK',
      is_default: false,
      locked: type === 'ADMIN_WORK',
    })),
    slot_durations: [],
    urgent_booking: 'BOTH',
    routine_booking: 'BOTH',
  };
}

export function buildSlaConfiguration(): SlaConfiguration {
  return {
    urgent_capacity: WEEK.map((day) => {
      const open = day !== 'SUNDAY' && day !== 'SATURDAY';
      return {
        day,
        opening_time: open ? '08:00' : null,
        closing_time: open ? '18:30' : null,
        practice_state: open ? 'OPEN' : 'CLOSED',
      };
    }),
    extra_appointments: 'SIGNPOST_TO_PHARMACY',
  };
}
