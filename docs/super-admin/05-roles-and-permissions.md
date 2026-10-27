# Super-admin · Role and Permissions (HUB)

Captured 2026-10-27. Nothing was created, edited or deleted.
Sidebar: HUB → Role and Permissions → `/verticals/public/roles`

## 1. Roles List — `/verticals/public/roles`

### Layout
- Breadcrumb: `Roles & Permissions / Roles List` (first crumb is a link).
- `ModulePageHeader`: white circle tile with a shield icon, **Roles & Permissions** / "Roles List". On the right, **⊕ Add New Role** (teal pill).
- An inner grey panel holds the filter bar and a white rounded table card. This is one more level of nesting than the Practice Management page.
- Filter bar:
  - `Search by role name`: a white filled input with no label (placeholder only)
  - `✕ Clear filters`: teal text button
  - `↻ Refresh`: outlined pill

### Table
| Column | Sortable | Notes |
|---|---|---|
| Role Name | | |
| Assigned Users | | count |
| Date Created | ✓ (default ↓) | **`MM/DD/YYYY`** |
| Last Modified Date | | `MM/DD/YYYY` |
| Actions | | 👁 **View** · 👥 **View Users** · 🗑 **Delete** (red); each icon has a tooltip with the same text |

Data (5 roles):
| Role | Users | Created | Modified |
|---|---|---|---|
| HR | 1 | 09/18/2026 | 10/27/2026 |
| Care navigator | 1 | 09/14/2026 | 10/27/2026 |
| Nurse | 2 | 08/27/2026 | 10/27/2026 |
| Practice Manager | 49 | 08/27/2026 | 10/27/2026 |
| Clinician | 45 | 05/18/2026 | 08/27/2026 |

- Row hover: light grey background.
- Pagination: `Rows per page: 10 ▾` · **`Showing 1 to 5 of 5 roles`**. The wording differs from Practice Management's MUI default `1–10 of 155`.
- API: `GET /api/crm/api/users/sub-apps/{subAppId}/roles?page=1&page_size=10` (note: no `/v1/` in this path).

### Delete role (read from the app code; the popup wasn't opened)
- Dialog title **Delete Role**: "Are you sure you want to delete the role {name}?"
- While the role's users are checked, it shows "Checking associated users...".
- If users are assigned: "Warning: Please reassign these users to another role before deleting."
- Success toast: "Role deleted successfully".
- Error toasts: "Validation failed. Please ensure all users have been reassigned." · "You do not have permission to delete this role." · "This role was not found. It may have been deleted." · "Server error. Please try again later." · "You are not authenticated. Please log in."

## 2. Associated Users — `/verticals/public/roles/{roleId}/users`
Opened with 👥 View Users.
- Breadcrumb `Roles & Permissions / Associated Users List`; subtitle "Associated Users List"; `‹ Go Back` inside the panel.
- Filters:
  - `Search`: labelled field, placeholder "Search by name or email..."
  - `Practice`: select, default **All**, options from `GET .../practices?page_size=1000`
  - `✕ Clear filters`
  - `↻ Refresh`
- Table:
  | Column | Content |
  |---|---|
  | Staff Name | name (bold) + email (grey) |
  | Practice | comma-separated list, truncated with `…` (e.g. "Chainbridge Medical Partnership, gege 1, NHA") |
  | Role | role name |
  | Status | pill chip (28px high, fully rounded) |
  | Actions | 👁 view staff |
- Status chips:
  | Status | Bg | Text |
  |---|---|---|
  | — (none) | `#F3F4F6` | `rgba(0,0,0,0.55)` |
  | Pending Invite | `#F3F4F6` | `rgba(0,0,0,0.55)` |
  | Active | `rgba(22,163,74,0.15)` | `#16A34A` |
- Pagination: `Showing 1 to 10 of 49 users`.
- API: `GET /api/crm/api/users/sub-apps/{subAppId}/roles/{roleId}/users?page=1&page_size=10`
- Errors: "Failed to load associated users", "You do not have permission to view this role's users."

## 3. Role Detail — `/verticals/public/roles/{roleId}`
Opened with 👁 View (captured: Nurse).
- Breadcrumb `Roles & Permissions / Role Detail`. Narrower centred column (about 540px of content).
- Header: shield icon, **Role Detail** / role name (grey). On the right, **✎ Edit**, a **cyan `#5CE1E6`** pill with white text. This is a different colour from the teal primary buttons elsewhere.
- **Role Details** card (collapsible):
  - `Role Name *`: read-only, grey filled
  - `Role Description`: read-only multiline, counter **`40 / 100`**. The format differs from the practice form's "0/500 characters".
- **Permissions** card. Header has a `Search` field (rounded pill, 🔍 icon, placeholder "Search permissions").
  - One grey accordion row per module: `›` chevron, **Module name** (bold), `N / M permissions selected` and a `⌄` icon. The count turns **green** when more than 0 are selected.
  - Expanded: white rows with a checkbox and the permission description. Child permissions are **indented** under their parent. On the right, a ✅ green check if granted or ❌ red cross if not.
  - In view mode, checkboxes are pale blue and disabled.
- APIs:
  - `GET .../users/sub-apps/{subAppId}/roles/{roleId}`
  - `GET .../users/sub-apps/{subAppId}/roles/{roleId}/permissions`
  - `GET .../users/v1/permissions?sub_app_id={subAppId}` (catalog)

### Edit mode (same URL)
- Breadcrumb becomes `Roles & Permissions / Edit Role`. Title **Editing role details** (no subtitle).
- Buttons: **Cancel** (white outlined pill) and **Save Changes** (`type=submit`, **disabled grey until something changes**).
- Fields become editable and checkboxes become active (teal-blue).
- Each expanded module ends with a **"Select all N permissions"** checkbox (indeterminate ▬ when some are selected).
- Cancel goes straight back to view mode, with **no "discard changes?" confirmation**.
- Errors: "Failed to update role", "Invalid data. Please check the role details and try again.", "You do not have permission to update this role."

## 4. Create New Role — `/verticals/public/roles/create`
- Breadcrumb `Roles & Permissions / Create New Role`. Title **Create New Role** / "Create new role by entering the information below."
- Buttons: **Cancel** (outlined) and **Save Changes** (cyan, enabled).
- Fields:
  - `Role Name *`: placeholder "Enter role name (must be unique)"
  - `Role Description`: placeholder "Brief description of your role...", counter `0 / 100`
- Permissions: same accordion as Edit, all unchecked.
- Validation (on blur): `Role name is required.` Note the trailing full stop, which the practice form messages don't have.
- Permission search with no results: centred grey text `No results matching "zzzz"`.

## Permission catalog (Public Primary Care, 103 permissions in 18 modules)
Names are stored as `Module:Parent:Child`; the UI indents children under parents and shows the description text.

| Module | Count | Permissions (indent = child) |
|---|---|---|
| Activity Tracker | 1 | View Activity Tracker |
| Appointment | 12 | View Alternative Appointment Approval Requests › Approve/Reject… · View Appointments List/Calendar View › Schedule/Request Follow-up · View Appointment Detail › (Join and Complete, Reschedule and Cancel) · View Open/Available and Booked Slots › (Book Appointments for Patients › Book Slots for Other Staff · Open Slots for Patients · Request Slots for Other Staff) |
| Billing | 1 | Billing |
| Dashboard | 1 | View All Insights |
| Exit Interview Management | 2 | View Exit Interviews › Manage Exit Interviews |
| HR Analytics | 1 | View Analytics |
| HR Policies | 2 | View Policies › Manage Policies |
| Leave Management | 5 | Apply for Leave · Approve/Reject Leaves · View Leave Balance Summary · View Leaves Requests · View Staff Leave History |
| Org Chart Management | 2 | View Org Chart › Manage Org Chart |
| Patient Consultation Requests | 16 | Access All Inboxes › Assign/Reassign · Change Status · Chat with Patient · Close/Reopen · Copy into Clinical System · Fetch/View Medical History · Fetch from Clinical System · Forward a Case · Mark Urgent/Routine · Open in Clinical System · Prescribe Medicine · Request a Test · Request Documents/Info · View/Add/Delete Clinical Notes · View/Add/Edit/Delete Snomed Codes |
| Patients | 6 | View List of Patients › Archive/Unarchive · Send/Resend Invites · View Patient Details › View List of Requests › View Request Details |
| Performance Management | 11 | Manage Configuration · View/Manage 360 Feedback · View/Manage Bonus Points · View/Manage Key Results · View/Manage Meetings · View/Manage Objectives |
| Recruitment Management | 9 | Approve Requisitions · Manage Configuration · Request Job Openings · View/Manage Candidates · View/Manage Interviews · View/Manage Job Openings |
| Role Permission Management | 4 | Assign/Reassign Roles of User · List All Roles › View Associated Users to a Role · View Permissions for a Role |
| ROTA Management | 10 | Access Practice and Staff View › Create and Apply ROTA Template · Create ROTA Assignment · Download ROTA · Edit and Delete ROTA Assignment · Reassign Staff or Practice · View List of ROTA Groups › (Add/Edit/Assign ROTA Groups · Publish Slot, Accept or Reject Bidding) · Bid for a ROTA Slot |
| Settings | 9 | View Appointment Configurations › Edit · View Roles and Permissions · View Standard and Staff-created Templates › Add/Edit Staff-created · Add/Edit Standard · Delete Staff-created · Delete Standard · Move Staff-created to Standard |
| Skills Management | 2 | View Skills › Manage Skills |
| Staff Management | 9 | View Staff List › Approve/Reject User · Archive/Unarchive · Lock/Unlock · Send/Resend Invite · View Staff Details › (Update Contract, Operating Hours and Leave Entitlement · Update Staff Details · Verify/Approve/Reject/Download Compliance Documents) |

Nurse role currently has 3/4 in Role Permission Management (all except "View associated users to a role") and nothing else.

## Issues found
- Dates are **MM/DD/YYYY** here but **DD/MM/YYYY** in Practice Management.
- Pagination text formats differ between modules.
- Primary action colours differ: Edit and Save on role pages are cyan `#5CE1E6`, while Practice pages use teal `#2C7A7B`.
- Character counters use two formats (`40 / 100` vs `0/500 characters`), and error messages are inconsistent about the trailing full stop.
- No unsaved-changes confirmation when cancelling an edit.
- The roles API path lacks `/v1/` (`users/sub-apps/...`), unlike `users/v1/...`.
- HR's Role Name cell has no accessible text node (it was missing from the accessibility tree, though it's visible).

## To capture
- [x] Delete Role dialog on screen. See `docs/practice/09-confirmation-popups.md`
- [ ] Create or save success toasts and the duplicate-name error (would change data)
- [ ] Staff detail page from Associated Users 👁
- [ ] Practice filter dropdown values on Associated Users
