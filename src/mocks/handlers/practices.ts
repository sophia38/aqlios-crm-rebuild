import { http, HttpResponse } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import type { AppointmentConfiguration, Practice, PracticeInput, SlaConfiguration } from '@/lib/api/types';
import { emptyAppointmentConfiguration, buildSlaConfiguration } from '../fixtures/lookups';
import { mockId } from '../fixtures/random';
import { currentPersona, getDb, practiceStatus, saveDb, visiblePractices } from '../store';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';

// Practice Management mocks. URLs marked ✔ in docs/plans/phase-3-reference-screens.md were captured
// live; create/update/logo/config-save were not and are inferred.

const crm = (path: string) => `*${CRM_API}${path}`;
const pm = (path: string) => crm(`/practice-management/v1/sub-apps/:subAppId${path}`);

function guard(adminOnly = false) {
  if (!getDb().session.signedIn) return unauthorized();
  if (adminOnly && !currentPersona().isAdmin) return forbidden();
  return null;
}

function nameTaken(name: string, excludeId?: string | null) {
  const wanted = name.trim().toLowerCase();
  return getDb().practices.some(
    (practice) => practice.id !== excludeId && practice.practice_name.trim().toLowerCase() === wanted,
  );
}

/** Server-side checks mirroring the form's required fields; errors use `{ field, message }` (inferred). */
function validate(input: Partial<PracticeInput>, excludeId?: string) {
  const errors: { field: string; message: string }[] = [];
  const required: [keyof PracticeInput, string][] = [
    ['practice_name', 'Practice name is required'],
    ['pcn_name', 'PCN name is required'],
    ['phone_number', 'Phone number is required'],
    ['address_line_1', 'Address line 1 is required'],
    ['postcode', 'Postcode is required'],
  ];
  for (const [field, message] of required) {
    if (!String(input[field] ?? '').trim()) errors.push({ field, message });
  }
  if (input.practice_name && nameTaken(input.practice_name, excludeId)) {
    errors.push({ field: 'practice_name', message: 'A practice with this name already exists.' });
  }
  return errors;
}

function withStatus(practice: Practice): Practice {
  return { ...practice, status: practiceStatus(practice) };
}

function applyInput(practice: Practice, input: Partial<PracticeInput>): Practice {
  const db = getDb();
  const manager = input.practice_manager
    ? db.practiceManagers.find((item) => item.id === input.practice_manager)
    : undefined;
  const now = new Date().toISOString();
  return {
    ...practice,
    ...input,
    practice_manager: input.practice_manager === undefined ? practice.practice_manager : input.practice_manager,
    practice_manager_name:
      input.practice_manager === undefined ? practice.practice_manager_name : (manager?.full_name ?? ''),
    operating_hours: input.operating_hours
      ? input.operating_hours.map((hours, index) => ({
          ...hours,
          id: mockId(`hours:${practice.id}`, index),
          practice: practice.id,
          subapp_id: null,
          created_at: practice.created_at,
          updated_at: now,
          deleted_at: null,
        }))
      : practice.operating_hours,
    updated_at: now,
  };
}

export const practiceHandlers = [
  // ✔ ODS directory search (not sub-app scoped).
  http.get(crm('/practice-management/v1/public-practices'), ({ request }) => {
    const denied = guard(true);
    if (denied) return denied;
    const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase() ?? '';
    const results = search
      ? getDb().odsDirectory.filter(
          (item) => item.name.toLowerCase().includes(search) || item.ods_code.toLowerCase().includes(search),
        )
      : [];
    return ok(results.slice(0, 20));
  }),

  // ✔ Practice managers, 10 per page.
  http.get(crm('/users/v1/sub-apps/:subAppId/practice-managers/'), ({ request }) => {
    const denied = guard(true);
    if (denied) return denied;
    const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase() ?? '';
    const managers = getDb().practiceManagers.filter(
      (manager) => !search || `${manager.full_name} ${manager.email}`.toLowerCase().includes(search),
    );
    return ok(paginate(request, managers));
  }),

  // ✔ Name availability (registered before `practices/:practiceId` so it isn't read as an id).
  http.get(pm('/practices/name-availability'), ({ request }) => {
    const denied = guard(true);
    if (denied) return denied;
    const url = new URL(request.url);
    const name = url.searchParams.get('practice_name') ?? '';
    return ok({ is_available: !nameTaken(name, url.searchParams.get('exclude_practice_id')) });
  }),

  // ~ Logo upload (multipart). Small images persist as data URLs; large ones last for this page load only.
  http.post(pm('/practices/logo'), async ({ request }) => {
    const denied = guard(true);
    if (denied) return denied;
    const file = (await request.formData()).get('file');
    if (!(file instanceof File)) return fail(400, 'No file uploaded', [{ field: 'file', message: 'Choose a file' }]);
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return fail(400, 'Unsupported file type', [{ field: 'file', message: 'Upload a JPEG or PNG image.' }]);
    }
    if (file.size > 10 * 1024 * 1024) {
      return fail(400, 'File too large', [{ field: 'file', message: 'The logo must be 10MB or smaller.' }]);
    }
    const logoUrl =
      file.size <= 512 * 1024
        ? `data:${file.type};base64,${btoa(String.fromCharCode(...new Uint8Array(await file.arrayBuffer())))}`
        : URL.createObjectURL(file);
    return ok({ logo_url: logoUrl }, 'Logo uploaded');
  }),

  // ✔ List (scoped by user) and detail.
  http.get(pm('/practices'), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase();
    const matching = search
      ? visiblePractices().filter((practice) => practice.practice_name.toLowerCase().includes(search))
      : visiblePractices();
    return ok(paginate(request, order(request, matching)));
  }),

  http.get(pm('/practices/:practiceId'), ({ params }) => {
    const denied = guard();
    if (denied) return denied;
    // Like the live API, an unknown id and a practice the user can't see both return 403.
    const practice = visiblePractices().find((item) => item.id === params.practiceId);
    return practice ? ok(practice) : forbidden();
  }),

  // ~ Create.
  http.post(pm('/practices'), async ({ request }) => {
    const denied = guard(true);
    if (denied) return denied;
    const input = (await request.json()) as PracticeInput;
    const errors = validate(input);
    if (errors.length) return fail(400, 'Validation failed', errors);
    const db = getDb();
    const now = new Date().toISOString();
    const id = mockId('practice-created', db.practices.length + Date.now());
    const base: Practice = {
      ...db.practices[0],
      id,
      auth31_id: mockId('auth31-practice-created', db.practices.length),
      ods_code: input.ods_code ?? '',
      sub_icb: '',
      city: '',
      email_address: null,
      website: null,
      description: null,
      logo_url: '',
      associated_users_count: 0,
      points_of_contact: [],
      rota_group_ids: [],
      linked_practice_ids: [],
      succession_start_date: null,
      succession_ongoing: true,
      succession_end_date: null,
      workforce_allocations: [],
      created_at: now,
      updated_at: now,
    };
    const practice = applyInput(base, input);
    db.practices.push(practice);
    db.appointmentConfigs[id] = emptyAppointmentConfiguration();
    db.slaConfigs[id] = buildSlaConfiguration();
    saveDb();
    return created(withStatus(practice), 'Practice created successfully');
  }),

  // ~ Update.
  http.patch(pm('/practices/:practiceId'), async ({ params, request }) => {
    const denied = guard(true);
    if (denied) return denied;
    const db = getDb();
    const index = db.practices.findIndex((practice) => practice.id === params.practiceId);
    if (index === -1) return forbidden();
    const input = (await request.json()) as Partial<PracticeInput>;
    const errors = validate(
      { ...(db.practices[index] as unknown as Partial<PracticeInput>), ...input },
      db.practices[index].id,
    );
    if (errors.length) return fail(400, 'Validation failed', errors);
    db.practices[index] = applyInput(db.practices[index], input);
    saveDb();
    return ok(withStatus(db.practices[index]), 'Practice updated successfully');
  }),

  // ✔ Appointment configuration (GET captured; PUT inferred).
  http.get(
    crm('/public/v1/sub-apps/:subAppId/practices/:practiceId/clinical-system/appointment-configuration/'),
    ({ params }) => {
      const denied = guard();
      if (denied) return denied;
      const config = getDb().appointmentConfigs[String(params.practiceId)];
      return config ? ok(config) : forbidden();
    },
  ),
  http.put(
    crm('/public/v1/sub-apps/:subAppId/practices/:practiceId/clinical-system/appointment-configuration/'),
    async ({ params, request }) => {
      const denied = guard(true);
      if (denied) return denied;
      const config = (await request.json()) as AppointmentConfiguration;
      if (!config.appointment_types.some((type) => type.enabled && type.is_default)) {
        return fail(400, 'Validation failed', [
          { field: 'appointment_types', message: 'Select a default appointment type.' },
        ]);
      }
      getDb().appointmentConfigs[String(params.practiceId)] = config;
      saveDb();
      return ok(config, 'Appointment configuration updated');
    },
  ),

  // ✔ SLA configuration (note the singular `practice/` in the live URL; PUT inferred).
  http.get(pm('/practice/:practiceId/sla-configuration'), ({ params }) => {
    const denied = guard();
    if (denied) return denied;
    const config = getDb().slaConfigs[String(params.practiceId)];
    return config ? ok(config) : forbidden();
  }),
  http.put(pm('/practice/:practiceId/sla-configuration'), async ({ params, request }) => {
    const denied = guard(true);
    if (denied) return denied;
    const config = (await request.json()) as SlaConfiguration;
    getDb().slaConfigs[String(params.practiceId)] = config;
    saveDb();
    return ok(config, 'SLA configuration updated');
  }),

  // ✔ Rota groups.
  http.get(crm('/public/v1/sub-apps/:subAppId/rota-groups/'), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const status = new URL(request.url).searchParams.get('status');
    const groups = getDb().rotaGroups.filter((group) => !status || group.status === status.toUpperCase());
    return ok(groups);
  }),

  // ✔ Lookup fired on profile load: practices sharing a rota group with this one (shape inferred).
  http.post(crm('/public/v1/sub-apps/:subAppId/practices/:practiceId/rota/same-rota-practices/'), ({ params }) => {
    const denied = guard();
    if (denied) return denied;
    const practice = getDb().practices.find((item) => item.id === params.practiceId);
    const groups = new Set(practice?.rota_group_ids ?? []);
    const same = getDb().practices.filter(
      (item) => item.id !== params.practiceId && item.rota_group_ids?.some((id) => groups.has(id)),
    );
    return ok(same.map((item) => ({ id: item.id, practice_name: item.practice_name })));
  }),

  // Practice-user "select business" (captured live). The URL is the source of truth in the rebuild.
  http.patch(crm('/users/v1/sub-apps/:subAppId/users/:userId/user-businesses/:practiceId/select'), () => {
    const denied = guard();
    if (denied) return denied;
    return HttpResponse.json({ status: { code: 200, message: 'Business selected' }, data: {}, errors: [] });
  }),
];
