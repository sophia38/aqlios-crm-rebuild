# Super-admin · Onboard New Practice (form)

Route: `/verticals/public/hub-management/practices/practice-management/onboard` · Captured 2026-10-27.
Entry: **Onboard New Practice** button (dashboard or Practice Management list).
**Save Changes was not clicked** — submit result, server errors and success popup are still to capture.

## Design tokens (measured from computed styles)
| Token | Value |
|---|---|
| Font | **Poppins** (body 16px, weight 400); MUI also loads Roboto as fallback, a display font "Bingo" exists |
| Body text | `rgba(0,0,0,0.78)` on `#FFFFFF` |
| Primary (teal) | **`#2C7A7B`** — Save button, switch "on" track |
| Required asterisk / error | `#D32F2F` (MUI error red), 12px |
| Page title | 24px / 700 |
| Section heading | 20px / 700 |
| Primary button | pill (`border-radius: 999px`), 42px high, padding 8px 24px, 15px / 500, white text |
| Outlined pill button (Browse File) | 1px `#1E1E1E` border, 999px radius, 14px / 500, padding 6px 20px |
| Text input | MUI Outlined, **12px radius**, 52px high, input text 14px, border `rgba(0,0,0,0.23)` |
| Disabled input | bg `#F5F5F5`, text `#9CA3AF` |
| Switch track | 26px high, 13px radius; off `#E9E9EA`, on `#2C7A7B` (iOS-style switch) |
| Dropdown popup | 18px radius, MUI elevation-1 shadow, list max-height 260px, option padding 6px 16px |
| UI library | **MUI** (Material UI) |

## Layout
- Breadcrumb: `Practice Management / Add New Practice`.
- Grey rounded page panel; inside, a centred column:
  - `‹ Go Back` link (small, grey) → back to practice list.
  - Header row: building icon + **Practice Information** / "Enter your practice information manually to onboard your practice." · right: **Save Changes** (teal pill, `type=submit`).
- **Logo dropzone**: dashed-border rounded box; cloud-check icon; bold "Choose a file or drag & drop your practice logo here"; grey "JPEG, PNG, PDG up to 10MB" (sic — "PDG" typo in the live app); right: **Browse File** outlined pill.
- Then four **collapsible section cards** (white, ~20px radius, thin border; header row with icon + bold title + ⌃ chevron; divider under the header; all expanded by default):

### 1. Practice Details
| Field | Type | Required | Placeholder / notes |
|---|---|---|---|
| Practice name or ODS code | Search autocomplete | ✓ | "Search by practice name or ODS code" |
| Practice Name | Text | ✓ | "Enter practice name (must be unique)" — uniqueness checked via API |
| Practice Manager | Autocomplete select | | "Select practice manager" |
| Practice Type | Select, **disabled**, value `Public` | ✓ | grey disabled style |
| PCN Name | Text | ✓ | "PCN Name" |
| Phone number | Phone input w/ country flag | ✓ | defaults to 🇬🇧 `+44` |
| Email Address | Text | | "Email Address" |
| Website | Text | | "test.co.uk" |
| Practice Description | Multiline textarea (grey bg) | | "Brief description of your practice and services..." · counter `0/500 characters` |

Two-column rows: Practice Name | Practice Manager; Phone | Email. Others full width.

### 2. Address
| Field | Required | Placeholder |
|---|---|---|
| Address Line 1 | ✓ | "Enter Address Line 1" |
| Address Line 2 | | "Enter Address Line 2 (optional)" |
| Postcode | ✓ | "Enter Postcode (e.g., SW1A 2HQ)" |

### 3. Point of contact
- Header has an **⊕ Add Another POC** outlined teal pill button beside the chevron.
- Empty by default. Each click adds a **Person N** sub-card (light grey bg, rounded) with a person icon, title "Person 1", red 🗑 delete icon and its own ⌃ chevron.
- Delete removes the person **immediately — no confirmation popup**.

| POC field | Required | Notes |
|---|---|---|
| Name | ✓ | |
| Contact No | ✓ | phone input, 🇬🇧 +44 |
| Email | ✓ | |
| Designation | ✓ | |
| Description | | textarea, `0/500 characters` (placeholder copy-pasted: "Brief description of your practice and services...") |

### 4. Operating Hours
One row per day: day label · switch · "Open"/"Closed" · `HH:mm` from-time · teal "to" · `HH:mm` to-time (time fields have up/down spinners; hidden when Closed).

Defaults (blank form): Sun **Closed**, Mon–Fri **Open 08:00 to 18:30**, Sat **Closed**.

## Dropdowns
- **Practice Manager**: two-line options (name, then grey email). Loaded 10 at a time from
  `GET /api/crm/api/users/v1/sub-apps/{subAppId}/practice-managers/?page=1&page_size=10`.
  First values: Access T Testing (saqib29@yopmail.com), alam khan, Ali Emis Manager, aziz khan, bakhti rehman, … (sorted A→Z, case-insensitive).
- **Phone country**: popup with a 🔍 search box; only option **United Kingdom +44**.
- **ODS search**: type-ahead; options show practice name (bold) + `ODS code | PCN code` in grey, e.g.
  - The Leeds Road Practice — `B82012 | U91790`
  - Leeds City Medical Practice — `B86012 | U16878`
  - The North Leeds Medical Practice — `B86013 | U31228`
  - Leeds Student Medical Practice — `B86110 | U96282`
  - API: `GET /api/crm/api/practice-management/v1/public-practices?search=Leeds`

## Behaviour
- **Selecting an ODS result autofills**: Practice Name, PCN Name (PCN code, e.g. `U91790`), Phone (`+44 1423 566636`), Website, Address Line 1 (`49-51 Leeds Road`), Postcode (`HG28AY`) **and Operating Hours** (changed to 09:00–17:00 Mon–Fri).
- **Name availability** check fires after the name is set:
  `GET .../practices/name-availability?practice_name=...&practice_type=PUBLIC` (and again with `&exclude_practice_id=...`).
- **Section error state**: when a section contains an invalid field, the whole section card gets a **red border** (also shown when the section is collapsed).
- Inline field errors (red outline + red helper text under the field), shown on blur:
  | Field | Message |
  |---|---|
  | POC Name empty | `Name is required` |
  | POC Email invalid (`abc`) | `Enter a valid email` |
  | POC Designation empty | `Designation is required` |
  | POC Contact No too short (`12`) | no error on blur — probably validated on submit |

## Save Changes on an empty form
Captured 2026-10-27 on a freshly loaded (blank) form. **Validation is client-side only — no API request was sent.** No toast or popup; the page does not scroll to the first error.

| Field | Error message |
|---|---|
| Practice name or ODS code | `Practice name or ODS code is required` |
| Practice Name | `Practice name is required` |
| PCN Name | `PCN name is required` |
| Phone number (only `+44`) | `Phone number is required` |
| Address Line 1 | `Address line 1 is required` |
| Postcode | `Postcode is required` |

- Error styling: field label and outline turn **`#DC2626`**; helper text 12px `#DC2626`, margin `3px 14px 0`.
- Sections with errors (Practice Details, Address) get the **red card border**.
- **Point of contact is optional** — no error when zero POCs are added. Operating Hours defaults pass.
- Optional fields (Practice Manager, Email, Website, Description, Address Line 2) show no error.
- Note: the error red here is `#DC2626`, while the required `*` is MUI's `#D32F2F` — two slightly different reds in the live app.

## To capture
- [x] Click **Save Changes** with empty form → all error messages
- [ ] Successful submit → toast/popup + redirect
- [ ] Duplicate name error (name-availability = taken)
- [ ] Logo upload: preview, wrong type, > 10MB
- [ ] Practice-level required errors (Practice name/ODS, PCN, Phone, Address Line 1, Postcode) and phone/postcode format rules
- [ ] Time validation (to < from)
- [ ] Description > 500 chars
- [ ] Hover states: buttons, dropdown options, section chevrons
