# Practice · HRM → Leaves, and Leaves and ROTA

Captured 2026-10-27 in **Main Practice - Surgery** as super-admin. No leave was approved, rejected or requested.

## 1. Leaves (Leave Management): manager view
Route `/leave-management`. Top bar "→ Leave Management". Breadcrumb `Dashboard / Leave Management`. Title **Leave Management** (bold ~22px). Tabs don't change the URL.

**Tabs** (pill container; active is dark teal filled): **Leave Requests** · **Leaves History**

### Leave Requests
- Filter card: `☰ Filters:` with stacked selects on the left and search on the right:
  - `Staff`: All Staff (searchable, "Search staff...")
  - `Role`: All Roles, Care navigator, Clinician, HR, Nurse, Practice Manager
  - `Leave Type`: All Types, Annual Leave, Sick Leave, Maternity Leave, Paternity Leave, Bereavement Leave, Emergency Leave, Compassionate Leave, TOIL Leave (Time Off in Lieu)
  - Search "Search by staff name and role" (🔍) · `✕ Clear filters`
- Table: **Staff Name** (bold) · Role · Leave Type · Balance · Start Date · End Date · Duration · Notes · Warnings · **Action**
- Actions are three **outlined pill buttons**, 100px radius, 50% tinted borders:
  - **View** (teal `#2C7A7B`)
  - **Approve** (green `#16A34A`)
  - **Reject** (red `#DC2626`)
- Rows per page options: **5, 10, 25**. Data: 2 pending requests ("aqlios admin", super-admin, Annual Leave, Balance N/A, 09/09→16/09 and 01/09→08/09, **16 Hrs** each, notes "Testing notes", warnings "—").

### Leave Request Details popup (View)
Centred dialog (~450px, 18px radius). **Leave Request Details** + ✕; subtitle "aqlios admin — Annual Leave". Label/value rows (label left, value right-aligned): Staff Name · Role · Leave Type · Balance · Start Date · End Date · Duration · Notes. Read-only, with no buttons except ✕.

### Leaves History
- Filters: Staff · **Roles** · **Status** (All Statuses, **Approved, Rejected**) · search · Clear filters.
- Table: Staff Name · Role · Leave Type · Start Date · End Date · Duration · Status.
- Empty: "No leave history found." `0–0 of 0`.

## 2. Leaves and ROTA: "my leave" (the signed-in user's own)
Route `/leave-and-rota`. Breadcrumb `Dashboard / Leaves and ROTA`. Title **Leaves and ROTA**.
- Card **Leave History** / "Manage your leave requests here."
- **6 balance cards** (2 columns; grey rounded pill cards: icon in a white circle, label, big coloured value, "Approval Required"):
  | Leave | Value | Colour / icon |
  |---|---|---|
  | Annual Leave | 0w | teal, beach umbrella |
  | Sick Leave | 0h | red, medical cross |
  | TOIL Leave (Time Off in Lieu) | 0h | teal, clock |
  | Bereavement Leave | 0d | grey, heart |
  | Compassionate Leave | 0d | orange, hand-heart |
  | Maternity Leave | 0d | purple, baby |
  Units vary by type: **w / h / d**.
- Filters: `From` 📅 · `To` 📅 · `Leave Type` · `Status` (All Statuses, Pending Approval, Approved, Rejected).
- Table: Leave Type · Start Date · End Date · Duration · Reason · Requested Date · Last Updated · **Status** (outlined orange pill "Pending Approval" `#F97316`) · Action (👁 View).
- **No "Request leave" button** on this page, and **no ROTA content** despite the name.

## Issues found
- **Duration vs dates:** 7 days of annual leave (09/09–16/09) shows "16 Hrs", and the balance is "N/A".
- **"Leaves and ROTA" shows no ROTA** and no way to request leave from the page.
- **Units are mixed** on balance cards (weeks / hours / days) with no total.
- **Filter labels differ** between tabs: "Role" (Requests) vs "Roles" (History).
- **Rows-per-page options differ** from other tables (5/10/25 here).
- **Status chips:** outlined here, tinted elsewhere.
- The leave approver can see and approve **their own** requests (super-admin on both sides).
