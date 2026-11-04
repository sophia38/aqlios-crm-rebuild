import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import type {
  Competency,
  CompetencyInput,
  GlobalAppointmentConfiguration,
  Pathway,
  PathwayChannel,
} from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import { practiceSettingsFor } from '../practiceSettingsState';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';
import { currentPersona, getDb, saveDb, visiblePractices } from '../store';
import { appointmentProblem, CHANNELS, validateCompetency, withRoleNames } from './settings';

// Practice Settings mocks (docs/plans/phase-5-practice-modules.md §8). All inferred. Anyone who can
// see the practice can use them (live: practice users have Settings in their menu); rows defined in
// vertical Settings are read-only for practice users.

const practicePath = (path: string) => `*${CRM_API}/public/v1/sub-apps/:subAppId/practices/:practiceId/${path}`;

function guard(practiceId: string) {
  if (!getDb().session.signedIn) return unauthorized();
  if (!visiblePractices().some((practice) => practice.id === practiceId)) return forbidden();
  return null;
}

const asVertical = (competency: Competency): Competency => ({ ...withRoleNames(competency), practice_id: null });

function competencyFields(input: CompetencyInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    role_ids: input.role_ids,
    slot_duration_minutes: Number(input.slot_duration_minutes),
    sub_types: input.sub_types.map((subType) => subType.trim()).filter(Boolean),
  };
}

/** The practice's own row, or the vertical one (which only super-admins may change from here). */
function findCompetency(practiceId: string, id: string, action: 'edited' | 'deleted') {
  const own = practiceSettingsFor(practiceId).competencies.find((item) => item.id === id);
  if (own) return { own };
  const vertical = getDb().competencies.find((item) => item.id === id);
  if (!vertical) return { error: fail(404, 'Competency not found.') };
  if (!currentPersona().isAdmin) return { error: fail(403, `Can be ${action} via vertical settings`) };
  return { vertical };
}

function presentPathway(practiceId: string, pathway: Pathway): Pathway {
  const custom = practiceSettingsFor(practiceId).pathwayChannels[pathway.id];
  return { ...pathway, channels: custom ? { ...custom } : { ...pathway.channels }, source: custom ? 'CUSTOM' : 'HUB' };
}

export const practiceSettingsHandlers = [
  http.get(practicePath('appointment-configuration/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    return guard(practiceId) ?? ok(practiceSettingsFor(practiceId).appointment);
  }),

  http.put(practicePath('appointment-configuration/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const input = (await request.json()) as GlobalAppointmentConfiguration;
    const problem = appointmentProblem(input);
    if (problem) return fail(400, problem);
    practiceSettingsFor(practiceId).appointment = input;
    saveDb();
    return ok(input, 'Appointment configuration updated successfully');
  }),

  // The vertical rows (locked for practice users) and the practice's own.
  http.get(practicePath('competencies/'), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const rows = [
      ...getDb().competencies.map(asVertical),
      ...practiceSettingsFor(practiceId).competencies.map(withRoleNames),
    ];
    return ok(paginate(request, order(request, rows, '-created_at')));
  }),

  http.post(practicePath('competencies/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const input = (await request.json()) as CompetencyInput;
    const errors = validateCompetency(input);
    if (errors.length) return fail(400, errors[0].message, errors);
    const { competencies } = practiceSettingsFor(practiceId);
    const competency: Competency = {
      id: mockId(`practice-competency:${practiceId}:new`, Date.now() + competencies.length),
      ...competencyFields(input),
      role_names: [],
      staff_assigned: 0,
      created_at: new Date().toISOString(),
      practice_id: practiceId,
    };
    competencies.push(competency);
    saveDb();
    return created(withRoleNames(competency), 'Competency created successfully');
  }),

  http.patch(practicePath('competencies/:id/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const { own, vertical, error } = findCompetency(practiceId, String(params.id), 'edited');
    if (error) return error;
    const input = (await request.json()) as CompetencyInput;
    const errors = validateCompetency(input);
    if (errors.length) return fail(400, errors[0].message, errors);
    const target = (own ?? vertical)!;
    Object.assign(target, competencyFields(input));
    saveDb();
    return ok(own ? withRoleNames(target) : asVertical(target), 'Competency updated successfully');
  }),

  http.delete(practicePath('competencies/:id/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const id = String(params.id);
    const { own, error } = findCompetency(practiceId, id, 'deleted');
    if (error) return error;
    const db = getDb();
    const settings = practiceSettingsFor(practiceId);
    if (own) settings.competencies = settings.competencies.filter((item) => item.id !== id);
    else db.competencies = db.competencies.filter((item) => item.id !== id);
    saveDb();
    return ok({ id }, 'Competency deleted successfully');
  }),

  http.get(practicePath('pathways/'), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const search = query.get('search')?.trim().toLowerCase();
    const channel = query.get('channel') as PathwayChannel | null;
    const results = getDb()
      .pathways.map((pathway) => presentPathway(practiceId, pathway))
      .filter((pathway) => !query.get('type') || pathway.type === query.get('type'))
      .filter((pathway) => !query.get('status') || pathway.status === query.get('status'))
      .filter((pathway) => !query.get('routing') || pathway.routing === query.get('routing'))
      .filter((pathway) => !channel || pathway.channels[channel])
      .filter(
        (pathway) =>
          !search || pathway.name.toLowerCase().includes(search) || pathway.specialty.toLowerCase().includes(search),
      );
    return ok(results);
  }),

  // Changing a channel here makes the pathway Custom for this practice; the hub row is untouched.
  http.patch(practicePath('pathways/:id/channels/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const pathway = getDb().pathways.find((item) => item.id === params.id);
    if (!pathway) return fail(404, 'Pathway not found.');
    if (pathway.status !== 'ACTIVE') return fail(400, 'Only active pathways can change channels.');
    const input = (await request.json()) as Partial<Record<PathwayChannel, boolean>>;
    const settings = practiceSettingsFor(practiceId);
    const channels = { ...(settings.pathwayChannels[pathway.id] ?? pathway.channels) };
    for (const key of CHANNELS) {
      if (typeof input[key] === 'boolean') channels[key] = input[key];
    }
    settings.pathwayChannels[pathway.id] = channels;
    saveDb();
    return ok(presentPathway(practiceId, pathway), 'Pathway updated successfully');
  }),
];
