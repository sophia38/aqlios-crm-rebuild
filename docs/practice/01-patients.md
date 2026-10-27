# Practice · EHR → Patients

Captured 2026-10-27 as super-admin. Nothing was saved, archived, deregistered or edited.
- Croft Hall Medical Practice has **no patients** (empty state).
- **Main Practice - Surgery** has 1 test patient ("Aqlios Test", dev data), used for the screenshots below.

## Navigating between practices
- **Switch Practice** (practice switcher menu) goes back to `/verticals/public/practices` (the grid). It doesn't open a picker.
- The URL slug is generated from the name: "Main Practice - Surgery" → `main-practice---surgery` (**triple dash**). The API's `slug` field is `null` for this practice.
- An **unknown slug or a practice ID** in the URL silently redirects to the practice grid, with no "not found" message.

## Practice-level page anatomy (differs from vertical pages)
- The top bar shows a **breadcrumb** instead of the page title: `Dashboard › Patient Management` (and `› Patient Details`). Earlier crumbs are grey, the current one is dark.
- No grey page panel and no icon tile. The title sits directly on the page: **Patient Management** (24px / **400**, `rgba(0,0,0,0.87)`) and "Manage Patients registration." (grey).

## 1. Patient list — `/patient-management`
- `⏷ Filters:` with two outlined selects:
  - `Registration Type`: All, Emergency, Immediately Necessary, Private, Regular, Temporary, Dummy, Other, Contraceptive Services, Maternity Services, Child Health Services, Walk-In, Gynaecology, Rheumatology, Dermatology
  - `Registration Date`: "Select date" date picker
- `Search`: full-width field, "Search by Name, NHS #, Phone No or email ID", 🔍 on the right.
- Table (scrolls sideways; header row bg `#F5F5F5`, bold small headers, centred):
  | Column | Content |
  |---|---|
  | # | row number |
  | Patient Name | name, plus a second line "NHS: 123 456 7890" (grey, small) |
  | Status | icon only: ✅ green check-circle. Tooltip: **"Patient Registered and Carer Correct"** (dark tooltip) |
  | Phone Number | `+447…` |
  | Email | |
  | Registration Type | small grey chip, e.g. **Private** |
  | Carer | carer name + blue ⓘ icon. **Hover shows a rich tooltip "Carer Information"**: Name, NHS No, DOB, Age, Sex, Ethnicity, Email, Phone, Address, Relationship |
  | Postcode | |
  | Date of Birth | `DD/MM/YYYY` |
  | Sex at Birth | |
  | Actions | 👁 view · 🗄 **Archive** (`aria-label "Archive {name}"`) |
- Pagination: `Rows per page: 10` · **`1 of 1 (1 Patients)`**, a fourth pagination format in the app.
- Empty state (Croft Hall): a single centred row, **"No registered patients yet."**
- The patient name isn't clickable; the record opens only from 👁.

## 2. Patient Details — `/patient-management/{patientId}`
Breadcrumb: `Dashboard › Patient Management › Patient Details`.

### Header
- `‹ Back` (white pill with shadow) · **Patient Details** · chips **Private** (grey) and **Carer Verified** (purple text, light purple bg).
- Action row:
  - 👁 **Open in Clinical Systems** (greyed out, disabled)
  - 👤✕ **Deregister Patient** (outlined **red** pill)
  - ✎ **Edit Details** (cyan filled pill)

### Cards (all collapsible, ⌃ on the right, white with shadow)
1. **Manage Registration**
   - `Registration Type` select (Private), `Registration Status` select, `NHS Number`.
   - Registration Status options: **Patient Registered and Carer Correct** ✓ · Patient Registered but Carer Incorrect · Not Known · Patient Not Registered.
   - 💾 **Save Status** (cyan pill, right).
2. **Additional Notes**
   - ⊕ **Add Note** (cyan pill) in the header.
   - Notes are **pale-yellow cards** with the full text, a red 🗑 on the right, and a footer "Added By: {name}" (left) and "7 October 2026 at 13:37" (right). The dates use a **long format**, unlike `DD/MM/YYYY` elsewhere.
3. **Patient Information**
   - Badge **"Not Sync with Clinical System"** (sic).
   - Read-only outlined fields (3 per row): First / Middle / Last Name · Date of Birth · Sex at Birth · Ethnicity · Phone Number · Email Address · Spoken Language · Do you need an interpreter? · Interpreter · Do you need transport assistance?
   - **Address** sub-group: Street Address · Address Line 2 · City · Post Code.
   - Empty values show `-`.
4. **Carer Information** (badge "Carer Verified")
   - Read-only fields: First / Middle / Last Name · Date of Birth · Sex at Birth · Ethnicity · NHS Number · Address · Relationship to Patient · Phone Number · Email Address.
5. **Contact Patient**
   - Tab strip (folder-style tabs; active white, inactive grey): 📞 **Call** · 💬 **Message** · ✉ **Email**.
   - Call tab: `Phone Number` (read-only) with a **Copy Phone Number** outlined pill inside the field · `After Call Feedback` textarea ("Record the outcome of the call.", `0/1000 characters`) · **Save Feedback** (cyan pill).
6. **Medical Requests**
   - Tabs: **Health Records** | **Consultations**.
   - Health Records: a list of file rows (red document icon, filename truncated with "…", "Date Added: 15/09/2026", 👁 view on the right).

## Issues found
- **Copy:** "Not Sync with Clinical System" should be "Not synced with clinical system".
- **Copy:** "Manage Patients registration." has odd capitalisation.
- **Date formats are mixed** on one page: `DD/MM/YYYY` in fields, "7 October 2026 at 13:37" on notes.
- **Pagination text** ("1 of 1 (1 Patients)") differs from the other tables, and "1 Patients" isn't singular.
- The carer's NHS number shows as `1234567894` in the card but `123 456 7894` in the tooltip.
- The patient's Street Address and City contain "Na" (test data stored as a value, not empty).
- Title weight is 400 here, while vertical-level titles are bold.

## Not opened (would change data or needs your OK)
- Archive patient · Deregister Patient · Edit Details · Save Status · Add Note / delete note · Save Feedback
- Message and Email tabs in Contact Patient (opening a tab is safe; can be captured next)
- Consultations tab and the 👁 file viewer
