# Phase 5 plan: practice modules

**Status: approved 2026-11-02, with every proposed default for questions 1–10** (SheetJS, "X days (Y h)", Archive + Unarchive enabled, self-approval blocked, read-only capture session first, 0-12/13-15/16-44/45+, "my shifts" on Leaves and ROTA, HR Policies hidden for practice users, keyword answers from 6 demo policies). Capture session done 2026-11-03.

**Progress:** Patients built (2026-11-03). Built notes:
- The practice anatomy is in place: `PracticeShell` shows a `Dashboard › …` breadcrumb set by pages with `usePracticeCrumbs` (only the current crumb on phones). `PracticeContext` also gives `usePracticeHref`.
- Extensions: `ModulePageHeader` optional `icon` and `titleAdornment`, `GoBackLink variant="pill"`, `ConfirmDialog requireReason`. New: `LabelValueList`. Token group `patient` (note card colours).
- 40 fictional patients for each of the 3 demo practices (999 NHS numbers, 07700 900xxx phones, example.com emails). The mock database key moved to `aqlios-mock-db-v7`.
- Patient detail pages are pre-built for the demo practices. Static export rejects an empty param list, so every other practice gets one `…/patient-management/none/` page that shows "Patient not found"; other ids go through the not-found fallback.
- Edit Details puts Cancel and Save Changes in the Patient Information card's header (top right of the form).
- Archived patients open read-only with an info banner. A deregistered patient shows the reason in a banner.
- Fixed a racy step in the phase 4 pathway test (a failed save can flip the switch back before `uncheck()` sees it).

**Progress:** Tickets built (2026-11-03). Built notes:
- 60 open and 8 closed fictional tickets for each demo practice, across 12 complaint types, with transcripts, summaries, red flags, recommended actions and logs. Recommended and assigned staff are the practice's active staff. Mock database key `aqlios-mock-db-v8`.
- New components `ChatThread` and `ActivityTimeline`. Extensions: `TemplateCard action`, read-only `FormDrawer`, ticket status tones in `StatusChip`. No new tokens.
- Consultation Details is one column in the captured order, and two columns (summary, notes, transcript | chat, assign, details) on extra-wide screens (`xl`).
- Closed cases follow the capture: everything editable disabled, a banner with who, when and why, and **Reopen Case** (with a confirm) next to the status.
- Browse Templates lists active Message/Email templates (Note templates for Clinical Notes); Use Template fills the known placeholders from the ticket and practice.
- Previous Consultations is its own page listing the patient's other tickets, with the Requested Date filter. The patient Consultations tab now lists the patient's tickets.
- Send As (SMS, Email, Aqlios App, NHS App) and Patient Reply Allowed are kept; Save Message in Clinical System is disabled (no clinical system). Save Template from the captured composer is left out.
- SNOMED search uses a short list of 21 well-known SNOMED CT concepts (common conditions and symptoms) rather than invented codes.
- Copy fixes: "These actions are prescribed by the voice agent. Change them if you disagree." and "…selected by the voice agent. Change it if you disagree."

**Progress:** Appointment built (2026-11-04). Built notes:
- Appointments are worked out per day from each demo practice's tickets (3–8 on weekdays, 0–2 on Saturday mornings), with the status following the clock. Cancel, reschedule and outcome changes are stored as overrides. 10 fictional alternative-booking requests per demo practice (4 pending, 1 expired). Mock database key `aqlios-mock-db-v9`.
- Extensions: `StatsStrip variant="pill"` (icon, tint), `FilterBar` `disabled`/`disabledLabel`, generic `events`/`renderEvent` in `WeekCalendarGrid` (no ＋ targets without `onSlotClick`), appointment status tones in `StatusChip` (DNA is purple everywhere now, as captured). No new tokens or components besides the feature's own.
- The Date filter is shared by both views: empty means today (Table, Day) or this week (Week). Its captured placeholder ("This week", "This day", "Today") is shown in the label, as the date field always shows DD/MM/YYYY.
- Mark as Completed / Mark as DNA appear once an appointment has started and offer whichever outcome it doesn't have yet, so a wrong outcome can be corrected. Join Appointment is for video appointments, enabled only while in progress.
- Status filter: the 6 captured options plus Reschedule Requested. The popup footer says Close (live "Cancel" sat next to Cancel Appointment); the cancel confirm's secondary button is Keep Appointment.
- Consultation Details is reused at `appointment/consultation-review/{id}` (crumb Appointment, Back returns to where it was opened). Previous Consultations from there stays under Tickets.
- Date Range on Requests is a select (All dates, Today, Last 7 days, Last 30 days).

**Progress:** Staff on-boarding and Profile built (2026-11-04). Built notes:
- Each demo practice lists its existing staff plus 22 fictional people over all 9 statuses (mostly invites). Details and documents are worked out from the person's id until saved. Mock database key `aqlios-mock-db-v10`.
- The CQC dashboard now takes each person's status from their compliance documents, so the two always agree.
- Bulk Import uses a real `.xlsx` file (question 2, option A): SheetJS **0.20.3**, installed from cdn.sheetjs.com and pinned (the npm copy is stuck at 0.18.5, which has known security issues). The template has a Staff sheet (header and 2 sample rows) and a Guidance sheet (column rules, valid roles and staff types). SheetJS loads only when the template is downloaded or a file is imported. The file format is in `src/features/staff/staffImportFile.ts`.
- New components `FileDropzone` (with `LogoUploadDropzone` as its logo look), `PasswordField` (also on the login page) and `ComplianceDocumentRow`. Status tone for Pending Profile. No new tokens.
- Archive and Unarchive are enabled (question 4). Approve/Reject on Pending Approval rows; Resend invite is a labelled ↻ button. Practice users can invite, with a practice-scoped role list (the vertical roles list is admin-only), and can read the competency list.
- Leave entitlements are entered in days and stored in hours, using the person's contracted day length (question 3). Read-only on your own profile.
- Payroll Updates: an amount needs its reason and end date, and the other way round (live marks all six as required). Proof of Identity's "Choose Document" select isn't rebuilt.
- Associated Users 👁 opens the person's Staff Member Details in their first practice.

Phase 5 replaces the 11 practice pages that still say "Rebuild in progress". The practice frame, dashboard banner, practice switcher, the 12 `coming-soon/*` pages and the 4 practice placeholders (Documents, Recruitment, Performance, Support, Notifications) were already built in phase 2 and stay as they are. It also fills in the four "rebuilt in phase 5" notes left in phase 4:
- Assign Staff and shift click on the vertical ROTA
- Create and Apply Rota Template
- Staff 👁 in Associated Users

Base route: `/verticals/public/practices/{slug}/…`. The practice always comes from the URL slug (approved in phase 2).

| # | Module | Route (as live) | Spec |
|---|---|---|---|
| 1 | Patients | `patient-management`, `patient-management/{patientId}` | `docs/practice/01-patients.md` |
| 2 | Tickets | `consultations-review`, `consultations-review/{consultationId}` | `docs/practice/02-tickets.md` |
| 3 | Appointment | `appointment` | `docs/practice/03-appointment.md` |
| 4 | Staff on-boarding and Profile | `staff`, `staff/{staffId}`, `profile` | `docs/practice/05-staff-onboarding.md`, `docs/practice-user/00-practice-user-role.md` |
| 5 | Practice ROTA | `rota` (`?module=shiftBidding`, `?module=activityTracker`) | `docs/practice/06-rota-management.md` |
| 6 | Leaves, and Leaves and ROTA | `leave-management`, `leave-and-rota` | `docs/practice/07-leaves-and-leaves-rota.md` |
| 7 | HR Policies | `hr-policies/ask`, `hr-policies/library` | `docs/practice/08-hr-policies-and-settings.md` §1 |
| 8 | Practice Settings | `settings/{section}` | `docs/practice/08-hr-policies-and-settings.md` §2 |

**Proposed order:** the order above (REBUILD-PLAN.md §5). Each module is built, tested, committed and deployed on its own, as in phase 4. Practice Settings goes last because it mostly reuses phase 4 screens.

---

## Applies to every module

### Practice page anatomy
The live practice pages don't follow the vertical anatomy:
- The top bar shows a breadcrumb (`Dashboard › Patient Management`) instead of the page title.
- There's no grey panel and no icon tile.
- Titles sit directly on the page, some at weight 400 and some bold.

The rebuild uses **one practice anatomy**:
- `PracticeShell` top bar with the breadcrumb.
- `ModulePageHeader` without an icon tile: title, subtitle and actions on the right. All titles use the same bold weight.
- Content in white rounded cards on the grey background.
- This is the same choice approved for titles in phase 4.

### Fixes and live behaviour applied throughout
- **Dates and times:** `DD/MM/YYYY` everywhere. Long dates ("7 October 2026 at 13:37") become `DD/MM/YYYY HH:mm`, and all times are 24-hour.
- **Confirms:** every confirm uses `ConfirmDialog`, with focus on Cancel. Button wording follows one rule: Cancel plus a verb ("Cancel Appointment", "Mark as Completed").
- **Pagination:** one style ("Rows per page", 10/25/50, "1–10 of N"), as approved for phase 4.
- **Status chips:** one style, `StatusChip`. Live mixes outlined and tinted chips per module.
- **Clinical system buttons** (Fetch from / Send to / Open in Clinical System): the demo has no clinical system. Fetch shows an info toast "No clinical system is connected in this demo." Send and Open stay disabled, as live.
- **Fictional data only:** patients, staff, tickets, transcripts, notes and policies are all written for the demo. Live test entries ("tEST", "asthama", "Aqlios Test") aren't copied.
- **Error states:** reachable with the mock failure switch.

### Detail pages on static hosting
Patient, consultation and staff detail pages have ids in their paths. They're pre-built for the seeded records of the 3 demo practices. Anything else (another practice, or a record created in the demo) opens through the not-found fallback added in phase 4, at the same URL.

---

## 1. Patients

### 1a. Patient Management list: `patient-management`
**Layout:**
- Breadcrumb `Dashboard › Patient Management`.
- Header **Patient Management** / "Manage patient registrations." (fixes the live "Manage Patients registration.").
- `FilterBar`: Registration Type (15 captured options) · Registration Date (date picker) · full-width search "Search by Name, NHS #, Phone No or email ID".

**`DataTable` columns:**
- **#** and **Patient Name** (with "NHS: 123 456 7890" below).
- **Status:** an icon with a tooltip for the 4 captured registration statuses.
- **Phone Number**, **Email**, **Registration Type** chip.
- **Carer:** the name plus ⓘ, with a tooltip showing the captured "Carer Information" fields.
- **Postcode**, **Date of Birth**, **Sex at Birth**.
- **Actions:** 👁 View and 🗄 Archive.

**Archive:**
- `ConfirmDialog` (warning tone): "Archive {name}? They will be moved out of the active patient list." with the callout "Archived patients can no longer be managed from this list." (captured copy).
- Toasts "Patient archived." / "Failed to archive the patient".

**States:**
- **Loading:** skeleton rows.
- **Empty:** "No registered patients yet." (live, no filters set) or "No patients found. Try another search." (filters set).
- **Error:** "Failed to load patients".

### 1b. Patient Details: `patient-management/{patientId}`
**Header:**
- Breadcrumb `… › Patient Details` · `‹ Back` pill · **Patient Details**.
- Chips: registration type and **Carer Verified**.
- Actions:
  - Open in Clinical Systems (disabled).
  - **Deregister Patient:** red outlined, with a confirm (copy below).
  - **Edit Details:** cyan.

**Collapsible cards** (`FormSectionCard`):
1. **Manage Registration:** Registration Type · Registration Status (4 options) · NHS Number · **Save Status**.
2. **Additional Notes:**
   - **Add Note**: an inline textarea, 0/1000.
   - Yellow note cards with 🗑 (confirm "Delete note?"), "Added By" and the date.
3. **Patient Information:**
   - Read-only fields with an **Edit Details** mode. The live edit form wasn't captured: it uses the same fields as outlined `TextField`s, with Yup checks for name, DOB, email and phone.
   - Badge "Not synced with clinical system" (fixes the live wording).
4. **Carer Information:** read-only, with the Carer Verified badge.
5. **Contact Patient:** `SegmentedTabs` Call · Message · Email.
   - **Call:** phone number with **Copy Phone Number**, After Call Feedback (0/1000) and **Save Feedback**.
   - **Message and Email** (captured 2026-11-03): the prefilled phone number or email address, then a 2000-character text box ("Write an SMS to the patient." / "Write an email to the patient.") with a counter, and **Send Message** / **Send Email**, disabled while empty. There's no template picker, subject or sent list, as in live.
6. **Medical Requests:** tabs Health Records | Consultations.
   - **Health Records:** file rows with 👁. The viewer is a dialog with a placeholder preview of the file (no real files in the demo).
   - **Consultations:** this patient's tickets, each linking to Consultation Details. Inferred: live loads these from the clinical system and the call never returned during the capture. Shows a spinner, then "No consultations found."

**Deregister Patient:**
- `ConfirmDialog` (error tone) with a required **Reason** (max 300).
- The copy is proposed: "Deregister {name}? They will no longer be registered at this practice."
- Afterwards the patient shows as "Patient Not Registered".

**States:**
- **Loading:** full-panel spinner.
- **Unknown id:** `AccessDenied` "Patient not found".
- **Success toasts:** "Registration status saved", "Note added", "Feedback saved", "Patient details updated", "Patient deregistered" (proposed copy).

**APIs (all inferred):**
- `GET`/`PATCH …/practices/{practiceId}/patients/` and `…/{patientId}/`
- `…/{patientId}/notes/`, `…/{patientId}/call-feedback/`, `…/{patientId}/messages/`
- `POST …/{patientId}/archive/`, `…/{patientId}/deregister/`

**Mock data:** about 40 fictional patients for each of the 3 demo practices:
- Some with carers.
- All registration types and statuses represented.
- Notes, health record files and call feedback on a few.

The other practices have none, so the "No registered patients yet." empty state can be demoed.

---

## 2. Tickets

### 2a. Tickets list: `consultations-review`
**Layout:**
- Breadcrumb `Dashboard › Tickets`.
- Header **Tickets** / "View and manage all tickets from your department as a care navigator."
- `SegmentedTabs` (brand tone): **Open Cases** | **Closed Cases**, kept in `?cases=closed`.
- Filters: Search · Status (Open Cases only; the 11 captured statuses) · Date Submitted.

**Open Cases table:**
- **Severity:** flag, with tooltip "Urgent" or "Routine".
- **Source:** Voice Agent or Web Triage.
- **Recommended Staff:** `—`, name + ⓘ "Recommended Staff", or a green name + ✅ "Assigned Staff".
- **Date & Time**, **Complaint Type**.
- **Patient Name:** with ⧉ "Copy patient name".
- **Age & Gender** chip and **Status** chip.
- **Actions:**
  - 👁 View consultation.
  - ✓ **Approve recommended staff** (disabled when nobody is recommended): `ConfirmDialog` "Assign {staff} to this consultation?"
  - 👤+ **Assign to Alternative Staff:** a `FormModal` with a required Staff select and an optional Reason.

**Closed Cases table:** Patient Name · Source · Case Type · Date Closed (sortable, sorted by default: fixes live) · Closed By · Reason for Closure · Actions.

### 2b. Consultation Details: `consultations-review/{consultationId}`
**Header:**
- `‹ Back` · **Consultation Details** · chip **"Current Viewer: {name}"**. Opening a ticket records you as its viewer, as live.
- Clinical system bar (see "Applies to every module").
- Patient name ⧉.
- **Previous Consultations:** a menu of this patient's earlier tickets.
- **View Logs** · **Update Status** · the status chip.
- Info alert "This consultation is unassigned and read-only. Assign a staff member to enable actions…" while unassigned.

**Cards:**
1. **Summary tabs** (`SegmentedTabs`, brand tone):
   - **Consultation Summary:** label/value rows, "Not provided" in italics, and the Red Flags box.
   - **SNOMED codes:**
     - Search (min 3 characters) against a small fictional code list, plus an optional Comment.
     - **Add and Save to Aqlios.** "Add and Save to Clinical System" is disabled.
     - A table of saved codes.
   - **Requested Tests & Documents** and **Medication:** lists with the captured empty states.
2. **Chat with Patient:**
   - Preferred-method chip, ↻ refresh and ⤢ expand.
   - **Browse Templates** (Template Library message templates, with placeholders filled from the patient).
   - The message list and a composer (Send). Disabled while unassigned.
3. **Voice Agent Recommendations:**
   - Urgency radio cards: Urgent · Routine (1 Week) · Routine (2 Weeks).
   - The live helper says the agent picked one but none was selected. **Fix:** the agent's choice is pre-selected.
   - Recommended actions.
4. **Assign Staff Member:** `Select Staff *` and **Assign Task** (disabled until a staff member is chosen).
5. **Details:** label/value rows.
6. **Clinical Notes:**
   - Browse Templates (Note type), the textarea (0/700) and ☐ Share with patient.
   - **Save Notes to Aqlios.** Save to Clinical System is disabled.
   - Saved notes are listed with author and time.
7. **Voice Consultation Transcript:** chat bubbles (AI Assistant on the left, patient on the right), in a scrolling area.

**Update Status:**
- A `FormModal` with a Status select. Choosing **Closed** adds a required **Reason for Closure**.
- Fix: a reason list (Resolved, Duplicate, Patient no longer needs help, Referred elsewhere, Other) plus free text for Other, replacing live's junk free text.
- The case then moves to Closed Cases.

**Consultation Logs:** a right `FormDrawer`-style drawer (white header, the same as the other drawers; live uses a cyan header) with a timeline of events, role chips and timestamps.

**States:**
- **Loading:** spinner.
- **Unknown id:** `AccessDenied`.
- **Read-only while unassigned:** buttons disabled, as live.
- **Validation:** Assign Task needs a staff member; the Closed status needs a reason.
- **Toasts:** "Staff assigned", "Status updated", "Notes saved", "SNOMED code added", "Message sent" (proposed copy).

**APIs (inferred):**
- `GET …/practices/{practiceId}/consultations/?case=open|closed&status&date&search&page`
- `GET`/`PATCH …/consultations/{id}/`
- `POST …/{id}/assign/`, `…/{id}/status/`, `…/{id}/notes/`, `…/{id}/snomed/`, `…/{id}/messages/`
- `GET …/{id}/logs/`

**Mock data:** about 60 open and 8 closed tickets for each demo practice:
- Fictional complaints in the captured style ("Repeat Prescription Request" and so on).
- Generated transcripts, summaries and red flags.
- Every status represented.

---

## 3. Appointment: `appointment`

**Layout:**
- Breadcrumb `Dashboard › Appointment`.
- Top `SegmentedTabs` (brand tone): **Appointment** | **Appointment Requests**, kept in `?tab=requests`.
- Header **Appointment** / "Manage and schedule patient appointments".
- The Requests tab gets its own header: **Appointment Requests** / "Review requests to book a different staff member." (fixes the reused live header).

### Appointment tab
**View switch:** Calendar View | Table View, kept in `?view=table`.

**Calendar View:**
- `WeekCalendarGrid`, extended to draw appointments as well as shifts (see Components).
- Week navigator, Day | Week, one now-line style (the ROTA dashed line; live has two styles).
- Clicking an appointment opens the popup.
- Clicking an empty slot does nothing, as in live (captured 2026-11-03: live has no click handler there).
- Empty week: "No appointments for this period".

**Table View:**
- **5 stat cards** (Upcoming, In Progress, DNA, Completed, Cancelled) via `StatsStrip`, extended with an icon (see Components).
- **Columns:** Patient Name (link to Patient Details) · Request Name · Appointment Time · Type · Status · Duration · 👁.
- **Fixes:**
  - **Duration** is the real length, not the time since the appointment (live shows "1259 min").
  - **Type names:** one set, the practice's 4 appointment types plus "Online (Video)".

**Filters (both views):** Search · Appointment Type · Severity (disabled with "Select type first" until a type is picked) · Staff (no duplicate names) · Status (6 captured options) · Date · Clear filters.

**Appointment popup** (a `FormModal`-sized dialog, ~450px):
- **Summary card:** date tile, patient, staff, type, status chip.
- **Actions:**
  - **Join Appointment** opens the meeting link in a new tab (demo link), only during the appointment.
  - **Reschedule:** a confirm "…The patient will be asked to choose a new time." Afterwards the status shows "Reschedule Requested".
  - **Cancel Appointment:** a confirm with a required Reason (max 300, captured).
  - **Mark as Completed** and **Mark as DNA** (captured from code) are shown for past booked appointments.
- **View Request Details ›** links to the consultation (Tickets).
- **Appointment Information:** times shown 24-hour.
- **Patient Information:** with **View Full Profile ›** to Patient Details.

### Appointment Requests tab
- **3 stat cards:** Pending Approval, Approved Today, Rejected Today.
- **Filters:** Requested By · Status (Pending Approval, Approved, Rejected, Expired) · Date Range.
- **Table:** Patient Name · Original Recommendation · Requested Alternative · Reason · Requested By · Expires in · Status · Actions.
- **Pending rows:** **Approve** (confirm) and **Reject** (confirm with an optional reason, max 300), as in the Leaves pattern.

**States:**
- **Loading:** skeletons.
- **Empty:** per tab.
- **Error:** toast.
- **Validation:** cancel reason required.
- **Toasts:** "Appointment cancelled", "Reschedule requested", "Appointment marked as completed", "Appointment marked as DNA", "Request approved", "Request rejected".

**APIs (inferred):**
- `GET …/practices/{practiceId}/appointments/?week_start|date&type&severity&staff_id&status&search&page`
- `GET …/appointments/summary`
- `POST …/appointments/{id}/cancel|reschedule|complete|dna/`
- `GET …/appointment-requests/` and `POST …/{id}/approve|reject/`

**Mock data:**
- Appointments are worked out per week, like ROTA shifts: 3–8 a day per demo practice, with the practice's clinicians.
- Status follows the clock: past appointments are Completed or DNA, now is In Progress, later is Upcoming.
- Changes (cancel and so on) are stored as overrides.
- About 10 alternative-booking requests, a few still pending.

---

## 4. Staff on-boarding and Profile

### 4a. Staff Management: `staff`
**Layout:**
- Breadcrumb `Staff Management / Staff List` (it changes per tab).
- Tabs (`SegmentedTabs`): **Staff List · Sent Invitations · Archived Users**, kept in `?tab=`.
- White card with the title, **Bulk Import Staff** (outlined) and **Invite Staff** (filled).

**Staff List:**
- **3 stat pills:** Total Staff, Active Staff, Pending Invitations. The full labels show (fixes the cut-off "Active St…").
- **Filters:** Search · Status (10 captured) · Staff Type (16 captured) · Clear filters · Refresh.
- **Table columns:**
  - **Staff Name:** name, email and phone. Shows the email first when there's no name, as live.
  - **Staff Type**, **Practice**, **Status**, **Invited Date** (sortable).
  - **Actions:**
    - 👁 View.
    - 🗄 Archive (see below).
    - 🔒 Lock / Unlock: the captured Lock confirm, with the user card. Unlock gets a matching confirm.
    - **Approve / Reject** on Pending Approval rows.
- **Resend invite:** live chips like "Resent invite" look like links but have no tooltip. **Fix:** a ↻ **Resend invite** icon button with a tooltip and a toast "Invitation resent".
- **Archive staff** is permanently disabled in live. **Fix:** Archive with a confirm, then the person appears in Archived Users with an **Unarchive** action (see question 4).

**Sent Invitations** and **Archived Users** tabs: the captured filters and empty state "No archived staff. Adjust your filters or search term."

**Send Invite** (`FormModal`):
- First Name · Last Name · **Email \*** (fix: live has no required mark) · Role \* · Staff Type \*.
- The submit button reads **Send Invite** (fix: live says "Sync with Clinical System").
- The new row appears in Sent Invitations as Pending Invite.

**Bulk Import Staff** (`FormModal`):
- **Step 1:** **Download Template** (a real `.xlsx`).
- **Step 2:** upload `.xlsx` with drag and drop.
- **Import Staff** is enabled once a file is chosen.
- The file is read in the browser: valid rows become Pending Invite staff, and invalid rows are listed with their row number and problem (see question 2).

### 4b. Staff Member Details: `staff/{staffId}`, and Profile: `profile`
One page, used for both:
- **`staff/{staffId}`:** the managers' view.
- **`profile`:** the signed-in user's own record, with the extra **Security** tab and read-only leave and competency dates (as captured).

**Layout:**
- `‹ Back` · **Staff Member Details** · profile strip (initials, name, practice, rota group chip).
- **Save Changes** top right: one save for the current tab, disabled until something changes.

**Tabs** (kept in `?tab=`):
- **Account Details:** collapsible cards with the captured fields and options:
  - Personal Details
  - Professional Registration (with verification status text)
  - Background & Identity Verification
  - Address
  - Emergency Contact (`RepeatableItemCard`)
  - Rota groups (`RotaGroupSelect`)
  - Contract Details (date rules as captured; Locum duty types)
  - Availability (Sunday→Saturday `OperatingHoursRow`s with a weekly hours chip)
  - Employment Record. Leaving Reason gets real options; live loads none.
- **Leave Management:** entitlement cards. Units follow question 3.
- **Compliance:**
  - Counters, plus the 9 document groups with the captured document names.
  - Each row: Upload / Re-upload, with a file dropzone.
  - Status flow: Pending Upload → Pending Verification → Verified, Rejected or Expired. Managers get **Verify** and **Reject** (with a reason).
  - This feeds the vertical CQC dashboard, so the two match.
- **Competencies:**
  - Inbox, Staff Type, Age Groups. Fix: the age ranges don't overlap: 0-12, 13-15, 16-44, 45+ (see question 7).
  - Competency Mapping from Settings → Competency: Date Completed and sub-type checkboxes, search, Select All, plus the captured warning.
- **Payroll:**
  - Payroll Documents (P45, HMRC Starter Checklist, Tax Code Update) with Upload.
  - Pension Enrolment (4 options).
  - Payroll Updates (£ amounts, reasons, end dates) with validation.
- **Security** (Profile only):
  - Current / New / Confirm password, each with show/hide.
  - The captured rule "at least 12 characters and include an uppercase letter, a lowercase letter, a number, and a special character".
  - "Passwords do not match".
  - Saving in the demo checks the current password ("demo") and shows "Password updated". No real account is touched.

**Also fixes:** Associated Users 👁 (phase 4) now opens this page.

**States (both pages):**
- **Loading:** spinner.
- **Unknown id:** `AccessDenied`.
- **Validation:** per field, plus the red card border.
- **Toasts:** "Staff details saved", "Document uploaded", "Document verified", "Invitation sent", "{n} staff imported" (proposed).

**APIs:**
- ✔ `GET …/practices/{orgId}/staff?page&page_size&status`
- ✔ `GET …/practices/{practiceId}/staff/bulk-import/` (template info)
- ~ `POST …/staff/invite/`, `POST …/staff/bulk-import/`
- ~ `GET`/`PATCH …/staff/{id}/` per tab
- ~ `POST …/staff/{id}/documents/{type}/` (upload, verify, reject)
- ~ `POST …/staff/{id}/lock|unlock|archive|unarchive|approve|reject|resend-invite/`
- ~ `POST /users/v1/me/password/`

**Mock data:**
- About 25 staff per demo practice, across the 10 statuses and 16 staff types. The existing staff get a staff type and contract.
- Compliance documents with a status spread that matches the CQC dashboard.

---

## 5. Practice ROTA: `rota`

**Layout:**
- `SegmentedTabs`: **Staff Rota · Shift Bidding · Activity Tracker**, kept in the live `?module=shiftBidding` / `?module=activityTracker`.
- The sidebar's Activity Tracker item is highlighted on its tab (live can't).

**Staff Rota:**
- The vertical Rota Management tab, reused with the practice fixed:
  - No Practice filter and no practice side panel; the grid is full width.
  - Staff View keeps the staff panel.
- **＋ Assign Staff:** opens the **Assign Staff** drawer (a `FormDrawer`):
  - Staff (with role chip and weekly capacity).
  - Assignment Type **Once | Recurring**.
  - Start Date, End Date, and Repeat every week (day circles).
  - Number of hours, with the **Flexible Hrs.** switch, from–to times, and ＋ for another slot.
  - Duty Type \* · Appointment Type \* (multi) · Routine / Urgent \* (multi) · break hours.
  - Validation: end after start, at least one day for Recurring, duty type required (live saves without one).
- **Clicking a shift:** opens **Edit Assignment**, the same drawer with:
  - The scope radios (Current · Current and Following · All).
  - The assigned staff card with 🗑 (confirm "Delete Assignment").
  - Fix: the date chip shows the clicked day, not live's "Mon, 5 Oct".
- **Create Rota Template:** a `FormModal`. Name, then a week pattern built from the visible week's shifts (or blank), Save.
- **Apply Rota Template:** a "Choose Rota Template" `FormModal`:
  - Template list for this practice only. Fix: live lists other practices' templates.
  - Edit and 🗑 on each, each with an `aria-label`.
  - Date range and ☐ "Clear existing shifts before applying template", with its warning.
  - Apply.
- **Download Rota:** CSV, as at vertical level.

**Shift Bidding:**
- Published slots (from the rota's published gaps) as cards: date, time, duty type and the rate (£/hour).
- Staff can **Claim** or **Decline** (captured confirms).
- Managers see bids on each slot and **Accept Bid** (captured confirm), which turns the slot into a shift.
- Empty: "No shifts open for bidding right now."

**Activity Tracker:**
- The vertical tab without the Practice filter and Practice Name row, plus a Duty Type filter (as captured).

**Mock change:** shifts are still worked out per week, and assignments made in the demo are stored as additions, edits and deletions on top. The vertical ROTA shows them too.

**APIs (inferred):**
- `POST`/`PATCH`/`DELETE /rota/v1/sub-apps/{id}/assignments/` (scope param for recurring edits)
- `GET`/`POST`/`PATCH`/`DELETE …/rota-templates/?practice_id`, `POST …/rota-templates/{id}/apply/`
- `GET …/published-slots/`, `POST …/{id}/claim|decline|bids/{bidId}/accept/`

---

## 6. Leaves, and Leaves and ROTA

### 6a. Leave Management: `leave-management`
**Layout:**
- Breadcrumb `Dashboard / Leave Management`.
- Tabs **Leave Requests · Leaves History**, kept in `?tab=`.

**Leave Requests:**
- **Filters:** Staff (searchable) · Role · Leave Type (8 types) · search · Clear. The filter is called "Role" on both tabs (live mixes "Role" and "Roles").
- **Table:** Staff Name · Role · Leave Type · Balance · Start Date · End Date · Duration · Notes · Warnings · **View / Approve / Reject** (outlined pills, as captured).
- **View:** read-only details dialog.
- **Approve:** confirm.
- **Reject:** confirm with an optional reason (max 300). Both are captured.
- **Fixes:**
  - The duration is calculated from the dates and working hours. Live shows 7 days as "16 Hrs".
  - Balance shows a real value. Live shows "N/A".
  - **Warnings** flag clashes with the rota (shifts in the leave period) and low balance.

**Leaves History:** Staff · Role · Status (Approved, Rejected) · search · the table, with the empty state "No leave history found."

### 6b. Leaves and ROTA: `leave-and-rota`
**Layout:**
- **Leave History** / "Manage your leave requests here."
- **Apply For Leave** for staff (live shows it only to non-admin users; kept).

**Content:**
- **6 balance cards** (see question 3 for units).
- **Filters:** From · To · Leave Type · Status.
- **Table:** Leave Type · Start Date · End Date · Duration · Reason · Requested Date · Last Updated · Status · 👁. Pending rows get **Cancel request**, with the captured "Cancel this leave request?" dialog.
- **This week's rota:** my shifts this week and next, in a compact list linking to the ROTA. Live shows no ROTA content despite the page name; see question 8.

**Apply For Leave** (`FormDrawer`):
- Leave Type \* with a balance pill, Start / End Date \*, Duration \*, Duration Type (Hours / Days), Note (0/300).
- **Apply Leave** stays disabled until valid (live is enabled while empty).
- The ✕ gets its `aria-label`.

**Self-approval:** see question 5.

**APIs (inferred):**
- `GET …/practices/{practiceId}/leave-requests/?status&staff_id&role_id&leave_type&search&page`
- `POST …/{id}/approve|reject/`
- `GET …/me/leave-requests/`, `GET …/me/leave-balances/`
- `POST …/me/leave-requests/`, `POST …/me/leave-requests/{id}/cancel/`

**Mock data:** about 15 leave requests per demo practice across all types and statuses, a few pending. Balances come from each person's contract.

---

## 7. HR Policies: `hr-policies/ask`, `hr-policies/library`

**Layout:**
- Breadcrumb `HRM / HR Policies / Ask HR` (or `/ Policy library`).
- Route tabs (live routes) with icons.
- **Visibility:** as live, HR Policies stays hidden from practice users (phase 2 already blocks the route). See question 9.

**Ask HR:**
- **Empty state** (no policies): **Upload a policy**.
- **Suggested-question chips** fill the composer.
- **Composer:** multiline, Enter sends and Shift+Enter adds a new line, 0/1000, **Send** disabled while empty.
- **Conversation** (proposal, not captured): the question, then an answer that **quotes the matching clause and cites its source** ("Annual leave policy, section 3.2"). If nothing matches: "I couldn't find this in your practice's policies." See question 1.

**Policy library:**
- Category chips (single-select, 11 captured).
- Policy cards or rows: title, category, owner, effective date, version, and **View · Replace · Delete** (the captured "Delete policy?" confirm).
- Empty state as captured.

**Upload policy** (`FormModal`):
- Title \* · Category \* · Owner (staff select) · Effective date (MUI `DatePicker`, not the native input) · Description · a PDF/Word dropzone (max 10 MB).
- **Upload** stays disabled until valid (live is enabled while empty).

**Mock data:** 6 fictional policies with short clause text, written for the demo: Staff handbook, Annual leave, Sickness absence, Family leave, Expenses, Grievance. That's enough for the 4 suggested questions to get real answers. Uploaded files are stored as names only.

**APIs (inferred):**
- `GET`/`POST`/`DELETE …/practices/{practiceId}/hr-policies/`
- `POST …/hr-policies/ask/` → `{ answer, sources[] }`

---

## 8. Practice Settings: `settings/{section}`

**Layout:**
- The phase 4 `SettingsShell` with the practice's 5 sections as path routes, as live. It opens the first section (already decided in phase 2).
- Breadcrumb `Settings / {Section}`.

**Sections:**
- **Appointment Configuration:** the phase 4 Global Appointment form with practice values, via a practice-scoped API. Subtitle "Manage appointment settings here." (fixes the live capital A).
- **Competency:** the phase 4 section. Rows defined at vertical level are locked for practice users, with disabled ✎ and 🗑 and the captured tooltips "Can be edited via vertical settings" / "Can be deleted via vertical settings".
- **Pathway Configuration:** the phase 4 section plus a **Source** column (Same as Hub / Custom). Changing a channel on a "Same as Hub" row makes it Custom for this practice.
- **Practice Profile:** stays the live placeholder.
- **Templates:**
  - The phase 4 Template Library.
  - As approved in REBUILD-PLAN.md §8, practice users can still edit and delete standard (hub) templates, as live. A small dev note on the page says this affects every practice.

**APIs (inferred):** `…/practices/{practiceId}/appointment-configuration/`, `…/competencies/?practice_id`, `…/pathways/?practice_id` (+ `source`).

---

## Components

**Reused:** everything built so far, mainly:
`PracticeShell`, `ModulePageHeader`, `DataTable`, `FilterBar`, `PracticeFilterSelect`, `StatusChip`, `SegmentedTabs`, `ActionMenu`, `FormModal`, `FormDrawer`, `ConfirmDialog`, `FormSectionCard`, `RepeatableItemCard`, `OperatingHoursRow`, `AppSwitch`, `RotaGroupSelect`, `RichTextEditor`, `TemplateCard`, `MessagePreview`, `PermissionTree`, `SettingsShell`, `GroupedDataTable`, `StatsStrip`, `WeekCalendarGrid`, `ShiftBlock`, `CapacityCard`, `ActivityCard`, `RotaLegend`, `GoBackLink`, `AccessDenied`, `LoadingSpinner`. The phase 4 ROTA tabs and Settings sections are reused with a `practiceId` prop.

**Extensions to existing components (a prop or variant, no new component):**
| Component | Extension | Why |
|---|---|---|
| `PracticeShell` | `crumbs` prop: shows a breadcrumb in the top bar instead of the page title | Practice pages show `Dashboard › …` there |
| `ModulePageHeader` | `icon` becomes optional | Practice pages have no icon tile |
| `GoBackLink` | `variant="pill"` (white pill with shadow) | The practice `‹ Back` pill |
| `StatsStrip` | `variant="pill"` and an optional `icon` per item | Appointment, Staff and Leave stat cards (icon circle, label, big number) |
| `WeekCalendarGrid` | Generic `events` with a `renderEvent` function, alongside shifts and gaps | Appointments in the same grid; one now-line style |
| `LogoUploadDropzone` → `FileDropzone` | Generalised: `accept`, `maxSize`, `label`, `helperText`; the logo screen keeps its look through a `variant` | Bulk import, policy upload, compliance and payroll uploads |
| `ConfirmDialog` | `requireReason` (label, max length, required or optional) | Cancel appointment, reject leave or request, deregister |

**New (needs approval):**
| Component | Where | Why nothing existing fits |
|---|---|---|
| `LabelValueList` | `src/components/data/` | Label-left, value-right rows appear in 6 places (consultation summary and details, appointment information, leave request details, patient and carer read-only cards, original template). One component instead of 6 copies |
| `ChatThread` | `src/components/data/` | Bubbles left and right with name, time and an optional icon, in a scrolling area. Used by Chat with Patient, Voice Consultation Transcript, Patient messages and Ask HR |
| `ActivityTimeline` | `src/features/tickets/components/` | Consultation Logs: dot, actor and event, user line, role chip, timestamp. Nothing similar exists |
| `AssignmentDrawer` | `src/features/rota/components/` | Assign Staff / Edit Assignment form: scope radios, Once/Recurring, repeat-day circles, hour slots. Too specific to compose ad hoc, and used from both the practice and vertical ROTA |
| `ComplianceDocumentRow` | `src/features/staff/components/` | Document name, uploaded file, dates, status and upload/verify actions. Repeated about 40 times on the Compliance tab |
| `PasswordField` | `src/components/forms/` | Password input with a show/hide toggle. Extracted from the login page and reused 3 times on the Security tab |

**New dependency (needs approval):** **SheetJS** (`xlsx`, pinned to a release older than two weeks), to generate the Bulk Import template and read uploaded `.xlsx` files in the browser. See question 2.

## Tests (Playwright, desktop + phone)
One spec per module, as in phase 4.

**Patients:**
- Filters and the empty states.
- Archive.
- Details: save registration status, notes add and delete, call feedback, edit with validation, deregister with a reason.

**Tickets:**
- Open and Closed tabs.
- Approve recommended staff, and assign alternative staff.
- Details:
  - Viewer chip and read-only while unassigned.
  - Assign Task, then notes, SNOMED, chat with a template.
  - Close with a reason, and the row moves to Closed.
  - Logs drawer.

**Appointment:**
- Calendar and table toggle, filters, the Severity lock.
- Popup: cancel needs a reason, reschedule, complete and DNA.
- Requests: approve and reject.
- The duration shows the real length.

**Staff:**
- Tabs, filters, invite validation, then the new row in Sent Invitations.
- Bulk import: a valid and an invalid row.
- Lock and unlock, archive and unarchive, resend.
- Details: each tab saves; compliance upload and verify updates the CQC dashboard.
- Profile Security: password rules.

**ROTA:**
- Assign Staff, Once and Recurring.
- Edit with each scope, and delete an assignment.
- Create and apply a template.
- Claim a slot and accept the bid.
- Activity Tracker Duty Type filter.

**Leaves:**
- Approve and reject, and history.
- Apply For Leave validation and submit, then cancel the request.
- Rota-clash warning.

**HR Policies:**
- A suggested question gets an answer with a source.
- Upload validation, then delete.
- Category chips.

**Settings:**
- Practice appointment config saves.
- Locked competency rows for the practice user.
- Pathway Source turns Custom.
- Templates.

**Access:** each module for both personas (practice users keep their captured menu).

## Questions
1. **Approve** the eight modules, the six new components, the seven extensions and the build order?
2. **Bulk import:**
   - **(A)** Add SheetJS to make a real `.xlsx` template and read uploaded files (proposed).
   - **(B)** Use a `.csv` template and accept `.csv` only, with no new dependency.
3. **Leave units:** live mixes weeks, hours and days, and they disagree (4.1w vs 135.44 Hours vs 48.37 Hours). Store everything in hours and show **"X days (Y h)"** using the person's contracted day length (proposed), or keep the live per-type units?
4. **Archive staff** is permanently disabled in live. Enable it with a confirm plus Unarchive (proposed), or keep it disabled?
5. **Self-approval:** live lets an approver approve their own leave, and a practice user can approve a super-admin's. Block approving your own request, with the buttons disabled and a tooltip (proposed), or keep live behaviour?
6. **Not-captured screens.** Several were never opened:
   - Patient Message/Email tabs, the Consultations tab and the file viewer.
   - Closed case detail, Browse Templates, Previous Consultations.
   - Appointment Day view, booking from an empty slot, View Request Details.
   - Create/Apply Rota Template, Assign Staff.
   - The Ask HR answer view.

   Two options:
   - **(A)** A short **read-only capture session** in the dev app first, if you sign in: opening and cancelling only, as before. I'd then match those screens exactly (proposed for this phase, because there are many).
   - **(B)** Build them from the proposals above, marked as inferred.

   Calendar booking stays out either way unless captured.
7. **Age Groups** on Competencies: the live ranges overlap (13-16, Above 16, 16-45). Use 0-12 / 13-15 / 16-44 / 45+ (proposed), or keep the live labels?
8. **Leaves and ROTA:** add "my shifts this week and next" (proposed, so the page matches its name), or keep it leave-only as live?
9. **HR Policies for practice users:** live hides it, though Ask HR is meant for staff. Keep it hidden as live (proposed default, as in phase 2), or show Ask HR to practice users and keep the library for managers?
10. **Ask HR answers:** answer from the 6 demo policies by matching keywords and quoting the clause (proposed), or show the composer with a "Coming soon" note for the answer?

## Capture session checklist (question 6A)

Read-only: open, read, screenshot, then Cancel / ✕ / Esc. Nothing is sent, saved, assigned, approved or uploaded. Captures go into the matching `docs/practice/*.md` spec under a "Captured 2026-11-02" note.

| # | Screen | Where | How (open and cancel only) |
|---|---|---|---|
| 1 | Patient Message and Email tabs | Patient Details → Contact | Open each tab, read the composer, don't send |
| 2 | Patient Consultations tab | Patient Details → Medical Requests | Open the tab |
| 3 | File viewer | Patient Details → Health Records | Open one file, close it |
| 4 | Closed case detail | Tickets → Closed Cases → 👁 | Open one closed case |
| 5 | Browse Templates | Consultation Details → chat | Open the picker, close it |
| 6 | Previous Consultations | Consultation Details | Open the panel |
| 7 | Appointment Day view | Appointment → Day | Switch view |
| 8 | Booking from an empty slot | Appointment calendar | Click an empty slot, then Cancel |
| 9 | View Request Details | Appointment Requests → View | Open, close |
| 10 | Create / Apply Rota Template | Practice ROTA | Open each modal, then Cancel |
| 11 | Assign Staff | Practice ROTA → open slot | Open the drawer, then Cancel |
| 12 | Ask HR answer view | HR Policies → Ask HR | Read the empty composer only. Asking a question is a submit, so only with your explicit OK |

### Capture results (2026-11-03)

Full notes are in the "Captured 2026-11-03" sections of `docs/practice/01, 02, 03, 06, 08`. What changes in the plan:

| # | Result | Plan change |
|---|---|---|
| 1 | Captured | Message/Email match live: no template picker or sent list (1b updated). Send stays disabled while empty for both (live leaves Send Email enabled). |
| 2 | Not capturable (the clinical system call hangs) | Consultations tab stays inferred (1b updated). |
| 3 | Not capturable (the documents call fails with "Request timed out…") | File viewer stays inferred. |
| 4 | Captured | Closed case: everything editable is disabled, with a closed banner showing who, when and why, and a **Reopen Case** button in Clinical Actions (with a confirm, inferred). Update Status is disabled. |
| 5 | Captured | Browse Templates is a 1200px dialog with Standard / Staff Created tabs, a category rail, Search + Type filters, cards with **Use Template**. Reuses the phase 4 `TemplateCard`. |
| 6 | Partly (page shell only) | Previous Consultations is its **own route** `consultations-review/{id}/previous-consultations` with a Requested Date filter, so it needs a static-param or 404-fallback entry. The results list is inferred. |
| 7 | Captured | Day view: one column, 48 half-hour rows, nav labels "Previous day / Next day", date filter "This day". |
| 8 | Captured: doesn't exist | No booking from empty slots (3 updated). |
| 9 | Captured: no popup | "View" opens Consultation Details at `appointment/consultation-review/{id}`, so ConsultationDetailsPage is reused on a second route. |
| 10 | Captured | Create Rota Template (600px) and Choose Rota Template (700px) fields and copy recorded. Apply lists only this practice's templates (live shows others). |
| 11 | Captured | Assign Staff opens by **dragging** a time range on a future day. The drawer has two modes, **Assign Staff** (available staff with weekly capacity) and **Publish Slot** (contract, groups, roles, duty type, bidding timeline, repeat, notifications). `AssignmentDrawer` gets a `mode` switch. Keyboard access is added (Enter on a slot). |
| 12 | Composer only | The empty state, 4 suggestions, 1000-character composer and helper text are captured. The answer view stays as proposed (question 10). |
