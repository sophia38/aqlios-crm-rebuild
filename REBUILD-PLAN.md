# Rebuild plan: Aqlios Public Primary Care

**Status: approved 2026-10-27; hosting changed from Netlify to GitHub Pages at your request.** No app code exists yet. Phase 0 starts once the project folder is chosen. Each module in phases 3–5 still gets its own short view plan for approval before it's built (CLAUDE.md rule 6).

**Goal:** a working copy of the built Public Primary Care app (vertical and practice level, super-admin and practice-user roles). It should look and behave like the dev app, run on **mock data shaped exactly like the real API**, be **shareable at a dev URL**, and give you a clean base for new modules.

**Inputs:** the 27 capture docs, `docs/design-tokens.md`, `COMPONENTS.md` and `CLAUDE.md`. These are the spec, and nothing is built from memory.

## 1. Stack
Match the live app (CLAUDE.md → Stack):

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript (strict) |
| UI | MUI (`@mui/material`, `@mui/x-date-pickers`) with Emotion; styling with `sx` and theme overrides only |
| Fonts | Poppins (default) + Inter via `next/font` |
| Forms | Formik + Yup |
| State | Redux Toolkit + redux-persist (session, user, current practice) |
| Toasts | notistack, bottom-left |
| Dates | dayjs; displayed as `DD/MM/YYYY` |
| Quality | ESLint + Prettier + `tsc --noEmit` on every change |
| Visual check | Playwright screenshots of each rebuilt screen at 1280px and 390px |

## 2. Mock data that is shaped like the real API
The app makes **the same calls it will make in production**, to the same paths, and gets mock answers.

```
Browser ──fetch('/api/crm/api/…')──▶ Mock Service Worker (in the browser)
                                         │
             NEXT_PUBLIC_API_MODE=mock ──┤──▶ src/mocks/handlers/<service>.ts  (in-browser store, seeded from fixtures)
             NEXT_PUBLIC_API_MODE=live ──┘──▶ worker off; requests go to the real backend (later; needs CORS/auth from your team)
```
GitHub Pages only serves static files, so the app is built as a static export (`output: 'export'`) and the mocks run in the browser with **MSW (Mock Service Worker)**. There's no server code.

- **Paths mirror the captured API exactly:** `practice-management/v1`, `users/v1`, `users/sub-apps/{id}/roles`, `public/v1`, `rota/v1`, `leave/v1`, `inbox/v1`, `activity/v1`. Sub-app id `3b668066-…` (Public Primary Care), the `{status, data, errors}` envelope, `page`/`page_size` pagination, `ordering` and filter query params, and field names (including oddities such as `complaince_status`, kept until the backend changes them).
- **Mocks run in each visitor's browser** (MSW), so the GitHub Pages URL works with no backend. Switching to the real backend later changes one environment variable, not the screens.
- **Writes behave realistically.** Create, edit, delete, approve and archive change the store, which is kept in the browser's `localStorage` per visitor. A "Reset demo data" action restores the fixtures. Each reviewer has their own copy, and changes aren't shared between people. Validation errors (400), not-found (404) and permission errors (403) are returned in the real error format, so error toasts and states can be shown.
- **Fixtures are fictional.** Practice names, staff, patients and policies are generated, and no data is copied from the dev app (the dev seed contains real-looking emails and phone numbers). Volumes match the dev app: 155 practices, 56 staff, 5 roles, 27 templates, 103 permissions, 8 leave types, etc.
- **Mock auth:**
  - `/api/auth/me` and `/api/auth/logout` are mocked in the worker. The login page accepts any email with the password `demo`.
  - A **dev-only role switcher** in the user menu toggles **Super-admin** and **Practice user (Aliii Emis-style)**, so reviewers can see both roles' menus and permissions.
  - The 31G auth service is not contacted.

## 3. Shareable dev URL
- **Code on GitHub, site on GitHub Pages.** A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the static export on every push to `main` and publishes it to `https://<your-account>.github.io/<repo>/`. Next.js `basePath` is set to the repo name.
- Dynamic routes (`[vertical]`, `[practiceSlug]`, `[roleId]` …) are pre-generated from the fixtures with `generateStaticParams`. A `404.html` fallback handles deep links.
- The **first deploy happens at the end of phase 1**. Creating the repo and the first push need **your OK**; after that, pushes happen when you ask.
- **Privacy:** GitHub Pages sites are public on free and Pro plans, even from a private repo. Private Pages needs GitHub Enterprise Cloud. All data is fictional, so a public URL is safe, but anyone with the link can see the UI.
- **Project folder:** this session currently lives in a temporary folder that is deleted with the session. Before phase 0, the work moves to a folder you choose, and a Git repo is created there and pushed to GitHub.

## 4. Folder structure
Follows CLAUDE.md → Conventions:
```
src/
  app/
    auth/login/                                  login
    verticals/                                   vertical picker
    verticals/[vertical]/                        vertical shell (super-admin)
      practices/                                 practice grid
      hub-management/practices/…                 Practice Management list, onboard, complete-profile
      roles/ · rota/ · settings/ · templates/ · compliance-dashboard/ · system-feed/ · notifications/
      coming-soon/[module]/
      practices/[practiceSlug]/                  practice shell
        dashboard/ · profile/ · patient-management/ · consultations-review/ · appointment/
        staff/ · rota/ · leave-management/ · leave-and-rota/ · hr-policies/{ask,library}/
        settings/{appointment-configuration,competency,pathway-configuration,practice-profile,templates}/
        documents/ · recruitment/ · performance/ · support/ · notifications/ · coming-soon/[module]/
  components/{primitives,forms,data,navigation,modals,feedback,layout}/
  features/<module>/components/                  module-only components (rota, tickets, templates…)
  lib/api/<service>.ts                           typed API client per backend service
  mocks/{fixtures,handlers,store}/               MSW handlers (mock API + mock auth), browser store
public/mockServiceWorker.js                      MSW worker
.github/workflows/deploy.yml                     build + publish to GitHub Pages
  store/                                         Redux slices (session, practice context)
  theme/{tokens,typography,theme}.ts
```
**The practice is identified by the URL** (`[practiceSlug]`), not only by client state. This fixes the live app's "practice context lost → redirect to grid" problem.

## 5. Phases and order
Each phase ends with a deploy and a short "what to check" note. A screen is done when it meets the definition of done in section 7.

| Phase | What gets built | Shareable result |
|---|---|---|
| **0. Setup** | Folder + Git, Next.js/MUI/TS scaffold, `tokens.ts`/`typography.ts`/`theme.ts` from `design-tokens.md`, fonts, lint/typecheck, Playwright | Blank themed app, running locally |
| **1. API and auth foundation** | MSW setup, mock store, fixtures for practices/users/roles, typed `lib/api` clients, mock auth, role switcher, GitHub repo + Pages workflow | **First GitHub Pages URL:** login → verticals |
| **2. Shells and shared components** | `VerticalShell`, `AppSidebar` (vertical drawer), practice shell (persistent sidebar, top bar, practice switcher), `ModulePageHeader`, breadcrumbs, `DataTable`, `PillTabs`/`SegmentedTabs`, `FilterBar`, `FormModal`, `FormDrawer`, `ConfirmDialog`, `StatusChip`, `ComingSoonPlaceholder`, loading/error boundaries | Every menu item navigates; unbuilt items show placeholders |
| **3. Reference screens** | Verticals; practice grid (`HubCard`, `ViewModeToggle`, list view); **Practice Management list**; **Onboard New Practice** (all sections, validation); practice profile / complete-profile | The three reference screens, pixel-checked |
| **4. Vertical modules** | Roles & Permissions (list, create/edit with `PermissionTree`, associated users, Delete Role); vertical ROTA (week grid, rota groups); Settings (Global Practice/Appointment config, Competency, Pathway Configuration); Template Library (cards, editor, Ask AI placeholder, all confirms); CQC Compliance (from code capture, with a proper "no access" state); System Feed / Notifications / coming-soon | Whole super-admin hub |
| **5. Practice modules** | Dashboard; Patients; Tickets (list + consultation detail); Appointment (calendar + table + detail + cancel/reschedule); Staff on-boarding (list, invitations, archived, invite, bulk import, staff detail tabs); ROTA (staff rota, shift bidding, activity tracker, templates, Edit Assignment drawer); Leaves; Leaves and ROTA (+ Apply For Leave); HR Policies; practice Settings; Profile (+ Security) | Full practice level for both roles |
| **6. Hardening** | Accessibility pass (CLAUDE.md §7), mobile widths, empty/loading/error states everywhere, issue list cross-check | Rebuild "1.0" |
| **7. New modules** | Your new features and improvements, each with its own view plan, built only from the shared components | — |

Inside phases 4 and 5 I'll follow the order above unless you want a module first, for example the one your new features touch.

## 6. Components
**Reused as specified in COMPONENTS.md:** all primitives, composed components and layouts listed there.

**New components to approve now** (not in COMPONENTS.md, needed by phase 2):

| Component | Why nothing existing fits |
|---|---|
| `PracticeShell` | The practice level has a different frame from `VerticalShell`: persistent sidebar, flat top bar with page title, no Back to Verticals |
| `PracticeSidebar` | Same visual language as `AppSidebar`, but persistent, collapsible with the `‹` edge button, role-aware items and a footer user card. Built as an `AppSidebar` variant if the code shares enough; otherwise as its own component |
| `PracticeSwitcher` | Top-bar pill menu (current practice, Switch Practice, Logout); nothing similar exists |
| `DevRoleSwitcher` | Dev-only menu to swap mock roles; it never ships to production |

`ConfirmDialog` is already listed. It replaces the live app's five confirm designs (see `docs/practice/09-confirmation-popups.md`), with **focus starting on Cancel**.

## 7. Definition of done for each screen
1. **Layout and look:**
   - Matches the capture doc: route, layout, copy, dropdown values, hover and focus states.
   - Screenshots side by side with the live app at 1280px, plus a 390px mobile check.
2. **Tokens only:** no hardcoded colours, sizes, radii or shadows.
3. **States:** loading, empty, error, validation and success are all present and reachable with the mock data. The mocks can be told to fail so error states can be demoed.
4. **API:** calls go through `lib/api` to the real path shapes, and the mock handler covers them.
5. **Accessibility:** labelled icon buttons, keyboard and Esc work, visible focus.
6. **Checks pass:** typecheck and lint.
7. **Capture docs:** a note in the capture doc's "Rebuilt" line, plus `COMPONENTS.md` updated for any new component.

## 8. Live-app bugs: default handling
CLAUDE.md says don't copy known bugs. Proposed defaults (you can override any):

| Live behaviour | Rebuild |
|---|---|
| A 401 from one endpoint logs the user out | Only an expired session logs out. A 403 shows a "You don't have access" state |
| Practice lost from client state, deep links fail | Practice comes from the URL slug |
| Five confirm designs, focus on the destructive button, Enter confirms | One `ConfirmDialog`, focus on Cancel |
| Wrong values: "16 Hrs" for 7 days, "1259 min" durations, Edit Assignment opening on 5 Oct | Correct values |
| Urgent dropdown labels mapped wrongly; "Sync with Clinical System" on Send Invite | Correct labels |
| Mixed date formats (MM/DD vs DD/MM) | `DD/MM/YYYY` everywhere |
| Practice user can edit or delete hub templates | **Kept as in the live app** until you decide on permissions. It's flagged in the UI with a dev note |
| `page_size=1000` capped at 100 | Paginated or server-searched selects |
| Secrets in the practice payload (`secret_key`, SMTP and Stripe keys) | Never present in mock responses |

## 9. Risks and limits
- **Some screens come from code only, not visual capture:** CQC Compliance, Archive Practice, Mark as Completed/DNA, Shift Bidding with data, Delete policy. Their spacing is a best match and should be confirmed when they can be seen live.
- **Live mode later** needs your backend team to allow the new origin (CORS) and agree on how the 31G auth token is passed. Nothing in phases 0–6 depends on it.
- **Mock data lives in each visitor's browser**, so it isn't shared between reviewers or kept anywhere central. It isn't a place to keep real work.
- **Static hosting limits:** no server-side code on GitHub Pages. Anything that needs a server (real auth, file uploads to storage) works only in live mode against your backend.
- **Other roles** (Practice Manager, Nurse, HR, Care navigator) haven't been captured. Their menus are inferred from permissions until captured.

## 10. Decisions needed before phase 0
1. **Approve this plan**, including the 4 new components in section 6 and the bug defaults in section 8.
2. **Project folder** for the code (and whether to push to a GitHub repo).
3. **Host:** GitHub Pages (decided). Still needed: your GitHub account or organisation, the repo name, and whether the repo is public or private (the Pages site is public either way).
4. **Module priority:** keep the order in section 5, or start with the module your first new feature extends.
