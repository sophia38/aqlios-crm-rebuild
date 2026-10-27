# Super-admin · Module map (Public Primary Care)

Captured 2026-10-27 from the hamburger side menu on `/verticals/public/practices`.

## Side menu (drawer) design
- Opens from the ☰ button as a left drawer (~245px wide at 1063px viewport) over a dark semi-transparent backdrop (MUI-style `presentation` > `dialog`).
- White background, full height, `navigation "Main navigation"`.
- Top: Aqlios wordmark, then a horizontal divider.
- "Overview" label (small, grey) above **Dashboard**.
- **Active item** (Dashboard): light teal/mint pill background with teal border, full width with side margin.
- **Section headers**: UPPERCASE, small, teal text, with a short teal vertical bar on the left and a ⌃ chevron on the right — each is a collapsible `button` (all expanded by default).
- **Items**: outline icon + label (dark grey, ~14px), indented under the section.
- Body scrolls; footer is pinned with a top divider:
  - 🔔 Notifications, ⚙ Settings
  - User card: light teal rounded box, teal circle avatar `AA` (white initials), "Aqlios Admin" / "super-admin".

## Modules

Status is taken from the link target: routes under `/coming-soon/` are placeholders (not built).

| # | Section | Item | Icon | Route | Status |
|---|---|---|---|---|---|
| 1 | Overview | Dashboard | grid | `/verticals/public/practices` | Built (practice list) |
| 2 | HUB | Practice Onboarding | person + | `/verticals/public/hub-management/practices` | Built |
| 3 | HUB | Template Library | document | `/verticals/public/templates` | Built |
| 4 | HUB | Role and Permissions | lock | `/verticals/public/roles` | Built |
| 5 | HUB | Leaves Management | clock | `/verticals/public/coming-soon/leaves-management` | Coming soon |
| 6 | HUB | ROTA Management | calendar | `/verticals/public/rota` | Built |
| 7 | COMMS | Notification Management | chat bubble | `/verticals/public/coming-soon/notification-management` | Coming soon |
| 8 | ANALYTICS & REPORTING | Reports | document | `/verticals/public/coming-soon/reports` | Coming soon |
| 9 | COMPLIANCE | CQC Compliance | check badge | `/verticals/public/compliance-dashboard` | Built |
| 10 | FINANCE | Payroll | briefcase | `/verticals/public/coming-soon/payroll` | Coming soon |
| 11 | FINANCE | Workforce Validation | person ✓ | `/verticals/public/coming-soon/workforce-validation` | Coming soon |
| 12 | RECRUITMENT | Vacancy Management | ID card | `/verticals/public/coming-soon/vacancy-management` | Coming soon |
| 13 | RECRUITMENT | Application Tracking | clock/target | `/verticals/public/coming-soon/application-tracking` | Coming soon |
| 14 | SUPPORT | System Feed | headset | `/verticals/public/system-feed` | **Placeholder** (not under /coming-soon/) |
| 15 | Footer | Notifications | bell | `/verticals/public/notifications` | **Placeholder** (not under /coming-soon/) |
| 16 | Footer | Settings | gear | `/verticals/public/settings` | Built |

**Corrected after visiting every page: Built 7 · Placeholder 9.** CQC Compliance is built but logs super-admin out (see `08-cqc-compliance.md`). The "60%" estimate likely counts backend work as well, since the permission catalog covers modules whose UI isn't built.

## Capture order (built modules)
1. Dashboard / practice list — partly done (`01-verticals-and-practice-list.md`)
2. Practice Onboarding
3. Template Library
4. Role and Permissions
5. ROTA Management
6. CQC Compliance
7. System Feed
8. Notifications
9. Settings
10. One "coming soon" page (shared placeholder layout)
