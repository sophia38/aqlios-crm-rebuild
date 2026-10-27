# Practice · EHR → Appointment

Captured 2026-10-27 in **Main Practice - Surgery** as super-admin. Nothing was booked, joined, rescheduled, cancelled, approved or rejected.
Route: `/verticals/public/practices/{slug}/appointment`. Tabs and views **don't change the URL**.
Top bar shows the page title "📅 Appointment" (no breadcrumb on this page, unlike Patients and Tickets).

## Page structure
- **Top tab switch** (pill container): 📥 **Appointment** | 📤 **Appointment Requests**. Active is cyan filled.
- **Appointment** (24px / 400) / "Manage and schedule patient appointments" (on both tabs; the Requests tab reuses the same title).

---

## Tab 1 · Appointment

### View switch (top right)
`📅 Calendar View` | `▦ Table View`. Active is **dark teal `#2C7A7B` filled** with white text, unlike the cyan top tabs.

### Calendar View (default)
- Week navigator `‹ 26 Oct - 1 Nov 2026 ›` (outlined pill) · `Day` | **`Week`** toggle.
- Filters (see below) plus a `Date` field showing "This week".
- Week grid: `Time` column, day headers "Mon / 26 Oct". **Today is in a teal colour with a teal top border.** Rows every 30 minutes, 00:00–23:30.
- Current-time line: solid dark-teal line with a ● dot on the left, **only across today's column** (ROTA draws a dashed line across the whole week).
- Empty week: "No appointments for this period".

### Table View
- **5 stat cards** (2-column grid; rounded, tinted bg, icon in a white circle, label, big number on the right):
  | Card | Tint / colour | Value |
  |---|---|---|
  | Upcoming Appointments | orange | 00 |
  | In Progress Appointments | blue | 00 |
  | DNA | purple | 04 |
  | Completed Appointments | green | 27 |
  | Cancelled Appointments | red | 14 |
- Filters: same set as Calendar, but `Date` shows "Today".
- Table:
  | Column | Content |
  |---|---|
  | Patient Name | **underlined link** |
  | Request Name | centred, wraps |
  | Appointment Time | `DD/MM/YYYY HH:mm` |
  | Type | "Online (Video)", "Face to Face" |
  | Status | tinted chip: **Completed** (green text `#166534` on light green) · **DNA** (purple `#6D28D9` on light purple) |
  | Duration | e.g. "20 min", **"1259 min"** ⚠ |
  | Actions | 👁 "View appointment for {patient}" |
- Pagination `1–10 of 56`.

### Filters (both views)
| Filter | Options |
|---|---|
| Search | "Search by name or email, p…" (placeholder cut off) with 🔍 |
| Appointment Type | All Types, Face To Face Surgery, Telephone Or Audio, Face To Face Home Visit, Written Including Online |
| Severity | **disabled until a type is chosen** ("Select type first") |
| Staff | All Staff + staff list (21 entries, **with duplicate names** such as "Muhammad Ali" ×2 and "Furqan Daud" ×2, plus test names) |
| Status | All Status, Upcoming, In Progress, DNA, Completed, Cancelled by Patient, Cancelled by Staff |
| Date | date picker |
| ✕ Clear filters | text button, greyed until a filter is set |

### Appointment popup (👁 View)
Centred card (~450px, 18px radius); the page dims behind it.
- Header: **request name in Title Case** ("New Non-Blanching Rash") and ✕.
- **Summary card** (light teal tint):
  - Date tile: "Oct" (teal), **23**, "Fri".
  - **Patient name** and assigned staff ("Appointments Example Two - 1413").
  - 🎥 "Online Appointment".
  - Status chip **Completed** (top right).
  - Action buttons (disabled for a past appointment): 🎥 **Join Appointment** (filled grey) · 📅 **Reschedule** (outlined) · 🗑 **Cancel Appointment** (outlined).
- **View Request Details ›** (bordered cyan link card): "See full request history, messages and clinician updates".
- **Appointment Information** (label/value rows): Date "Friday, 23 October 2026" · Time **"03:00 AM (1259 mins)"** · Request Type · Appointment Type "Video Appointment" · Meeting Link "Link here" (blue underlined).
- **Patient Information** + **View Full Profile ›** (outlined pill): Patient Name · Pronouns (—) · Phone · Email.
- Footer: **Cancel** (outlined pill; closes the popup).

---

## Tab 2 · Appointment Requests
Requests to book a staff member other than the one the system recommended.
- **3 stat cards** in one row:
  | Card | Colour | Value |
  |---|---|---|
  | Pending Approval Appointments | orange | 0 |
  | Approved Today Appointments | green | 5 |
  | Rejected Today Appointments | red | 1 |
- Filters: `Requested By` (All Staff) · `Status` (**All Status, Pending Approval, Approved, Rejected, Expired**) · `Date Range` ("All dates") · ✕ Clear filters.
- Table:
  | Patient Name (link) | Original Recommendation | Requested Alternative | Reason | Requested By | Expires in | Status | Actions |
  - "Expires in" shows `---` for resolved requests.
  - Status: Approved / Rejected.
  - Actions are empty for resolved rows; pending rows probably show Approve / Reject (none pending in dev).
- Pagination `1–6 of 6`.
- Permission link: "Appointment: View Alternative Appointment Approval Requests › Approve/Reject…".

## Issues found
- **Duration bug:** past appointments show durations like 1259 / 1200 / 1160 min (about 20 hours), apparently the time elapsed since the appointment, not its length. The popup repeats it ("03:00 AM (1259 mins)").
- **Appointment type names differ:** the filter lists "Face To Face Surgery / Telephone Or Audio…", the table shows "Online (Video) / Face to Face", and the popup shows "Video Appointment" / "Online Appointment". Filtering by type probably can't match the "Online (Video)" rows.
- **12-hour time in the popup** ("03:00 AM"); the rest of the app uses 24-hour.
- **Two different active-toggle colours** on one page: cyan (top tabs) vs dark teal (Calendar/Table).
- **The Requests tab reuses the "Appointment / Manage and schedule…" header.**
- **Duplicate staff names** in the Staff filter.
- **Search placeholder cut off** ("Search by name or email, p…").
- **Stat labels:** "Approved Today Appointments" reads oddly.
- **Two current-time line styles:** solid with a dot (Appointment) vs dashed with an arrow (ROTA).

## Not opened (change data or need your OK)
Join / Reschedule / Cancel Appointment · View Request Details · View Full Profile · Day view · clicking an empty calendar slot (may start booking) · Approve / Reject on pending requests (none pending).
