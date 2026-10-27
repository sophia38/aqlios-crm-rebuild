# Practice user · Role overview and module differences

Captured 2026-10-27, signed in as **Aliii Emis** (staff record "Ali Emis - 201", GP, Clinician inbox) in **Public Primary Care → Main Practice - Surgery**. `/api/auth/me` returns `isAdmin: false` with an **empty `role`**.
Every module in this role's sidebar was opened read-only. A page guard blocked all writes except the app's own practice-select call (see "Entry flow"). Screens that look the same as the super-admin capture link to the existing doc; this page records **only what differs**.

## Entry flow
1. Login → `/verticals` → **Public Primary Care** → `/verticals/public/practices`.
2. **Practice grid:** only the practices this user belongs to (**2**: Abbey Medical Centre, Main Practice - Surgery; `1–2 of 2`).
   - Header pill: logo and vertical name in the centre, 🔔, user pill **"Aliii Emis / Actions"** (subtitle "Actions" where super-admin shows "super-admin").
   - **No ☰ hub menu and no "Back to Verticals"** button.
   - Hub routes (`/compliance-dashboard`, `/roles`, `/templates`, `/settings` …) **redirect** back to the grid.
3. Clicking a practice sends:
   - `PATCH /api/crm/api/users/v1/sub-apps/{subAppId}/users/{userId}/user-businesses/{practiceId}/select`, which stores the current practice on the server.
   - `POST /api/crm/api/activity/v1/sub-apps/{subAppId}/user-sessions` (activity tracking).
   - Super-admin sends neither: it keeps the practice in client state only.
4. If the select call fails, the grid shows a **raw red MUI Alert with the bare error message** (seen as "blocked by capture guard") and stays on the grid.

## Shell differences
| | Super-admin | Practice user |
|---|---|---|
| Sidebar extra item | — | **Profile** (`/profile`, under Dashboard, same icon as the top bar) |
| HR Policies | ✓ | **Not in the menu** |
| Sidebar user card | "Aqlios Admin · super-admin" | **"Aliii Emis"** only, with no role line |
| 🔔 top bar | plain | **red unread dot** |
| Dashboard banner | "Welcome, Aqlios!" | "Welcome, **Aliii**!" / "You are in Public Primary Care" |

Every other item, including the 12 `coming-soon/*` pages and the 4 practice placeholders (Recruitment, Performance, Support, Notifications), matches `docs/practice/00-practice-shell-and-module-map.md` and `04-documents-and-placeholders.md`. **CQC Compliance** is `coming-soon/cqc-compliance` here as well. Documents doesn't appear in this role's menu.

## Module by module
| Module | Same as super-admin? | Differences |
|---|---|---|
| Dashboard | Yes | Name only |
| **Profile** | **New** | See below |
| Patients | Yes (`01-patients.md`) | View and Archive are both available |
| Tickets | Yes (`02-tickets.md`) | Same care-navigator table and actions (View consultation, Approve recommended staff, Assign to Alternative Staff) |
| Appointment | Yes (`03-appointment.md`) | Calendar empty for this week. **Clear filters is disabled** when no filter is set (it was enabled for super-admin) |
| Staff on-boarding | Yes (`05-staff-onboarding.md`) | Bulk Import Staff and Invite Staff are available. Lock user is enabled on active rows; Archive staff is disabled as everywhere. Counts at capture: 56 total, 20 active, 35 pending |
| ROTA Management | Yes (`06-rota-management.md`) | Same tabs and buttons (Create and Apply Rota Template are available) |
| Leaves | Yes (`07-…`) | **Can Approve and Reject** the super-admin's leave requests |
| **Leaves and ROTA** | **Differs** | Real balances and **Apply For Leave**. See below |
| Settings | Mostly | Competency rows defined at vertical level are locked. Template actions include Edit, Mark as Inactive and Delete on **standard (hub) templates**. See below |

### Profile: `/profile` (the user's own staff record)
Same page as **Staff Member Details** in Staff on-boarding (`05-staff-onboarding.md`), opened for the signed-in user:
- Header: `‹ Back` · **Staff Member Details** · Save Changes (top right, disabled until something changes).
- Identity card: initials avatar, "Ali Emis - 201", practice, "Rota Group: Croft Hall Rota Group, Primary Rota Group".
- Tabs: Account Details · Leave Management · Compliance · Competencies · Payroll · **Security** (the extra tab).
- **Security** card: 🔒 tile, "Security" / "Manage your password and account protection settings." Fields:
  - `Current Password *`, `New Password *` (helper "Password must be at least 12 characters and include an uppercase letter, a lowercase letter, a number, and a special character."), `Confirm New Password *`.
  - Each field has a 👁 toggle ("Show current password" and so on).
  - Saved with the page-level **Save Changes**.
- **Leave Management tab** (read-only for self):
  - Annual Leave Entitlement: **48.37 Hours • 7.33 Days**, Duration Type Weeks, "Annual Leave Balance: 4.1 weeks", with the note "…automatically calculated based on the joining date (01 Apr 2026) for the current leave year: 4.1 weeks."
  - Sick Leave Entitlement: "40 Hours • 1 Week", "Sick Leave Balance: 1.21 weeks".
  - Other Leaves Entitlement: "No Fixed Entitlement".
- **Compliance tab:** the user's own documents, with **Upload / Re-upload** enabled on non-verified items and disabled on verified ones.
- **Competencies tab:** Consultation Details (Inbox, Staff Type), Age Groups (0-12, 13-16, Above 16, 16-45, 45+), Competency Mapping with "Date Completed" pickers disabled.
- **Payroll tab:** Payroll Documents table with Download/Upload, Pension Enrolment radios (No Pension, NHS Pension, GP Salaried Pension, NEST Pension), Payroll Updates (Deduction / Additional Payment, with amount, reason and end date).

### Leaves and ROTA: `/leave-and-rota` (self-service leave)
- Card **Leave History** / "Manage your leave requests here." · **Apply For Leave** button (top right, dark teal). It isn't shown for super-admin: the code shows it only to non-admin users with `APPLY_FOR_LEAVE`.
- Balance cards now show real values:
  - **Remaining Annual Leave 4.1w** "Out of 4.1 Weeks"
  - **Remaining Sick Leave 40h** "Out of 40 Hours"
  - TOIL 0h, Bereavement 0d, Compassionate 0d and Maternity 0d, each "Approval Required"
- Table empty: **"No leave records found."** (Leaves History in Leave Management says "No leave history found.")

**Apply For Leave drawer** (right drawer, 480px, 18px radius; opened and cancelled):
- Title **Apply For Leave** + ✕ (**no aria-label**) · "Fill the form below to apply for leave."
- `Leave Type *` (default Annual Leave): Annual, Sick, Maternity, Paternity, Bereavement, Emergency, Compassionate, TOIL Leave (Time Off in Lieu).
- Grey balance pill under the type: **"Annual Leave Balance: 135.44 Hours"**.
- `Start Date *` · `End Date *` (date pickers, side by side) · `Duration *` · `Duration Type`: **Hours / Day**.
- `Note` textarea (placeholder "Write your message here (Optional)", `0/300`).
- Footer: **Cancel** (outlined pill) · **Apply Leave** (dark teal pill, enabled while empty).
- Cancelling a pending request uses the "Cancel this leave request?" dialog (`docs/practice/09-confirmation-popups.md`).

### Settings (practice)
| Section | Practice user |
|---|---|
| Appointment Configuration | Same form. Cancel and Save Changes are **disabled until a change is made**; 4 of 36 inputs are disabled |
| Competency | Add Competency available. Rows defined by the vertical have **disabled ✎/🗑** with tooltips "Can be edited via vertical settings" / "Can be deleted via vertical settings" (3 of 6 rows locked) |
| Pathway Configuration | Same; practice counts (e.g. Administrative 3 of 5, Cardiovascular 2 of 7, Men's Health 1 of 1) |
| Practice Profile | Placeholder (same) |
| Templates | Same 27 templates. ⋮ menus: standard: View Details · **Edit Template · Mark as Inactive/Activate · Delete Template**; staff-created: View Details · Edit Template · Move to Standard · **Mark as Inactive** · Delete Template |

## Issues found
- **The practice user can edit, deactivate and delete standard (hub) templates** from practice Settings. Those templates are shared across the vertical, so one practice can remove them for every practice.
- **The practice user can approve or reject a super-admin's leave**, and the Leaves approver list isn't limited to the user's own team.
- **Leave balance units disagree across three screens:**
  - Annual leave: the card says 4.1w, the drawer says 135.44 Hours, and the profile says entitlement 48.37 Hours • 7.33 Days. 4.1 weeks is not 48 hours.
  - Sick leave: the card says 40h, the profile says "1.21 weeks" balance and "40 Hours • 1 Week" entitlement.
- **Duration Type options mix plural and singular:** "Hours / Day".
- **Apply Leave is enabled with an empty form**, and the drawer's ✕ has no aria-label.
- **`/api/auth/me` returns an empty `role`** for this user, so the UI shows "Actions" in the user pill and no role on the sidebar card.
- **A failed practice-select call shows a raw error string** in a red alert on the grid.
- **Empty-state wording differs:** "No leave records found." vs "No leave history found."
- **Hub routes silently redirect** non-admins to the grid. There's no "no access" message.
- **HR Policies is missing for this role**, although it's a staff-facing feature (Ask HR is meant for staff).
