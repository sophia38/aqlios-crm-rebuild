# Phase 1 view plans: Login and Verticals

**Status: awaiting approval** (CLAUDE.md rule 6). The data layer for these screens is already built and tested: mock auth, `/api/auth/me`, `/api/auth/sub-apps` and profile (`src/mocks/`, `tests/e2e/mock-api.spec.ts`).

---

## View 1: Login — `/auth/login`
**Spec:** `docs/super-admin/00-login.md`. There's no reference screen for this layout; it's the shared 31G auth page and is copied from its capture.

### Layout
- Light grey page with a faint "auth" shield watermark behind a centred white card (soft shadow, 18px radius).
- **Two columns** (stacked below `md`):
  - **Left:** Aqlios logo, **Portal Login** (34px / 600), "Sign in with your credentials to access your dashboard." (16px, secondary text).
  - **Right:** `Email` and `Password` fields (👁 show/hide toggle with `aria-label` "Show password" / "Hide password"), right-aligned **Forgot Password?** link (brand cyan, 14px), full-width **Log In** button (brand `#5CE1E6`, dark-teal text, 48px high, **16px radius**, 15px / 500).
- **Demo box** (dev only, below the button): "Demo: any email, password `demo`" plus a **Sign in as** select (Super-admin / Practice user). This is the approved `DevRoleSwitcher`, rendered only in mock mode.

### Components
| Reused (COMPONENTS.md) | New |
|---|---|
| `BrandLogo`, MUI `TextField` and `Button` (themed), `LoadingSpinner` | `DevRoleSwitcher` (approved in the plan) · `AuthGate` (see "Shared" below) |

### States
| State | Behaviour |
|---|---|
| Loading | The Log In button shows a spinner and the fields are disabled |
| Validation (on blur and on submit, Formik + Yup) | "Email is required" · "Enter a valid email" · "Password is required" |
| Wrong credentials | Red `Alert` above the button: "Invalid email or password." (the live copy isn't captured, so this is a placeholder) |
| Success | Go to `/verticals` |
| Already signed in | Visiting `/auth/login` goes straight to `/verticals` |
| Forgot Password? | The live link points back to the login page (a bug). **Proposed:** an info toast, "Password reset is handled by the 31G sign-in service. Contact your administrator." |

### APIs
`POST /api/auth/login` (mock-only) → `GET /api/auth/me`. In live mode, login is the 31G service's job; the page will redirect there instead.

---

## View 2: Verticals picker — `/verticals`
**Spec:** `docs/super-admin/01-verticals-and-practice-list.md` §1. **Reference:** the Dashboard practice grid, for card spacing.

### Layout
- **Header** (no bar): Aqlios logo on the left; **`UserMenu`** pill on the right (initials avatar on light lavender, name, role line, chevron).
- **Body:** centred "Welcome back **{first} {last}** 👋".
- **Three `VerticalCard`s** in a row (stacked on mobile; ~16px radius, thin border, white-to-soft-gradient background, lightbulb illustration, 2–3-line title):
  - **Public Primary Care:** active → `/verticals/public/practices` (built in phase 3; until then it goes to a placeholder).
  - **Private Business:** active in the live app but **out of scope**. **Proposed:** it opens a `ComingSoonPlaceholder` "Not part of this rebuild".
  - **Everyclinic Business:** disabled (faded, `aria-disabled`, not clickable).
- **Footer:** top border, centred "Copyright © 2026 Aqlios. All rights reserved."
- Background: white fading to very light teal at the bottom.

### `UserMenu` options
The live options weren't captured. **Proposed:**
- Name and email (read-only)
- **Logout**
- In mock mode only, under a "Demo" divider: **Switch role** (Super-admin / Practice user) and **Reset demo data**

### Practice user
- The role line is empty in the live app, which shows "Actions". The rebuild shows **no role line** rather than copying that bug.
- The live app sends practice users to the practice grid with no hub menu. The Verticals page still shows the cards, as it does live.

### Components
| Reused (COMPONENTS.md) | New |
|---|---|
| `BrandLogo`, `VerticalCard`, `UserMenu`, `LoadingSpinner`, `ComingSoonPlaceholder` | `DevRoleSwitcher` (inside `UserMenu`) |

### States
| State | Behaviour |
|---|---|
| Loading | `LoadingSpinner` while `/api/auth/me` and `/api/auth/sub-apps` load |
| Error | "Failed to load verticals" error toast and a Try again button in the body |
| Signed out (401 from `/me`) | Go to `/auth/login` |
| Empty (no sub-apps) | "No verticals available for your account." |

### APIs
`GET /api/auth/me`, `GET /api/auth/sub-apps`, `GET /api/crm/api/users/v1/profile`.

---

## Shared
- **`AuthGate`** (new, small): a client wrapper for every signed-in route. It loads the session once into Redux, shows `LoadingSpinner`, sends signed-out users to `/auth/login`, and keeps the URL they wanted for after login. `/` goes to `/verticals` or `/auth/login`. Because GitHub Pages is static, this runs in the browser, not as a server redirect.
- **Images:** the logo (`/aqlios_logo.svg`), the lightbulb card illustrations (`/business_logos/*.svg`) and the auth watermark belong to your app. **Proposed:** I copy these SVGs from the dev app into `public/`. Each download needs your OK; otherwise I'll draw simple stand-ins.

## Questions
1. Approve both views as described?
2. Private Business card: a placeholder (proposed), hidden, or disabled?
3. Forgot Password?: an info toast (proposed), or hide it?
4. May I download the logo, card illustrations and watermark SVGs from the dev app?
