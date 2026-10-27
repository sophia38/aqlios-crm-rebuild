# Super-admin · System Feed (SUPPORT) and Notifications

Captured 2026-10-27. **Status: neither is built**, although the menu doesn't mark them "coming soon" (their routes aren't under `/coming-soon/`).

## Second placeholder style ("hub placeholder")
Both pages use a placeholder that **differs** from the shared `/coming-soon/*` template (`07-payroll.md`):

| | `/coming-soon/*` template | Hub placeholder (these two) |
|---|---|---|
| Header title | module name | **section name** ("Support") or page name |
| Header subtitle | "Coming soon" | **"Practice List"** ⚠ copied by mistake |
| Body | centred directly on the page panel | inside an **inner grey rounded box** (`#F3F4F6`-ish, ~16px radius) filling the panel |
| Icon circle | ~72px, teal-light, outline icon | ~90px, teal-light, **filled** teal icon |
| Message | one generic sentence | specific 2–3 line copy |
| Pill | COMING SOON | COMING SOON (same) |

## System Feed — `/verticals/public/system-feed`
- Header: 🎧 headset icon tile · **Support** / "Practice List".
- Body: filled document icon · **System Feed** · "We are currently building the hub-level activity feed management. Soon you will be able to manage your vertical-wide activity feed here." · COMING SOON.

## Notifications — `/verticals/public/notifications`
Reached from the sidebar footer and the header 🔔.
- Header: 🔔 icon tile · **Notifications** / "Practice List".
- Body: filled bell icon · **Hub Notifications** · "Stay informed about your vertical's activity. Soon this page will centralize all hub-level alerts, system announcements, and practice/business activity logs." · COMING SOON.
- Icon asset: `/layout/notification_icon.svg`.

### Header bell 🔔
- A circular outlined icon button (`link "Notifications"`, href `/verticals/public/notifications`).
- **No unread badge and no dropdown**; it just navigates.

### What exists in the code and API
- A practice-level notifications endpoint already exists and is called when a practice is opened:
  `GET /api/crm/api/public/v1/sub-apps/{subAppId}/practices/{practiceId}/notifications/?page=1&page_size=10`
  So practice notifications have backend support; the hub-level page doesn't use it yet.
- The COMMS → **Notification Management** module (`/coming-soon/notification-management`) is a separate, also-unbuilt feature (probably for configuring notifications, as opposed to viewing them).

## Issues found
- Two different "coming soon" designs exist; they should share one `ComingSoonPlaceholder` component.
- Both pages show the subtitle **"Practice List"**, copied by mistake.
- The menu doesn't tell users these are unbuilt: System Feed and Notifications look like live links.
- The header bell has no unread indicator.

## Corrected build status (super-admin, Public)
| Status | Modules |
|---|---|
| **Built** (7) | Dashboard (practice grid), Practice Onboarding (list, onboard form, profile), Template Library, Role and Permissions, ROTA Management (3 tabs), Settings (4 sections), CQC Compliance (built, but blocked for super-admin) |
| **Placeholder** (9) | Leaves Management, Notification Management, Reports, Payroll, Workforce Validation, Vacancy Management, Application Tracking, **System Feed**, **Notifications** |
