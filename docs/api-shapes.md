# API response shapes (from the live dev app)

Captured 2026-10-27 by reading GET responses while signed in as a non-admin practice user. Only **field names and types** were recorded, not values. The mock API in `src/mocks/` and the types in `src/lib/api/types.ts` follow this file. Fields marked *(inferred)* weren't seen in a response; they come from the screens or the app code.

## Envelope (all `/api/crm/api/...` endpoints)
```jsonc
{
  "status": { "code": 200, "message": "string" },
  "data": { /* payload, or null on error */ },
  "errors": []
}
```
- Paginated payloads use `data: { count, next, previous, results: [] }` (Django REST style). `next` and `previous` are URLs or `null`.
- **403** (no permission, and also an unknown id) returns `{ status: { code: 403, message: "You do not have permission to perform this action!" }, data: null, errors: [] }`.
- **401** returns `{ status: { code: 401, message: "Authentication credentials were not provided" }, data: null, errors: [] }`.

## `GET /api/auth/me` (shared 31G auth, no envelope)
```jsonc
{
  "user": { "id", "email", "firstName", "lastName", "isAdmin": boolean, "isPatient": boolean, "role": "string (empty for practice users)", "subAppSlugs": ["string"] },
  "claims": {
    "sub", "user_id", "app_id", "email", "first_name", "last_name", "is_admin", "is_patient", "is_verified",
    "meta_data": null, "organizations": [], "redirect_url", "roles": [],
    "sub_apps": [{ "id", "name", "slug", "organizations": [{…}], "permissions": [], "roles": [] }]
  },
  "isDemo": boolean
}
```
Signed out → 401.

## `GET /api/auth/sub-apps` (no envelope)
```jsonc
{ "message": "string", "sub_apps": [{ "id", "name", "slug", "description", "is_active": boolean, "logo_url": null, "redirect_url": null }] }
```

## `GET /api/crm/api/users/v1/profile`
```jsonc
data: { "profile": { "id", "internal_user_id", "username", "email", "first_name", "last_name", "full_name", "date_of_birth", "roles": [] } }
```

## `GET /api/crm/api/practice-management/v1/sub-apps/{subAppId}/practices`
Query: `page`, `page_size` (the backend caps it at 100), `ordering` (`-created_at` default on Practice Management; `associated_users_count` sortable), `search` *(inferred name)*.
**Scoped by user:** super-admin sees all 155; a practice user sees only their own practices (2).
```jsonc
results: [{
  "id", "auth31_id", "subapp", "practice_name", "practice_type", "ods_code", "pcn_name", "sub_icb",
  "address_line_1", "address_line_2", "city", "postcode", "country": null, "phone_number", "email_address": null,
  "website": null, "description": null, "logo_url", "cqc_no": null, "practice_manager_name",
  "associated_users_count": number, "status", "is_active": boolean, "sla_status": boolean,
  "activity_tracker_enabled": boolean, "inactivity_threshold_minutes": null, "is_career_page_active": boolean,
  "uses_connect": boolean, "commission_percentage": null, "payout_eligibility_days": null,
  "points_of_contact": [], "slug": null, "tenant_id": null, "app_id": null,
  "operating_hours": [{ "id", "practice", "day", "opening_time": null, "closing_time": null, "practice_state", "subapp_id": null, "created_at", "updated_at", "deleted_at": null }],
  "created_at", "updated_at", "deleted_at": null,
  // Also returned by the live API but NEVER mocked or used (secrets leak, see issue list):
  // "secret_key", "smtp_host", "smtp_port", "smtp_use_tls", "smtp_username", "stripe_publishable_key"
}]
```
`slug` is `null` in the API. The live app derives the URL slug from `practice_name` (e.g. "Main Practice - Surgery" → `main-practice---surgery`).

## `GET /api/crm/api/users/sub-apps/{subAppId}/roles` (no `/v1/`)
403 for practice users. Fields *(inferred from the Roles list screen)*: `id`, `name`, `description`, `assigned_users_count`, `created_at`, `updated_at`, in the paginated envelope.

## Mock-only endpoints (don't exist in the live app)
| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` `{ email, password }` | Demo login. Password `demo`. The real app signs in through the 31G auth service |
| `POST /api/auth/logout` | Clears the mock session (the live app has this path too) |
| `POST /api/mock/persona` `{ persona: "super-admin" \| "practice-user" }` | Dev role switcher |
| `POST /api/mock/reset` | Restores the fixtures ("Reset demo data") |

## Phase 3 endpoints (URLs captured, shapes inferred unless noted)
| Endpoint | Mock response `data` |
|---|---|
| `GET /practice-management/v1/public-practices?search=` | `PublicPractice[]`: `name, ods_code, pcn_code, phone_number, website, address_line_1, postcode, opening_time, closing_time` |
| `GET /users/v1/sub-apps/{id}/practice-managers/?page&page_size&search` | paginated `{ id, full_name, email }` |
| `GET …/practices/name-availability?practice_name&practice_type&exclude_practice_id` | `{ is_available }` |
| `POST …/practices` (inferred) | created practice (201); 400 `errors: [{ field, message }]` |
| `PATCH …/practices/{id}` (inferred) | updated practice |
| `POST …/practices/logo` (inferred, multipart `file`) | `{ logo_url }` |
| `GET/PUT /public/v1/…/practices/{id}/clinical-system/appointment-configuration/` | `{ appointment_types[{type, enabled, is_default, locked}], slot_durations[{role_id, appointment_type, duration_minutes}], urgent_booking, routine_booking }` |
| `GET/PUT /practice-management/v1/…/practice/{id}/sla-configuration` | `{ urgent_capacity[{day, opening_time, closing_time, practice_state}], extra_appointments }` (extra_appointments values captured) |
| `GET /public/v1/sub-apps/{id}/rota-groups/?status=active` | `{ id, name, status }[]` |
| `POST /public/v1/…/practices/{id}/rota/same-rota-practices/` | `{ id, practice_name }[]` |

Practice records gained (inferred): `practice_manager` (id), `rota_group_ids`, `linked_practice_ids`, `succession_start_date`, `succession_ongoing`, `succession_end_date`, `workforce_allocations[{staff_type, frequency, hours}]`. `status` is computed (`ACTIVE` / `INCOMPLETE`).

## Mock-only failure switch (phase 4)
Set `localStorage['aqlios-mock-fail']` to a URL fragment, optionally preceded by a method and followed by a status code (e.g. `PATCH /pathways/`, `GET /staff/dashboard/ 401`). Matching CRM calls answer with that code (500 `Server error. Please try again later.` by default). Remove the key to go back to normal. Used to demo and test error states (`src/mocks/handlers/failures.ts`).

## Settings (phase 4, all inferred)
- `GET`/`PUT /public/v1/sub-apps/{id}/global-practice-configuration/` → `GlobalPracticeConfiguration`
- `GET`/`PUT …/global-appointment-configuration/` → `GlobalAppointmentConfiguration`
- `GET …/competencies/?page&page_size&ordering` (paged) · `POST` · `PATCH …/competencies/{id}/` · `DELETE`
- `GET …/pathways/?type&status&channel&routing&search` (plain list) · `PATCH …/pathways/{id}/channels/` with `{ <channel>: boolean }`

Types are in `src/lib/api/types.ts`.

## Vertical ROTA (phase 4)
- ✔ `GET /rota/v1/sub-apps/{id}/available-practices?week_start=` → `RotaPractice[]` (assigned = opening time covered by shifts)
- ✔ `GET /rota/v1/sub-apps/{id}/available-staff?date=` → `RotaStaff[]`
- ✔ `GET /public/v1/sub-apps/{id}/rota-groups/?status=` → `RotaGroupDetail[]` (now with practices, roles and staff)
- ~ `POST …/rota-groups/` · `PATCH …/rota-groups/{id}/` with `RotaGroupInput`
- ~ `GET /rota/v1/sub-apps/{id}/assignments?week_start&practice_id&staff_id&staff_type&duty_type&role_id&rota_group_id` → `{ shifts, gaps }`
- ~ `GET /activity/v1/sub-apps/{id}/staff-activity?date&staff_id&practice_id&status&search&page&page_size` → paged `StaffActivity` plus `stats { active, inactive, on_leave }`

## CQC Compliance (phase 4)
- (code) `GET /public/v1/sub-apps/{id}/staff/dashboard/?page&page_size&practice_id&search&verification_status` → paged `ComplianceRowApi` (with the live typo `complaince_status`) plus `summary { total_staff, compliant, pending_upload, awaiting_verification, reverification_due, expired, rejected }`. `reverification_due` is inferred (the live card had no field). `lib/api` renames the typo.

## Patients (phase 5)
Base `GET /api/crm/api/public/v1/sub-apps/{subAppId}/practices/{practiceId}/patients/?page&page_size` (**captured** path); query `search`, `registration_type`, `registration_date` (YYYY-MM-DD) and every other call are inferred. Types in `src/lib/api/types.ts` (`Patient`, `PatientDetail`), client in `src/lib/api/patients.ts`.
- `GET …/patients/{id}/` → `PatientDetail` (patient + `notes` + `health_records`); 404 "Patient not found".
- `PATCH …/patients/{id}/` (registration fields or Edit Details fields; NHS number stored without spaces).
- `POST …/{id}/archive/` · `POST …/{id}/deregister/ {reason}` (required, ≤300).
- `POST …/{id}/notes/ {text}` (≤1000) · `DELETE …/{id}/notes/{noteId}/`.
- `POST …/{id}/call-feedback/ {feedback}` (≤1000) · `POST …/{id}/messages/ {channel: SMS|EMAIL, body}` (≤2000; nothing is sent in the demo).
- `GET …/{id}/consultations/` → the patient's tickets `{id, request_name, status, submitted_at}[]`, newest first. Live reads these from the clinical system (`…/consultation/patient/{id}/emis-consultations/`, never returned during capture).

## Tickets (phase 5, all inferred)
No ticket call was captured. Base `…/public/v1/sub-apps/{subAppId}/practices/{practiceId}/consultations/`. Types in `src/lib/api/types.ts` (`Ticket`, `TicketDetail`, `TicketLog`), client in `src/lib/api/tickets.ts`.
- `GET …/consultations/?case=open|closed&status&date&search&patient_id&exclude&ordering&page&page_size` → `Paginated<Ticket>`. Default ordering `-created_at` (open) or `-closed_at` (closed); no `case` returns both (Previous Consultations).
- `GET …/consultations/assignable-staff/` → `{id, name, role}[]` (active staff of the practice).
- `GET …/consultations/{id}/` → `TicketDetail`; also records the caller as `current_viewer_name`, as live. 404 "Consultation not found".
- `PATCH …/{id}/ {urgency}` (URGENT · ROUTINE_ONE_WEEK · ROUTINE_TWO_WEEK; sets `urgency_changed_by_clinician`).
- `POST …/{id}/assign/ {staff_id, reason?}` (≤300). `POST …/{id}/status/ {status, reason?}`: CLOSED needs a reason (≤300) and sets `closed_at`/`closed_by_name`/`closure_reason`; a closed case only accepts REOPENED.
- `POST …/{id}/notes/ {text, shared_with_patient}` (≤700) · `POST …/{id}/snomed/ {code, comment}` (≤200, no duplicates) · `POST …/{id}/messages/ {body, channels: SMS|EMAIL|APP|NHS_APP[], reply_allowed}` (≤1000; nothing is sent in the demo).
- Notes, SNOMED and messages return 400 while the ticket is unassigned or closed (live: read-only).
- `GET …/{id}/logs/` → `TicketLog[]` newest first. `GET /public/v1/snomed-codes/?search` (≥3 characters) → `{code, term}[]` from a short demo list.

## Appointments (phase 5, all inferred)
No appointment call was captured. Base `…/public/v1/sub-apps/{subAppId}/practices/{practiceId}/`. Types in `src/lib/api/types.ts` (`Appointment`, `AppointmentRequest`), client in `src/lib/api/appointments.ts`.
- `GET …/appointments/?week_start|date&type&severity&staff_id&status&search&ordering&page&page_size` → `Paginated<Appointment>`. `week_start` (a Monday) covers 7 days, `date` one day; neither means today. `ordering=start|-start` (default `start`). Search matches name, email and phone (spaces ignored).
- `GET …/appointments/summary/` (same filters, no `status`) → `{upcoming, in_progress, dna, completed, cancelled}`. Upcoming includes Reschedule Requested; cancelled is both cancel statuses.
- `GET …/appointments/{id}/` → `Appointment` (ids look like `appt-2026-11-04-3`). 404 "Appointment not found".
- `POST …/{id}/cancel/ {reason}` (required, ≤300; Upcoming or Reschedule Requested only) → status CANCELLED_BY_STAFF. `POST …/{id}/reschedule/` (Upcoming only) → RESCHEDULE_REQUESTED. `POST …/{id}/complete/` and `…/dna/` once the appointment has started.
- Mock only: appointments are worked out per day from the practice's tickets (3–8 on weekdays, 0–2 on Saturdays), and the status follows the clock. Changes are kept in `appointmentChanges`.
- `GET …/appointment-requests/?requested_by&status&range=today|last_7_days|last_30_days&page&page_size` → `Paginated<AppointmentRequest>`, newest first. A pending request shows as EXPIRED 24 hours after it was made.
- `GET …/appointment-requests/summary/` → `{pending, approved_today, rejected_today}`. `POST …/{id}/approve/` and `POST …/{id}/reject/ {reason?}` (≤300), pending only.

## Staff on-boarding and Profile (phase 5)
Base `…/public/v1/sub-apps/{subAppId}/practices/{practiceId}/staff/`. Captured: the list (`?page&page_size&status`, live uses the organisation id; the rebuild uses the practice id) and `GET …/staff/bulk-import/`. Everything else is inferred. Types in `src/lib/api/types.ts` (`PracticeStaff`, `StaffDetail`, `StaffDocument`), client in `src/lib/api/staff.ts`.
- `GET …/staff/?tab=staff|invitations|archived&status&staff_type&search&ordering&page&page_size` → `Paginated<PracticeStaff>` (default `-invited_at`). Invitations are the 3 invite statuses; Archived is a flag, not a status (live loads `status=INACTIVE`).
- `GET …/staff/summary/` → `{total, active, pending_invitations}` (archived people left out). `GET …/staff/roles/` → `{id, name}[]` (practice-scoped, so practice users can invite).
- `GET …/staff/bulk-import/` → `{template_name, roles, staff_types}`. `POST …/staff/bulk-import/ {rows: {first_name, last_name, email, role, staff_type}[]}` → `{created, errors: {row, message}[]}` (row numbers count the header as row 1).
- `POST …/staff/invite/ {first_name, last_name, email, role_id, staff_type}` → `PracticeStaff` (Pending Invite). 400 for a missing/invalid email, a duplicate email, or an unknown role or staff type.
- `POST …/staff/{id}/lock|unlock|archive|unarchive|approve|reject|resend-invite/ {reason?}`: each only from the matching status (e.g. approve/reject from Pending Approval). You can't lock or archive yourself.
- `GET …/staff/{id}/` (`me` = the signed-in user) → `StaffDetail` with `account`, `leave` (hours), `competencies`, `payroll` and `documents`. `PATCH …/staff/{id}/ {tab, data}` saves one tab; leave is read-only for yourself. Saving Account Details on a Pending Profile record moves it to Pending Approval.
- `POST …/staff/{id}/documents/{key}/ {file_name, issue_date?, expiry_date?}` → Pending Verification (expiry required for expiring certificates). `…/verify/` and `…/reject/ {reason}` (required, ≤300) from Pending Verification; not on your own documents. `POST …/staff/{id}/payroll-documents/{P45|HMRC_STARTER_CHECKLIST|TAX_CODE_UPDATE}/ {file_name}`.
- `POST /users/v1/me/password/ {current_password, new_password}`: demo only, checks the current password is "demo" and the new one meets the captured rule; nothing is stored.
- Mock only: the CQC dashboard status (`…/staff/dashboard/`) is worked out from each person's documents (worst first: Rejected, Expired, Re-verification Due, Pending Upload, Pending Verification, else Compliant), so it matches the Compliance tab.

## Practice ROTA (phase 5, all inferred)
Base `/rota/v1/sub-apps/{subAppId}/`. Types in `src/lib/api/types.ts`, client in `src/lib/api/rota.ts`.
- The phase 4 GETs take `practice_id`: `assignments?week_start&practice_id…`, `available-staff?date&practice_id` (that practice's rota people, its other active staff, and the practice-user persona) and the staff activity `?practice_id&duty_type`. Practice users may call them for their own practices; without a practice id they stay admin-only.
- Shifts now carry `series_id`, `recurring`, `series_start_date`, `series_end_date`, `repeat_days`, `appointment_types`, `urgencies`, `break_start`, `break_end`.
- `POST assignments {staff_id, practice_id, type: ONCE|RECURRING, start_date, end_date?, days?, slots: {start_time, end_time}[], duty_type, appointment_types, urgencies, break_start?, break_end?}`: not in the past; slots don't overlap; duty type, appointment type and Routine / Urgent required; a break must sit inside a slot. Each slot is its own series.
- `PATCH assignments/{shiftId}?scope=CURRENT|FOLLOWING|ALL {start_time, end_time, duty_type, appointment_types, urgencies, break_start?, break_end?}` and `DELETE assignments/{shiftId}?scope=`: stored as an edit or delete of the series over that range (Current = that day; Following = that day on; All = the whole series). Past shifts can't be changed.
- `GET published-slots?practice_id` → `PublishedSlot[]`, today onwards for 4 weeks, with `bids`, `my_bid` and `declined` for the caller. `POST published-slots {practice_id, date, start_time, end_time, staff_type, rota_group_ids, role_ids, duty_type, rate_per_hour, bidding_closes, repeat_weekly, repeat_until?, notify}` (admins). `POST published-slots/{id}/claim`, `…/decline`, and `…/bids/{bidId}/accept` (admins; the slot becomes a Once shift for the bidder and leaves the list). Seeded Wednesday slots get one fictional bid each.
- `GET rota-templates?practice_id` (only that practice's, fixing live) · `POST rota-templates {name ≤30, practice_id, rota_group_id, staff_ids, start_date, end_date (≤4 weeks), include_bank_holidays}` copies those staff's shifts in the range · `PATCH rota-templates/{id} {name}` · `DELETE rota-templates/{id}` · `POST rota-templates/{id}/apply {start_date, clear_existing}` → `{created}` (Once shifts; `clear_existing` first deletes those staff's shifts at that practice in the range).

## Leaves (phase 5, all inferred)
Base `/public/v1/sub-apps/{subAppId}/practices/{practiceId}/`. Types in `src/lib/api/types.ts`, client in `src/lib/api/leave.ts`. Durations and balances are hours; `day_hours` is the person's contracted day, for "X days (Y h)".
- `GET leave-requests/?tab=requests|history&staff_id&role_id&leave_type&status&search&ordering&page&page_size` → paged `LeaveRequest` (`requests`: pending; `history`: approved and rejected). Each row has `balance_hours` (null: no fixed entitlement), `warnings: {kind: ROTA_CLASH|LOW_BALANCE, message}[]` and `is_own`.
- `GET leave-requests/staff/` → `{id, name, role_id, role_name}[]` (the Staff filter).
- `POST leave-requests/{id}/approve/` · `POST leave-requests/{id}/reject/ {reason? ≤300}`: pending only; 400 "You can't approve your own leave request." for your own.
- `GET me/leave-requests/?from&to&leave_type&status&ordering&page` → the caller's requests at the practice (`from`/`to` match any overlap).
- `GET me/leave-balances/` → `{day_hours, schedule: {DAY: hours}, bank_holidays, year, balances: {leave_type, entitlement_hours, taken_hours, pending_hours, remaining_hours}[]}`; 404 when the caller isn't on the practice's staff.
- `POST me/leave-requests/ {leave_type, start_date, end_date, duration_hours, notes ≤300}`: no past start except sick leave; the duration must fit the working hours in the dates; no overlap with your own pending or approved leave. `POST me/leave-requests/{id}/cancel/`: pending only.
- The live app's paths weren't captured; the rebuild also scopes "my leave" to the practice (`…/practices/{id}/me/…`).

## HR Policies (phase 5, all inferred)
Base `/public/v1/sub-apps/{subAppId}/practices/{practiceId}/hr-policies/`. Types in `src/lib/api/types.ts`, client in `src/lib/api/hrPolicies.ts`.
- `GET ?category&search&ordering&page&page_size` → paged `HrPolicy` `{id, title, category, owner_id, owner_name, effective_date, description, version, file_name, file_size, sections: {number, heading, text}[], uploaded_by, updated_at}`. Categories: STAFF_HANDBOOK, LEAVE, SICKNESS, FAMILY_LEAVE, EXPENSES, CONDUCT, GRIEVANCE, HEALTH_SAFETY, EQUALITY, OTHER.
- `GET owners/` → `{id, name, role_name}[]` (the Owner select).
- `POST {title ≤120, category, owner_id?, effective_date?, description ≤500, file_name (.pdf/.docx), file_size ≤10 MB}` → the new policy, version 1. `POST {id}/replace/` (same body) → version + 1. `DELETE {id}/` → `{id}`. Managing is super-admin only in the mock.
- `POST ask/ {question ≤1000}` → `{question, found, answer, sources: {policy_id, policy_title, section, heading, quote}[]}`.
- The demo sends file names only (no upload).
