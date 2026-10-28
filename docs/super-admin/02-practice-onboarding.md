# Super-admin · Practice Onboarding (HUB)

Route: `/verticals/public/hub-management/practices` · Captured 2026-10-27.

## Layout
- Same vertical shell header as the dashboard (☰, Back to Verticals, logo | Public Practice, 🔔, user pill).
- **Breadcrumb** (above the panel, left): `Practice Management / Practice List` — first crumb dark, second grey, `/` separator.
- **Page panel** (light grey, rounded ~24px):
  - Title row: white rounded icon tile (folder/ID icon) + **"Practice Management"** (bold ~26px) / "Practice List" (grey).
  - Right: **Onboard New Practice** — dark teal pill button with ⊕ icon (same as dashboard).
  - **Tab-style button row**:
    - `Practice List` — active: teal filled pill, white text, list icon.
    - `Refresh` — inactive: outlined pill (light teal border), teal text, ↻ icon. Re-fetches the table.
  - Section heading **"Practices List"** (bold ~18px).
  - **Filter**: full-width outlined text field with floating label `Practice Name` (MUI outlined TextField, rounded ~10px). Filters the table by name.

## Table
White rounded container, header row on white, rows separated by thin dividers.

| Column | Content | Sortable |
|---|---|---|
| Practice Name | Name (dark, ~14px) + second line: practice email, or `—` if none | No |
| Practice Manager | Manager name, or `—` | No |
| No. of Users | Integer | **Yes** (button header) |
| Date Added | `DD/MM/YYYY` | **Yes** — default sort, descending (↓ arrow shown) |
| Actions | 👁 eye icon button (`View`) | — |

### Row states
- **Incomplete profile** rows: pale peach/salmon background (`~#FDF1EC`), **orange left border** (~3px, `~#E8774A`), orange ⓘ/! circle icon before the name. Icon label: `Practice profile is incomplete` (likely a tooltip on hover — to confirm).
- Normal rows: white background, no icon.
- Incomplete seen on: Ashcroft Surgery, Westcotes Gp Surgery (Two), Elm Tree Surgery, Ponteland Medical Group, Fairfields Practice. Incomplete does not depend on having a manager (Ponteland has one).

### Sample data (page 1, default sort)
| Practice | Email | Manager | Users | Added | Incomplete |
|---|---|---|---|---|---|
| Ashcroft Surgery | — | — | 1 | 07/10/2026 | ✓ |
| Westcotes Gp Surgery (Two) | testexample1@nhs.net | — | 0 | 06/10/2026 | ✓ |
| Elm Tree Surgery | — | — | 0 | 05/10/2026 | ✓ |
| Hadrian Health Centre | testexample1@nhs.net | Manager Appointments | 0 | 04/10/2026 | |
| Ponteland Medical Group | furqan.daud@aqliosssssss.com | Manager Appointments | 0 | 01/10/2026 | ✓ |
| Westcroft House Surgery | ali.emis@yopmail.com | Manager Appointments | 0 | 23/09/2026 | |
| Croft Hall Medical Practice | sam@nhs.net | Manager Appointments | 1 | 18/09/2026 | |
| Linthorpe Surgery | linthorpe@nhs.net | Manager Appointments | 0 | 18/09/2026 | |
| St. Albans Medical Group | sfasfasf | — | — | 18/08/2026 | |
| Fairfields Practice | test-practice-16@nhs.net | Manager Appointments | 0 | 17/08/2026 | ✓ |

Edge cases visible in data: missing email (`—`), invalid email text (`sfasfasf`) is displayed as-is, missing manager (`—`).

### Pagination
`Rows per page: [10 ▾]` · `1–10 of 155` · ‹ › (note: default 10 here vs 12 on dashboard grid).

## APIs
- List: `GET /api/crm/api/practice-management/v1/sub-apps/{subAppId}/practices?ordering=-created_at&page=1&page_size=10`
  - `ordering` drives the sortable columns (`-created_at` = Date Added desc).
- Detail (seen when a practice was opened earlier): `GET .../practice-management/v1/sub-apps/{subAppId}/practices/{practiceId}?user_id={userId}`
- Practice notifications: `GET /api/crm/api/public/v1/sub-apps/{subAppId}/practices/{practiceId}/notifications/?page=1&page_size=10`

## To capture
- [ ] Hover on incomplete ⓘ icon (tooltip text)
- [ ] Row hover state
- [ ] Sort toggles: No. of Users asc/desc, Date Added asc
- [ ] Practice Name filter: results + **no results** empty state
- [ ] Rows-per-page dropdown values
- [ ] **View (👁)** → practice detail page
- [ ] **Onboard New Practice** → form/stepper, all fields, dropdowns, validation errors, success/cancel popups
- [ ] Refresh loading state

## Rebuilt (phase 3)
`src/features/practices/PracticeManagementListPage.tsx`. Search sends `search` (param name inferred). No Archived tab or Archive action (off in the live app too).
