# Super-admin · Settings

Captured 2026-10-27. Nothing was saved, and no table switch was clicked.
Route: `/verticals/public/settings?section=<section>`. Unlike ROTA tabs, sections **are** in the URL.

## Layout (settings shell)
- Breadcrumb: `Settings` (underlined link) `/ <Section name>`.
- Header: white circle tile with a ⚙ icon and **Settings** (bold, ~32px). No subtitle.
- Two columns:
  - **Left nav card** (~210px, white, rounded): 4 links. The active one is a bold pill with a light border.
    | Section | `?section=` |
    |---|---|
    | Global Practice Configuration | `practice-configuration` (default) |
    | Global Appointment Configuration | `appointment-configuration` |
    | Competency | `competency` |
    | Pathway Configuration | `pathway-configuration` |
  - **Content card** (white, rounded): section title (bold) + subtitle, then the content.
- Config sections have **Cancel** (outlined) and **Save Changes** (filled grey) **top-left under the title**, both disabled until something changes. Other forms put these buttons top-right.

---

## 1. Global Practice Configuration
"Manage global practice configurations here." These are the defaults behind each practice's own Additional Configuration (see `04-practice-profile.md`).

| Section | Contents |
|---|---|
| Appointment Type Configuration **(Mandatory)** | Warning alert (same copy as the practice profile). Rows: ☐ **Face-to-Face** [Set as Default] · ☑ **Call** [**Default** cyan chip] |
| Slot Duration Configuration (Optional) | Header button **＋ Add Another Slot** (cyan filled pill). Helper: "Configure slot durations per Practice + Role + Appointment Type combination". Sub-card **Slot Duration 1** (sliders icon, red 🗑): Role* `Clinician` · Appointment Type* `Face-to-Face` · Duration (Mins)* `30` |
| Appointment Booking Configuration | Urgent* `Both` · Routine* `Both` |
| Operating Hours | **Mon → Sun** order. Each day is a grey rounded box: day · cyan switch · Open/Closed · from-time · "to" · to-time. Mon–Fri Open 09:00–18:00; Sat and Sun Closed (times greyed out but visible: 09:00–17:00) |
| Custom practice closed messages | "These are messages you can set to appear when practice is closed for clinical and non-clinical requests." Two blocks, one for **clinical** requests and one for **non-clinical**: bold heading, recommendation text ("We recommend including guidance… call 111."), `Message *` textarea, "Character limit: 300" |

## 2. Global Appointment Configuration
"Manage global appointment configurations here" (no full stop).

| Section | Fields |
|---|---|
| Opened Slot Configuration | `Allow patient to select offered slots` with a **Hrs.** suffix (value 799). Live helper: "Patients can book their appointments within 799 hours." |
| Appointment Reminder Settings | `Send SMS Reminder` and `Send Email Reminder` selects, each with a live helper "Send SMS reminder to patient for their appointments before 48 hours." Options: **No reminder, Before 48 Hours, Before 24 Hours, Before 12 Hours, Before 6 Hours, Before 2 Hours** |
| Cancellation & Rescheduled Policy | `Minimum Cancellation Notice` (hours) · `Minimum Reschedule Notice` (hours), with helpers. Checkboxes (all ☑): Enable Video Appointments · Notify staff when a client cancels · Show clinician name to patients · Re-open cancelled slot for immediate booking |
| Appointment Booking Configuration | `Max Advance Booking Period *` (Days suffix, 799) · **Same Day Booking** switch ("Not Allowed") · Urgent* `Admin Staff` · Routine* `Admin Staff` · ☑ Require Manager Approval for alternative appointments |
| Urgent Capacity Threshold | Day rows (Mon–Sun) as in Operating Hours · `Extra Appointments *` select (`Creating additional same-day appointments`) |
| Additional Slot Duration N | Repeating, header button **Add Another Slot**. Fields: Role* · Appointment Type* · **Staff*** · Start Time* · End Time*. Values: Clinician / Telephone/Audio / "Ali Emis - 201"; Clinician / Online (Video) / "Ali Ali" |

Appointment types seen here: **Telephone/Audio, Online (Video)**.

## 3. Competency
"Manage clinical competency categories and sub-types used for staff assignment and task routing."
- **＋ Add Competency** (cyan filled pill, top-left).
- Table with a **teal-tint header row** (unlike the white headers elsewhere):
  | Competency Type | Role | Sub Types | Slot Duration | Staff Assigned | Date Added | Actions |
  |---|---|---|---|---|---|---|
  | Only new | Nurse | Only new one | 30 mins | 0 | 05/10/2026 | |
  | Furqan Clinician Multiple Type | HR, Nurse, Clinician | Sub1, Sub2, Sub3 | 30 mins | 1 | 02/10/2026 | |
  | ENT | Furqan Practice Manager | Throat, Nose, Ear | 30 mins | 4 | 11/08/2026 | |
- Sub Types wrap into tall rows. The table is **wider than its card**, so Date Added and Actions are cut off and scroll sideways.
- Pagination `1–3 of 3`.

### Add Competency drawer ⭐ (reference for side drawers)
- MUI **Drawer from the right, 480px**, 18px radius, MUI elevation-16 shadow, page dimmed behind.
- Header: **Add Competency** (bold) + ✕, divider. Intro: "Define a competency type and its associated sub-types."
- **Labels above the fields** (bold 14px, red `*`), not floating labels:
  | Field | Required | Placeholder |
  |---|---|---|
  | Competency Type Name | ✓ | e.g. Respiratory |
  | Description (optional) | | Describe this competency type... (grey textarea) |
  | Roles | ✓ | Select Roles (multi-select) |
  | Slot Duration | ✓ | e.g. 30 + unit select (**only "Mins"**) |
  | Sub Types | ✓ | Sub-type 1 … plus **＋ Add Sub-type** (cyan pill, right-aligned) |
- Sticky footer: **Cancel** (outlined, cyan text) · **✓ Save Competency** (cyan filled).

## 4. Pathway Configuration
"Manage practices-wide pathway configuration settings here." Title is **regular weight**, not bold like the other sections.
- `⏷ Filters:` Type (All, **Clinical, Administrative**) · Status · Channel · Routing (2nd row) · full-width Search ("Search here..").
- Table columns: Pathway · Type · Status · **Mobile App · Web App · Voice Agent · Website · Care Navigator** (inline cyan switches per channel) · Routing (Hub / Practice) · Actions. This table is also wider than its card.
- Rows are **grouped by specialty**, each with a header row "N of M active":
  Administrative and Non-Clinical (2/5) · Cardiovascular and Metabolic (0/7) · Dermatology (1/3) · Ear, Nose and Throat (1/5) · Gastrointestinal (0/6) · Long-Term Conditions, Frailty and Complex Care (0/1) · Men's Health (0/1) · Mental Health and Neurology (1/4) · Musculoskeletal (0/6) · Ophthalmology (0/1) · Paediatric and Child Health (0/1) · Respiratory (1/4) · Women's Health (1/5)
- Status chips: **Active** (green outline and tint) · **Draft** (outlined grey) · **Archived** (grey filled). Draft rows show `—` instead of switches.
- Example rows (Administrative): Ongoing or Longstanding Issue Follow-up with a Specific Clinician Assessment (Draft) · Medication Query Assessment (Active, Hub; Mobile App switch grey/off) · Covid Vaccine (Archived, Practice) · Death Process (Draft, Hub) · Home Visit Request (Active, Practice).
- ⚠ The channel switches look like they **save immediately**; they weren't clicked.

## Issues found
- **Appointment type names disagree across the app:** "Face-to-Face / Call" (global), "Face To Face Surgery / Telephone Or Audio / Face To Face Home Visit / Written Including Online / Admin Work" (practice), "Telephone/Audio / Online (Video)" (additional slots).
- **Urgent/Routine options:** the global page shows "Admin Staff" for both. Given the value/label mix-up found on the practice profile (`URGENT` labelled "Admin Staff"), these saved values may be wrong.
- **Operating Hours layout breaks:** the "to" time wraps onto its own line in each day box.
- **Saved closed messages are cut off** mid-word ("…e.g. te"), even though the limit is 300 characters, so text is being lost on save or load.
- **Day order differs:** Mon→Sun here, Sun→Sat on the practice forms.
- **Test-looking values** in dev data (799 hours/days) suggest the number fields have no max limit.
- **Three form styles across the app:** floating-label MUI fields (most forms), labels above the fields (drawer), and suffix adornments.
- **Button colours mixed:** cyan (`#5CE1E6`) for Add Competency, Add Another Slot and Save Competency; teal elsewhere.
- **Tables overflow their cards** (Competency and Pathway); there's no responsive column handling.
- **Header mismatches:** "Cancellation & Rescheduled Policy" (mixed tense); Global Appointment's subtitle lacks the full stop that the others have.
- **Inconsistent table header styling:** a teal tint here, white elsewhere.

## To capture
- [ ] Each section's Save success and validation
- [x] Competency delete confirm (see `docs/practice/09-confirmation-popups.md`); edit drawer is in this doc
- [ ] Pathway detail page (row action is only "Configure"; no confirmations)
- [ ] What toggling a channel switch does (needs your OK; probably saves immediately)
