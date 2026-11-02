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
