# Practice · HRM → ROTA Management (and Activity Tracker)

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
