# Phase 4 plan: vertical (hub) modules

**Status: approved 2026-10-28** with every recommended default (questions 1–10). Built and deployed module by module: Roles → Templates → Settings → ROTA → CQC.

**Progress:** Roles & Permissions built (2026-10-28). Built notes: the list pages share a new `usePagedList` hook (`src/lib/usePagedList.ts`; the practice list uses it too). `FilterBar` gained `hideLabel` and `children`. The site's not-found page renders new roles at their real URLs, and also a newly onboarded practice's dashboard. The mock database key moved to `aqlios-mock-db-v3` (adds the permission catalog, role permissions and ~98 staff).

Phase 4 replaces the five hub "Rebuild in progress" pages with the real screens. Each module follows the reference screens from phase 3 and reuses their components. Everything runs on the mock API in the browser, as before.

| # | Module | Route (as live) | Spec | Follows |
|---|---|---|---|---|
| 1 | Roles & Permissions | `/verticals/public/roles` (+ `/create`, `/{roleId}`, `/{roleId}/users`) | `docs/super-admin/05-roles-and-permissions.md` | List page + form page |
| 2 | Template Library | `/verticals/public/templates` | `docs/super-admin/10-template-library.md` | Card-grid page + large popup |
| 3 | Settings | `/verticals/public/settings?section=…` | `docs/super-admin/09-settings.md` | Form page + list page |
| 4 | Vertical ROTA | `/verticals/public/rota` | `docs/super-admin/06-rota-management.md` (+ shift block from `docs/practice/06-rota-management.md`) | Own calendar layout + list page |
| 5 | CQC Compliance | `/verticals/public/compliance-dashboard` | `docs/super-admin/08-cqc-compliance.md` (read from code, never seen on screen) | List page |

**Proposed build order:** Roles → Templates → Settings → ROTA → CQC. Roles and Templates are the most fully captured. ROTA is the largest. CQC has the least visual evidence, so it goes last. I'd **deploy after each module** so you can check them one by one, instead of one big deploy at the end.

**Applies to every module:**
- **Page anatomy:** `VerticalShell` → breadcrumb (where live has one) → grey panel → `ModulePageHeader` → content.
- **Dates:** `DD/MM/YYYY` everywhere (approved bug default). This replaces live's `MM/DD/YYYY` on Roles.
- **Times:** 24-hour everywhere. This replaces live's `5:43 AM` in the Activity Tracker.
- **Toasts:** success and error toasts, bottom-left.
- **Confirms:** every confirm uses the one `ConfirmDialog`, with focus on Cancel.
- **Unsaved changes:** Cancel and ✕ close without a "discard changes?" prompt, as live and as in phase 3.
- **Demo errors:** the mocks can be told to fail so error states can be demoed.
- **Access:** practice users can't reach hub routes. They get the `AccessDenied` state from phase 2, instead of live's silent redirect.

---

## 1. Roles & Permissions

### 1a. Roles List: `/roles`
**Layout:** breadcrumb `Roles & Permissions / Roles List` → `ModulePageHeader` (shield icon, **Roles & Permissions** / "Roles List", **⊕ Add New Role** teal pill) → inner grey panel → `FilterBar` (search "Search by role name", ✕ Clear filters, ↻ Refresh) → `DataTable`.

| Column | Sort | Content |
|---|---|---|
| Role Name | | name |
| Assigned Users | | count |
| Date Created | ✓ default ↓ (`-created_at`) | `DD/MM/YYYY` |
| Last Modified Date | | `DD/MM/YYYY` |
| Actions | | 👁 **View** · 👥 **View Users** · 🗑 **Delete** (red). Each has a tooltip and an `aria-label` with its name |

- **Pagination:** 10 rows. Live's own label reads "Showing 1 to 5 of 5 roles"; see question 3 for whether to keep it.
- **Delete Role:**
  - Opens `ConfirmDialog` (error tone): **Delete Role** · "Are you sure you want to delete the role "{name}"?"
  - While the role's users load, it shows "Checking associated users...".
  - **If users are assigned:**
    - Pink warning box: "Warning: N user(s) are assigned to this role." / "Please reassign these users to another role before deleting."
    - One card per user (name, email, `Reassign User To Role *` autocomplete). The options are the other roles; the role being deleted isn't listed.
    - **Delete Role** stays disabled until every user is reassigned.
  - Success toast "Role deleted successfully". The captured error toasts are mapped to 403, 404, 400 and 500 responses.
  - **Fixes:**
    - Esc closes only an open autocomplete, not the dialog, so the reassignments already picked aren't lost.
    - The Role Name cell gets real accessible text (live's HR row had none).

**States:**
- **Loading:** skeleton rows.
- **Empty:** "No roles found. Try another search."
- **Error:** "Failed to load roles" toast plus an inline row.

### 1b. Associated Users: `/roles/{roleId}/users`
**Layout:** breadcrumb `Roles & Permissions / Associated Users List` → header subtitle "Associated Users List" → `GoBackLink` → filters (labelled `Search` "Search by name or email...", `Practice` select (default All), ✕ Clear filters, ↻ Refresh) → table.

**Columns:**
- **Staff Name:** bold name with the email in grey below.
- **Practice:** comma list truncated with `…`. A tooltip shows the full list.
- **Role.**
- **Status:** `StatusChip` showing Active, Pending Invite or —.
- **Actions:** 👁 View staff. Staff detail is built in phase 5; until then 👁 opens an interim page that says so.

**Practice filter:** the practice select uses server search instead of live's `page_size=1000` (approved bug default).

**States:**
- **Empty:** "No users found. Try another search."
- **Errors:** "Failed to load associated users" and "You do not have permission to view this role's users."

### 1c. Role Detail / Edit: `/roles/{roleId}`
**Layout:** breadcrumb `Roles & Permissions / Role Detail`, then a centred narrow column (about 540px of content). The header has a shield icon, **Role Detail** / role name, and **✎ Edit** on the right.

**Cards:**
- **Role Details** (`FormSectionCard`, collapsible):
  - `Role Name *`, read-only.
  - `Role Description`, read-only multiline, with the counter `40 / 100`.
- **Permissions:** a search pill ("Search permissions"), then the **`PermissionTree`**:
  - One grey accordion per module: `›`, **Module**, `N / M permissions selected` (green when more than 0), `⌄`.
  - Expanded modules list checkbox rows with children indented, and ✅ or ❌ on the right.
  - In view mode the checkboxes are disabled.

**Edit mode (same URL):**
- The breadcrumb changes to `Edit Role` and the title to **Editing role details**.
- **Cancel** (outlined) and **Save Changes** (disabled until something changes).
- Each expanded module ends with **"Select all N permissions"**, which shows the indeterminate state when only some are selected.
- Success toast "Role updated successfully" (placeholder copy; not captured).
- Errors: "Failed to update role" · "Invalid data. Please check the role details and try again." · "You do not have permission to update this role."

### 1d. Create New Role: `/roles/create`
- Breadcrumb `Create New Role`. Title **Create New Role** / "Create new role by entering the information below."
- Buttons: **Cancel** and **Save Changes**.
- **Fields:**
  - `Role Name *`, placeholder "Enter role name (must be unique)".
  - `Role Description`, placeholder "Brief description of your role...", counter `0 / 100`.
- **Permissions:** the `PermissionTree` in edit mode, with nothing ticked.
- **Validation:**
  - Empty name: "Role name is required." (live copy, full stop included).
  - Duplicate name: "A role with this name already exists." (placeholder).
  - Description over 100 characters is blocked by the counter.
- **Permission search with no results:** `No results matching "{term}"`.
- **Success:** toast "Role created successfully" (placeholder), then go to the new role's detail page.

**APIs** (✔ = URL captured, ~ = inferred):
- ✔ `GET /users/sub-apps/{id}/roles?page&page_size&ordering&search` (no `/v1/`, as live)
- ✔ `GET /users/sub-apps/{id}/roles/{roleId}`
- ✔ `GET …/roles/{roleId}/permissions`
- ✔ `GET …/roles/{roleId}/users`
- ✔ `GET /users/v1/permissions?sub_app_id=` (catalog)
- ~ `POST …/roles`, `PATCH …/roles/{roleId}` (with `permission_ids`), `DELETE …/roles/{roleId}` (with `reassignments`)

**Mock data:**
- **Roles:** the 5 captured roles.
- **Permission catalog:** the full captured catalog, 103 permissions in 18 modules, with parent and child links.
- **Role permissions:** Nurse = 3 of the 4 in Role Permission Management (as captured); the others get plausible sets.
- **Staff:** about 100 fictional staff linked to roles and practices, so the user counts match.

---

## 2. Template Library: `/templates`

**Layout:**
- No breadcrumb (as live). `ModulePageHeader`: document icon, **Templates Library**.
- One white card holds everything:
  - **Communication Templates (27)**.
  - `SegmentedTabs` (brand tone): `Standard Templates` | `Staff Created Templates`.
  - Sub-header: **Standard Templates (16)** with **⊕ Add Template** on the right (Standard tab only).
  - Filter row.
  - Full-width **Template Categories** select.
  - Category groups: a bordered box per category titled **Category (n)**, holding a 2-column grid of **`TemplateCard`s** (1 column on phone).

**Filters:**
- **Standard tab:** Search "Search templates by name..." · Type (Message, Email, Note) · Status (Active, Inactive, Draft) · ✕ Clear filters.
- **Staff Created tab:** the same, plus **Created By**.

**`TemplateCard`:**
- Type and status chips, and a ⋮ `ActionMenu`.
- **Name.**
- Email templates only: "Subject: …".
- A 2-line body preview, with `{{placeholders}}` shown in blue.
- "Created by {name}" and the date.
- Staff Created cards only: an italic "Business: {practice}" line.

**⋮ actions (as captured):**
| Template | Actions |
|---|---|
| Standard, Active | View Details · Edit Template · Mark as Inactive · Delete Template |
| Standard, Inactive | View Details · Edit Template · Activate Template · Delete Template |
| Staff Created | View Details · Move to Standard · Delete Template |

**Template popup (create, view and edit):**
- `FormModal` at the large size (near full width, 18px radius).
- **Header:** document icon tile, then **Create Template**, **Template Details** or **Edit Template**, the chip **Standard Template**, the matching subtitle, and ✕.
- **Template Details card:**
  - **Status select** (Draft by default).
  - `Template Name *` | `Category *` (10 captured categories).
  - `Template Type *` radios: Message (SMS / In-app) · Email · Notes.
  - Email adds `Subject *`.
  - `Template Message *`: the **`RichTextEditor`**:
    - **Toolbar:** Bold, Italic, Underline, Strikethrough, Link, 4 alignments, bulleted and numbered lists, indent and outdent, undo and redo.
    - **⊕ Insert Placeholder:** a menu of the 13 captured placeholders.
    - **Ask AI:** a placeholder for now (see question 5).
    - Counter "Character limit: n/300".
- **Preview card:** `MessagePreview` phone mock with sample data. Empty state "Start typing to generate a preview."
- **Sticky footer:**
  - Cancel.
  - **Save as Draft**.
  - **Create Template** (disabled until the form is valid). It reads **Save Changes** in edit mode.
- **View mode:** fields disabled and the toolbar hidden.
- **Fixes:**
  - The view subtitle no longer says "Create a reusable message template."
  - The type label reads "Notes" everywhere (live mixes "Notes" and "Note").
  - The whole dialog no longer gets the browser's amber focus ring when it opens.

**Validation (placeholder copy):**
- "Template name is required"
- "Category is required"
- "Subject is required"
- "Template message is required"
- "Template message must be 300 characters or fewer"

**Confirms (captured copy):**
- **Delete Template:**
  - Text: "This action cannot be undone. "{name}" will be permanently deleted."
  - Button: **Delete Permanently**, red.
- **Mark Template as Inactive:**
  - Text: "{name}" will be moved to inactive status. Staff will no longer be able to use this template."
  - Amber note: "You can reactivate this template anytime from the Template Library."
  - Button: **Mark as Inactive**.
- **Activate Template:**
  - Text: "{name}" will be activated and made available to staff."
  - Button: **Activate**.
- **Move to Standard Templates:**
  - A 900px review form. A grey "Original template" box comes first.
  - Fields: `Template Name *`, `Category *`, `Subject *` (email only) and `Template Body *` (n/1000).
  - Success toast: "Template moved to Standard Templates successfully."
  - Error toast: "Failed to move template to Standard Templates."

**States:**
- **Loading:** skeleton cards.
- **Empty:** "No templates found. Try another search." (category or search with no matches).
- **Error:** "Failed to load templates" toast.
- No pagination, as live.

**APIs:** none were captured for templates, so all paths are inferred. They follow the backend pattern:
- `GET /public/v1/sub-apps/{id}/templates/?scope=standard|staff&search&type&status&category&created_by`
- `POST` · `PATCH` · `DELETE …/templates/{id}/`
- `POST …/templates/{id}/move-to-standard/`

**Mock data:**
- **Standard:** 16 templates matching the captured category counts.
- **Staff Created:** 11 templates.
- Realistic fictional wording. Live's test-looking entries ("kk / jjo", "Test1212") are left out.

---

## 3. Settings: `/settings?section=…`

**Layout:**
- Breadcrumb `Settings / {Section}`. `ModulePageHeader`: ⚙ **Settings**, no subtitle.
- **`SettingsShell`:**
  - **Left nav card**, about 210px, with 4 links. The active link is a bold pill with `aria-current`.
  - **Content card** on the right.
  - Below md the nav becomes a horizontal pill row.
- The section is in `?section=`, as live. Static hosting serves one page for all four.

### 3a. Global Practice Configuration (default)
- Title and subtitle "Manage global practice configurations here."
- **Cancel** and **Save Changes** sit **under the title on the left**, as live. Both are disabled until something changes.
- **Sections:**
  - Appointment Type Configuration (Mandatory): `ToggleOptionRow` × 2, Face-to-Face and Call.
  - Slot Duration Configuration (Optional): `RepeatableItemCard` with Role\*, Appointment Type\* and Duration (Mins)\*, plus ＋ Add Another Slot.
  - Appointment Booking Configuration: Urgent\* and Routine\*, with the phase 3 fixed options.
  - Operating Hours: `OperatingHoursRow` × 7, **Mon→Sun** (as live here).
  - Custom practice closed messages: clinical and non-clinical `Message *` textareas, "Character limit: 300".
- **Fixes:**
  - Saved closed messages are no longer cut off.
  - The "to" time no longer wraps onto its own line.
- Success toast: "Global practice configuration updated successfully" (placeholder).

### 3b. Global Appointment Configuration
- Same frame. Subtitle "Manage global appointment configurations here." (full stop added).
- **Opened Slot Configuration:** hours field with a live helper ("Patients can book their appointments within N hours.").
- **Appointment Reminder Settings:** SMS and Email selects, 6 captured options each, with live helpers.
- **Cancellation & Reschedule Policy:** two hour fields with helpers and 4 checkboxes. The live heading says "Rescheduled"; it's fixed to "Reschedule".
- **Appointment Booking Configuration:**
  - Max Advance Booking Period\*, in days.
  - Same Day Booking switch.
  - Urgent\* and Routine\*.
  - ☑ Require Manager Approval.
- **Urgent Capacity Threshold:** day rows and the Extra Appointments\* select.
- **Additional Slot Duration N:** `RepeatableItemCard` with Role\*, Appointment Type\*, Staff\*, Start Time\* and End Time\*.
- **Number limits** (fix): hours 1–720, days 1–365 (proposed). Live accepts values like 799.

### 3c. Competency
- Description, then **＋ Add Competency** above a `DataTable`.
- **Columns:** Competency Type · Role · Sub Types · Slot Duration · Staff Assigned · Date Added · Actions (✎ Edit, 🗑 Delete).
- **Fix:** the table scrolls inside its card instead of overflowing it.
- **`FormDrawer`** for Add and Edit Competency (480px, labels above the fields):
  - Competency Type Name\*.
  - Description (optional).
  - Roles\* (multi-select).
  - Slot Duration\*, a number with the unit "Mins".
  - Sub Types\*, a repeating list with ＋ Add Sub-type.
  - Footer: Cancel and ✓ **Save Competency**.
- **Validation (placeholder copy):**
  - "Competency type name is required"
  - "Select at least one role"
  - "Slot duration is required"
  - "Add at least one sub-type"
- **Delete:**
  - `ConfirmDialog` **Delete Competency**: "Are you sure you want to delete "{name}"? This action cannot be undone."
  - Success toast: "Competency deleted successfully" (placeholder).

### 3d. Pathway Configuration
- Subtitle, then `FilterBar`: Type (All, Clinical, Administrative) · Status · Channel · Routing · full-width search "Search here..".
- **`GroupedDataTable`:**
  - One header row per specialty: name and "N of M active".
  - **Columns:** Pathway · Type · Status · Mobile App · Web App · Voice Agent · Website · Care Navigator · Routing · Actions.
  - The five channel columns are inline `AppSwitch`es.
  - **Status chips:** Active, Draft, Archived. Draft rows show `—` instead of switches.
- **Channel switches:** saved straight away, with a success toast. If the save fails, the switch flips back and an error toast shows. See question 6.
- **Configure action:** the detail page wasn't captured, so it opens an interim "Not captured yet" page (see question 7).
- **Mock data:** 13 specialties with the captured counts. The row names are fictional except the 5 captured Administrative ones.

**APIs** (all inferred; Settings calls weren't recorded):
- `GET`/`PUT /public/v1/sub-apps/{id}/global-practice-configuration/`
- `GET`/`PUT …/global-appointment-configuration/`
- `GET`/`POST`/`PATCH`/`DELETE …/competencies/`
- `GET …/pathways/?type&status&channel&routing&search`
- `PATCH …/pathways/{id}/channels/`

**States** (each section):
- **Loading:** spinner in the content card.
- **Error:** "Failed to load {section}" toast with Try again.
- **Validation:** inline errors, plus the red section border.
- **Success:** a toast. The buttons are disabled again once the save is done.

---

## 4. Vertical ROTA: `/rota`

**Layout:**
- No breadcrumb (as live).
- A **sticky top `SegmentedTabs`**: 📅 Rota Management · 👥 Rota Groups · 📈 Activity Tracker.
- **Fix:** the tab is kept in `?tab=` (`rota-groups`, `activity-tracker`), so tabs can be linked and survive a refresh. Live's tabs don't change the URL.

### 4a. Rota Management tab
- **Header:** calendar icon, **Hub ROTA Management** / "Practice View" or "Staff View", with the large `SegmentedTabs` view switch.
- **Action row:**
  - ⬇ **Download Rota**: disabled until a practice or staff member is selected. Once enabled, it downloads a CSV of the visible week (see question 8).
  - ⧉ **Apply Rota Template** and ＋ **Create Rota Template**: see question 8.
- **Toolbar card:**
  - Week navigator `‹ 26 Oct - 1 Nov 2026 ›`.
  - `Day | Week` toggle (Week by default).
  - `FilterBar` small selects: Staff · Staff Type · Duty Type · Roles · Practice · Rota Group · **Show** (multi-select: All, Holidays, Leaves, Published Slots) · Date (`DD/MM/YYYY` picker).
- **`RotaLegend`:** session types, the 10 duty types and 4 gap types. The colours go into a `dutyType` / `rota` token group in `tokens.ts`.
- **Side panel**, collapsible, with "Collapse sidebar" / "Expand sidebar":
  - **Practice View:** "Select Practice". The first card is **All Practices**, then a **`CapacityCard`** per practice (hours, Weekly Capacity "Nh remaining", bar, assigned and total).
  - **Staff View:** "Select Staff", with collapsible role groups and counts, and staff `CapacityCard`s with a role chip.
  - **Fix:** a role with no name is grouped as "Other" instead of live's "s(1)".
- **`WeekCalendarGrid`:**
  - Mon–Sun columns; today's column is tinted with a teal underline.
  - 30-minute rows from 00:00 to 23:30.
  - Dashed now-line with ▶.
  - Thin ＋ "Assign Staff" buttons, each with an `aria-label` such as "Assign staff, Mon 26 Oct 09:00".
  - **Shift blocks:** the design captured at practice level. Clicking one opens Edit Assignment, which is built in phase 5.
  - Day view shows one wide column.
  - **Mock data:** the current week gets a realistic spread of shifts, so the grid isn't empty.
- **Loading:** a thin `LinearProgress` bar above the grid, and the side panel fades.
- **Empty:** "No shifts this week." in the grid header area. The grid still renders.

### 4b. Rota Groups tab
- **ROTA Groups** / "Manage and assign rota groups", with **＋ Create Rota Group** on the right.
- **Filters:** Role · Status · search "Search rota groups by name...".
- **`DataTable` columns:**
  - Group Name.
  - Role.
  - No. of Practices, shown as "15 sites". The header gets its full stop, matching No. of Staff.
  - No. of Staff.
  - Status chip.
  - Actions: ✎ Edit, with an `aria-label`.
- **Create and Edit Rota Group** use `FormModal` (600px), the reference modal:
  - Group Name\*.
  - Description (Optional), 0/300, with the helper text.
  - Select Practices\*.
  - Select Roles\*: disabled with "Select practice first" until a practice is chosen.
  - Select Staff\*: disabled with "Select role first" until a role is chosen.
  - Active Status switch box.
  - **Create Group** stays disabled until the form is valid.
  - **Edit** uses the same form with the values filled in and **Save Changes**.
- **Validation (placeholder copy):**
  - "Group name is required"
  - "Select at least one practice"
  - "Select at least one role"
  - "Select at least one staff member"
- **Success toasts:**
  - "Rota group created successfully"
  - "Rota group updated successfully"
- **Mock data:** the 3 captured groups with their roles, practices and staff counts. New groups also show up in the phase 3 profile's `RotaGroupSelect`.

### 4c. Activity Tracker tab
- **Activity Tracker** / "Manage and view staff activities here."
  - Fix: the title uses the same weight as other module titles.
- **Filters:**
  - Staff · Practice · Date · search "Search by staff name...".
  - Status: All Statuses, Active, Inactive and **On Leave**. On Leave is missing live (fix).
- **`StatsStrip`:** Active Now · Inactive · On Leave, zero-padded.
- **`ActivityCard` list:**
  - **Name - ID** and the date, with a status chip.
  - Rows: Practice Name · Duty Type (swatch and name) · Login Time · Logout Time · Allocated Hours.
  - Times are 24-hour.
- **Duty type:** cards only use the 10 real duty types. Live's "Standard" isn't one of them.
- **Pagination:** `TablePagination`.
- **Empty:** "No staff activity found. Try another search."

**APIs:**
- ✔ `GET /rota/v1/sub-apps/{id}/available-practices?week_start=`
- ✔ `GET /rota/v1/sub-apps/{id}/available-staff?date=`
- ✔ `GET /public/v1/sub-apps/{id}/rota-groups/?status=`
- ✔ `GET /users/sub-apps/{id}/roles?is_paginated=false`
- ~ `GET /rota/v1/sub-apps/{id}/assignments?week_start&…filters`
- ~ `POST`/`PATCH …/rota-groups/`
- ~ `GET /activity/v1/sub-apps/{id}/staff-activity?date&…`

---

## 5. CQC Compliance: `/compliance-dashboard`

Nothing here was seen on screen; it's all **from the page's code**. The copy, columns, filters and chip colours are exact. **The layout of the stat cards is inferred**, so it'll follow the Activity Tracker look.

**Layout:**
- Breadcrumb `CQC Compliance / Compliance Dashboard` (inferred).
- `ModulePageHeader`: the compliance icon, **CQC Compliance** / "Compliance Dashboard".
- **6 stat cards** in a responsive grid (3 per row on desktop, 2 on tablet, 1 on phone):

| Card | Caption |
|---|---|
| Total Staff | Across All Practices |
| Compliant | — |
| Pending Upload | Waiting on action |
| Awaiting Verification | Uploaded but not verified |
| Re-verification Due | — |
| Expired | Require re-upload |

- **Filters** (`FilterBar`):
  - Practice (All Practices + server-searched practices).
  - Compliance Status (the 5 statuses).
  - Search "Search by name, role or skill...", 400ms debounce.
- **`DataTable` columns:** Staff Name · Practice · Compliance Status (chip) · Waiting Since (`DD/MM/YYYY` or `-`) · Last Updated.
- **Pagination:** live's label "Records per page:", options 10–50, and "1–10 of N (X Users)" (see question 3).

**States** (copy from the code):
- **Loading:** "Loading compliance data…"
- **Empty:** "No staff found. Adjust your filters or search term."
- **Error:** "Failed to load compliance dashboard". On timeout: "Request timed out. Please check your connection and try again."

**Fixes:**
- **Super-admin sees the dashboard.** The mock returns 200, and a 401 no longer logs anyone out (approved bug default).
- One status vocabulary with one spelling each ("Re-verification Due", "Awaiting Verification"). The API keeps its values (`REVERIFICATION_DUE`, `PENDING_VERIFICATION`).
- **Rejected** gets its own status chip in rows. It has no stat card, as live.
- Chip colours become theme tokens: a new `compliance` token group.
- The API field typo `complaince_status` is kept **only in the mock response** (it's how the real API answers) and is mapped to `compliance_status` in `lib/api`.

**Practice users:** get the `AccessDenied` state. In the practice sidebar, CQC Compliance stays coming-soon, as live.

**API:** ✔ `GET /public/v1/sub-apps/{id}/staff/dashboard/?page&page_size&practice_id&search&verification_status`. The counts come back in the same response (shape inferred from the code).

**Mock data:** compliance records for the ~100 staff, spread across all statuses.

---

## Components

**Reused, built earlier:**
`VerticalShell`, `HubManagementLayout`, `ModulePageHeader`, `DataTable`, `FilterBar`, `StatusChip`, `PillTabs`, `SegmentedTabs`, `ActionMenu`, `FormModal`, `FormDrawer` / `FieldLabel`, `ConfirmDialog`, `FormSectionCard`, `RepeatableItemCard`, `ToggleOptionRow`, `OperatingHoursRow`, `AppSwitch`, `GoBackLink`, `LoadingSpinner`, `AccessDenied`, `RotaGroupSelect`.

**Already in COMPONENTS.md ("observed"), built now:**
| Component | Where |
|---|---|
| `PermissionTree` | `src/features/roles/components/` |
| `TemplateCard`, `MessagePreview` | `src/features/templates/components/` |
| `RichTextEditor` | `src/components/forms/` |
| `SettingsShell` | `src/components/layout/` |
| `GroupedDataTable` | `src/components/data/` |
| `StatsStrip` | `src/components/data/` |
| `ActivityCard`, `CapacityCard`, `RotaLegend`, `WeekCalendarGrid` | `src/features/rota/components/` |

**Extensions to existing components (a new prop each, no new component):**
| Component | Extension | Why |
|---|---|---|
| `ConfirmDialog` | `children` slot | Delete Role's per-user reassign cards and the Template amber note go inside the standard confirm |
| `FormModal` | `size`: `md` (600, default) / `lg` (900) / `xl` (near full width), plus `footer` for a custom button row | Move to Standard is 900px. The template popup is near full width with Save as Draft |
| `StatsStrip` | `variant`: `strip` / `cards` | The CQC stat cards use the same data shape, laid out as cards |
| `DataTable` | `paginationLabel` / `rowsPerPageLabel` (already has `labelDisplayedRows`) | Only needed if you keep the live wording (question 3) |

**New (needs approval):**
| Component | Why nothing existing fits |
|---|---|
| `ShiftBlock` (feature-level, `src/features/rota/components/`) | The coloured shift card inside the calendar grid (duty colour, time, staff and practice). It's separate from `WeekCalendarGrid` because practice ROTA in phase 5 reuses it in its own grid and in the Edit Assignment drawer |
| `StatCard` is **not** needed | Covered by the `StatsStrip` `cards` variant |

**New dependency (needs approval):** **Tiptap** (`@tiptap/react` + starter kit, underline, link, text-align) for `RichTextEditor`. MUI has no rich-text editor, and building one on raw `contentEditable` would be fragile. Its toolbar is built from MUI buttons and icons, so it looks like the rest of the app.

**Routing on static hosting:**
- The role pages (`/roles/{roleId}`, `/roles/{roleId}/users`) are pre-built for the seeded roles.
- A role you create in the demo has no pre-built page, so the site's not-found page will recognise role URLs and render the role screen instead (the GitHub Pages 404 fallback).
- The same fallback also fixes a phase 3 gap: the dashboard of a newly onboarded practice currently shows "Page not found".

## Tests (Playwright, desktop + phone)
- **Roles:**
  - The list shows its default sort, search and empty message.
  - Delete Role with users stays disabled until every user is reassigned, then the role disappears from the list.
  - Delete Role with no users deletes straight away after the confirm.
  - Create shows the required error, then saves and lands on the new role's detail page.
  - Edit: Select all, the indeterminate state, Save enables and saves, and Cancel goes back to view mode.
  - Permission search shows its no-results text.
  - Associated Users filters by practice.
- **Templates:**
  - Tabs and filters work, and category counts are correct.
  - Placeholders appear in blue on the cards.
  - Create: validation, Insert Placeholder, the preview, Save as Draft and Create.
  - All three confirms work, and Move to Standard moves the template to the Standard tab.
- **Settings:**
  - The `?section=` deep links open the right section.
  - Save is disabled until something changes, and a save persists after reload.
  - Competency: the drawer's validation, adding and deleting work.
  - Pathway: a switch saves (with a toast), and a failure flips it back.
- **ROTA:**
  - `?tab=` deep links work.
  - The week navigator changes the dates.
  - Shifts render in their duty colours.
  - Practice/Staff switch and the side-panel collapse work.
  - Rota group create: dependent fields unlock in order, and the new group appears in the table and in the practice profile select.
  - Activity Tracker filters by On Leave.
- **CQC:**
  - Super-admin sees the cards and the table.
  - Filters and pagination work.
  - Practice user sees `AccessDenied`.
  - A forced 401 doesn't log the user out.

## Questions
1. **Approve** the five modules as proposed, with the new `ShiftBlock` component and the four component extensions?
2. **Tiptap** for the rich-text editor: OK to add this dependency?
3. **Pagination wording:** live uses three styles: "1–10 of 155", "Showing 1 to 5 of 5 roles", and "Records per page … (X Users)". Use **one style everywhere** (the MUI default from Practice Management; proposed), or copy each module's wording?
4. **Button colours:** live uses cyan (`#5CE1E6`) for some buttons: Role Edit/Save, Template tabs and Add Template, and Settings Add buttons. Keep cyan **as live** (proposed, via the existing `brand` token), or use teal everywhere?
5. **Ask AI** in the template editor: show the button as a disabled "Coming soon" (proposed), or have it insert a canned sample message in the demo?
6. **Pathway channel switches:** save straight away with a toast (proposed, matching how they look live), or collect changes behind a Save button?
7. **Not-captured screens in this phase:**
   - Pathway "Configure"
   - Create and Apply Rota Template
   - Assign Staff (＋ on the calendar)
   - Staff detail (👁 in Associated Users)

   Two options:
   - **(A)** Leave them for **phase 5**, where practice ROTA and Staff are built (these screens share components with it). Until then they show an interim "Rebuilt in phase 5" page or toast. This is proposed.
   - **(B)** Capture them now in the dev app (read-only), if you sign in, and build them here.
8. **Download Rota:** download a **CSV** of the visible week (proposed; the live file format wasn't captured), or leave it as an interim toast until it's captured?
9. **Number limits** in Global Appointment Configuration: is 1–720 hours / 1–365 days OK? Live has no limit.
10. **Build and deploy module by module** in the order Roles → Templates → Settings → ROTA → CQC (proposed), or build all five and deploy once?
