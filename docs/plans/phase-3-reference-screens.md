# Phase 3 plan: reference screens

**Status: built 2026-10-28** (approved as proposed: both new components; after onboarding go to the profile; JPEG or PNG logos; proposed placeholder copy; built from the screens (no extra capture)).

**Built notes:** time fields use the date-picker library's 24-hour `TimeField` (the browser's own time input follows the browser language and showed AM/PM). Hour-order errors show as soon as a time changes. The practice grid's list view reuses the table columns without Actions; rows are clickable. Mock data persists in the browser (`aqlios-mock-db-v2`).

The four screens are the **reference screens** in CLAUDE.md §3: the card grid, the list/table page and the create/edit form. Every later module copies their patterns, so this phase also builds the form components that phases 4 and 5 reuse.

| # | View | Route (as live) | Spec |
|---|---|---|---|
| 1 | Practice grid (Dashboard) | `/verticals/public/practices` | `docs/super-admin/01-verticals-and-practice-list.md` §2 |
| 2 | Practice Management list | `/verticals/public/hub-management/practices` | `docs/super-admin/02-practice-onboarding.md` |
| 3 | Onboard New Practice | `/verticals/public/hub-management/practices/practice-management/onboard` | `docs/super-admin/03-onboard-new-practice.md` |
| 4 | Practice profile (View) | `…/practice-management/create/manual/complete-profile?practiceId={id}&subAppId={subAppId}` | `docs/super-admin/04-practice-profile.md` |

The profile keeps the live **query-string** URL, which suits the static host: one page serves every practice.

---

## View 1: Practice grid
**Layout:** `VerticalShell` → `HubManagementLayout` (no breadcrumb, as live) → `ModulePageHeader` (grid icon, **Public Practice** / "Practice List", **⊕ Onboard New Practice** on the right) → `ViewModeToggle` → content → pagination. It replaces the phase 2 interim list.

- **Grid view (default):**
  - 3 columns × 4 rows, 12 per page. Responsive: 2 columns on tablet, 1 on phone.
  - **`HubCard`** (reused from the inventory): white card (20px radius, thin border) holding a grey inner pill with `EntityAvatar` (logo or 2-letter initials) | divider | name (2 lines, then `…`), and a round ↗ button (`aria-label="Open business"`).
  - **Hover:** the inner pill gets a light teal tint, and the full name appears in a tooltip when it's truncated.
- **List view:** the same `DataTable` columns as View 2 (the live list view wasn't captured). The toggle is remembered per visitor in the persisted UI state.
- **Pagination:** `TablePagination` "Rows per page: 12" with options **12, 24, 48** (not captured live), plus "1–12 of 155".
- **Opening a practice** (card, ↗ or row) → `/verticals/public/practices/{slug}/dashboard`. For practice users it also calls the mock `PATCH …/user-businesses/{id}/select`, as live.
- **Practice user:** sees only their practices and **no Onboard button** (as live).

**States:**
- **Loading:** 12 skeleton cards.
- **Empty:** "No practices found." For a practice user: "You aren't linked to any practice yet. Ask your administrator."
- **Error:** "Failed to load practices" toast, plus an inline "Try again".

**API:** `GET …/practices?page&page_size=12` (backend-scoped by user).

---

## View 2: Practice Management list (reference for list pages)
**Layout:** breadcrumb `Practice Management / Practice List` → panel → `ModulePageHeader` (folder icon, **Practice Management** / "Practice List", **⊕ Onboard New Practice**) → button row (**Practice List** teal pill via `PillTabs`, **↻ Refresh** outlined pill) → **"Practices List"** heading → full-width `Practice Name` search → `DataTable`.

- **Columns:**
  - **Practice Name:** name plus a second line with the email or `—`. Invalid emails are shown as-is, as live.
  - **Practice Manager:** name or `—`.
  - **No. of Users:** sortable.
  - **Date Added:** `DD/MM/YYYY`, sortable, the default (`-created_at`).
  - **Actions:** 👁 `View` → View 4.
- **Incomplete rows:** peach background, orange left border, and an ⓘ icon with the tooltip "Practice profile is incomplete".
- **Search** is debounced 400ms and sent as `search` (param name inferred) on the server. Empty result: **"No practices found. Try another search."** (CLAUDE.md pattern).
- **Refresh** re-fetches and shows the table's loading rows.
- **Pagination:** default 10, options 10, 25, 50, plus "1–10 of 155".
- **Removed live dead code:** no Archived tab and no Archive action (both are off live; see the confirmation-popups doc). Adding archiving is a decision for later.

**States:** loading skeleton rows · empty (above) · error row "Could not load practices." plus an error toast · success after create/save returns here with a toast (see View 3).

**API:** `GET …/practices?ordering&page&page_size&search`.

---

## View 3: Onboard New Practice (reference for create/edit forms)
**Layout:**
- Breadcrumb `Practice Management / Add New Practice` → panel with a centred column:
  - `GoBackLink` → list.
  - Header: building icon, **Practice Information**, "Enter your practice information manually to onboard your practice.", and on the right **Save Changes** (teal pill, `type=submit`).
- **`LogoUploadDropzone`:** dashed box with a cloud icon, "Choose a file or drag & drop your practice logo here", "**JPEG or PNG up to 10MB**" (fixes the live "PDG" typo; see questions), and **Browse File**.
- Four **`FormSectionCard`s**, all expanded:

| Section | Fields (required *) | Components |
|---|---|---|
| Practice Details | Practice name or ODS code* (search) · Practice Name* (unique) · Practice Manager · Practice Type* (disabled "Public") · PCN Name* · Phone number* (🇬🇧 +44) · Email Address · Website · Practice Description (0/500) | `OdsPracticeSearch`, `PracticeManagerSelect`, `PhoneField` |
| Address | Address Line 1* · Address Line 2 · Postcode* | `TextField` |
| Point of contact | ⊕ Add Another POC → **Person N** cards: Name* · Contact No* · Email* · Designation* · Description (0/500) · 🗑 (no confirm, as live) | `RepeatableItemCard` (new), `PhoneField` |
| Operating Hours | 7 rows: switch · Open/Closed · from `HH:mm` · "to" · to `HH:mm`. Default Sun/Sat Closed, Mon–Fri 08:00–18:30 | `OperatingHoursRow`, `AppSwitch` |

**Behaviour:**
- **ODS search:** type-ahead with options "**Name**" plus "`ODS | PCN`". Picking one autofills name, PCN, phone, website, address line 1, postcode and operating hours.
- **Name availability:** checked 500ms after the name changes. If taken: "**A practice with this name already exists.**" (placeholder copy; the live message wasn't captured).
- **Validation (Formik + Yup, on blur and on submit):**
  - Required fields use the captured messages: "Practice name or ODS code is required", "Practice name is required", "PCN name is required", "Phone number is required", "Address line 1 is required", "Postcode is required", "Name is required", "Designation is required".
  - Invalid emails show "Enter a valid email".
  - The rebuild adds UK format checks for phone and postcode ("Enter a valid UK phone number", "Enter a valid UK postcode"), plus "Closing time must be after opening time" (live: "Start time cannot be after end time").
  - A section with an error gets the **red card border**.
  - **Improvement:** on submit, the page scrolls to and focuses the first error (live doesn't).
  - **One error red** is used everywhere (`error.main`); the live app uses two reds.
- **Save:** `POST` (inferred, below). The button shows a spinner and is disabled while saving. On success: the toast "**Practice onboarded successfully**" (placeholder copy) and a redirect to that practice's **profile (View 4)**, so the Additional Configuration can be finished. On failure: "Failed to onboard practice" toast, and server field errors shown on the matching fields.
- **Leaving with unsaved changes:** no prompt, as live.

**APIs** (✔ = captured URL, ~ = inferred):
- ✔ `GET /practice-management/v1/public-practices?search=` (ODS)
- ✔ `GET /users/v1/sub-apps/{id}/practice-managers/?page&page_size=10`
- ✔ `GET …/practices/name-availability?practice_name&practice_type=PUBLIC[&exclude_practice_id]`
- ~ `POST /practice-management/v1/sub-apps/{id}/practices` (create)
- ~ `POST …/practices/logo` (multipart; returns `logo_url`)

The response shapes for the ✔ endpoints weren't captured, so the mocks follow the screens. I'll align them if you sign in once more (§Questions).

---

## View 4: Practice profile (View / Complete Practice Profile)
**Layout:**
- Breadcrumb `Practice Management / Complete Practice Profile`. The live middle crumb "Practice Onboard Setup Method" points to an uncaptured page, so it's **dropped** rather than linked to nothing.
- `GoBackLink`, then header **Practice Information**, "Update practice information, upload your logo, and configure additional settings.", and **Save Changes**.
- **Logo block:** 80px framed logo, ✓ **Saved**, **Change Logo**, 🗑.
- The four View 3 sections, **collapsed by default** and without the ODS search.
- Divider pill **Additional Configuration**, then the sections below, expanded.

| Section | Content | Components |
|---|---|---|
| Rota groups (Optional) | Multi-select chips `Select Rota Group(s)`; empty "No rota groups available." | `RotaGroupSelect` |
| Linked Practices (Optional) | Multi-select chips `Select Practice(s)` | MUI `Autocomplete` |
| Practice Succession Date | `Start Date *` (DD/MM/YYYY) · ☑ Ongoing; unticking shows `End Date *` (not captured; must be after the start) | MUI `DatePicker` |
| Workforce Allocation Configuration (Optional) | Repeating **Workforce Allocation N**: Staff Type (15 options) · Frequency (Daily/Weekly/Monthly) · Hours (e.g. 8) · 🗑 · ⊕ Add hours for another staff type | `RepeatableItemCard` |
| Appointment Type Configuration (**Mandatory**) | Warning alert (live copy) · 5 rows: Face To Face Surgery, Telephone Or Audio, Face To Face Home Visit, Written Including Online, Admin Work (locked) · Default chip / Set as Default. Error if no default: "**Select a default appointment type.**" (placeholder) | `ToggleOptionRow` |
| Slot Duration Configuration | Repeating **Slot Duration N**: Role* · Appointment Type* (enabled types only) · Duration (minutes)* (digits, max 5, step 15) · ⊕ Add another… | `RepeatableItemCard` |
| Appointment Booking Configuration | Urgent / Routine selects: **Both, Admin Staff, AI Voice Agent** with **the same values and order in both** (approved bug fix) | `TextField select` |
| Urgent Capacity Threshold | Per-day rows (same `OperatingHoursRow`, **same iOS switch**, fixing the live cyan switch) · Extra appointments select (5 options) | `OperatingHoursRow` |

**States:**
- **Loading:** a full-panel spinner while the details, appointment configuration and SLA configuration load.
- **Unknown or forbidden `practiceId`:** `AccessDenied` "Practice not found or you don't have access".
- **Validation** as in View 3.
- **Save:** one Save Changes saves all three resources. Toast "**Practice profile updated successfully**" (placeholder); stay on the page.
- **Partial failure:** a toast naming which part failed.

**APIs:**
- ✔ `GET …/practices/{id}`
- ✔ `GET /public/v1/sub-apps/{id}/practices/{id}/clinical-system/appointment-configuration/`
- ✔ `GET …/practice/{id}/sla-configuration`
- ✔ `GET /public/v1/sub-apps/{id}/rota-groups/?status=active`
- ✔ `POST …/rota/same-rota-practices/` (lookup)
- ~ `PATCH …/practices/{id}`, `PUT` for the appointment configuration, `PUT` for the SLA configuration

**"Incomplete" rule (inferred):** live rows were incomplete even with a manager and email, so it's probably about the Additional Configuration. The mock marks a practice incomplete until it has a default appointment type, at least one slot duration and a succession start date. Saving the profile then clears the orange row, which can be demoed.

---

## Components
**Reused, built in phase 2:** `VerticalShell`, `HubManagementLayout`, `ModulePageHeader`, `DataTable`, `PillTabs`, `ViewModeToggle`, `EntityAvatar`, `GoBackLink`, `StatusChip`, `LoadingSpinner`, `AccessDenied`.

**From COMPONENTS.md, built now:** `HubCard`, `PracticeListToolbar`, `FormSectionCard`, `AppSwitch`, `LogoUploadDropzone`, `OdsPracticeSearch`, `PracticeManagerSelect`, `PhoneField`, `OperatingHoursRow`, `ToggleOptionRow`, `RotaGroupSelect`. `CollapsibleAccordion` isn't needed separately, because `FormSectionCard` covers it.

**New (needs approval):**
| Component | Why nothing existing fits |
|---|---|
| `RepeatableItemCard` | The live app repeats one pattern three times: a grey sub-card with icon, "{Label} N", 🗑 and a collapse chevron (Person N, Workforce Allocation N, Slot Duration N). One component instead of three copies |
| `PracticeForm` (feature-level, `src/features/practices/`) | Shared form body for View 3 and View 4 (sections, schema, ODS autofill), so the two screens can't drift apart |

## Demo data added
- **ODS directory:** about 40 fictional NHS-style practices across a few towns, with name, ODS code, PCN code, phone, website, address and hours.
- **Practice managers:** 25 fictional people, paged 10 at a time.
- **Rota groups:** the 3 captured names, as product config.
- **Appointment and SLA configuration** per practice.
- **Existing practices:** emails, managers and logos for some of them, so every column and row state can be demoed.
- **Saving:** creates and saves persist in the visitor's browser and survive reloads. The user menu's "Reset demo data" restores everything.

## Tests (Playwright, desktop + phone)
- **Grid:**
  - 12 cards and pagination work.
  - The view toggle switches and is remembered.
  - Truncated names show a tooltip.
  - Practice users get no Onboard button and only their own cards.
- **List:**
  - Default sort is `-created_at` with ↓ shown, and sorting by users works.
  - Search narrows the rows, and the empty message appears.
  - The incomplete row style and tooltip show.
  - 👁 opens the profile.
- **Onboard form:**
  - Saving the empty form shows the six captured messages and red sections, and focus moves to the first error.
  - ODS autofill fills all its fields.
  - A taken name shows its error.
  - POC add and delete work, and a bad POC email shows its error.
  - A closing time before the opening time is rejected.
  - A successful save shows the toast and the new practice in the list.
- **Profile:**
  - Fields load into the form.
  - Unticking Ongoing shows End Date.
  - Disabling the default appointment type shows its error.
  - Slot duration options follow the enabled types.
  - Saving clears the incomplete row.

## Questions
1. **Approve** the four views and the two new components (`RepeatableItemCard`, `PracticeForm`)?
2. **After onboarding:** go to the new practice's **profile** to finish setup (proposed), or back to the list?
3. **Logo formats:** the live copy says "JPEG, PNG, PDG". Should it be **JPEG or PNG** (proposed), or should SVG/PDF be allowed?
4. **Placeholder copy:** the success toasts, the "name already exists" error and the "select a default appointment type" error weren't captured live. Are the proposed wordings okay?
5. **Optional capture:** if you sign in to the dev app once more as super-admin, I'll record the response shapes of the 3 lookup endpoints (practice managers, ODS search, rota groups), read-only, before building the mocks. Or I can build from the screens now.
