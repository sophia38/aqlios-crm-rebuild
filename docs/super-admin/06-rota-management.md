# Super-admin · ROTA Management (HUB)

Captured 2026-10-27 (week 26 Oct – 1 Nov 2026). Nothing was created, assigned or saved.
Route: `/verticals/public/rota`. The three tabs switch **in place with no URL change**.

## Page shell
- No breadcrumb on this module.
- **Top tab bar**: a white pill container with three pill tabs, each with an icon. The active tab is teal filled with white text; inactive tabs are grey text.
  1. 📅 **Rota Management**
  2. 👥 **Rota Groups**
  3. 📈 **Activity Tracker**
- The tab bar stays fixed at the top while the calendar scrolls.

---

## Tab 1 · Rota Management

### Header
- Calendar-grid icon, **Hub ROTA Management** (bold), subtitle showing the current view ("Practice View" / "Staff View").
- **View switch**: a large pill toggle, `Practice View` | `Staff View` (active is teal filled).
- Action row:
  | Button | Style | State |
  |---|---|---|
  | ⬇ Download Rota | outlined pill | **disabled** (greyed) until something is selected |
  | ⧉ Apply Rota Template | outlined teal pill | enabled (not opened) |
  | ＋ Create Rota Template | filled teal pill | enabled (not opened) |

### Toolbar (white card)
- Week navigator: `‹` · **26 Oct - 1 Nov 2026** (pill) · `›`.
- Range toggle: `Day` | **`Week`** (default Week).
- Filters: small outlined selects, 13px / 500, 12px radius, label 12px `neutral.500`, focus border teal, menu max-height 240px.

| Filter | Options | Notes |
|---|---|---|
| Staff | All + staff list (loads more on scroll) | `GET rota/v1/.../available-staff?date=` |
| Staff Type | All, Salaried, Locum | |
| Duty Type | All + 10 duty types (below) | |
| Roles | All, Care navigator, Clinician, HR, Nurse, Practice Manager | `GET users/.../roles?is_paginated=false` |
| Practice | All + practices | only shown at hub level |
| Rota Group | All, Primary Rota Group, Duty Rosters, Croft Hall Rota Group | `GET public/v1/.../rota-groups/?status=active` |
| Show | All, Holidays, Leaves, Published Slots | **multi-select** with checkboxes; choosing All clears the others |
| Date | Date picker `DD/MM/YYYY`, default today | |

### Legend
Small 10px squares with 3px radius, uppercase grey group labels.
| Group | Item | Colour |
|---|---|---|
| SESSION TYPE | AM | `#0EA5E9` |
| | PM | `#16A34A` |
| DUTY TYPE | On Call | `#FB3748` |
| | Care-home / Ward Round | `#7D52F4` |
| | Extended Access | `#FBD249` |
| | Nursing | `#717784` |
| | Admin Session | `#22D3BB` |
| | Neighbourhood Shift | `#FF936C` |
| | Remote Working | `#95C3FF` |
| | PPT / PLT / CPD | `#FFD5C0` |
| | AM Session | `#03A9F4` |
| | PM Session | `#1FC16B` |
| GAPS (2px dashed outline) | Leave-created | `#F97316` |
| | Published | `#06B6D4` |
| | Holidays | `#22C55E` |
| | Unallocated | `#D1D5DB` |

Duty type enum (code): `ON_CALL, CARE_HOME_WARD_ROUND, EXTENDED_ACCESS, NURSING, ADMIN_SESSION, NEIGHBOURHOOD_SHIFT, REMOTE_WORK, PPT_PLT_CPD, AM_SESSION, PM_SESSION`.

### Calendar body
Two columns:
- **Left side panel** (~190px, collapsible with `‹` "Collapse Sidebar"):
  - **Practice View**: header "Select Practice". The first card is **All Practices** / "Show all locations" (teal-tint selected state). Then one card per practice:
    - building icon, **name** (truncated), opening hours (`08:00 - 20:00`)
    - `Weekly Capacity` · **`72h remaining`** (bold)
    - a thin progress bar
    - `0h assigned` · `72h total`
  - **Staff View**: header "Select Staff". Collapsible groups by role with counts: **Practice Managers(8)**, Care navigators(1), Clinicians(16), HRs(1), **s(1)** ⚠, Furqan Practice Managers(1). Each staff card has the name, a role chip (outlined teal pill, e.g. "Practice Manager"), working hours and the same capacity block.
- **Week grid**:
  - Columns Mon–Sun with header `Mon … 26 Oct`. **Today's column** has a light teal tint and a teal underline on its header.
  - Rows every 30 minutes from 00:00 to 23:30. Hour labels are bold and half-hours faint.
  - **Current time line**: a dashed teal line across the week with a ▶ marker on the left.
  - Every empty slot has an "Assign Staff" target (shows on hover); clicking it starts an assignment, which wasn't captured.
- Loading: a thin `LinearProgress` bar above the grid, and the side panel fades while staff and practices load.
- This week had no assigned shifts, so the shift block design is **not yet captured**.

### APIs
- `GET /api/crm/api/rota/v1/sub-apps/{subAppId}/available-practices?week_start=YYYY-MM-DD`
- `GET /api/crm/api/rota/v1/sub-apps/{subAppId}/available-staff?date=YYYY-MM-DD`
- `GET /api/crm/api/public/v1/sub-apps/{subAppId}/rota-groups/?status=active`
- `GET /api/crm/api/users/sub-apps/{subAppId}/roles?is_paginated=false`

---

## Tab 2 · Rota Groups
- Title **ROTA Groups** (bold) / "Manage and assign rota groups". On the right, **＋ Create Rota Group** (teal pill).
- Filter card: `☰ Filters:` · `Role` select (All Roles + roles) · `Status` select (All Statuses, Active, Inactive) · on the right, search "Search rota groups by name..." with a 🔍 icon.
- Table:
  | Column | Content |
  |---|---|
  | Group Name | bold |
  | Role | comma-separated role names |
  | No of Practices | "15 sites" |
  | No. of Staff | integer |
  | Status | **Active** chip (light green bg, green border and text, small) |
  | Actions | ✎ edit (teal pencil) |
- Data: Primary Rota Group (Public Super Admin, Clinician, Practice Manager, Nurse · 15 sites · 10), Duty Rosters (… Receptionist · 5 sites · 0), Croft Hall Rota Group (Clinician, HR · 2 sites · 3).
- Pagination `1–3 of 3`.

### Create Rota Group modal ⭐ (reference for modals)
- MUI Dialog, **600px wide, 16px radius**, shadow `0 12px 40px rgba(0,0,0,0.12)`, backdrop `rgba(0,0,0,0.5)`, 12px padding.
- Header: **Create Rota Group** (20px / 600) with a ✕ close button on the right.
- Intro: "Add basic information and select practices and staff to create a rota group."
- Fields:
  | Field | Required | Notes |
  |---|---|---|
  | Group Name | ✓ | placeholder "e.g. North London Emergency Pool" |
  | Description (Optional) | | helper "Only alphanumeric text and standard punctuation are accepted." · counter `0/300` |
  | Select Practices | ✓ | autocomplete |
  | Select Roles | ✓ | **disabled until a practice is chosen**: "Select practice first" |
  | Select Staff | ✓ | **disabled until a role is chosen**: "Select role first" |
  | Active Status | | switch in a tinted box (bg `#FAFDFD`, border `rgba(44,122,123,0.12)`, 8px radius), "Set this rota group as active or inactive", on by default |
- Footer: **Cancel** (outlined, `#CCCCCC` border, `#666` text, 100px radius, 48px high) and **📅 Create Group** (`type=submit`, disabled grey `#E5E7EB` until valid).
- Cancel closes with no confirmation.

---

## Tab 3 · Activity Tracker
- Title **Activity Tracker** (24px / **400**, not bold like other titles) / "Manage and view staff activities here."
- Filters: `⏷ Filters:` · Staff (All Staff) · Practice (All Practices) · Status (All Statuses, Active, Inactive) · Date (today) · Search "Search by staff name..." (🔍).
- **Stats strip** (grey `#F5F7FA` panel), three stats each with a coloured left bar:
  | Stat | Colour | Value |
  |---|---|---|
  | Active Now | `#2E7D32` | 00 |
  | Inactive | `#FFB400` | 02 |
  | On Leave | `#9C27B0` | 00 |
  Values are zero-padded, ~34px.
- **Staff activity cards** (bordered list, one per staff member):
  - **Name - ID** (e.g. "Appointments Example - 6500") and the date. Status chip on the right (**Inactive**: amber outline `#FFB400`, bg `rgba(255,180,0,0.04)`).
  - Label/value rows: Practice Name · Duty Type (■ swatch + "Standard") · Login Time (`5:43 AM` or `-`) · Logout Time · Allocated Hours (`8h`).
- Pagination `1-2` (hyphen, not an en dash).

## Issues found
- **"s(1)"** staff group in Staff View: a role with an empty name, pluralised with "s".
- Session-type AM colour `#0EA5E9` differs from the duty-type "AM Session" colour `#03A9F4`. PM is `#16A34A` vs `#1FC16B`.
- Activity Tracker shows **"Standard"** duty type, which isn't among the 10 duty types.
- Activity Tracker uses **12-hour time** (`5:43 AM`); the rest of the app uses 24-hour.
- The Status filter lacks **On Leave** even though On Leave is a stat.
- Title weights differ: Activity Tracker is 400, other module titles are 600–700.
- Column headers are inconsistent: "No of Practices" vs "No. of Staff".
- Pagination dash style is inconsistent (`1–3` vs `1-2`).
- Tabs don't change the URL, so you can't link to or refresh into Rota Groups or Activity Tracker.
- Modal buttons (Cancel `#666`, 100px radius) use different values from page buttons (999px, teal).

## To capture
- [ ] A week with real shifts (shift block design, hover tooltip, click detail)
- [ ] Day view
- [ ] Assign Staff flow (click an empty slot)
- [ ] Create Rota Template and Apply Rota Template screens
- [ ] Download Rota (enabled state and file format)
- [ ] Edit Rota Group (✎)
- [ ] Rota Group modal validation messages
