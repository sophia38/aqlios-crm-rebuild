# Practice · EHR → Tickets (consultations)

Captured 2026-10-27 in **Main Practice - Surgery** as super-admin. Nothing was assigned, approved, saved or closed.
Route: `/verticals/public/practices/{slug}/consultations-review`. Sidebar label "Tickets"; page breadcrumb `Dashboard › Tickets`.

> **Session note:** after signing in again, a direct link to a practice page redirects to the practice grid. The "current practice" is kept in client state and has to be re-selected from the grid. Deep links into practices don't survive a new login.

## 1. Tickets list
- White rounded page card. **Tickets** (bold, ~22px) / "View and manage all tickets from department as a care navigator."
- **Case switch** (pill toggle): 📥 **Open Cases** (cyan filled when active) | 📤 **Closed Cases**.
- Right-side stacked filters:
  - `Search` "Search here..." with 🔍
  - `Status` select (Open Cases only)
  - `Date Submitted` date picker (grey filled field, 📅)

### Status options (Open Cases)
All · New · More Info Required · Appointment Pending · Under Clinical Review · Reopened · Forwarded · Follow Up Requested · Appointment Booked · DNA · Appointment Cancelled

### Open Cases table (147 rows; scrolls sideways with a visible scrollbar)
| Column | Content |
|---|---|
| Severity | 🏳 grey flag icon. Tooltip **"Routine"** (an urgent flag is probably red; token `tickets.flagUrgent #D32F2F`, routine `#BDBDBD`) |
| Source | Voice Agent · Web Triage |
| Recommended Staff | `—` none · **name + ⓘ** (tooltip "Recommended Staff"; recommended but not approved) · **green name + ✅** (tooltip "Assigned Staff"; `#2E7D32`) |
| Date & Time | `DD/MM/YYYY HH:mm` |
| Complaint Type | e.g. "Repeat Prescription Request", "Diabetes Concerns, Questions Or Problems Assessment" (truncated with …) |
| Patient Name | name + ⧉ copy icon |
| Age & Gender | outlined chip `Male (32)` (grey `#BDBDBD` border) |
| Status | **outlined pill** chips: **New** (blue outline and text) · **Under Clinical Review** (orange outline and text) |
| Actions | 👁 **View consultation** · ✓ **Approve recommended staff** (grey and disabled when nobody is recommended, green when available) · 👤+ **Assign to Alternative Staff**. Assigned rows show only 👁 |

Pagination `1–10 of 147`.

### Closed Cases table (6 rows)
| Patient Name (⧉) | Source | Case Type | **Date Closed** (blue header, sortable) | Closed By | Reason for Closure | Actions |
Reasons in dev data: "Completed.", "Close.", "tEST", "mnm" (free text). Pagination `1–6 of 6`.

## 2. Consultation Details — `/consultations-review/{consultationId}`
Breadcrumb `Dashboard › Tickets › Consultation Details`.

### Header
- `‹ Back` pill · **Consultation Details** · outlined chip **"Current Viewer: Aqlios Admin"**. Opening a ticket **registers you as its viewer**, so other users see who has it open.
- Clinical system bar:
  - **Fetch from Clinical System** (outlined teal, with icon)
  - **Send data to Clinical System** (disabled)
  - **Open in Clinical System ↗** (disabled text link)
- Patient: **Aqlios Test** ⧉
- Row:
  - `‹ Previous Consultations` link
  - **View Logs** (outlined pill, history icon)
  - **Update Status** (disabled)
  - Status chip **Under Clinical Review** (orange outline)
- **Info alert** (light blue): "This consultation is unassigned and read-only. Assign a staff member to enable actions. Use the Assign Staff Member panel to assign it."

### Cards (top to bottom)
1. **Summary tabs** (pill tabs; active is cyan): **Consultation Summary** · **SNOMED codes** · **Requested Tests & Documents** · **Medication**
   - Summary: grey rounded rows with a label and value: Presenting Complaint ("Repeat prescription: ibuprofen"), Current Condition History, Timeframe, Symptoms (missing values in *italic "Not provided"*). Then **Red Flags** in a **light red box** with red text ("No red flags identified").
   - SNOMED codes: **Add SNOMED code** with `Search codes` ("Type at least 3 characters"), `Comment (Optional)`, buttons **Add and Save to Clinical System** / **Add and Save to Aqlios**. Then a **Saved SNOMED codes** table (Saved SNOMED codes · Comment · Date & Time).
   - Requested Tests & Documents: empty state *"No requested tests or documents"*.
   - Medication: empty state *"No medication prescribed"*.
   - Note: the **Voice Agent Recommendations** card shows only while the Summary tab is active.
2. **Chat with Patient**
   - Outlined chip "Preferred Method: Aqlios App". Header icons: ↻ refresh, ⤢ expand.
   - **Use Message Template** bar: "Browse categorised templates and instantly apply them to the patient conversation." with a **Browse Templates** button (disabled while unassigned).
   - Empty state "No messages yet".
3. **Voice Agent Recommendations**
   - "How clinically urgent is this consultation?" with radio cards **Urgent · Routine (1 Week) · Routine (2 Weeks)**. Helper: "This urgency level is selected by voice agent — change it if you disagree."
   - "What actions are required to solve this consultation?" "No actions recommended." Helper: "These actions are prescribed by voice agent change if you disagree."
4. **Assign Staff Member**: `Select Staff *` select ("Select here") and **Assign Task** (disabled until a staff member is chosen).
5. **Details**: label/value rows: Request date & time · Status · Request Name · Submitted by.
6. **Clinical Notes** (⤢ expand)
   - Use Note Template + Browse Templates
   - textarea "Clinical notes and observations..." (`0/700`)
   - ☐ Share this note with the patient
   - **Save Notes to Aqlios** (full-width, filled)
   - **Save Notes to Clinical System** (full-width, outlined); both disabled
7. **Voice Consultation Transcript** (⤢ expand)
   - Header "26 October 2026 · 16:57 – 16:57 · 42s".
   - Chat bubbles: **AI Assistant** on the left (robot icon, light grey bubble with a **cyan left border**); **patient** on the right (cyan filled bubble, name above). The area scrolls internally.

### Consultation Logs drawer (View Logs)
- **Right drawer with a cyan `#7ADDE2`-ish header**: "Consultation Logs" / "Full activity log for Aqlios Test's consultation", ✕.
- Timeline entries: green dot · **actor** (bold) + event ("Consultation Started", "Patient Symptoms Recorded") · "User: Aqlios Voice Agent (Voice Agent)" · on the right a role chip (light cyan "Voice Agent") and a timestamp "26 October 2026 at 16:57".

## Issues found
- **Voice-agent urgency wording vs data:** the helper says the agent selected a level, but no radio is selected.
- **Missing comma** in "These actions are prescribed by voice agent change if you disagree."
- **Two drawer styles:** Competency (white header, 480px) and Consultation Logs (cyan header, ~470px).
- **Status chips differ by module:** outlined pills here, filled-tint chips in Roles and Templates.
- **Closed Cases isn't sorted** by Date Closed, although its header looks active (blue).
- **Mixed date formats:** `DD/MM/YYYY HH:mm` (list, details) vs "26 October 2026 at 16:57" (logs, transcript).
- **Free-text closure reasons** allow junk ("tEST", "mnm"); there's no predefined reason list.
- **Viewer tracking:** simply viewing a ticket registers "Current Viewer". Worth knowing when testing.

## Not opened (change data or need your OK)
Approve recommended staff · Assign to Alternative Staff · Assign Task · Update Status · Fetch from / Send to Clinical System · Add SNOMED code · Save Notes · sending chat messages · Browse Templates popup (disabled while unassigned) · Previous Consultations · a Closed case's detail.
