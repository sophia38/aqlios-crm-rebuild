import type {
  Competency,
  DaySchedule,
  GlobalAppointmentConfiguration,
  GlobalPracticeConfiguration,
  Pathway,
  Role,
} from '@/lib/api/types';
import type { StaffMember } from './users';
import { isoDaysAgo, mockId } from './random';

// Fictional Settings seed (docs/super-admin/09-settings.md). Values follow the capture, except the
// test-looking ones (799 hours/days, "Furqan…" roles), which become realistic values.

const WEEK: DaySchedule['day'][] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const weekdays = (from: string, to: string, weekendFrom = '09:00', weekendTo = '17:00'): DaySchedule[] =>
  WEEK.map((day) => {
    const weekend = day === 'SATURDAY' || day === 'SUNDAY';
    return {
      day,
      is_open: !weekend,
      opening_time: weekend ? weekendFrom : from,
      closing_time: weekend ? weekendTo : to,
    };
  });

export function buildGlobalPracticeConfiguration(roles: Role[]): GlobalPracticeConfiguration {
  const clinician = roles.find((role) => role.name === 'Clinician') ?? roles[0];
  return {
    appointment_types: [
      { type: 'FACE_TO_FACE', enabled: false, is_default: false },
      { type: 'CALL', enabled: true, is_default: true },
    ],
    slot_durations: [{ role_id: clinician.id, appointment_type: 'FACE_TO_FACE', duration_minutes: 30 }],
    urgent_booking: 'BOTH',
    routine_booking: 'BOTH',
    operating_hours: weekdays('09:00', '18:00'),
    closed_message_clinical:
      'The practice is currently closed. If you need urgent medical help, please call 111. In an emergency, call 999.',
    closed_message_non_clinical:
      'The practice is currently closed. We will reply to your request on the next working day.',
  };
}

export function buildGlobalAppointmentConfiguration(
  roles: Role[],
  staff: StaffMember[],
): GlobalAppointmentConfiguration {
  const clinician = roles.find((role) => role.name === 'Clinician') ?? roles[0];
  const clinicians = staff.filter((member) => member.role_id === clinician.id);
  return {
    offered_slot_hours: 72,
    sms_reminder: 'BEFORE_48H',
    email_reminder: 'BEFORE_48H',
    min_cancellation_hours: 24,
    min_reschedule_hours: 24,
    enable_video_appointments: true,
    notify_staff_on_cancel: true,
    show_clinician_name: true,
    reopen_cancelled_slot: true,
    max_advance_booking_days: 28,
    same_day_booking: false,
    urgent_booking: 'ADMIN_STAFF',
    routine_booking: 'ADMIN_STAFF',
    require_manager_approval: true,
    urgent_capacity: weekdays('08:00', '10:00'),
    extra_appointments: 'CREATE_SAME_DAY_APPOINTMENTS',
    additional_slots: [
      {
        role_id: clinician.id,
        appointment_type: 'TELEPHONE_AUDIO',
        staff_id: clinicians[0]?.id ?? '',
        start_time: '17:00',
        end_time: '18:30',
      },
      {
        role_id: clinician.id,
        appointment_type: 'ONLINE_VIDEO',
        staff_id: clinicians[1]?.id ?? '',
        start_time: '08:00',
        end_time: '09:00',
      },
    ],
  };
}

export function buildCompetencies(roles: Role[]): Competency[] {
  const byName = (name: string) => roles.find((role) => role.name === name) ?? roles[0];
  const rows: [string, string, string[], number, string[], number, number][] = [
    ['Minor Illness', 'Coughs, colds and other self-limiting conditions.', ['Nurse'], 30, ['Coughs and colds'], 0, 23],
    [
      'Chronic Disease Review',
      'Annual reviews for patients with long-term conditions.',
      ['HR', 'Nurse', 'Clinician'],
      30,
      ['Asthma', 'Diabetes', 'COPD'],
      1,
      26,
    ],
    ['ENT', 'Ear, nose and throat problems.', ['Clinician'], 30, ['Throat', 'Nose', 'Ear'], 4, 77],
  ];
  return rows.map(([name, description, roleNames, minutes, subTypes, staffAssigned, daysAgo], index) => ({
    id: mockId('competency', index),
    name,
    description,
    role_ids: roleNames.map((roleName) => byName(roleName).id),
    role_names: roleNames,
    slot_duration_minutes: minutes,
    sub_types: subTypes,
    staff_assigned: staffAssigned,
    created_at: isoDaysAgo(daysAgo),
  }));
}

/** [specialty, active count, pathway names]; the Administrative group uses the five captured rows. */
const SPECIALTIES: [string, string[]][] = [
  [
    'Administrative and Non-Clinical',
    [
      'Ongoing or Longstanding Issue Follow-up with a Specific Clinician Assessment',
      'Medication Query Assessment',
      'Covid Vaccine',
      'Death Process',
      'Home Visit Request',
    ],
  ],
  [
    'Cardiovascular and Metabolic',
    [
      'Blood Pressure Check',
      'Chest Pain',
      'Palpitations',
      'Diabetes Review',
      'Cholesterol Results',
      'Thyroid Problems',
      'Weight Management',
    ],
  ],
  ['Dermatology', ['Rash', 'Mole Check', 'Acne']],
  ['Ear, Nose and Throat', ['Sore Throat', 'Earache', 'Sinus Problems', 'Hearing Loss', 'Nosebleeds']],
  [
    'Gastrointestinal',
    ['Abdominal Pain', 'Diarrhoea', 'Constipation', 'Heartburn and Reflux', 'Nausea and Vomiting', 'Rectal Bleeding'],
  ],
  ['Long-Term Conditions, Frailty and Complex Care', ['Frailty Review']],
  ["Men's Health", ['Prostate Symptoms']],
  ['Mental Health and Neurology', ['Low Mood', 'Anxiety', 'Headache', 'Sleep Problems']],
  ['Musculoskeletal', ['Back Pain', 'Knee Pain', 'Shoulder Pain', 'Neck Pain', 'Hip Pain', 'Sprains and Strains']],
  ['Ophthalmology', ['Red Eye']],
  ['Paediatric and Child Health', ['Child Fever']],
  ['Respiratory', ['Cough', 'Asthma Review', 'Shortness of Breath', 'Chest Infection']],
  ["Women's Health", ['Contraception', 'Menopause', 'Period Problems', 'Urinary Tract Infection', 'Pregnancy Advice']],
];

/** Which rows are Active, matching the captured "N of M active" counts (7 in all). */
const ACTIVE = new Set([
  'Medication Query Assessment',
  'Home Visit Request',
  'Rash',
  'Sore Throat',
  'Low Mood',
  'Cough',
  'Contraception',
]);

/** Captured Administrative rows that aren't Active. */
const CAPTURED_STATUS: Record<string, Pathway['status']> = {
  'Ongoing or Longstanding Issue Follow-up with a Specific Clinician Assessment': 'DRAFT',
  'Covid Vaccine': 'ARCHIVED',
  'Death Process': 'DRAFT',
};

const PRACTICE_ROUTED = new Set(['Covid Vaccine', 'Home Visit Request', 'Rash', 'Contraception']);

export function buildPathways(): Pathway[] {
  let index = 0;
  return SPECIALTIES.flatMap(([specialty, names]) =>
    names.map((name) => {
      const status: Pathway['status'] = ACTIVE.has(name)
        ? 'ACTIVE'
        : (CAPTURED_STATUS[name] ?? (index % 5 === 0 ? 'ARCHIVED' : 'DRAFT'));
      const active = status === 'ACTIVE';
      const id = mockId('pathway', index);
      index += 1;
      return {
        id,
        name,
        specialty,
        type: specialty === 'Administrative and Non-Clinical' ? ('ADMINISTRATIVE' as const) : ('CLINICAL' as const),
        status,
        routing: PRACTICE_ROUTED.has(name) ? ('PRACTICE' as const) : ('HUB' as const),
        channels: {
          // Captured: Medication Query Assessment has Mobile App off.
          mobile_app: active && name !== 'Medication Query Assessment',
          web_app: active,
          voice_agent: active && index % 2 === 0,
          website: active,
          care_navigator: active,
        },
      };
    }),
  );
}
