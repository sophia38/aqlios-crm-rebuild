# Practice level · Shell and module map

Captured 2026-10-27 as super-admin (= Vertical Admin) in **Public Primary Care**, practice **Croft Hall Medical Practice**.

## How you get here
1. `/verticals` → **Public Primary Care** card
2. `/verticals/public/practices` (dashboard grid) → click a practice card or its ↗ button
   - Card hover: the inner pill gets a light teal tint; the ↗ circle stays navy.
3. → **`/verticals/public/practices/{practice-slug}/dashboard`**
   - The practice is identified by a **slug from its name** (`croft-hall-medical-practice`), not by ID.

## Practice shell (different from the vertical shell)
| | Vertical level | Practice level |
|---|---|---|
| Sidebar | Hidden drawer opened with ☰ | **Persistent left sidebar** (~195px), collapsible with a `‹` circle button on its edge |
| Top bar | Floating pill: ☰, Back to Verticals, centred logo, 🔔, user pill | Flat white bar: page icon + **page title** / "Welcome back Aqlios Admin 👋"; on the right 🔍, 🔔 and the **practice switcher** |
| Logo | Centred in the header | Top of the sidebar ("aqlios" wordmark) |
| Back to Verticals | Button in the header | **None**; use the practice switcher |

### Top bar (right side)
- 🔍 **Search**: a square outlined icon button (~30px, 8px radius, soft shadow). **Clicking does nothing** (not built).
- 🔔 **Notifications**: the same style of icon button.
- **Practice switcher**: a white pill button with a soft shadow, **bold practice name** and a ⌄ chevron (⌃ when open). Menu items:
  1. **Croft Hall Medical Practice** (current, highlighted with a grey background)
  2. **Switch Practice**
  3. **Logout**
- No user avatar in the top bar; the user card sits at the bottom of the sidebar.

### Sidebar
Same visual language as the vertical drawer: "Overview" label, active item as a mint pill with a teal border, uppercase teal section headers with a left bar and ⌃ collapse. Items are an outline icon plus label. Hover shows a light mint background (e.g. "Staff off-boarding").
Pinned footer: 🔔 Notifications, ⚙ Settings, teal user card "AA · Aqlios Admin · super-admin".

### Practice dashboard — `/dashboard`
- Only a **welcome banner**: a dark-teal gradient card (~100px tall, 18px radius), **"Welcome, Aqlios!"** (white, bold, ~26px) and "You are in **Public Primary Care**" (vertical name in light blue, bold).
- Nothing else; no widgets or KPIs yet.

## Practice module map
Base route: `/verticals/public/practices/{slug}/…`

| # | Section | Item | Route | Status |
|---|---|---|---|---|
| 1 | Overview | Dashboard | `dashboard` | Built (banner only) |
| 2 | EHR | Patients | `patient-management` | Built |
| 3 | EHR | Tickets | `consultations-review` | Built |
| 4 | EHR | Appointment | `appointment` | Built |
| 5 | EHR | Documents | `documents` | Built |
| 6 | EHR | Call Recall | `coming-soon/call-recall` | Coming soon |
| 7 | HRM | Staff on-boarding | `staff` | Built |
| 8 | HRM | Staff off-boarding | `coming-soon/staff-off-boarding` | Coming soon |
| 9 | HRM | ROTA Management | `rota` | Built |
| 10 | HRM | Activity Tracker | `rota` (same route as ROTA; probably opens its tab) | Built |
| 11 | HRM | Leaves | `leave-management` | Built |
| 12 | HRM | Leaves and ROTA | `leave-and-rota` | Built |
| 13 | HRM | Compliance | `coming-soon/compliance` | Coming soon |
| 14 | HRM | Recruitment | `recruitment` | Built |
| 15 | HRM | Performance | `performance` | Built |
| 16 | HRM | HR Policies | `hr-policies` | Built |
| 17 | COMMS | Patient Comms | `coming-soon/patient-comms` | Coming soon |
| 18 | COMMS | Colleagues Comms | `coming-soon/colleagues-comms` | Coming soon |
| 19 | COMMS | Notification Management | `coming-soon/notification-management` | Coming soon |
| 20 | FINANCE | Payroll | `coming-soon/payroll` | Coming soon |
| 21 | FINANCE | Workforce Validation | `coming-soon/workforce-validation` | Coming soon |
| 22 | COMPLIANCE | CQC Compliance | `coming-soon/cqc-compliance` | Coming soon (built at vertical level) |
| 23 | SUPPORT | Survey | `coming-soon/survey` | Coming soon |
| 24 | SUPPORT | Feedback | `coming-soon/feedback` | Coming soon |
| 25 | SUPPORT | Colleague Survey | `coming-soon/colleague-survey` | Coming soon |
| 26 | SUPPORT | Support | `support` | To check |
| 27 | Footer | Notifications | `notifications` | To check |
| 28 | Footer | Settings | `settings` | To check |

**Real routes: 16** · **Coming soon: 12**

### Verified status (2026-10-27, every real route opened)
| Status | Modules |
|---|---|
| **Built (9)** | Dashboard (banner only), Patients, Tickets, Appointment, Staff on-boarding (`staff`: Staff List / Sent Invitations / Archived Users, Bulk Import, Invite Staff), ROTA Management (tabs **Staff Rota · Shift Bidding · Activity Tracker**), Leaves (`leave-management`: Leave Requests / Leaves History), Leaves and ROTA (`leave-and-rota`: personal leave balances), HR Policies (`hr-policies/ask`: Ask HR · Policy library), Settings (sections: Appointment Configuration, Competency, Pathway Configuration, Practice Profile, Templates) |
| **Placeholder despite a real route (5)** | Documents, Recruitment, Performance, Support, Notifications. See `04-documents-and-placeholders.md` |
| **Coming soon (12)** | Call Recall, Staff off-boarding, Compliance, Patient Comms, Colleagues Comms, Notification Management, Payroll, Workforce Validation, CQC Compliance, Survey, Feedback, Colleague Survey |

Practice level: **9 built / 17 not built** (excluding footer duplicates).

### Capture status (all built practice modules done, 2026-10-27)
| Module | Doc |
|---|---|
| Patients | `01-patients.md` |
| Tickets | `02-tickets.md` |
| Appointment | `03-appointment.md` |
| Documents + all placeholders + 12 coming-soon | `04-documents-and-placeholders.md` |
| Staff on-boarding | `05-staff-onboarding.md` |
| ROTA Management + Activity Tracker | `06-rota-management.md` |
| Leaves, Leaves and ROTA | `07-leaves-and-leaves-rota.md` |
| HR Policies, Settings | `08-hr-policies-and-settings.md` (Settings → Practice Profile is also a placeholder) |
| Confirmation popups (all levels) | `09-confirmation-popups.md` |

### Modules new at practice level (not in the vertical menu)
Patients, Tickets, Appointment, Documents, Call Recall, Staff on/off-boarding, Leaves, Leaves and ROTA, Compliance (HRM), Recruitment, Performance, HR Policies, Patient Comms, Colleagues Comms, Survey, Feedback, Colleague Survey, Support.

### Modules that leave the menu at practice level
Practice Onboarding, Template Library, Role and Permissions (vertical HUB items), Reports, Vacancy Management, Application Tracking, System Feed.

## Issues found
- The 🔍 search button has no behaviour.
- Activity Tracker and ROTA Management point to the **same URL**, so the sidebar can't highlight Activity Tracker as active.
- CQC Compliance is "coming soon" at practice level but built at vertical level.
- "Staff on-boarding" goes to `/staff`, which probably holds the whole staff list, not just onboarding.
- The practice URL uses a name slug, so renaming a practice would break bookmarks, and duplicate names (e.g. "Abbey Medical Centre" vs "Abbey Medical Centre (4)") need unique slugs.
- The welcome banner says "Welcome, Aqlios!" (first word of the name), while the top bar says "Welcome back Aqlios Admin 👋".
