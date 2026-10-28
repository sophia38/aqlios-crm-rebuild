import * as Yup from 'yup';
import type {
  AppointmentConfiguration,
  AppointmentTypeKey,
  BookingChannel,
  ExtraAppointments,
  OperatingHours,
  PointOfContact,
  Practice,
  PracticeInput,
  PublicPractice,
  SlaConfiguration,
  WorkforceAllocation,
} from '@/lib/api/types';
import type { DayHours } from '@/components/forms/OperatingHoursRow';

// Shared model, defaults and validation for Onboard New Practice and the practice profile
// (docs/super-admin/03-onboard-new-practice.md, 04-practice-profile.md). Required-field messages
// are the ones captured live; the format checks are rebuild additions approved in the phase 3 plan.

export type Day = OperatingHours['day'];

/** Display order: Sunday first, as in the live form. */
export const DAYS: { key: Day; label: string }[] = [
  { key: 'SUNDAY', label: 'Sunday' },
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
];

export type WeekHours = Record<Day, DayHours>;

export const STAFF_TYPES = [
  'GP',
  'ACP',
  'FCP',
  'Physiotherapist',
  'ME',
  'Nurse',
  'NP',
  'ANP',
  'Pharmacist',
  'Pharmacist technician',
  'Prescription clerk',
  'Reception',
  'Administrative',
  'MDT',
  'Duty Team',
];

export const FREQUENCIES: { value: WorkforceAllocation['frequency']; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentTypeKey, string> = {
  FACE_TO_FACE_SURGERY: 'Face To Face Surgery',
  TELEPHONE_OR_AUDIO: 'Telephone Or Audio',
  FACE_TO_FACE_HOME_VISIT: 'Face To Face Home Visit',
  WRITTEN_INCLUDING_ONLINE: 'Written Including Online',
  ADMIN_WORK: 'Admin Work',
};

/** One list for both Urgent and Routine (approved fix: the live Urgent list mislabels its values). */
export const BOOKING_CHANNELS: { value: BookingChannel; label: string }[] = [
  { value: 'BOTH', label: 'Both' },
  { value: 'ADMIN_STAFF', label: 'Admin Staff' },
  { value: 'AI_VOICE_AGENT', label: 'AI Voice Agent' },
];

export const EXTRA_APPOINTMENTS: { value: ExtraAppointments; label: string }[] = [
  { value: 'SIGNPOST_TO_PHARMACY', label: 'Signposting to Pharmacy' },
  { value: 'REDIRECT_OOH_CLINIC', label: 'Redirecting to Out of Hours Clinic' },
  { value: 'REDIRECT_NHS_111', label: 'Redirecting to NHS 111' },
  { value: 'FORWARD_TO_AE', label: 'Forwarding patients to A&E' },
  { value: 'CREATE_SAME_DAY_APPOINTMENTS', label: 'Creating additional same-day appointments' },
];

export interface PracticeDetailsValues {
  /** Text typed in the ODS search (onboard only). */
  ods_query: string;
  ods_selection: PublicPractice | null;
  ods_code: string;
  practice_name: string;
  practice_manager: string | null;
  practice_manager_name: string;
  pcn_name: string;
  phone_number: string;
  email_address: string;
  website: string;
  description: string;
  address_line_1: string;
  address_line_2: string;
  postcode: string;
  logo_url: string;
  points_of_contact: PointOfContact[];
  hours: WeekHours;
}

export interface SlotDurationValue {
  role_id: string;
  appointment_type: AppointmentTypeKey | '';
  duration_minutes: string;
}

export interface WorkforceValue {
  staff_type: string;
  frequency: WorkforceAllocation['frequency'] | '';
  hours: string;
}

export interface ProfileValues extends PracticeDetailsValues {
  rota_group_ids: string[];
  linked_practice_ids: string[];
  succession_start_date: string;
  succession_ongoing: boolean;
  succession_end_date: string;
  workforce_allocations: WorkforceValue[];
  appointment_types: AppointmentConfiguration['appointment_types'];
  slot_durations: SlotDurationValue[];
  urgent_booking: BookingChannel;
  routine_booking: BookingChannel;
  urgent_capacity: WeekHours;
  extra_appointments: ExtraAppointments;
}

export const EMPTY_POC: PointOfContact = { name: '', phone_number: '+44', email: '', designation: '', description: '' };

/** Blank form: Sunday and Saturday closed, weekdays 08:00–18:30 (live defaults). */
export function defaultWeek(from = '08:00', to = '18:30'): WeekHours {
  return Object.fromEntries(
    DAYS.map(({ key }) => [key, { open: key !== 'SUNDAY' && key !== 'SATURDAY', from, to }]),
  ) as WeekHours;
}

function weekFrom(rows: Pick<OperatingHours, 'day' | 'opening_time' | 'closing_time' | 'practice_state'>[]): WeekHours {
  const week = defaultWeek();
  for (const row of rows) {
    week[row.day] = {
      open: row.practice_state === 'OPEN',
      from: row.opening_time ?? '08:00',
      to: row.closing_time ?? '18:30',
    };
  }
  return week;
}

function weekTo(week: WeekHours) {
  return DAYS.map(({ key }) => {
    const day = week[key];
    return {
      day: key,
      practice_state: day.open ? ('OPEN' as const) : ('CLOSED' as const),
      opening_time: day.open ? day.from : null,
      closing_time: day.open ? day.to : null,
    };
  });
}

export const EMPTY_DETAILS: PracticeDetailsValues = {
  ods_query: '',
  ods_selection: null,
  ods_code: '',
  practice_name: '',
  practice_manager: null,
  practice_manager_name: '',
  pcn_name: '',
  phone_number: '+44',
  email_address: '',
  website: '',
  description: '',
  address_line_1: '',
  address_line_2: '',
  postcode: '',
  logo_url: '',
  points_of_contact: [],
  hours: defaultWeek(),
};

/** Values to merge into the form when an ODS result is picked (live autofill). */
export function odsAutofill(entry: PublicPractice): Partial<PracticeDetailsValues> {
  return {
    ods_selection: entry,
    ods_query: entry.name,
    ods_code: entry.ods_code,
    practice_name: entry.name,
    pcn_name: entry.pcn_code,
    phone_number: entry.phone_number,
    website: entry.website,
    address_line_1: entry.address_line_1,
    postcode: entry.postcode,
    hours: defaultWeek(entry.opening_time, entry.closing_time),
  };
}

export function detailsFromPractice(practice: Practice): PracticeDetailsValues {
  return {
    ...EMPTY_DETAILS,
    ods_code: practice.ods_code,
    practice_name: practice.practice_name,
    practice_manager: practice.practice_manager ?? null,
    practice_manager_name: practice.practice_manager_name,
    pcn_name: practice.pcn_name,
    phone_number: practice.phone_number || '+44',
    email_address: practice.email_address ?? '',
    website: practice.website ?? '',
    description: practice.description ?? '',
    address_line_1: practice.address_line_1,
    address_line_2: practice.address_line_2,
    postcode: practice.postcode,
    logo_url: practice.logo_url,
    points_of_contact: practice.points_of_contact.map((poc) => ({ ...EMPTY_POC, ...poc })),
    hours: weekFrom(practice.operating_hours),
  };
}

export function profileFromApi(
  practice: Practice,
  appointment: AppointmentConfiguration,
  sla: SlaConfiguration,
): ProfileValues {
  return {
    ...detailsFromPractice(practice),
    rota_group_ids: practice.rota_group_ids ?? [],
    linked_practice_ids: practice.linked_practice_ids ?? [],
    succession_start_date: practice.succession_start_date ?? '',
    succession_ongoing: practice.succession_ongoing ?? true,
    succession_end_date: practice.succession_end_date ?? '',
    workforce_allocations: (practice.workforce_allocations ?? []).map((item) => ({
      staff_type: item.staff_type,
      frequency: item.frequency,
      hours: String(item.hours),
    })),
    appointment_types: appointment.appointment_types,
    slot_durations: appointment.slot_durations.length
      ? appointment.slot_durations.map((item) => ({ ...item, duration_minutes: String(item.duration_minutes) }))
      : [{ role_id: '', appointment_type: '', duration_minutes: '' }],
    urgent_booking: appointment.urgent_booking,
    routine_booking: appointment.routine_booking,
    urgent_capacity: weekFrom(sla.urgent_capacity),
    extra_appointments: sla.extra_appointments,
  };
}

export function detailsToInput(values: PracticeDetailsValues): PracticeInput {
  const blankToNull = (value: string) => (value.trim() ? value.trim() : null);
  return {
    practice_type: 'PUBLIC',
    practice_name: values.practice_name.trim(),
    ods_code: values.ods_code,
    practice_manager: values.practice_manager,
    pcn_name: values.pcn_name.trim(),
    phone_number: values.phone_number.trim(),
    email_address: blankToNull(values.email_address),
    website: blankToNull(values.website),
    description: blankToNull(values.description),
    address_line_1: values.address_line_1.trim(),
    address_line_2: values.address_line_2.trim(),
    postcode: values.postcode.trim().toUpperCase(),
    logo_url: values.logo_url,
    points_of_contact: values.points_of_contact,
    operating_hours: weekTo(values.hours),
  };
}

export function profileToApi(values: ProfileValues) {
  const input: PracticeInput = {
    ...detailsToInput(values),
    rota_group_ids: values.rota_group_ids,
    linked_practice_ids: values.linked_practice_ids,
    succession_start_date: values.succession_start_date || null,
    succession_ongoing: values.succession_ongoing,
    succession_end_date: values.succession_ongoing ? null : values.succession_end_date || null,
    workforce_allocations: values.workforce_allocations.map((item) => ({
      staff_type: item.staff_type,
      frequency: item.frequency as WorkforceAllocation['frequency'],
      hours: Number(item.hours),
    })),
  };
  const appointment: AppointmentConfiguration = {
    appointment_types: values.appointment_types,
    slot_durations: values.slot_durations.map((item) => ({
      role_id: item.role_id,
      appointment_type: item.appointment_type as AppointmentTypeKey,
      duration_minutes: Number(item.duration_minutes),
    })),
    urgent_booking: values.urgent_booking,
    routine_booking: values.routine_booking,
  };
  const sla: SlaConfiguration = {
    urgent_capacity: weekTo(values.urgent_capacity),
    extra_appointments: values.extra_appointments,
  };
  return { input, appointment, sla };
}

// ---------------------------------------------------------------- validation

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
/** "+44" followed by 9–10 digits (spaces allowed). */
const UK_PHONE = /^\+44\s*(\d\s*){9,10}$/;
const isBlankPhone = (value?: string) => !value || value.replace(/[\s+]/g, '') === '44';

const phoneSchema = (requiredMessage: string) =>
  Yup.string()
    .test('required', requiredMessage, (value) => !isBlankPhone(value))
    .test('format', 'Enter a valid UK phone number', (value) => isBlankPhone(value) || UK_PHONE.test(value ?? ''));

const hoursSchema = Yup.object(
  Object.fromEntries(
    DAYS.map(({ key }) => [
      key,
      Yup.object({ open: Yup.boolean(), from: Yup.string(), to: Yup.string() }).test(
        'order',
        'Closing time must be after opening time',
        (day) => !day?.open || !day.from || !day.to || day.to > day.from,
      ),
    ]),
  ),
);

const detailsShape = (mode: 'onboard' | 'profile') => ({
  ods_query: mode === 'onboard' ? Yup.string().trim().required('Practice name or ODS code is required') : Yup.string(),
  practice_name: Yup.string().trim().required('Practice name is required'),
  pcn_name: Yup.string().trim().required('PCN name is required'),
  phone_number: phoneSchema('Phone number is required'),
  email_address: Yup.string().trim().email('Enter a valid email'),
  website: Yup.string().trim(),
  description: Yup.string().max(500, 'Description must be 500 characters or fewer'),
  address_line_1: Yup.string().trim().required('Address line 1 is required'),
  postcode: Yup.string()
    .trim()
    .required('Postcode is required')
    .matches(UK_POSTCODE, { message: 'Enter a valid UK postcode', excludeEmptyString: true }),
  points_of_contact: Yup.array().of(
    Yup.object({
      name: Yup.string().trim().required('Name is required'),
      phone_number: phoneSchema('Contact number is required'),
      email: Yup.string().trim().required('Email is required').email('Enter a valid email'),
      designation: Yup.string().trim().required('Designation is required'),
      description: Yup.string().max(500, 'Description must be 500 characters or fewer'),
    }),
  ),
  hours: hoursSchema,
});

export const onboardSchema = Yup.object(detailsShape('onboard'));

export const profileSchema = Yup.object({
  ...detailsShape('profile'),
  succession_start_date: Yup.string().required('Start date is required'),
  succession_end_date: Yup.string().when('succession_ongoing', {
    is: false,
    then: (schema) =>
      schema
        .required('End date is required')
        .test(
          'after-start',
          'End date must be after the start date',
          (value, context) =>
            !value || !context.parent.succession_start_date || value > context.parent.succession_start_date,
        ),
  }),
  workforce_allocations: Yup.array().of(
    Yup.object({
      staff_type: Yup.string().required('Staff type is required'),
      frequency: Yup.string().required('Frequency is required'),
      hours: Yup.number()
        .typeError('Hours must be a number')
        .required('Hours is required')
        .positive('Hours must be more than 0'),
    }),
  ),
  appointment_types: Yup.array().test('has-default', 'Select a default appointment type.', (types) =>
    Boolean(types?.some((type) => type.enabled && type.is_default)),
  ),
  slot_durations: Yup.array()
    .min(1, 'Add at least one slot duration')
    .of(
      Yup.object({
        role_id: Yup.string().required('Role is required'),
        appointment_type: Yup.string().required('Appointment type is required'),
        duration_minutes: Yup.string()
          .required('Duration is required')
          .matches(/^\d{1,5}$/, 'Enter whole minutes (up to 5 digits)')
          .test('positive', 'Duration must be more than 0', (value) => !value || Number(value) > 0),
      }),
    ),
  urgent_capacity: hoursSchema,
});

/** Which form section a field path belongs to, for the red section border. */
export type SectionKey =
  'details' | 'address' | 'contacts' | 'hours' | 'succession' | 'workforce' | 'appointmentTypes' | 'slots' | 'urgent';

export function sectionOf(field: string): SectionKey | null {
  if (['address_line_1', 'address_line_2', 'postcode'].includes(field)) return 'address';
  if (field === 'points_of_contact') return 'contacts';
  if (field === 'hours') return 'hours';
  if (field.startsWith('succession')) return 'succession';
  if (field === 'workforce_allocations') return 'workforce';
  if (field === 'appointment_types') return 'appointmentTypes';
  if (field === 'slot_durations') return 'slots';
  if (field === 'urgent_capacity') return 'urgent';
  if (
    [
      'ods_query',
      'practice_name',
      'practice_manager',
      'pcn_name',
      'phone_number',
      'email_address',
      'website',
      'description',
    ].includes(field)
  ) {
    return 'details';
  }
  return null;
}
