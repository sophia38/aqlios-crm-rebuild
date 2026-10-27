# Super-admin · Payroll (FINANCE)

Captured 2026-10-27. **Status: not built.** Route: `/verticals/public/coming-soon/payroll`.

## What's on screen: the shared "Coming soon" placeholder
The same layout is used by all 7 unbuilt modules (Leaves Management, Notification Management, Reports, Payroll, Workforce Validation, Vacancy Management, Application Tracking). Only the name and icon change.

- Vertical shell header (☰, Back to Verticals, logo with "Public Practice", 🔔, user pill). **No breadcrumb.**
- Grey rounded page panel.
- `ModulePageHeader`: white circle tile with a teal **briefcase** icon · **Payroll** (32px / 700, `rgba(0,0,0,0.87)`) · "Coming soon" (16px, `rgba(0,0,0,0.6)`).
- Centred empty state, vertically centred in the panel:
  - ~72px circle, `surface.tealLight` `#E0F2F1`, teal briefcase icon
  - **Payroll** (28px / 700, `rgba(0,0,0,0.78)`)
  - "We are currently building Payroll. It will be available here soon." (16px, `rgba(0,0,0,0.55)`)
  - **COMING SOON** pill: 13px / 600, uppercase, text `#2DD4BF` (`accent.teal`) on `#E0F2F1`, 99px radius
- No buttons and no "Go back" link. The sidebar is the only way out.

### All coming-soon modules (checked 2026-10-27)
Every one of these routes renders the same template, with only the name changing. Copy: "We are currently building {Module}. It will be available here soon."
| Module | Route | Section |
|---|---|---|
| Leaves Management | `/coming-soon/leaves-management` | HUB |
| Notification Management | `/coming-soon/notification-management` | COMMS |
| Reports | `/coming-soon/reports` | ANALYTICS & REPORTING |
| Payroll | `/coming-soon/payroll` | FINANCE |
| Workforce Validation | `/coming-soon/workforce-validation` | FINANCE |
| Vacancy Management | `/coming-soon/vacancy-management` | RECRUITMENT |
| Application Tracking | `/coming-soon/application-tracking` | RECRUITMENT |

**Loading state:** before the page renders, every protected route first shows a blank white page with only the text **"Verifying session..."** while the session is checked. There's no logo or spinner.

Note: the permission catalog already has permission groups for several of these (Leave Management: 5, Recruitment Management: 9, HR Analytics: 1), so backend work exists for them even though the UI says "coming soon".

## What exists in the code for Payroll
- **Menu entry:** FINANCE section → `{ id: "payroll", label: "Payroll", icon: briefcase }`, next to Workforce Validation (`userFollow` icon).
- **Status colour tokens** `payrollStatus`, suggesting a document or timesheet verification flow:
  | Status | Colour |
  |---|---|
  | verified | `#2E7D32` |
  | pendingUpload | `#F59E0B` |
  | pendingVerification | `#0288D1` |
  | rejected | `#D32F2F` |
  | expired | `#78716C` |
- **No permissions:** the permission catalog has no Payroll module. The "Billing" module has a single permission, "Billing management module of practice".
- **No payroll API calls, components or copy** in the bundles loaded so far.

## Implications for building Payroll
- This is a new feature. Under `CLAUDE.md` rule 6, it needs a plan and your approval first, starting with the **requirements** (what payroll covers: timesheets from ROTA hours, locum invoices, salaried pay runs, document verification?).
- Likely data sources already in the app:
  - ROTA allocated and assigned hours, and the Staff Type filter (Salaried / Locum)
  - Activity Tracker login and logout times
  - Workforce Allocation config on the practice profile
- New permissions will be needed (for example "Payroll: View / Manage / Approve") in the same `Module:Parent:Child` format as the existing catalog.
- Reuse: `ModulePageHeader`, `FilterBar`, `DataTable`, `StatusChip` (with the `payrollStatus` colours), `StatsStrip`, `FormModal`.

## Issues found
- The menu config is defined **three times** in the bundle, with section labels in different cases ("FINANCE" vs "Finance").
- Header title styles differ: 32px at 0.87 opacity here, against 24–26px at 0.78 on built modules. The empty-state title is 28px.
- The placeholder has no Go Back or link to the dashboard.
