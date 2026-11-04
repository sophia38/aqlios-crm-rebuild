import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import type {
  Competency,
  CompetencyInput,
  DaySchedule,
  GlobalAppointmentConfiguration,
  GlobalPracticeConfiguration,
  PathwayChannel,
} from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import { currentPersona, getDb, saveDb } from '../store';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';

// Vertical Settings mocks (docs/plans/phase-4-vertical-modules.md §3). No Settings call was captured,
// so every path and shape here is inferred.

const settings = (path: string) => `*${CRM_API}/public/v1/sub-apps/:subAppId/${path}`;

export const CHANNELS: PathwayChannel[] = ['mobile_app', 'web_app', 'voice_agent', 'website', 'care_navigator'];

function guard() {
  if (!getDb().session.signedIn) return unauthorized();
  if (!currentPersona().isAdmin) return forbidden();
  return null;
}

const badHours = (days: DaySchedule[]) => days.some((day) => day.is_open && day.closing_time <= day.opening_time);

export function withRoleNames(competency: Competency): Competency {
  const { roles } = getDb();
  return {
    ...competency,
    role_names: competency.role_ids.map((id) => roles.find((role) => role.id === id)?.name ?? '').filter(Boolean),
  };
}

export function validateCompetency(input: Partial<CompetencyInput>) {
  const errors: { field: string; message: string }[] = [];
  if (!String(input.name ?? '').trim()) errors.push({ field: 'name', message: 'Competency type name is required' });
  if (!input.role_ids?.length) errors.push({ field: 'role_ids', message: 'Select at least one role' });
  if (!(Number(input.slot_duration_minutes) > 0)) {
    errors.push({ field: 'slot_duration_minutes', message: 'Slot duration is required' });
  }
  if (!input.sub_types?.some((subType) => subType.trim())) {
    errors.push({ field: 'sub_types', message: 'Add at least one sub-type' });
  }
  return errors;
}

/** The appointment configuration rules shared by vertical and practice Settings. */
export function appointmentProblem(input: GlobalAppointmentConfiguration) {
  if (input.offered_slot_hours < 1 || input.offered_slot_hours > 720) return 'Enter a number of hours from 1 to 720';
  if (input.max_advance_booking_days < 1 || input.max_advance_booking_days > 365) {
    return 'Enter a number of days from 1 to 365';
  }
  if (badHours(input.urgent_capacity)) return 'Closing time must be after opening time';
  return null;
}

export const settingsHandlers = [
  http.get(settings('global-practice-configuration/'), () => guard() ?? ok(getDb().globalPracticeConfig)),

  http.put(settings('global-practice-configuration/'), async ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const input = (await request.json()) as GlobalPracticeConfiguration;
    if (!input.appointment_types.some((type) => type.enabled && type.is_default)) {
      return fail(400, 'Select a default appointment type.');
    }
    if (badHours(input.operating_hours)) return fail(400, 'Closing time must be after opening time');
    getDb().globalPracticeConfig = input;
    saveDb();
    return ok(input, 'Global practice configuration updated successfully');
  }),

  http.get(settings('global-appointment-configuration/'), () => guard() ?? ok(getDb().globalAppointmentConfig)),

  http.put(settings('global-appointment-configuration/'), async ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const input = (await request.json()) as GlobalAppointmentConfiguration;
    const problem = appointmentProblem(input);
    if (problem) return fail(400, problem);
    getDb().globalAppointmentConfig = input;
    saveDb();
    return ok(input, 'Global appointment configuration updated successfully');
  }),

  http.get(settings('competencies/'), ({ request }) => {
    // Anyone signed in can read the list (staff profiles show the Competency Mapping); only admins change it.
    if (!getDb().session.signedIn) return unauthorized();
    const list = getDb().competencies.map(withRoleNames);
    return ok(paginate(request, order(request, list, '-created_at')));
  }),

  http.post(settings('competencies/'), async ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const input = (await request.json()) as CompetencyInput;
    const errors = validateCompetency(input);
    if (errors.length) return fail(400, errors[0].message, errors);
    const competency: Competency = withRoleNames({
      id: mockId('competency-new', Date.now()),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      role_ids: input.role_ids,
      role_names: [],
      slot_duration_minutes: Number(input.slot_duration_minutes),
      sub_types: input.sub_types.map((subType) => subType.trim()).filter(Boolean),
      staff_assigned: 0,
      created_at: new Date().toISOString(),
    });
    getDb().competencies.push(competency);
    saveDb();
    return created(competency, 'Competency created successfully');
  }),

  http.patch(settings('competencies/:id/'), async ({ params, request }) => {
    const denied = guard();
    if (denied) return denied;
    const competency = getDb().competencies.find((item) => item.id === params.id);
    if (!competency) return fail(404, 'Competency not found.');
    const input = (await request.json()) as CompetencyInput;
    const errors = validateCompetency(input);
    if (errors.length) return fail(400, errors[0].message, errors);
    Object.assign(competency, {
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      role_ids: input.role_ids,
      slot_duration_minutes: Number(input.slot_duration_minutes),
      sub_types: input.sub_types.map((subType) => subType.trim()).filter(Boolean),
    });
    saveDb();
    return ok(withRoleNames(competency), 'Competency updated successfully');
  }),

  http.delete(settings('competencies/:id/'), ({ params }) => {
    const denied = guard();
    if (denied) return denied;
    const db = getDb();
    if (!db.competencies.some((item) => item.id === params.id)) return fail(404, 'Competency not found.');
    db.competencies = db.competencies.filter((item) => item.id !== params.id);
    saveDb();
    return ok({ id: String(params.id) }, 'Competency deleted successfully');
  }),

  http.get(settings('pathways/'), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const search = query.get('search')?.trim().toLowerCase();
    const channel = query.get('channel') as PathwayChannel | null;
    const results = getDb()
      .pathways.filter((pathway) => !query.get('type') || pathway.type === query.get('type'))
      .filter((pathway) => !query.get('status') || pathway.status === query.get('status'))
      .filter((pathway) => !query.get('routing') || pathway.routing === query.get('routing'))
      .filter((pathway) => !channel || pathway.channels[channel])
      .filter(
        (pathway) =>
          !search || pathway.name.toLowerCase().includes(search) || pathway.specialty.toLowerCase().includes(search),
      );
    return ok(results);
  }),

  http.patch(settings('pathways/:id/channels/'), async ({ params, request }) => {
    const denied = guard();
    if (denied) return denied;
    const pathway = getDb().pathways.find((item) => item.id === params.id);
    if (!pathway) return fail(404, 'Pathway not found.');
    if (pathway.status !== 'ACTIVE') return fail(400, 'Only active pathways can change channels.');
    const input = (await request.json()) as Partial<Record<PathwayChannel, boolean>>;
    for (const channel of CHANNELS) {
      if (typeof input[channel] === 'boolean') pathway.channels[channel] = input[channel];
    }
    saveDb();
    return ok(pathway, 'Pathway updated successfully');
  }),
];
