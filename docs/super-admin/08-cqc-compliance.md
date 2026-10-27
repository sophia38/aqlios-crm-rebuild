# Super-admin · CQC Compliance (COMPLIANCE)

Captured 2026-10-27. Route: `/verticals/public/compliance-dashboard`. Icon: `/layout/compliance_dashboard_icon.svg`.

> ⚠ **Not seen rendered.** For super-admin the page's data call returns **401**, and the app then **logs the user out** (`POST /api/auth/logout`) and redirects to `/auth/login`. This happened on 2 of 2 tries, both times straight after profile and practice calls that returned 200, so it isn't an expired session.
> Everything below is read from the page's own code (`app/verticals/[verticalId]/compliance-dashboard/page-*.js`). Colours and text are exact; exact layout and spacing still need a visual capture with a role that has access, such as Practice Manager.

## Bug: a 401 from one endpoint logs the whole user out
- `GET /api/crm/api/public/v1/sub-apps/{subAppId}/staff/dashboard/?page=1&page_size=10` → **401**
- The app's API client treats any 401 as "session expired" and calls logout.
- Expected: a 403-style "You don't have access to this module" state (the app already has copy like this elsewhere, e.g. "You do not have permission to view this role."), or the menu item hidden for this role.
- Also check the backend: super-admin probably *should* have access. If so, the endpoint wrongly returns 401.

## Screen (from code)

### Guard
If the vertical isn't Public: "Compliance Dashboard is available for Public practices only".

### Stat cards (6)
| Label | Caption | API field |
|---|---|---|
| Total Staff | Across All Practices | `total_staff` |
| Compliant | — | `compliant` |
| Pending Upload | Waiting on action | `pending_upload` |
| Awaiting Verification | Uploaded but not verified | `awaiting_verification` |
| Re-verification Due | — | — |
| Expired | Require re-upload | `expired` |

The response also has `rejected`, which has no card.

### Filters
`Filters:` label, then:
| Filter | Options |
|---|---|
| Practice | All Practices + practice list (`GET .../practices?page_size=1000`) |
| Compliance Status | All Statuses, Compliant (`ACTIVE`), Pending Upload (`PENDING_UPLOAD`), Awaiting Verification (`PENDING_VERIFICATION`), Re-verification Due (`REVERIFICATION_DUE`), Expired (`EXPIRED`) |
| Search | label "Search", placeholder "Search by name, role or skill...", 🔍 end icon, **400ms debounce** |

Query params: `page`, `page_size`, `practice_id`, `search`, `user_name`, `verification_status`.

### Table (min-width 720px; all columns centred except Staff Name)
| Column | Content |
|---|---|
| Staff Name | `first_name last_name`, falls back to email |
| Practice | `practice_name` |
| Compliance Status | status chip |
| Waiting Since | date, or `-` |
| Last Updated | date |

- Rows highlight on hover (MUI `hover`).
- Loading: one full-width row, "Loading compliance data…"
- Empty: "No staff found. Adjust your filters or search term."
- Error: "Failed to load compliance dashboard"; on timeout, "Request timed out. Please check your connection and try again."
- Pagination: **"Records per page:"** with options **10, 20, 30, 40, 50**. The label reads `1–10 of N (X Users)`.

### Status chips (text colour, 4%-tint background)
| Status (incl. aliases) | Shown as | Colour | Bg |
|---|---|---|---|
| Active / Verified / Compliant | Compliant | `#2E7D32` | `rgba(46,125,50,0.04)` |
| Pending Upload | Pending Upload | `#EF6C00` | `rgba(239,108,0,0.04)` |
| Reverification Due / Re-verification Due | Re-verification Due | `#EF6C00` | same |
| Pending Verification / Awaiting Verification | Awaiting Verification | `#0288D1` | `rgba(2,136,209,0.04)` |
| Expired | Expired | `#D32F2F` | `rgba(211,47,47,0.04)` |
| Rejected | Rejected | `status.rejected` `#EF4444` | `rgba(239,68,68,0.05)` |
| anything else | as-is | `neutral.500` | `neutral.100` |

## Issues found
- **No role tried can see the built CQC dashboard.** The module is effectively unreachable in dev.
- A failed (blocked) request on practice open surfaces as a raw red alert with the bare error message on the practice grid, with no friendly copy.
- **Logout on 401** (above). This is the most serious bug found so far.
- The API field is misspelled: **`complaince_status`**.
- The same status has two spellings ("Reverification Due" / "Re-verification Due") and two names ("Pending Verification" / "Awaiting Verification"). The UI papers over this with an alias map.
- `rejected` is counted but never shown.
- The pagination label is "Records per page:" with 10–50 options, while other tables use "Rows per page:" with fewer options.
- The chips use CSS variables with hex fallbacks (`var(--success-main, #2E7D32)`) instead of theme tokens like the rest of the app.

## Second attempt: non-admin practice user (2026-10-27)
Signed in as a non-admin user (`isAdmin: false`, empty `role` in `/api/auth/me`) linked to 2 practices (Abbey Medical Centre, Main Practice - Surgery).
- `/verticals/public/compliance-dashboard` **redirects** to `/verticals` → `/verticals/public/practices`. Hub routes aren't available to non-admins.
- This role's practice grid has **no ☰ hub menu**; the user pill subtitle reads **"Actions"** instead of a role name.
- Inside the practice, **CQC Compliance → `coming-soon/cqc-compliance`** (the same placeholder super-admin sees).
- So the built CQC dashboard can't be seen by **either** role tried: super-admin gets logged out by the 401, and practice users can't reach the hub route.
- Opening a practice as this role sends `PATCH …/users/{userId}/user-businesses/{practiceId}/select` (records the current practice) and `POST …/activity/v1/…/user-sessions` (activity tracking). Super-admin doesn't send these.
- Differences in this role's practice sidebar compared with super-admin: an extra **Profile** item (`/profile`, also linked from the user card), and **no HR Policies**.

## To capture (needs a role with access)
- [ ] Visual layout: stat-card design, filter bar, table. Needs a hub-level role other than super-admin, or a backend fix for the 401.
- [ ] Row click (is there a staff compliance detail page?)
- [ ] Populated data and the real dates format
