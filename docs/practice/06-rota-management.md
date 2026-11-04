# Practice · HRM → ROTA Management (and Activity Tracker)

> Rebuilt in phase 5 (2026-11-04): `src/features/rota/PracticeRotaPage.tsx` and the shared ROTA tabs. Built notes are in `docs/plans/phase-5-practice-modules.md` (Progress).

Captured 2026-10-27 in **Main Practice - Surgery** as super-admin. Nothing was assigned, edited, published or bid on; the Edit Assignment drawer was cancelled.
Route: `/verticals/public/practices/{slug}/rota`. Tabs **are in the URL** here: `?module=shiftBidding`, `?module=activityTracker` (the vertical-level ROTA tabs are not).
The sidebar items "ROTA Management" and "Activity Tracker" both open this page; Activity Tracker opens its tab.

The layout reuses the vertical ROTA (`docs/super-admin/06-rota-management.md`). Only the differences and the new parts are listed here.

## Tabs
Pill container with **Staff Rota** · **Shift Bidding** · **Activity Tracker**. The active tab is dark teal filled. (Vertical level has Rota Management · Rota Groups · Activity Tracker; at practice level **Rota Groups is replaced by Shift Bidding**.)

## 1. Staff Rota
- Header: **ROTA Management** / "Practice View" or "Staff View". Same `Practice View | Staff View` switch and the same Download Rota / Apply Rota Template / Create Rota Template buttons.
- Filters: Staff · Staff Type · Duty Type · Roles · Rota Group · Show · Date. **There's no Practice filter** (the practice is already selected).
- Same legend (session type, duty type, gaps).
- **No left side panel** of practices; the grid takes the full width.

### Shift block ⭐ (first time seen with data)
White card, **6px radius, 12px solid left bar in the session colour** (`#0EA5E9` = AM), no shadow, full height of the shift span. Content, top to bottom:
1. **Staff name** (bold, truncated "Appointm…") with hours **"8h 0m"** on the right
2. Role chip **Clinician** (teal outline, mint fill)
3. Contract chip **Salaried** (grey fill)
4. Practice chip **Main Practice - Surgery** (rust outline, peach fill)
5. 🕘 **09:00 - 17:00**

- Several staff on the same day sit **side by side** as columns within the day.
- Each day has a thin column of **＋ buttons** (one per 30-minute slot, cyan "+"), the "Assign Staff" targets. No tooltip on hover.
- No hover tooltip on shift cards.
- Data this week: "Appointments Example - 6500" and "Appointments Example Two - 1413", Clinician, Salaried, 09:00–17:00, Mon–Fri.

### Edit Assignment drawer (click a shift) ⭐
Right drawer, **480px**, white header with ✕, sticky footer.
- Header: **Edit Assignment** · date chip "📅 Mon, 5 Oct" ⚠ (the clicked shift was Mon 26 Oct; it appears to show the series start date, in an unexpected format).
- **ASSIGNED STAFF (1)** (uppercase label): mint card with name, role chip, 🗑 remove, "09:00 - 17:00", ⌃ collapse. **Weekly Capacity** bar: "0h remaining", "40h assigned", "40h total".
- Grey sub-card **Main Practice - Surgery**:
  - Scope radios: ◉ **Current Assignment** · ○ Current and Following Assignment · ○ All Assignments
  - `Assignment Type *` segmented: **Once** | **Recurring** (both disabled when editing; Recurring is selected)
  - `Start Date *` 26/10/2026 · `End Date *` 05/11/2026 (disabled)
  - **Repeat every week**: day circles M T W T F (teal filled = selected) and S S (outlined = off)
  - `Number of hours to assign for this shift *` · **Flexible Hrs.** switch · `8` · `09:00` 🕘 to `17:00` 🕘 · **＋** (Add shift slot)
  - `Duty Type for this shift *` (Select duty type)
  - `Appointment Type *` (multi: "Written Including Online, Face To Face Surgery") · `Routine / Urgent *` (multi: "Routine (1 week), Urgent")
  - `Enter break hours`: HH:mm to HH:mm
- Footer buttons: **Save changes** (teal) · **Cancel** (outlined).

## 2. Shift Bidding (new at practice level)
- Header **ROTA Management** / "Shift Bidding".
- Empty state, centred grey text: **"No shifts open for bidding right now."**
- Permission link: ROTA › "Publish Slot, Accept or Reject Bidding" and "Bid for a ROTA Slot". Published slots and bids show up here.

## 3. Activity Tracker
Same as the vertical tab (stats Active Now 00 / Inactive 02 / On Leave 00, staff activity cards), except:
- Filters: Staff · **Duty Type** (new) · Status · Date · Search. **No Practice filter.**
- The cards omit the "Practice Name" row.

## Issues found
- **Edit Assignment date chip** shows "Mon, 5 Oct" for a 26 Oct shift.
- **Duty Type is empty** on an existing assignment, though it's required (`*`), so saving this record may fail validation.
- **Mixed session colour:** a full-day 09:00–17:00 shift uses the AM colour.
- The **＋ slot buttons** have no label or tooltip (the accessible name is just "icon").
- Two sidebar items point to one page; at least they open different tabs here.
- Activity Tracker still shows a "Standard" duty type and 12-hour times (same as vertical level).

## Not opened (change data or need your OK)
＋ Assign Staff · Save changes · remove staff 🗑 · Create / Apply Rota Template · Download Rota · Day view · Staff View with data.

## Captured 2026-11-03 (phase 5 read-only session)

Practice: Main Practice - Surgery (the only practice with patient data). Open and cancel only; nothing was sent, saved, assigned, published or asked. Numbers match the checklist in `docs/plans/phase-5-practice-modules.md`.

### 10 Practice ROTA header, Create / Apply Rota Template
- Practice rota header: tabs Staff Rota | Shift Bidding | Activity Tracker (plain buttons). Title "ROTA Management". Toggle Practice View / Staff View. Actions: Download Rota · Apply Rota Template · Create Rota Template. Week nav "2 Nov - 8 Nov 2026" with unlabelled prev/next icon buttons (a11y bug), Day/Week.
- Filters: Staff Name · Staff Type · Duty Type · Roles · Rota Group · Show (all "All") · Date (DD/MM/YYYY picker).
- Legend: SESSION TYPE: AM, PM · DUTY TYPE: On Call, Care-home / Ward Round, Extended Access, Nursing, Admin Session, Neighbourhood Shift, Remote Working, AM Session, PM Session · GAPS: Leave-created, Published, Holidays, Unallocated.
- Grid: every empty day-slot shows an "Assign Staff" placeholder; shift blocks show name (truncated "…"), "8h 0m", role chip, contract chip "Salaried", practice name, "09:00 - 17:00". Published gap: "Published Slot for Bidding" / "00 Eligible Bids" (zero-padded, sic).
- **Create Rota Template**: Dialog 600 wide, 18px radius, ✕ "Close dialog". Title "Create Rota Template". Subtitle "Create a reusable rota template from existing schedules to quickly apply recurring staffing patterns in future rota periods." Fields: Template Name * (maxLength 30) · Rota Group (Optional) autocomplete · Select Practice * (prefilled with the current practice, disabled) · Select Staff * (multi-select autocomplete with checkboxes, placeholder "Search Staff") · "Select date range from existing rota *" with Start Date * / End Date * (DD/MM/YYYY) · checkbox "Include Bank Holidays in Template" (unchecked). Footer Cancel · **Create Template** (disabled until valid).
- **Apply Rota Template**: Dialog 700 wide. Title "Choose Rota Template". Subtitle "Apply an existing rota template to generate future schedules using predefined staffing patterns and session assignments." A list of template cards: name · red Delete icon · edit (BorderColor) icon · **Choose** button · practice name · start DD-MM-YYYY · end DD-MM-YYYY (dashes, sic: use DD/MM/YYYY) · "5 Shifts" · "1 Staff Members" (sic plural). Footer Cancel · **Apply Template** (disabled until one is chosen). Icon buttons have no aria-label or tooltip (a11y bug: label "Delete template" / "Edit template").
- Live bug: the Apply list shows templates from other practices (Friary House Surgery) inside Main Practice. Rebuild: filter to the current practice.
- What happens after Choose wasn't checked (no clicks beyond open and cancel).

### 11 Assign Staff (practice ROTA)
- Opened by **dragging** across a future day column (cursor crosshair; mousedown→mousemove→mouseup selects a start–end time in 15-min steps). Past days ignore it. A plain click does nothing. Rebuild: keep drag-select, and add keyboard access (Enter on a focused slot opens a 1h default), because live has none.
- Right drawer 480 wide. Two segmented buttons at the top: **Assign Staff** (active: filled teal #2C7A7B) | **Publish Slot**. There's an unlabelled ✕ icon button (a11y bug).
- **Assign Staff** mode: date "Wed, 4 Nov" · Search ("Search staff...") · "AVAILABLE STAFF (n)" heading (0 → "No staff available"; loaded async, briefly 0 first) · staff cards: name · role (Clinician) · availability "00:00 - 23:00" · "Weekly Capacity" with "99h remaining" / "0h assigned" / "99h total". Footer Cancel · Assign Staff (disabled, grey #E5E7EB, until a staff card is selected).
- **Publish Slot** mode: date · "Create proposal and publish unallocated slot." · practice name · the dragged range "00:15 - 00:45" · switch "Shift Time ⇄ Session Hrs" (off = Shift Time) · time fields hh:mm "to" hh:mm (MUI TimeField with clock picker) · Staff Contract ("Select staff contract") · Rota Groups ("Select rota groups") · Roles ("Select roles") · Select Staff ("Search Staff", disabled until the filters are chosen) · Duty Type ("Select duty type") · Bidding Timeline (DD/MM/YYYY date) · switch "Repeat Slot / Choose to publish same slot for next week." (ON by default) · Repeat Until (date) · "Notification Preferences / Choose how members of this group are notified about new shifts." checkboxes Aqlios App, SMS, Email (all off). Footer Cancel · Publish Slot (enabled before validation, so validation must happen on submit; rebuild: disable until valid per CLAUDE.md).
