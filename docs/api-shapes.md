# API response shapes (from the live dev app)

Captured 2026-10-27 by reading GET responses while signed in as a non-admin practice user. Only **field names and types** were recorded, not values. The mock API in `src/mocks/` and the types in `src/lib/api/types.ts` follow this file. Fields marked *(inferred)* weren't seen in a response; they come from the screens or the app code.

## Envelope (all `/api/crm/api/...` endpoints)
```jsonc
{
  "status": { "code": 200, "message": "string" },
  "data": { /* payload, or null on error */ },
  "errors": []
}
```
- Paginated payloads use `data: { count, next, previous, results: [] }` (Django REST style). `next` and `previous` are URLs or `null`.
- **403** (no permission, and also an unknown id) returns `{ status: { code: 403, message: "You do not have permission to perform this action!" }, data: null, errors: [] }`.
- **401** returns `{ status: { code: 401, message: "Authentication credentials were not provided" }, data: null, errors: [] }`.

## `GET /api/auth/me` (shared 31G auth, no envelope)
```jsonc
{
  "user": { "id", "email", "firstName", "lastName", "isAdmin": boolean, "isPatient": boolean, "role": "string (empty for practice users)", "subAppSlugs": ["string"] },
  "claims": {
    "sub", "user_id", "app_id", "email", "first_name", "last_name", "is_admin", "is_patient", "is_verified",
    "meta_data": null, "organizations": [], "redirect_url", "roles": [],
    "sub_apps": [{ "id", "name", "slug", "organizations": [{…}], "permissions": [], "roles": [] }]
  },
  "isDemo": boolean
}
```
Signed out → 401.

## `GET /api/auth/sub-apps` (no envelope)
```jsonc
{ "message": "string", "sub_apps": [{ "id", "name", "slug", "description", "is_active": boolean, "logo_url": null, "redirect_url": null }] }
```

## `GET /api/crm/api/users/v1/profile`
```jsonc
data: { "profile": { "id", "internal_user_id", "username", "email", "first_name", "last_name", "full_name", "date_of_birth", "roles": [] } }
```

## `GET /api/crm/api/practice-management/v1/sub-apps/{subAppId}/practices`
Query: `page`, `page_size` (the backend caps it at 100), `ordering` (`-created_at` default on Practice Management; `associated_users_count` sortable), `search` *(inferred name)*.
**Scoped by user:** super-admin sees all 155; a practice user sees only their own practices (2).
```jsonc
results: [{
  "id", "auth31_id", "subapp", "practice_name", "practice_type", "ods_code", "pcn_name", "sub_icb",
  "address_line_1", "address_line_2", "city", "postcode", "country": null, "phone_number", "email_address": null,
  "website": null, "description": null, "logo_url", "cqc_no": null, "practice_manager_name",
  "associated_users_count": number, "status", "is_active": boolean, "sla_status": boolean,
  "activity_tracker_enabled": boolean, "inactivity_threshold_minutes": null, "is_career_page_active": boolean,
  "uses_connect": boolean, "commission_percentage": null, "payout_eligibility_days": null,
  "points_of_contact": [], "slug": null, "tenant_id": null, "app_id": null,
  "operating_hours": [{ "id", "practice", "day", "opening_time": null, "closing_time": null, "practice_state", "subapp_id": null, "created_at", "updated_at", "deleted_at": null }],
  "created_at", "updated_at", "deleted_at": null,
  // Also returned by the live API but NEVER mocked or used (secrets leak, see issue list):
  // "secret_key", "smtp_host", "smtp_port", "smtp_use_tls", "smtp_username", "stripe_publishable_key"
}]
```
`slug` is `null` in the API. The live app derives the URL slug from `practice_name` (e.g. "Main Practice - Surgery" → `main-practice---surgery`).

## `GET /api/crm/api/users/sub-apps/{subAppId}/roles` (no `/v1/`)
403 for practice users. Fields *(inferred from the Roles list screen)*: `id`, `name`, `description`, `assigned_users_count`, `created_at`, `updated_at`, in the paginated envelope.

## Mock-only endpoints (don't exist in the live app)
| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` `{ email, password }` | Demo login. Password `demo`. The real app signs in through the 31G auth service |
| `POST /api/auth/logout` | Clears the mock session (the live app has this path too) |
| `POST /api/mock/persona` `{ persona: "super-admin" \| "practice-user" }` | Dev role switcher |
| `POST /api/mock/reset` | Restores the fixtures ("Reset demo data") |
