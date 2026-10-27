# Login — `/auth/login`

Captured 2026-10-27 (seen after the session expired and the app redirected here).

## Layout
- Light grey page with a large faint "auth" watermark shape (rounded shield outline with the word "auth") behind the card.
- Centred white card, rounded, soft drop shadow, two columns:
  - **Left**: Aqlios logo (served from the shared auth service: `media-auth31.31g.co.uk/apps/{appId}/logo/...svg`), **Portal Login** (34px / 600), subtitle "Sign in with your credentials to access your dashboard." (16px, `rgba(0,0,0,0.6)`).
  - **Right**: Email field, Password field with 👁 show/hide toggle, right-aligned **Forgot Password?** link, full-width **Log In** button.

## Tokens
| Element | Value |
|---|---|
| Log In button | bg **`#5CE1E6`** (light cyan — differs from the in-app teal `#2C7A7B`), dark text, 48px high, **16px radius** (not pill), 15px / 500, full width (370px) |
| Forgot Password? | 14px, `#5CE1E6` |
| Font | Poppins |

## Behaviour / notes
- Session expiry redirects any route to `/auth/login` (no "session expired" message shown).
- **Forgot Password? link points to `/auth/login`** (same page) — appears unimplemented.
- Login is a shared 31G auth service ("auth31"); the CRM gets the session via `/api/auth/me`.

## To capture
- [ ] Empty-submit and wrong-credential errors
- [ ] Password show/hide toggle state
- [ ] Redirect after login (to `/verticals`)
