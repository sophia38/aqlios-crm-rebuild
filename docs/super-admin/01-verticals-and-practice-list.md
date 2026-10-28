# Super-admin · Verticals & Public Practice List

Captured 2026-10-27 from `crm.dev.aqlios.31g.co.uk` as **Aqlios Admin (super-admin)**.
Stack observed: Next.js (App Router, `_next/static/chunks/app/...`).

---

## 1. Verticals picker — `/verticals`

### Layout
- **Header** (no bar background, sits on page):
  - Left: Aqlios logo (`/aqlios_logo.svg`).
  - Right: user pill — circular avatar with initials `AA` (light lavender bg), name "Aqlios Admin", role "super-admin" + chevron (combobox, opens account menu — options not yet captured).
- **Body**: centred greeting `Welcome back **Aqlios Admin** 👋` (name bold).
- **Three cards** in a row, rounded (~16px radius), thin light border, white bg with soft gradient, each with a lightbulb illustration and a two/three-line title:
  | Card | State |
  |---|---|
  | Public Primary Care | Active → `/verticals/public/practices` |
  | Private Business | Active (not yet captured) |
  | Everyclinic Business | **Disabled** — title and icon faded/greyed |
- **Footer**: top border, centred `Copyright © 2026 Aqlios. All rights reserved.`
- Background: white fading to a very light blue/teal gradient toward the bottom.

### APIs
| Call | Purpose (inferred) |
|---|---|
| `GET /api/auth/me` (+ `?fresh=1`) | Session user + role |
| `GET /api/crm/api/users/v1/profile` | Profile (name, avatar) |
| `GET /api/auth/sub-apps` | Vertical cards list + enabled state |
| `/business_logos/arrow_business_icon.svg`, `/business_logos/business_svg.svg` | Card icons |

### To capture
- [ ] User pill dropdown options
- [ ] Card hover state
- [ ] Disabled card tooltip/cursor (if any)
- [ ] Private Business vertical

---

## 2. Public Practice list — `/verticals/public/practices`

### Header (vertical shell)
Floating rounded header bar (pill-shaped container, very light blue-tinted bg):
- Left: hamburger button (`Open menu`, circular outline) → opens side menu (**not yet captured — this is the module list**).
- `‹ Back to Verticals` pill button (outlined) → `/verticals`.
- Centre: Aqlios logo | vertical divider | "Public / Practice" two-line label.
- Right: bell icon button → `/verticals/public/notifications`; user pill (same as above).

### Page card
Large rounded panel (light grey `#F5F5F5`-ish bg, ~24px radius):
- Title row: square icon tile (grid icon, white bg, rounded) + **"Public Practice"** (bold, ~26px) / "Practice List" (grey, small).
- Right: **Onboard New Practice** button — dark teal (`~#3F7F7A`), white text, pill shape, leading ⊕ icon.
- View toggle (`tablist "View as list or grid"`): pill with two icon tabs — **List view** | **Grid view**; active tab = teal filled circle with white icon. Grid is default.

### Grid view
- 3 columns × 4 rows (page size 12).
- Each item is a white rounded card (~20px radius, thin border) containing:
  - Inner light-grey pill with: logo **or** initials avatar (circle, light teal bg, dark bold 2-letter initials) | thin vertical divider | practice name (centred, 2 lines, truncated with `…`).
  - Right: circular outline button with dark navy ↗ arrow (`Open business`).
- Names longer than 2 lines are ellipsised (e.g. "Ashcroft Sur…", "Hadrian Heal… Centre").
- Logo vs initials: practices with an uploaded logo show the image (e.g. Westcroft House → "31G" logo, Croft Hall/Linthorpe → Ripon Spa Surgery logo, St. Albans → screenshot-like logo); others show initials.

Sample data on page 1:
| Initials | Practice |
|---|---|
| AS | Ashcroft Surgery |
| WG | Westcotes Gp Surgery (Two) |
| ET | Elm Tree Surgery |
| HH | Hadrian Health Centre |
| PM | Ponteland Medical Group |
| logo | Westcroft House Surgery |
| logo | Croft Hall Medical Practice |
| logo | Linthorpe Surgery |
| logo | St. Albans Medical Group |
| FP | Fairfields Practice |
| TS | Testvale Surgery |
| KM | Kings Medical Centre |

### Pagination (bottom, right-aligned, top divider)
`Rows per page: [12 ▾]` · `1–12 of 155` · `‹` (disabled on page 1) `›`
(MUI-style TablePagination.)

### APIs
`GET /api/crm/api/practice-management/v1/sub-apps/{subAppId}/practices?page=1&page_size=12`
- Public Primary Care sub-app id: `3b668066-ab7e-4a11-ae82-01af30ff5cef`
- Total: 155 practices.

### To capture
- [ ] **Hamburger side menu** (module list)
- [ ] List view (table columns)
- [ ] Rows-per-page dropdown values
- [ ] Card hover + arrow hover states; truncated-name tooltip?
- [ ] Onboard New Practice flow (form fields, validation, popups)
- [ ] Practice detail (click ↗)
- [ ] Notifications page
- [ ] Empty / loading / error states

## Rebuilt (phase 3)
Practice grid: `src/features/practices/PracticeGridPage.tsx`. List view reuses the Practice Management columns (live list view not captured). Rows per page 12/24/48 (not captured). Practice users: own practices only, no Onboard button.
