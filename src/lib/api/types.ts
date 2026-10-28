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
