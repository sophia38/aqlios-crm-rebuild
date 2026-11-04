// Response types mirror the live API (docs/api-shapes.md).

export interface ApiEnvelope<T> {
  status: { code: number; message: string };
  data: T | null;
  errors: unknown[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isPatient: boolean;
  role: string;
  subAppSlugs: string[];
}

export interface AuthClaimsSubApp {
  id: string;
  name: string;
  slug: string;
  organizations: { id: string; name: string }[];
  permissions: string[];
  roles: string[];
}

export interface AuthMe {
  user: AuthUser;
  claims: {
    sub: string;
    user_id: string;
    app_id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_admin: boolean;
    is_patient: boolean;
    is_verified: boolean;
    meta_data: null;
    organizations: { id: string; name: string }[];
    redirect_url: string;
    roles: string[];
    sub_apps: AuthClaimsSubApp[];
  };
  isDemo: boolean;
}

export interface SubApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  logo_url: string | null;
  redirect_url: string | null;
}

export interface SubAppsResponse {
  message: string;
  sub_apps: SubApp[];
}

export interface Profile {
  id: string;
  internal_user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  roles: string[];
}

// `day` and `practice_state` values are inferred from the Onboard New Practice form; only their types were captured.
export interface OperatingHours {
  id: string;
  practice: string;
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  opening_time: string | null;
  closing_time: string | null;
  practice_state: 'OPEN' | 'CLOSED';
  subapp_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Practice {
  id: string;
  auth31_id: string;
  subapp: string;
  practice_name: string;
  practice_type: string;
  ods_code: string;
  pcn_name: string;
  sub_icb: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postcode: string;
  country: string | null;
  phone_number: string;
  email_address: string | null;
  website: string | null;
  description: string | null;
  logo_url: string;
  cqc_no: string | null;
  practice_manager_name: string;
  associated_users_count: number;
  status: string;
  is_active: boolean;
  sla_status: boolean;
  activity_tracker_enabled: boolean;
  inactivity_threshold_minutes: number | null;
  is_career_page_active: boolean;
  uses_connect: boolean;
  commission_percentage: number | null;
  payout_eligibility_days: number | null;
  points_of_contact: PointOfContact[];
  slug: string | null;
  tenant_id: string | null;
  app_id: string | null;
  operating_hours: OperatingHours[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Profile fields below were not seen in a list response; they come from the profile screen (inferred).
  practice_manager?: string | null;
  rota_group_ids?: string[];
  linked_practice_ids?: string[];
  succession_start_date?: string | null;
  succession_ongoing?: boolean;
  succession_end_date?: string | null;
  workforce_allocations?: WorkforceAllocation[];
}

// Inferred from the onboard form (docs/super-admin/03-onboard-new-practice.md).
export interface PointOfContact {
  name: string;
  phone_number: string;
  email: string;
  designation: string;
  description: string;
}

export interface WorkforceAllocation {
  staff_type: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  hours: number;
}

/** Create/update payload (inferred; the live save wasn't captured). */
export type PracticeInput = Pick<
  Practice,
  | 'practice_name'
  | 'ods_code'
  | 'pcn_name'
  | 'phone_number'
  | 'email_address'
  | 'website'
  | 'description'
  | 'address_line_1'
  | 'address_line_2'
  | 'postcode'
  | 'logo_url'
  | 'points_of_contact'
> & {
  practice_type: 'PUBLIC';
  practice_manager: string | null;
  operating_hours: Pick<OperatingHours, 'day' | 'opening_time' | 'closing_time' | 'practice_state'>[];
} & Partial<
    Pick<
      Practice,
      | 'rota_group_ids'
      | 'linked_practice_ids'
      | 'succession_start_date'
      | 'succession_ongoing'
      | 'succession_end_date'
      | 'workforce_allocations'
    >
  >;

/** Practice manager option (URL captured; shape inferred from the two-line dropdown). */
export interface PracticeManager {
  id: string;
  full_name: string;
  email: string;
}

/** NHS ODS directory entry (URL captured; shape inferred from the options and autofill). */
export interface PublicPractice {
  name: string;
  ods_code: string;
  pcn_code: string;
  phone_number: string;
  website: string;
  address_line_1: string;
  postcode: string;
  opening_time: string;
  closing_time: string;
}

/** URL captured; shape inferred. */
export interface RotaGroup {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type AppointmentTypeKey =
  'FACE_TO_FACE_SURGERY' | 'TELEPHONE_OR_AUDIO' | 'FACE_TO_FACE_HOME_VISIT' | 'WRITTEN_INCLUDING_ONLINE' | 'ADMIN_WORK';

export type BookingChannel = 'BOTH' | 'ADMIN_STAFF' | 'AI_VOICE_AGENT';

/** `…/clinical-system/appointment-configuration/` (URL captured; shape inferred). */
export interface AppointmentConfiguration {
  appointment_types: { type: AppointmentTypeKey; enabled: boolean; is_default: boolean; locked: boolean }[];
  slot_durations: { role_id: string; appointment_type: AppointmentTypeKey; duration_minutes: number }[];
  urgent_booking: BookingChannel;
  routine_booking: BookingChannel;
}

export type ExtraAppointments =
  | 'SIGNPOST_TO_PHARMACY'
  | 'REDIRECT_OOH_CLINIC'
  | 'REDIRECT_NHS_111'
  | 'FORWARD_TO_AE'
  | 'CREATE_SAME_DAY_APPOINTMENTS';

/** `…/practice/{id}/sla-configuration` (URL captured; shape inferred). */
export interface SlaConfiguration {
  urgent_capacity: Pick<OperatingHours, 'day' | 'opening_time' | 'closing_time' | 'practice_state'>[];
  extra_appointments: ExtraAppointments;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  assigned_users_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * One permission from `users/v1/permissions` (URL captured; shape inferred). `name` is stored as
 * `Module:Parent:Child`; the UI shows `description` and indents children under `parent`.
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  parent: string | null;
}

export interface RoleInput {
  name: string;
  description: string;
  permission_ids: string[];
}

export type StaffStatus = 'ACTIVE' | 'PENDING_INVITE' | null;

/** A row of `roles/{roleId}/users` (URL captured; shape inferred). */
export interface RoleUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  practices: { id: string; practice_name: string }[];
  role: { id: string; name: string };
  status: StaffStatus;
}

/** Body of `DELETE …/roles/{roleId}` (inferred): where each assigned user moves to. */
export interface RoleDeleteInput {
  reassignments: { user_id: string; role_id: string }[];
}

export type ListParams = {
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
};

export type TemplateScope = 'STANDARD' | 'STAFF';
export type TemplateType = 'MESSAGE' | 'EMAIL' | 'NOTE';
export type TemplateStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

/** The 10 captured categories, in the live order (docs/super-admin/10-template-library.md). */
export const TEMPLATE_CATEGORIES = [
  'Appointments',
  'Prescription',
  'Medicine',
  'Payment',
  'Consultation / Requests',
  'Diet & Lifestyle',
  'Documents',
  'Blood Tests',
  'Measurements & Vitals',
  'Medical History',
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/** A communication template (no template API was captured; shape inferred from the screens). */
export interface CommunicationTemplate {
  id: string;
  scope: TemplateScope;
  name: string;
  category: TemplateCategory;
  type: TemplateType;
  status: TemplateStatus;
  /** Email only. */
  subject: string | null;
  /** Rich text as HTML; `{{placeholders}}` are plain text inside it. */
  body: string;
  created_by_name: string;
  /** Staff-created only: the practice the author belongs to. */
  business_name: string | null;
  created_at: string;
  updated_at: string;
}

export type TemplateInput = Pick<CommunicationTemplate, 'name' | 'category' | 'type' | 'status' | 'subject' | 'body'>;

export interface TemplateListResponse {
  results: CommunicationTemplate[];
  /** Unfiltered totals for the header and tab counts. */
  totals: { standard: number; staff: number };
  /** Authors of staff-created templates (the Created By filter). */
  authors: string[];
}

export interface TemplateListParams {
  scope: 'standard' | 'staff';
  search?: string;
  type?: string;
  status?: string;
  category?: string;
  created_by?: string;
}

// ---- Settings (docs/super-admin/09-settings.md). No Settings call was captured; shapes inferred. ----

export type GlobalAppointmentType = 'FACE_TO_FACE' | 'CALL';
export type AdditionalSlotType = 'TELEPHONE_AUDIO' | 'ONLINE_VIDEO';
export type ReminderOption = 'NONE' | 'BEFORE_48H' | 'BEFORE_24H' | 'BEFORE_12H' | 'BEFORE_6H' | 'BEFORE_2H';

export interface DaySchedule {
  day: OperatingHours['day'];
  is_open: boolean;
  opening_time: string;
  closing_time: string;
}

export interface GlobalPracticeConfiguration {
  appointment_types: { type: GlobalAppointmentType; enabled: boolean; is_default: boolean }[];
  slot_durations: { role_id: string; appointment_type: GlobalAppointmentType; duration_minutes: number }[];
  urgent_booking: BookingChannel;
  routine_booking: BookingChannel;
  /** Monday first, as on this page. */
  operating_hours: DaySchedule[];
  closed_message_clinical: string;
  closed_message_non_clinical: string;
}

export interface AdditionalSlot {
  role_id: string;
  appointment_type: AdditionalSlotType;
  staff_id: string;
  start_time: string;
  end_time: string;
}

export interface GlobalAppointmentConfiguration {
  offered_slot_hours: number;
  sms_reminder: ReminderOption;
  email_reminder: ReminderOption;
  min_cancellation_hours: number;
  min_reschedule_hours: number;
  enable_video_appointments: boolean;
  notify_staff_on_cancel: boolean;
  show_clinician_name: boolean;
  reopen_cancelled_slot: boolean;
  max_advance_booking_days: number;
  same_day_booking: boolean;
  urgent_booking: BookingChannel;
  routine_booking: BookingChannel;
  require_manager_approval: boolean;
  urgent_capacity: DaySchedule[];
  extra_appointments: ExtraAppointments;
  additional_slots: AdditionalSlot[];
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  role_ids: string[];
  role_names: string[];
  slot_duration_minutes: number;
  sub_types: string[];
  staff_assigned: number;
  created_at: string;
}

export type CompetencyInput = Pick<
  Competency,
  'name' | 'description' | 'role_ids' | 'slot_duration_minutes' | 'sub_types'
>;

export type PathwayChannel = 'mobile_app' | 'web_app' | 'voice_agent' | 'website' | 'care_navigator';

export interface Pathway {
  id: string;
  name: string;
  specialty: string;
  type: 'CLINICAL' | 'ADMINISTRATIVE';
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  routing: 'HUB' | 'PRACTICE';
  channels: Record<PathwayChannel, boolean>;
}

// ---- ROTA (docs/super-admin/06-rota-management.md). URLs marked ✔ were captured; shapes inferred. ----

export type DutyType =
  | 'ON_CALL'
  | 'CARE_HOME_WARD_ROUND'
  | 'EXTENDED_ACCESS'
  | 'NURSING'
  | 'ADMIN_SESSION'
  | 'NEIGHBOURHOOD_SHIFT'
  | 'REMOTE_WORK'
  | 'PPT_PLT_CPD'
  | 'AM_SESSION'
  | 'PM_SESSION';

export type StaffType = 'SALARIED' | 'LOCUM';

/** A rota group with what the Rota Groups tab and its form need. */
export interface RotaGroupDetail extends RotaGroup {
  description: string;
  practices: { id: string; practice_name: string }[];
  roles: { id: string; name: string }[];
  staff: { id: string; name: string }[];
}

export type RotaGroupInput = {
  name: string;
  description: string;
  status: RotaGroup['status'];
  practice_ids: string[];
  role_ids: string[];
  staff_ids: string[];
};

/** ✔ `rota/v1/.../available-practices?week_start=` (shape inferred). */
export interface RotaPractice {
  id: string;
  practice_name: string;
  opening_time: string;
  closing_time: string;
  assigned_hours: number;
  total_hours: number;
}

/** ✔ `rota/v1/.../available-staff?date=` (shape inferred). */
export interface RotaStaff {
  id: string;
  name: string;
  role_id: string;
  role_name: string;
  staff_type: StaffType;
  working_hours: string;
  assigned_hours: number;
  total_hours: number;
}

export interface Shift {
  id: string;
  staff_id: string;
  staff_name: string;
  role_name: string;
  staff_type: StaffType;
  practice_id: string;
  practice_name: string;
  /** YYYY-MM-DD */
  date: string;
  start_time: string;
  end_time: string;
  duty_type: DutyType;
  /** The assignment this shift belongs to (phase 5): edits can apply to it from a date on. */
  series_id?: string;
  recurring?: boolean;
  series_start_date?: string;
  series_end_date?: string | null;
  repeat_days?: DayKey[];
  appointment_types?: AppointmentKind[];
  urgencies?: ShiftUrgency[];
  break_start?: string;
  break_end?: string;
}

export type GapKind = 'leave' | 'published' | 'holiday';

export interface RotaGap {
  id: string;
  kind: GapKind;
  date: string;
  start_time: string;
  end_time: string;
  label: string;
  practice_id: string | null;
  staff_id: string | null;
}

export interface RotaWeek {
  shifts: Shift[];
  gaps: RotaGap[];
}

export interface RotaWeekParams {
  week_start: string;
  practice_id?: string;
  staff_id?: string;
  staff_type?: string;
  duty_type?: string;
  role_id?: string;
  rota_group_id?: string;
}

export type ActivityStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface StaffActivity {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_code: string;
  practice_name: string;
  duty_type: DutyType;
  status: ActivityStatus;
  login_time: string | null;
  logout_time: string | null;
  allocated_hours: number;
  date: string;
}

export interface StaffActivityResponse extends Paginated<StaffActivity> {
  stats: { active: number; inactive: number; on_leave: number };
}

// ---- CQC Compliance (docs/super-admin/08-cqc-compliance.md, read from the live page's code). ----

/** API values; one spelling each (the live UI papers over two spellings with an alias map). */
export type ComplianceStatus =
  'ACTIVE' | 'PENDING_UPLOAD' | 'PENDING_VERIFICATION' | 'REVERIFICATION_DUE' | 'EXPIRED' | 'REJECTED';

/** A row as the API sends it: note the live field typo `complaince_status`. */
export interface ComplianceRowApi {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  practice_id: string;
  practice_name: string;
  complaince_status: ComplianceStatus;
  waiting_since: string | null;
  last_updated: string;
}

/** The same row in the app, with the field name spelled correctly. */
export type ComplianceRow = Omit<ComplianceRowApi, 'complaince_status'> & { compliance_status: ComplianceStatus };

export interface ComplianceSummary {
  total_staff: number;
  compliant: number;
  pending_upload: number;
  awaiting_verification: number;
  reverification_due: number;
  expired: number;
  rejected: number;
}

export interface ComplianceDashboardApi extends Paginated<ComplianceRowApi> {
  summary: ComplianceSummary;
}

export interface ComplianceDashboard extends Paginated<ComplianceRow> {
  summary: ComplianceSummary;
}

// ---------------------------------------------------------------- patients (phase 5, inferred)

/** The 14 captured Registration Type options (docs/practice/01-patients.md). */
export const REGISTRATION_TYPES = [
  'EMERGENCY',
  'IMMEDIATELY_NECESSARY',
  'PRIVATE',
  'REGULAR',
  'TEMPORARY',
  'DUMMY',
  'OTHER',
  'CONTRACEPTIVE_SERVICES',
  'MATERNITY_SERVICES',
  'CHILD_HEALTH_SERVICES',
  'WALK_IN',
  'GYNAECOLOGY',
  'RHEUMATOLOGY',
  'DERMATOLOGY',
] as const;
export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

/** The 4 captured Registration Status options. */
export const REGISTRATION_STATUSES = [
  'PATIENT_REGISTERED_AND_CARER_CORRECT',
  'PATIENT_REGISTERED_BUT_CARER_INCORRECT',
  'NOT_KNOWN',
  'PATIENT_NOT_REGISTERED',
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export interface PatientAddress {
  street_address: string;
  address_line_2: string;
  city: string;
  post_code: string;
}

export interface PatientCarer {
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string | null;
  sex_at_birth: string;
  ethnicity: string;
  nhs_number: string;
  address: string;
  relationship: string;
  phone_number: string;
  email: string;
  verified: boolean;
}

export interface Patient {
  id: string;
  practice_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  /** Stored without spaces; shown as "999 123 4567". */
  nhs_number: string;
  date_of_birth: string;
  sex_at_birth: string;
  ethnicity: string;
  phone_number: string;
  email: string;
  spoken_language: string;
  needs_interpreter: boolean | null;
  interpreter_language: string;
  needs_transport: boolean | null;
  address: PatientAddress;
  registration_type: RegistrationType;
  registration_status: RegistrationStatus;
  registered_at: string;
  carer: PatientCarer | null;
  synced_with_clinical_system: boolean;
  archived: boolean;
  deregistration_reason: string | null;
}

export interface PatientNote {
  id: string;
  text: string;
  added_by_name: string;
  created_at: string;
}

export interface HealthRecordFile {
  id: string;
  file_name: string;
  file_type: string;
  size_kb: number;
  date_added: string;
}

export interface PatientDetail extends Patient {
  notes: PatientNote[];
  health_records: HealthRecordFile[];
}

export interface PatientConsultation {
  id: string;
  request_name: string;
  status: string;
  submitted_at: string;
}

export type PatientInput = Partial<
  Omit<Patient, 'id' | 'practice_id' | 'registered_at' | 'carer' | 'synced_with_clinical_system' | 'archived'>
>;

export interface PatientListParams {
  page: number;
  page_size: number;
  search?: string;
  registration_type?: string;
  registration_date?: string;
}

export type PatientMessageChannel = 'SMS' | 'EMAIL';

// ---- Tickets / consultations (docs/practice/02-tickets.md). No ticket call was captured; shapes inferred. ----

/** The 10 captured Open Cases statuses, in the live order, then Closed (shown as "Completed"). */
export const TICKET_OPEN_STATUSES = [
  'NEW',
  'MORE_INFO_REQUIRED',
  'APPOINTMENT_PENDING',
  'UNDER_CLINICAL_REVIEW',
  'REOPENED',
  'FORWARDED',
  'FOLLOW_UP_REQUESTED',
  'APPOINTMENT_BOOKED',
  'DNA',
  'APPOINTMENT_CANCELLED',
] as const;
export type TicketOpenStatus = (typeof TICKET_OPEN_STATUSES)[number];
export type TicketStatus = TicketOpenStatus | 'CLOSED';

export type TicketSource = 'VOICE_AGENT' | 'WEB_TRIAGE';
/** The captured urgency radio values. Severity (the list flag) follows it: URGENT is urgent, the rest routine. */
export const TICKET_URGENCIES = ['URGENT', 'ROUTINE_ONE_WEEK', 'ROUTINE_TWO_WEEK'] as const;
export type TicketUrgency = (typeof TICKET_URGENCIES)[number];

/** Fix: a reason list replaces the live free text ("tEST", "mnm"). */
export const TICKET_CLOSURE_REASONS = [
  'Resolved',
  'Duplicate',
  'Patient no longer needs help',
  'Referred elsewhere',
  'Other',
] as const;
export type TicketClosureReason = (typeof TICKET_CLOSURE_REASONS)[number];

export interface TicketStaff {
  id: string;
  name: string;
  role: string;
}

export interface Ticket {
  id: string;
  practice_id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_sex: string;
  source: TicketSource;
  urgency: TicketUrgency;
  complaint_type: string;
  status: TicketStatus;
  created_at: string;
  recommended_staff: TicketStaff | null;
  assigned_staff: TicketStaff | null;
  closed_at: string | null;
  closed_by_name: string | null;
  closure_reason: string | null;
}

export interface TicketSnomedCode {
  id: string;
  code: string;
  term: string;
  comment: string;
  created_at: string;
}

export type TicketMessageChannel = 'SMS' | 'EMAIL' | 'APP' | 'NHS_APP';

export interface TicketMessage {
  id: string;
  /** STAFF: sent from the CRM. PATIENT: a reply. */
  sender: 'STAFF' | 'PATIENT';
  sender_name: string;
  body: string;
  channels: TicketMessageChannel[];
  reply_allowed: boolean;
  created_at: string;
}

export interface TicketNote {
  id: string;
  text: string;
  shared_with_patient: boolean;
  added_by_name: string;
  created_at: string;
}

export interface TicketTranscriptEntry {
  speaker: 'AI' | 'PATIENT';
  text: string;
}

export interface TicketDetail extends Ticket {
  current_viewer_name: string | null;
  preferred_method: string;
  request_name: string;
  submitted_by: string;
  urgency_changed_by_clinician: boolean;
  summary: {
    presenting_complaint: string | null;
    condition_history: string | null;
    timeframe: string | null;
    symptoms: string | null;
  };
  red_flags: string[];
  recommended_actions: string[];
  requested_tests: string[];
  medication: string[];
  snomed_codes: TicketSnomedCode[];
  messages: TicketMessage[];
  notes: TicketNote[];
  transcript: { started_at: string; duration_seconds: number; entries: TicketTranscriptEntry[] };
}

export interface TicketLog {
  id: string;
  actor: string;
  event: string;
  user_name: string;
  role: string;
  created_at: string;
}

export interface TicketListParams {
  page: number;
  page_size: number;
  /** Omit for both (Previous Consultations). */
  case?: 'open' | 'closed';
  ordering?: string;
  search?: string;
  status?: string;
  date?: string;
  patient_id?: string;
  exclude?: string;
}

export interface SnomedConcept {
  code: string;
  term: string;
}

// ---- Appointments (docs/practice/03-appointment.md). No appointment call was captured; shapes inferred. ----

/** One set of type names: the practice's 4 appointment types plus Online (Video) (fixes the live mix). */
export const APPOINTMENT_KINDS = [
  'FACE_TO_FACE_SURGERY',
  'TELEPHONE_OR_AUDIO',
  'FACE_TO_FACE_HOME_VISIT',
  'WRITTEN_INCLUDING_ONLINE',
  'ONLINE_VIDEO',
] as const;
export type AppointmentKind = (typeof APPOINTMENT_KINDS)[number];

/** The 6 captured Status filter values, then Reschedule Requested (after a reschedule). */
export const APPOINTMENT_STATUSES = [
  'UPCOMING',
  'IN_PROGRESS',
  'DNA',
  'COMPLETED',
  'CANCELLED_BY_PATIENT',
  'CANCELLED_BY_STAFF',
  'RESCHEDULE_REQUESTED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type AppointmentSeverity = 'URGENT' | 'ROUTINE';

export interface Appointment {
  id: string;
  practice_id: string;
  consultation_id: string;
  request_name: string;
  patient_id: string;
  patient_name: string;
  patient_pronouns: string | null;
  patient_phone: string;
  patient_email: string;
  staff: TicketStaff;
  type: AppointmentKind;
  severity: AppointmentSeverity;
  /** YYYY-MM-DD and HH:mm, practice local time. */
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  /** Video appointments only. */
  meeting_link: string | null;
  cancellation_reason: string | null;
}

export interface AppointmentListParams {
  /** A Monday: the 7 days from it (Calendar View, Week). */
  week_start?: string;
  /** One day (Calendar View, Day, and Table View). Neither: today. */
  date?: string;
  type?: string;
  severity?: string;
  staff_id?: string;
  status?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface AppointmentSummary {
  upcoming: number;
  in_progress: number;
  dna: number;
  completed: number;
  cancelled: number;
}

export type AppointmentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

/** A request to book a staff member other than the one the system recommended. */
export interface AppointmentRequest {
  id: string;
  practice_id: string;
  consultation_id: string;
  patient_id: string;
  patient_name: string;
  original_staff: TicketStaff;
  requested_staff: TicketStaff;
  reason: string;
  requested_by: TicketStaff;
  created_at: string;
  expires_at: string;
  status: AppointmentRequestStatus;
  decided_at: string | null;
  decided_by_name: string | null;
  rejection_reason: string | null;
}

export type AppointmentRequestRange = 'today' | 'last_7_days' | 'last_30_days';

export interface AppointmentRequestListParams {
  page: number;
  page_size: number;
  requested_by?: string;
  status?: string;
  range?: string;
}

export interface AppointmentRequestSummary {
  pending: number;
  approved_today: number;
  rejected_today: number;
}

// ---- Staff on-boarding and Profile (docs/practice/05-staff-onboarding.md). List URL captured; the rest inferred. ----

/** The 9 captured Status filter values, in the live order. */
export const PRACTICE_STAFF_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'LOCKED',
  'PENDING_INVITE',
  'INVITATION_EXPIRED',
  'RESENT_INVITE',
  'PENDING_PROFILE',
  'PENDING_APPROVAL',
  'REJECTED',
] as const;
export type PracticeStaffStatus = (typeof PRACTICE_STAFF_STATUSES)[number];

/** Invitations not yet accepted (Sent Invitations tab, Pending Invitations count). */
export const STAFF_INVITE_STATUSES: PracticeStaffStatus[] = ['PENDING_INVITE', 'INVITATION_EXPIRED', 'RESENT_INVITE'];

/** The 15 captured Staff Type options, as shown. */
export const PRACTICE_STAFF_TYPES = [
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
] as const;
export type PracticeStaffType = (typeof PRACTICE_STAFF_TYPES)[number];

/** A Staff Management row. */
export interface PracticeStaff {
  id: string;
  practice_id: string;
  practice_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: string;
  role_name: string;
  staff_type: PracticeStaffType;
  status: PracticeStaffStatus;
  invited_at: string;
  archived: boolean;
  rota_group_names: string[];
}

export type StaffListTab = 'staff' | 'invitations' | 'archived';

export interface StaffListParams {
  page: number;
  page_size: number;
  tab?: StaffListTab;
  status?: string;
  staff_type?: string;
  search?: string;
  ordering?: string;
}

export interface StaffSummary {
  total: number;
  active: number;
  pending_invitations: number;
}

export interface StaffInviteInput {
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  staff_type: PracticeStaffType;
}

/** `GET …/staff/bulk-import/` (URL captured; shape inferred). */
export interface StaffImportInfo {
  template_name: string;
  roles: string[];
  staff_types: string[];
}

export interface StaffImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

export type DayKey = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface StaffEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface StaffAccountDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  spoken_language: string;
  performers_list_number: string;
  registration_number: string;
  ppa_id: string;
  smartcard_status: 'WAITING' | 'HAS_SMARTCARD' | '';
  smartcard_number: string;
  ni_number: string;
  dbs_status: 'WAITING' | 'HAS_DBS' | '';
  dbs_number: string;
  dbs_issue_date: string;
  dbs_level: 'STANDARD' | 'ENHANCED' | '';
  dbs_update_service: 'YES' | 'NO' | '';
  address_line_1: string;
  address_line_2: string;
  city: string;
  postcode: string;
  emergency_contacts: StaffEmergencyContact[];
  rota_group_ids: string[];
  contract_start: string;
  contract_end: string;
  ongoing_sla: boolean;
  contract_type: 'LOCUM' | 'SALARIED' | '';
  duty_types: DutyType[];
  availability: Record<DayKey, { open: boolean; from: string; to: string }>;
  employment_start: string;
  employment_end: string;
  leaving_reason: string;
}

/** Leave entitlements are stored in hours and shown as "X days (Y h)" (phase 5 question 3). */
export interface StaffLeaveEntitlement {
  annual_hours: number;
  sick_hours: number;
  other: { leave_type: string; hours: number }[];
}

export type StaffDocumentStatus = 'PENDING_UPLOAD' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface StaffDocument {
  key: string;
  group: string;
  name: string;
  required: boolean;
  /** Training and indemnity certificates expire. */
  has_expiry: boolean;
  /** Registration documents are re-verified every year. */
  reverification: boolean;
  file_name: string | null;
  added_at: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  reverification_due: string | null;
  status: StaffDocumentStatus;
  rejection_reason: string | null;
}

export interface StaffCompetencies {
  inbox: string;
  staff_type: string;
  age_groups: string[];
  items: { competency_id: string; date_completed: string; sub_types: string[] }[];
}

export type PayrollDocumentType = 'P45' | 'HMRC_STARTER_CHECKLIST' | 'TAX_CODE_UPDATE';
export type PensionScheme = 'NONE' | 'NHS' | 'GP_SALARIED' | 'NEST';

export interface StaffPayroll {
  documents: {
    type: PayrollDocumentType;
    file_name: string | null;
    added_at: string | null;
    verified_at: string | null;
    added_by: string | null;
    status: 'PENDING_UPLOAD' | 'PENDING_VERIFICATION' | 'VERIFIED';
  }[];
  pension: PensionScheme | '';
  deduction_amount: string;
  deduction_reason: string;
  deduction_end: string;
  payment_amount: string;
  payment_reason: string;
  payment_end: string;
}

export interface StaffDetail extends PracticeStaff {
  /** The signed-in user's own record (Profile). */
  is_self: boolean;
  account: StaffAccountDetails;
  leave: StaffLeaveEntitlement;
  competencies: StaffCompetencies;
  payroll: StaffPayroll;
  documents: StaffDocument[];
}

export type StaffDetailTab = 'account' | 'leave' | 'competencies' | 'payroll';

export type StaffAction = 'lock' | 'unlock' | 'archive' | 'unarchive' | 'approve' | 'reject' | 'resend-invite';

// ---- Practice ROTA (docs/practice/06-rota-management.md). All inferred. ----

export type ShiftUrgency = 'ROUTINE' | 'URGENT';

/** Which shifts of a recurring assignment an edit or delete applies to (captured radios). */
export type AssignmentScope = 'CURRENT' | 'FOLLOWING' | 'ALL';

export interface ShiftSlot {
  start_time: string;
  end_time: string;
}

/** Assign Staff (POST …/assignments). */
export interface AssignmentInput {
  staff_id: string;
  practice_id: string;
  type: 'ONCE' | 'RECURRING';
  start_date: string;
  /** Recurring only. */
  end_date?: string;
  /** Recurring only: the "Repeat every week" days. */
  days?: DayKey[];
  slots: ShiftSlot[];
  duty_type: DutyType;
  appointment_types: AppointmentKind[];
  urgencies: ShiftUrgency[];
  break_start?: string;
  break_end?: string;
}

/** Edit Assignment (PATCH …/assignments/{shiftId}?scope=). */
export interface AssignmentUpdate {
  start_time: string;
  end_time: string;
  duty_type: DutyType;
  appointment_types: AppointmentKind[];
  urgencies: ShiftUrgency[];
  break_start?: string;
  break_end?: string;
}

/** Publish Slot (POST …/published-slots). */
export interface PublishSlotInput {
  practice_id: string;
  date: string;
  start_time: string;
  end_time: string;
  staff_type: StaffType | '';
  rota_group_ids: string[];
  role_ids: string[];
  duty_type: DutyType;
  rate_per_hour: number;
  bidding_closes: string;
  repeat_weekly: boolean;
  repeat_until?: string;
  notify: ('APP' | 'SMS' | 'EMAIL')[];
}

export interface SlotBid {
  id: string;
  staff_id: string;
  staff_name: string;
  role_name: string;
  created_at: string;
}

/** One published slot on one date (Shift Bidding). */
export interface PublishedSlot {
  id: string;
  practice_id: string;
  practice_name: string;
  date: string;
  start_time: string;
  end_time: string;
  duty_type: DutyType;
  rate_per_hour: number;
  bidding_closes: string;
  bids: SlotBid[];
  /** The signed-in user's own bid and decline. */
  my_bid: boolean;
  declined: boolean;
}

export interface RotaTemplateShift {
  staff_id: string;
  staff_name: string;
  /** Days from the template's start date. */
  day_offset: number;
  start_time: string;
  end_time: string;
  duty_type: DutyType;
}

export interface RotaTemplate {
  id: string;
  name: string;
  practice_id: string;
  practice_name: string;
  rota_group_id: string | null;
  staff_ids: string[];
  start_date: string;
  end_date: string;
  include_bank_holidays: boolean;
  shifts: RotaTemplateShift[];
  created_at: string;
}

export interface RotaTemplateInput {
  name: string;
  practice_id: string;
  rota_group_id: string | null;
  staff_ids: string[];
  start_date: string;
  end_date: string;
  include_bank_holidays: boolean;
}

// ---- Leaves (docs/practice/07-leaves-and-leaves-rota.md). Only the screens were captured. ----

export const LEAVE_TYPES = [
  'ANNUAL',
  'SICK',
  'MATERNITY',
  'PATERNITY',
  'BEREAVEMENT',
  'EMERGENCY',
  'COMPASSIONATE',
  'TOIL',
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export interface LeaveWarning {
  kind: 'ROTA_CLASH' | 'LOW_BALANCE';
  message: string;
}

/** Durations and balances are in hours; `day_hours` is the person's contracted day, for "X days (Y h)". */
export interface LeaveRequest {
  id: string;
  practice_id: string;
  staff_id: string;
  staff_name: string;
  role_id: string;
  role_name: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration_hours: number;
  day_hours: number;
  notes: string;
  status: LeaveStatus;
  requested_at: string;
  updated_at: string;
  decided_by: string | null;
  rejection_reason: string | null;
  /** What's left of this type in the leave year, before this request (null: no fixed entitlement). */
  balance_hours: number | null;
  warnings: LeaveWarning[];
  /** The signed-in user's own request: they can't approve or reject it (phase 5 question 5). */
  is_own: boolean;
}

export interface LeaveRequestListParams {
  tab: 'requests' | 'history';
  page: number;
  page_size: number;
  ordering?: string;
  search?: string;
  staff_id?: string;
  role_id?: string;
  leave_type?: string;
  status?: string;
}

export interface MyLeaveListParams {
  page: number;
  page_size: number;
  ordering?: string;
  from?: string;
  to?: string;
  leave_type?: string;
  status?: string;
}

export interface LeaveBalance {
  leave_type: LeaveType;
  /** null: no fixed entitlement. */
  entitlement_hours: number | null;
  taken_hours: number;
  pending_hours: number;
  remaining_hours: number | null;
}

/** Everything Apply For Leave needs to work out a duration from the dates. */
export interface MyLeaveSummary {
  day_hours: number;
  /** Contracted hours on each weekday. */
  schedule: Record<DayKey, number>;
  bank_holidays: string[];
  /** The leave year (1 January to 31 December). */
  year: number;
  balances: LeaveBalance[];
}

export interface LeaveApplyInput {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration_hours: number;
  notes: string;
}

// HR Policies (docs/practice/08-hr-policies-and-settings.md §1, plan §7). All inferred.

/** The captured category chips, after "All". */
export const HR_POLICY_CATEGORIES = [
  'STAFF_HANDBOOK',
  'LEAVE',
  'SICKNESS',
  'FAMILY_LEAVE',
  'EXPENSES',
  'CONDUCT',
  'GRIEVANCE',
  'HEALTH_SAFETY',
  'EQUALITY',
  'OTHER',
] as const;
export type HrPolicyCategory = (typeof HR_POLICY_CATEGORIES)[number];

/** A numbered clause the assistant can quote. */
export interface HrPolicySection {
  number: string;
  heading: string;
  text: string;
}

export interface HrPolicy {
  id: string;
  practice_id: string;
  title: string;
  category: HrPolicyCategory;
  owner_id: string | null;
  owner_name: string | null;
  /** YYYY-MM-DD. */
  effective_date: string | null;
  description: string;
  version: number;
  file_name: string;
  file_size: number;
  /** Empty for files uploaded in the demo: only the name is stored, so there's nothing to quote. */
  sections: HrPolicySection[];
  uploaded_by: string;
  updated_at: string;
}

export interface HrPolicyListParams {
  page: number;
  page_size: number;
  category?: string;
  search?: string;
  ordering?: string;
}

export interface HrPolicyInput {
  title: string;
  category: HrPolicyCategory;
  owner_id: string | null;
  effective_date: string | null;
  description: string;
  file_name: string;
  file_size: number;
}

export interface HrAnswerSource {
  policy_id: string;
  policy_title: string;
  section: string;
  heading: string;
  quote: string;
}

export interface HrAnswer {
  question: string;
  /** False when nothing in the practice's policies matched. */
  found: boolean;
  answer: string;
  sources: HrAnswerSource[];
}
