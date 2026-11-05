import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import {
  CQC_ACTION_STATUSES,
  CQC_ALERT_ACTION_LABELS,
  CQC_APPLICABLE_LABELS,
  CQC_CHECK_AREAS,
  CQC_PRIORITIES,
  CQC_RISKS,
  CQC_SIGN_OFF_LABELS,
  CQC_STATUSES,
  type CqcActionEdit,
  type CqcAlert,
  type CqcAlertInput,
  type CqcAreaKey,
  type CqcCheckEdit,
  type CqcSurveyEdit,
} from '@/lib/api/cqc';
import { surveySummary, cqcRecord, presentChecks, presentSurvey, summaryFor, todayIso } from '../cqcState';
import { CQC_CHECK_SEEDS } from '../fixtures/cqc';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';
import { currentPersona, getDb, saveDb, visiblePractices } from '../store';

// CQC Compliance mocks (docs/plans/phase-6-cqc-compliance.md). All inferred from the BA workbook:
// the rules in the validation messages are the workbook's own ("Close only after completion evidence
// and an effectiveness check", "Every gap points to one action ID").

const cqcPath = (rest: string) => `*${CRM_API}/public/v1/sub-apps/:subAppId/practices/:practiceId/cqc/${rest}`;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown) => String(value ?? '').trim();
const dateOrNull = (value: unknown) => (DATE.test(text(value)) ? text(value) : null);

function guard(practiceId: string) {
  if (!getDb().session.signedIn) return unauthorized();
  if (!currentPersona().isAdmin) return forbidden();
  if (!visiblePractices().some((practice) => practice.id === practiceId)) return forbidden();
  return null;
}

const AREA_KEYS = CQC_CHECK_AREAS.map((area) => area.key);

function checkProblem(input: Partial<CqcCheckEdit>, linkedActionStatus: string | null, linkedActionId: string | null) {
  const status = input.status;
  if (!status || !CQC_STATUSES.includes(status)) return 'Status is required';
  if (input.risk && !CQC_RISKS.includes(input.risk)) return 'Risk is not valid';
  if (status === 'GAP' || status === 'IN_PROGRESS') {
    if (!input.risk || input.risk === 'NONE') return 'Risk is required';
    if (!text(input.gap_action)) return 'Gap / action required is required';
    if (!dateOrNull(input.due_date)) return 'Due date is required';
  }
  if (status === 'COMPLETE' || status === 'OUTSTANDING') {
    if (!text(input.evidence)) return 'Evidence location is required';
    if (!dateOrNull(input.completed_date)) return 'Completed date is required';
  }
  if (status === 'NOT_APPLICABLE' && !text(input.notes)) return 'Justification is required';
  const resolving = status === 'COMPLETE' || status === 'OUTSTANDING' || status === 'NOT_APPLICABLE';
  if (resolving && linkedActionId && linkedActionStatus !== 'CLOSED') {
    return `Close action ${linkedActionId} first, with its completion evidence and effectiveness check`;
  }
  return null;
}

function alertProblem(input: Partial<CqcAlertInput>) {
  if (!text(input.reference)) return 'Alert reference is required';
  if (!text(input.title)) return 'Alert title is required';
  if (!dateOrNull(input.received_date)) return 'Received date is required';
  if (!input.applicable || !(input.applicable in CQC_APPLICABLE_LABELS)) return 'Applicable is required';
  if (!input.action_status || !(input.action_status in CQC_ALERT_ACTION_LABELS)) return 'Action completed is required';
  if (!input.sign_off || !(input.sign_off in CQC_SIGN_OFF_LABELS)) return 'Governance sign-off is required';
  if (input.action_status === 'COMPLETE' && !text(input.closure_evidence)) return 'Closure evidence is required';
  if (
    input.sign_off === 'SIGNED_OFF' &&
    input.action_status !== 'COMPLETE' &&
    input.action_status !== 'NOT_APPLICABLE'
  ) {
    return 'Complete the action before signing off';
  }
  return null;
}

function actionProblem(input: Partial<CqcActionEdit>) {
  if (!input.priority || !CQC_PRIORITIES.includes(input.priority)) return 'Priority is required';
  if (!text(input.gap)) return 'Gap / risk is required';
  if (!text(input.required_action)) return 'Required action is required';
  if (!input.status || !CQC_ACTION_STATUSES.includes(input.status)) return 'Status is required';
  if (input.status === 'CLOSED') {
    if (!text(input.completion_evidence)) return 'Completion evidence is required to close an action';
    if (!text(input.effectiveness_check)) return 'Effectiveness check is required to close an action';
  }
  return null;
}

export const cqcHandlers = [
  http.get(cqcPath('summary/'), ({ params }) => {
    const blocked = guard(String(params.practiceId));
    if (blocked) return blocked;
    return ok(summaryFor(String(params.practiceId)));
  }),

  http.get(cqcPath('areas/:area/checks/'), ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const area = String(params.area) as CqcAreaKey;
    if (!AREA_KEYS.includes(area)) return fail(404, 'Area not found');
    const query = new URL(request.url).searchParams;
    const group = query.get('group');
    const status = query.get('status');
    const risk = query.get('risk');
    const search = query.get('search')?.trim().toLowerCase();
    const all = presentChecks(practiceId, area);
    const rows = all
      .filter((check) => !group || check.group === group)
      .filter((check) => !status || check.status === status)
      .filter((check) => !risk || check.risk === risk)
      .filter(
        (check) =>
          !search ||
          `${check.id} ${check.requirement} ${check.owner} ${check.action_id ?? ''}`.toLowerCase().includes(search),
      );
    const groups = [...new Set(CQC_CHECK_SEEDS.filter((seed) => seed.area === area).map((seed) => seed.group))];
    return ok({ ...paginate(request, order(request, rows, 'id')), groups });
  }),

  http.patch(cqcPath('checks/:id/'), async ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const id = String(params.id);
    const seed = CQC_CHECK_SEEDS.find((item) => item.id === id);
    if (!seed) return fail(404, 'Check not found');
    const record = cqcRecord(practiceId);
    const stored = record.checks[id];
    const input = (await request.json()) as Partial<CqcCheckEdit>;
    const linked = record.actions.find((action) => action.id === stored.action_id);
    const problem = checkProblem(input, linked?.status ?? null, stored.action_id);
    if (problem) return fail(400, problem);

    const status = input.status!;
    const open = status === 'GAP' || status === 'IN_PROGRESS';
    const next = {
      status,
      risk: input.risk ?? null,
      evidence: text(input.evidence),
      due_date: dateOrNull(input.due_date),
      completed_date: dateOrNull(input.completed_date),
      gap_action: text(input.gap_action),
      owner: text(input.owner),
      notes: text(input.notes),
      action_id: stored.action_id,
    };
    if (open) {
      // Every gap points to exactly one action in the single action plan.
      if (!linked) {
        const number = record.actions.reduce((max, action) => Math.max(max, Number(action.id.slice(4))), 0) + 1;
        next.action_id = `ACT-${String(number).padStart(3, '0')}`;
        record.actions.push({
          id: next.action_id,
          source_area: seed.area,
          source_check_id: seed.id,
          priority: next.risk === 'NONE' || !next.risk ? 'LOW' : next.risk,
          gap: seed.requirement,
          required_action: next.gap_action,
          owner: next.owner,
          opened_date: todayIso(),
          due_date: next.due_date,
          status: status === 'GAP' ? 'OPEN' : 'IN_PROGRESS',
          completion_evidence: '',
          effectiveness_check: '',
          closed_date: null,
        });
      } else if (linked.status !== 'CLOSED') {
        linked.priority = next.risk === 'NONE' || !next.risk ? 'LOW' : next.risk;
        linked.required_action = next.gap_action;
        linked.owner = next.owner;
        linked.due_date = next.due_date;
      }
    }
    record.checks[id] = next;
    saveDb();
    return ok({ ...seed, ...next });
  }),

  http.get(cqcPath('survey-measures/'), ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const { entered, total, average_score, readiness, rating } = surveySummary(practiceId);
    const summary = { entered, total, average_score, readiness, rating };
    return ok({ ...paginate(request, presentSurvey(practiceId)), summary });
  }),

  http.patch(cqcPath('survey-measures/:id/'), async ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const id = String(params.id);
    const record = cqcRecord(practiceId);
    if (!record.survey[id]) return fail(404, 'Measure not found');
    const input = (await request.json()) as Partial<Record<keyof CqcSurveyEdit, unknown>>;
    const result = (value: unknown, label: string): { value: number | null; error?: string } => {
      if (value === null || value === '' || value === undefined) return { value: null };
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 100) {
        return { value: null, error: `${label} must be between 0 and 100` };
      }
      return { value: number };
    };
    const practice = result(input.practice_result, 'Practice result');
    const national = result(input.national_result, 'National result');
    const previous = result(input.previous_result, 'Previous practice result');
    const error = practice.error ?? national.error ?? previous.error;
    if (error) return fail(400, error);
    if (practice.value !== null && national.value === null) return fail(400, 'National result is required');
    record.survey[id] = {
      practice_result: practice.value,
      national_result: national.value,
      previous_result: previous.value,
      action: text(input.action),
      owner: text(input.owner),
    };
    saveDb();
    return ok(presentSurvey(practiceId).find((measure) => measure.id === id));
  }),

  http.get(cqcPath('alerts/'), ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const rows = [...cqcRecord(practiceId).alerts].sort((a, b) =>
      String(b.received_date ?? '').localeCompare(String(a.received_date ?? '')),
    );
    return ok(paginate(request, rows));
  }),

  http.post(cqcPath('alerts/'), async ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const input = (await request.json()) as Partial<CqcAlertInput>;
    const problem = alertProblem(input);
    if (problem) return fail(400, problem);
    const record = cqcRecord(practiceId);
    const alert = toAlert(`alert-${Date.now()}`, input);
    record.alerts.push(alert);
    saveDb();
    return created(alert);
  }),

  http.patch(cqcPath('alerts/:id/'), async ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const record = cqcRecord(practiceId);
    const index = record.alerts.findIndex((alert) => alert.id === params.id);
    if (index < 0) return fail(404, 'Alert not found');
    const input = (await request.json()) as Partial<CqcAlertInput>;
    const problem = alertProblem(input);
    if (problem) return fail(400, problem);
    record.alerts[index] = toAlert(record.alerts[index].id, input);
    saveDb();
    return ok(record.alerts[index]);
  }),

  http.get(cqcPath('actions/'), ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const query = new URL(request.url).searchParams;
    const status = query.get('status');
    const priority = query.get('priority');
    const search = query.get('search')?.trim().toLowerCase();
    const rows = cqcRecord(practiceId)
      .actions.filter((action) => !status || action.status === status)
      .filter((action) => !priority || action.priority === priority)
      .filter(
        (action) =>
          !search ||
          `${action.id} ${action.source_check_id ?? ''} ${action.gap} ${action.required_action} ${action.owner}`
            .toLowerCase()
            .includes(search),
      );
    return ok(paginate(request, order(request, rows, 'id')));
  }),

  http.patch(cqcPath('actions/:id/'), async ({ params, request }) => {
    const practiceId = String(params.practiceId);
    const blocked = guard(practiceId);
    if (blocked) return blocked;
    const record = cqcRecord(practiceId);
    const action = record.actions.find((item) => item.id === params.id);
    if (!action) return fail(404, 'Action not found');
    const input = (await request.json()) as Partial<CqcActionEdit>;
    const problem = actionProblem(input);
    if (problem) return fail(400, problem);
    const status = input.status!;
    Object.assign(action, {
      priority: input.priority,
      gap: text(input.gap),
      required_action: text(input.required_action),
      owner: text(input.owner),
      due_date: dateOrNull(input.due_date),
      status,
      completion_evidence: text(input.completion_evidence),
      effectiveness_check: text(input.effectiveness_check),
      closed_date: status === 'CLOSED' ? (action.closed_date ?? todayIso()) : null,
    });
    saveDb();
    return ok(action);
  }),
];

function toAlert(id: string, input: Partial<CqcAlertInput>): CqcAlert {
  const patients = input.patients_affected;
  return {
    id,
    reference: text(input.reference),
    title: text(input.title),
    received_date: dateOrNull(input.received_date),
    applicable: input.applicable!,
    clinical_owner: text(input.clinical_owner),
    action_deadline: dateOrNull(input.action_deadline),
    patients_affected: patients === null || patients === undefined || String(patients) === '' ? null : Number(patients),
    action_status: input.action_status!,
    closure_evidence: text(input.closure_evidence),
    closed_date: dateOrNull(input.closed_date),
    sign_off: input.sign_off!,
    notes: text(input.notes),
  };
}
