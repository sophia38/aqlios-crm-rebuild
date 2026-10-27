# Aqlios CRM: project rules

Aqlios is a CRM for UK primary care, covering Public Primary Care, Private Business and Everyclinic verticals. About 60% is built. **There is no original source code.** This project is a rebuild from the live dev app at `https://crm.dev.aqlios.31g.co.uk`. Captures of each screen are in `docs/super-admin/`, tokens in `docs/design-tokens.md`, components in `COMPONENTS.md`.

## Stack (match the live app)
- **Framework:** Next.js App Router, React, TypeScript
- **UI:** MUI (`@mui/material`, `@mui/x-date-pickers`). Styling uses the `sx` prop and theme overrides. There is no Tailwind and no CSS modules. Global CSS only loads fonts.
- **Fonts:** Poppins (`--font-poppins`, default), Inter (`--font-inter`), via `next/font`
- **Forms:** Formik + Yup
- **State:** Redux (with persisted state) for session and user. Server data comes from fetch calls to `/api/crm/api/...`.
- **Toasts:** notistack, anchored bottom-left
- **Dates:** dayjs
- **Icons:** MUI icons plus app SVGs in `/public` (`/practice/*.svg`, `/business_logos/*.svg`)
- **Auth:** shared 31G auth service; the session is read from `/api/auth/me`

## Commands and hosting
- `npm run dev` (port 3000) · `npm run check` (typecheck, lint, prettier) · `npm run build` (static export to `out/`) · `npm run test:e2e` (Playwright on `out/`, desktop 1280 and mobile 390).
- Hosting is **GitHub Pages**, so the app is a static export (`output: 'export'`): no route handlers, server actions, cookies, rewrites or proxy. Dynamic routes need `generateStaticParams`. Mock data runs in the browser with MSW (`REBUILD-PLAN.md` §2–3).
- This is **Next.js 16** and **MUI 9**. Check `node_modules/next/dist/docs/` and `node_modules/@mui/material/docs/` before using an API from memory (e.g. MUI 9 renamed `MuiPickersDay` to `MuiPickerDay`).

## 1. Reuse before you build
- Before creating any component, search the codebase **and** `COMPONENTS.md` for an existing one.
- Prefer, in this order: reuse it as-is → extend it with a prop or variant → propose a new component.
- **Propose new components and wait for approval** before building them. Say why nothing existing fits.
- When an approved component is built, add it to `COMPONENTS.md` in the right group (primitive, composed or layout) with purpose, props, path and an example.

## 2. Tokens only
- Never hardcode colours, spacing, font sizes, radii or shadows.
- Use `theme.palette.*`, `theme.spacing()`, typography variants (`<Typography variant="h6">`), `theme.shape.borderRadius` and the token module `src/theme/tokens.ts`. All values are listed in `docs/design-tokens.md`.
- Use the radius tokens defined there: inputs 12px, cards and paper 18px, pill buttons 999px.
- If a value you need doesn't exist as a token, propose adding one. Don't inline it.
- Keep feature-scoped token groups (`dutyType`, `calendar.status`, `medicalAlert` and so on) in `tokens.ts`. Don't scatter them in components.

## 3. Reference screens
New views must match the layout, spacing and patterns of these screens:
1. **Practice Management list:** `/verticals/public/hub-management/practices` (`docs/super-admin/02-practice-onboarding.md`). Reference for **list and table pages**.
2. **Onboard New Practice form:** `/verticals/public/hub-management/practices/practice-management/onboard` (`docs/super-admin/03-onboard-new-practice.md`). Reference for **create and edit forms**.
3. **Dashboard practice grid:** `/verticals/public/practices` (`docs/super-admin/01-verticals-and-practice-list.md`). Reference for **card-grid pages**.

The page anatomy is `VerticalShell` → breadcrumbs → grey rounded page panel → `ModulePageHeader` (icon tile, title and subtitle, primary action on the right) → content.

## 4. Use the existing patterns
| Need | Use |
|---|---|
| Page shell and navigation | `VerticalShell`, `AppSidebar`, `HubManagementLayout`, `ModulePageHeader` |
| Loading | `LoadingSpinner` (inline or `fullScreen`); route-level `loading.tsx` |
| Empty | A short sentence of secondary text inside the table or list area, in the form "No {things} found. Try another search." |
| Error (route) | `error.tsx` with "Something went wrong" and a Try again button |
| Error (data load or action) | `enqueueSnackbar('Failed to load …', { variant: 'error' })` |
| Success | `enqueueSnackbar(msg, { variant: 'success' })` |
| Forms | Formik + Yup. `FormSectionCard` per section with `hasError`. Outlined `TextField`s in a Grid (`xs:12`, `md:6` pairs). Red `*` on required labels. Messages as "{Field} is required" and "Enter a valid email". Validate on blur and on submit. **Save Changes** goes top right. |
| Modals | `FormModal`, matching the **Create Rota Group** modal (`docs/super-admin/06-rota-management.md`): 600px, 16px radius, title with ✕, Cancel and a submit button that stays disabled until the form is valid. For destructive confirms, follow `ArchiveConfirmModal` / Delete Role. |
| Tables | `DataTable` with sortable headers driven by API `ordering`, the eye-icon View action, `TablePagination` (10 rows), and incomplete rows tinted with an orange left border and icon |
| Grids | `HubCard` in 3 columns with 12 per page, plus `ViewModeToggle` |
| Tabs | `PillTabs` |

## 5. Conventions
- **Routes:** `src/app/verticals/[vertical]/<module>/...`, with kebab-case segments that match the live URLs (`hub-management/practices`, `compliance-dashboard`, `system-feed`). Unbuilt modules route to `coming-soon/<module>`.
- **Components:** PascalCase `.tsx`, one per file, in `src/components/{primitives,forms,data,navigation,modals,feedback,layout,practice,...}`. Put feature-specific components under `src/features/<module>/components/`.
- **Theme:** `src/theme/{tokens,typography,theme}.ts`
- **API:** `src/lib/api/<service>.ts`, mirroring backend paths (`practice-management/v1`, `users/v1`, `public/v1`). Query params use snake_case (`page_size`, `ordering`).
- **Copy:** Title Case for buttons and headings ("Onboard New Practice", "Save Changes"). Sentence case for helper and error text.
- **Dates:** display as `DD/MM/YYYY`.

## 6. Plan before every new view
Before writing code for a new view, send a plan and **wait for approval**. The plan must include:
1. The route and the layout (which reference screen it follows).
2. The existing components it will use, from `COMPONENTS.md`.
3. Any new components needed, with a justification for each.
4. Its states: loading, empty, error, validation and success.
5. The APIs it calls, or mock data if the API is unknown.

## 7. Accessibility (match existing behaviour)
- Icon-only buttons have an `aria-label`, e.g. "Open menu", "Notifications", "View", "Open business", "Expand sidebar" / "Collapse sidebar".
- Navigation uses `<nav aria-label="Main navigation">`, and the active link has `aria-current="page"`.
- Breadcrumbs sit in a `<nav>` with a list.
- View toggles use `role="tablist"` / `role="tab"` (e.g. "View as list or grid").
- Focus: inputs show a 1px `primary.main` border. Keep MUI's default focus-visible ring on buttons and never remove outlines.
- Use only native or MUI interactive elements so keyboard support comes for free. Esc closes dialogs, drawers and dropdowns.
- Pair every input with a visible label; don't rely on placeholder-only fields.

## Don't
- Write feature code without an approved plan.
- Copy known bugs from the live app unless asked to. They are listed in the audit report, e.g. the "PDG" typo and the Forgot Password link pointing to the login page.
