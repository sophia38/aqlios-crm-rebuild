# Practice · Documents and other placeholder modules

Captured 2026-10-27 in **Main Practice - Surgery** as super-admin.

## Third placeholder style ("practice placeholder")
Five practice modules have real routes (not under `/coming-soon/`) but render a placeholder:

- The top bar shows the page icon and title (e.g. "📄 Documents").
- **No page header, card or breadcrumb.** The message sits directly on the grey `#F5F5F5` page background, centred vertically.
- Teal-light circle (~72px) with a **filled teal icon**, **title** (bold ~22px), 2–3 lines of grey copy, and a **COMING SOON** pill (teal text on teal-light).

| Module | Route | Copy |
|---|---|---|
| Documents | `documents` | "We are currently building the public practice document management center. Soon you will be able to store, manage, and share practice documents here." |
| Recruitment | `recruitment` | "We are currently building the recruitment module. Soon you will be able to manage job openings, candidates, and interviews here." |
| Performance | `performance` | "We are currently building the performance module. Soon you will be able to track objectives, key results, and team performance here." |
| Support | `support` | "We are currently building the public practice support center. Soon you will be able to access help resources and contact dedicated support here." |
| Notifications | `notifications` | "We are currently building the public practice notification system. Soon you will be able to configure alerts, reminders, and messaging preferences here." |

So the app has **three different placeholder designs**:
1. `/coming-soon/*` (vertical): page header with "Coming soon" subtitle, then the body.
2. Hub placeholder (System Feed and Notifications, vertical): header with a wrong "Practice List" subtitle and an inner grey box.
3. Practice placeholder (this page): no header, centred on the background.

## Practice `/coming-soon/*` pages (all 12 checked 2026-10-27)
All use the same template as the vertical `/coming-soon/*` pages (header with module name / "Coming soon", centred icon, "We are currently building {Module}. It will be available here soon.", COMING SOON pill).

| Section | Module | Route |
|---|---|---|
| EHR | Call Recall | `coming-soon/call-recall` |
| HRM | Staff off-boarding | `coming-soon/staff-off-boarding` |
| HRM | Compliance | `coming-soon/compliance` |
| COMMS | Patient Comms | `coming-soon/patient-comms` |
| COMMS | Colleagues Comms | `coming-soon/colleagues-comms` |
| COMMS | Notification Management | `coming-soon/notification-management` |
| FINANCE | Payroll | `coming-soon/payroll` (a per-staff Payroll tab is built; see `05-staff-onboarding.md`) |
| FINANCE | Workforce Validation | `coming-soon/workforce-validation` |
| COMPLIANCE | CQC Compliance | `coming-soon/cqc-compliance` (built at vertical level) |
| SUPPORT | Survey | `coming-soon/survey` |
| SUPPORT | Feedback | `coming-soon/feedback` |
| SUPPORT | Colleague Survey | `coming-soon/colleague-survey` |

Note: HRM → Compliance is "coming soon", but each staff record already has a full **Compliance** tab with 38 documents.

## Session behaviour noticed
The selected practice is lost occasionally (even without signing out), and any practice URL then redirects to the practice grid. You have to re-select the practice from the grid. The rebuild should keep the practice in the URL as the source of truth.
