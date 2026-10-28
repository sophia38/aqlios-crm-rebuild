# Phase 2 plan: page frames and shared components

**Status: built 2026-10-28** (approved with option A (pre-build every practice; rich demo data in 3 practices), the component gallery and the "no access" message).

**Built notes:** 5,604 static pages, 308 MB (more than the 200 MB estimate). Below the `md` breakpoint the practice sidebar becomes a ☰ drawer (the live app has no phone layout). URLs that weren't pre-built (e.g. a mistyped practice) show a "Page not found" page. Practice slugs come from the demo fixtures at build time.

**Goal:** every menu item at vertical and practice level navigates to a real route inside the right frame. Unbuilt modules show their placeholder. The shared building blocks used by phases 3–5 exist and are tested. No module screens (lists, forms) are built in this phase, except the practice **Dashboard** banner, which is the practice level's landing page.

---

## 1. Decision: practice URLs on a static host
The live app puts the practice in the path: `/verticals/public/practices/{practice-slug}/rota`. GitHub Pages can only serve pages that exist at build time, and each page is about 44 KB.

| Option | URLs | Build output | Trade-off |
|---|---|---|---|
| **A. Pre-build every practice (recommended)** | Same as live: `/practices/{slug}/{module}` | 155 practices × ~30 practice routes ≈ 4,600 pages, about **200 MB**; the build takes a few minutes | Every practice and deep link works. **Detail pages** (a patient, a staff member) are pre-built only for the entities in the demo data. Rich demo data (staff, patients, rota) lives in **3 demo practices**; the other 152 have empty lists. That keeps the site bounded as modules grow |
| B. Practice in the query string | `/practices/rota?practice={slug}` | ~30 practice pages, under 2 MB | Tiny and fast, but **every practice URL differs from the live app** |
| C. Switch to a server host | Same as live | Small | Vercel can deploy straight from your GitHub repo and supports real dynamic routes. Pages hosting is dropped, but code stays on GitHub |

With **A**, if the site ever nears GitHub Pages' 1 GB limit, the fallback is C. Nothing in the screens changes.

---

## 2. Vertical frame: `VerticalShell` + `AppSidebar` (vertical drawer)
**Spec:** `docs/super-admin/01-verticals-and-practice-list.md` §2 (header), `00-module-map.md` (drawer and menu). **Applies to:** every `/verticals/public/...` route except the practice level.

### Header
- A floating pill bar (very light blue tint, radius 999) holding:
  - ☰ round outline button (`aria-label="Open menu"`)
  - **‹ Back to Verticals** outlined pill → `/verticals`
  - Centre: logo | divider | "Public / Practice" two-line label
  - Right: 🔔 icon button (`aria-label="Notifications"`) → `/verticals/public/notifications`, then `UserMenu`
- Practice users never see this frame, because hub routes send them to their practice list (§5).

### Drawer (`AppSidebar`, `variant="drawer"`)
- Left temporary drawer, about 245px, over a dimmed backdrop, inside `<nav aria-label="Main navigation">`.
- Logo, then a divider, then "Overview" → **Dashboard**.
- Sections: **HUB, COMMS, ANALYTICS & REPORTING, COMPLIANCE, FINANCE, RECRUITMENT, SUPPORT**. Headers are uppercase teal with a left bar and a ⌃ collapse control (all open by default; `aria-expanded`).
- Items are outline icon + label. The active item is a mint pill with a teal inset border and `aria-current="page"`; hover is `#EFFCFC`.
- Pinned footer: 🔔 Notifications, ⚙ Settings, and a teal user card (initials, name, role).
- Esc and backdrop click close it; it also closes after navigating.

### Routes wired (16 items, `00-module-map.md`)
| Status | Items |
|---|---|
| Real route, **placeholder until its phase** | Dashboard (practice grid, phase 3), Practice Onboarding, Template Library, Role and Permissions, ROTA Management, CQC Compliance, Settings (phase 4) |
| `coming-soon/{module}` (built now, final) | Leaves Management, Notification Management, Reports, Payroll, Workforce Validation, Vacancy Management, Application Tracking |
| Live placeholder (built now, final) | System Feed, Notifications |

### Page anatomy (CLAUDE.md §3)
- **`HubManagementLayout`:** breadcrumbs `<nav aria-label="breadcrumb">` + grey rounded page panel (`surface.panel`, radius 24).
- **`ModulePageHeader`:** white icon tile, title (pageTitle) / subtitle, actions on the right.
- **Coming-soon page:** header with the module's icon, name and "Coming soon", then `ComingSoonPlaceholder` with the copy "We are currently building {Module}. It will be available here soon." There's no breadcrumb, as in the live app.

### States
- **Loading:** the route's `loading.tsx` shows `LoadingSpinner`.
- **Route error:** `error.tsx` shows "Something went wrong" and a Try again button.
- **Signed out:** `AuthGate` (built).

---

## 3. Practice frame: `PracticeShell` + `PracticeSidebar` + `PracticeSwitcher` (approved new components)
**Spec:** `docs/practice/00-practice-shell-and-module-map.md`, `docs/practice-user/00-practice-user-role.md`. **Applies to:** `/verticals/public/practices/[practiceSlug]/...`.

### Sidebar (`PracticeSidebar`, built as `AppSidebar variant="persistent"` if the code shares enough)
- Persistent, about 195px. A `‹` circle on its edge collapses it to icons only (`aria-label` "Collapse sidebar" / "Expand sidebar"). The collapsed state is remembered in redux-persist, the first use of persisted state.
- Logo at the top, then "Overview" → Dashboard, then sections **EHR, HRM, COMMS, FINANCE, COMPLIANCE, SUPPORT** (28 items, same look as the drawer).
- Footer: Notifications, Settings, and the user card (name, plus a role line only when the role is set).
- **Role-aware menu:**
  - Super-admin sees the captured super-admin list.
  - Practice user also gets **Profile** and loses **HR Policies** and **Documents**.
  - Driven by one menu config in `src/config/navigation.ts`, not two hand-written menus.

### Top bar
- Flat white bar: page icon + page title on the left (the Dashboard shows "Welcome back {name} 👋").
- On the right: 🔍 (`aria-label="Search"`, **disabled with tooltip "Coming soon"**, because the live one does nothing), 🔔 (unread dot when there are notifications), then **`PracticeSwitcher`**.

### `PracticeSwitcher`
- White pill with the **bold practice name** and ⌄ (⌃ when open).
- Menu: current practice (highlighted), **Switch Practice** (→ `/verticals/public/practices`), **Logout**.
- In mock mode it doesn't call the live app's `PATCH …/user-businesses/{id}/select`; the URL is the source of truth. A mock handler for that path is added anyway, so live mode can call it later.

### Practice context
- `[practiceSlug]` resolves the practice from the practices list (cached per session).
- An unknown slug, or a practice the user can't access, shows **"Practice not found or you don't have access"** with a link to the practice list. The live app silently redirects to the grid; the rebuild doesn't.

### Routes wired (28 items)
| Status | Items |
|---|---|
| **Built now** | Dashboard: dark-teal gradient banner "Welcome, {first name}!" / "You are in **Public Primary Care**" |
| Real route, placeholder until phase 5 | Profile (practice user), Patients, Tickets, Appointment, Staff on-boarding, ROTA Management, Activity Tracker (opens ROTA with `?module=activityTracker`, fixing the shared-URL highlight bug), Leaves, Leaves and ROTA, HR Policies, Settings (with its 5 path sections) |
| Live "practice placeholder" style (built now, final) | Documents, Recruitment, Performance, Support, Notifications: centred message on the grey background with no header, copy from `docs/practice/04-documents-and-placeholders.md` |
| `coming-soon/{module}` (built now, final) | The 12 practice coming-soon modules |

---

## 4. Shared components (all from COMPONENTS.md; nothing new beyond §3)
Each is built to its captured spec and shown in a **component gallery** (`/dev/components`, mock mode only) so you can review them on the dev URL before modules use them.

| Component | Spec source | Notes |
|---|---|---|
| `ModulePageHeader` | `02-practice-onboarding.md` | Icon tile, title/subtitle, actions |
| `HubManagementLayout` | `02-practice-onboarding.md` | Breadcrumbs + grey panel |
| `DataTable` | `02-practice-onboarding.md` (reference table) | Sortable headers driven by API `ordering` (`aria-sort`), row states (incomplete: peach bg `#FDF1EC`, 3px orange left border, ⓘ "Practice profile is incomplete"), eye-icon View action, `TablePagination` (default 10; options per screen), loading row, empty line "No {things} found. Try another search.", error line |
| `PillTabs` | `02-practice-onboarding.md` | Teal filled active pill |
| `SegmentedTabs` | `06-rota-management.md` | Icon tabs in a pill container; `role="tablist"` |
| `ViewModeToggle` | `01-verticals…` §2 | "View as list or grid" tablist |
| `FilterBar` | `06-rota-management.md`, `07-leaves…` | "☰ Filters:" label, small selects, search with 🔍 and debounce, Clear filters, optional Refresh |
| `FormModal` | Create Rota Group (`06-rota-management.md`) | 600px, 16px radius, title + ✕, intro, Cancel (outlined pill) + submit (disabled until valid, optional icon); Esc closes; **no discard prompt** (as live) |
| `FormDrawer` | Add Competency (`09-settings.md`) | Right drawer 480px, labels above fields, sticky Cancel + Save footer |
| `ConfirmDialog` | `docs/practice/09-confirmation-popups.md` design A | Tones error, warning, success, primary; auto "This can't be undone." subtitle for Delete/Remove **without repeating it in the body**; warning and alternative callouts; **focus starts on Cancel and Enter doesn't confirm** (approved bug fix) |
| `StatusChip` | Roles, ROTA groups, Staff | Soft (tinted) and outlined variants from `tone`/`status` tokens; one status → one colour map |
| `ActionMenu` | Template Library | ⋮ menu; destructive items red, warning items orange |
| `EntityAvatar` | Practice grid | Logo, or 2-letter initials on teal-light |
| `GoBackLink` | Roles | "‹ Go Back" |
| `ComingSoonPlaceholder` | built | Gains the vertical header variant |
| `RouteErrorBoundary`, `LoadingBoundary` | — | `error.tsx` and `loading.tsx` conventions |

**Deferred to the phase that first uses them:** `FormSectionCard`, `LogoUploadDropzone`, `OperatingHoursRow` and the other form pieces (phase 3); `PermissionTree`, `TemplateCard`, `RichTextEditor`, `GroupedDataTable`, `SettingsShell` (phase 4); ROTA pieces (phase 5).

---

## 5. Access rules wired in this phase
| Who | Rule |
|---|---|
| Practice user | `/verticals` → their practice list (phase 1). Any hub route (`/verticals/public/roles`, `/templates`, `/settings`, …) shows **"You don't have access to this page"** with a link back, instead of the live app's silent redirect |
| Practice user | Only their 2 practices resolve at practice level |
| Super-admin | Every route |

## 6. APIs
No new endpoints, apart from the mock `PATCH …/users/v1/sub-apps/{id}/users/{userId}/user-businesses/{practiceId}/select` (§3). The practice context uses the existing practices list and detail endpoints.

## 7. Tests (Playwright, desktop + mobile)
- **Navigation:** every sidebar and drawer item reaches the right route and frame, and the active item has `aria-current`.
- **Drawer:** opens, Esc closes, and it closes after navigation. **Sidebar:** collapse and expand, and the state survives a reload.
- **Practice level:** the switcher menu and Switch Practice work; an unknown slug shows the error state; the practice user's menu has Profile and no HR Policies or Documents; hub routes show "no access".
- **ConfirmDialog:** focus is on Cancel and Enter doesn't confirm. **FormModal:** submit stays disabled until valid and Esc closes. **DataTable:** sorting toggles `ordering`, pagination works, and the incomplete row style shows.

## Questions
1. **§1:** Option **A** (recommended), B or C?
2. Is the component gallery at `/dev/components` (mock mode only) useful, or should I skip it?
3. Should the practice-user "no access" message for hub routes replace the live silent redirect (proposed)?
