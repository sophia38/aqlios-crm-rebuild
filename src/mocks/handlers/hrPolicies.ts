import dayjs from 'dayjs';
import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import { HR_DESCRIPTION_MAX, HR_POLICY_FILE_MAX_BYTES, HR_QUESTION_MAX } from '@/lib/api/hrPolicies';
import { HR_POLICY_CATEGORIES, type HrPolicyCategory, type HrPolicyInput } from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import { answerQuestion, hrPolicyRecords, presentPolicy, type HrPolicyRecord } from '../hrPolicyState';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';
import { currentPersona, getDb, saveDb, visiblePractices } from '../store';
import { leavePeople } from './staff';

// HR Policies mocks (docs/plans/phase-5-practice-modules.md §7). All inferred. As live, the module is
// hidden from practice users; managing the library is super-admin only here.

const policiesPath = (path = '') =>
  `*${CRM_API}/public/v1/sub-apps/:subAppId/practices/:practiceId/hr-policies/${path}`;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FILE = /\.(pdf|docx)$/i;

function guard(practiceId: string, manage = false) {
  if (!getDb().session.signedIn) return unauthorized();
  if (!visiblePractices().some((practice) => practice.id === practiceId)) return forbidden();
  if (manage && !currentPersona().isAdmin) return forbidden();
  return null;
}

function inputProblem(practiceId: string, input: Partial<HrPolicyInput>) {
  if (!String(input.title ?? '').trim()) return 'Title is required';
  if (String(input.title).trim().length > 120) return 'Title must be 120 characters or fewer';
  if (!HR_POLICY_CATEGORIES.includes(input.category as HrPolicyCategory)) return 'Category is required';
  if (input.owner_id && !leavePeople(practiceId).some((person) => person.id === input.owner_id))
    return 'Choose an owner from the practice’s staff';
  if (input.effective_date && !DATE.test(input.effective_date)) return 'Enter a valid effective date';
  if (String(input.description ?? '').length > HR_DESCRIPTION_MAX)
    return `Description must be ${HR_DESCRIPTION_MAX} characters or fewer`;
  if (!FILE.test(String(input.file_name ?? ''))) return 'Add a PDF or Word (.docx) file';
  if (Number(input.file_size) > HR_POLICY_FILE_MAX_BYTES) return 'The file must be 10 MB or smaller';
  return null;
}

const details = (input: HrPolicyInput) => ({
  title: input.title.trim(),
  category: input.category,
  owner_id: input.owner_id || null,
  effective_date: input.effective_date || null,
  description: String(input.description ?? '').trim(),
  file_name: input.file_name,
  file_size: Number(input.file_size) || 0,
});

const actorName = () => {
  const persona = currentPersona();
  return `${persona.firstName} ${persona.lastName}`;
};

export const hrPolicyHandlers = [
  http.get(policiesPath(), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const category = query.get('category');
    const search = query.get('search')?.trim().toLowerCase();
    const rows = hrPolicyRecords(practiceId)
      .filter((record) => !category || record.category === category)
      .map(presentPolicy)
      .filter((row) => !search || `${row.title} ${row.description}`.toLowerCase().includes(search));
    return ok(paginate(request, order(request, rows, 'title')));
  }),

  http.get(policiesPath('owners/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    return ok(
      leavePeople(practiceId)
        .map(({ id, name, role_name }) => ({ id, name, role_name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }),

  http.post(policiesPath('ask/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const { question } = (await request.json().catch(() => ({}))) as { question?: string };
    const text = String(question ?? '').trim();
    if (!text) return fail(400, 'Question is required');
    if (text.length > HR_QUESTION_MAX) return fail(400, `Question must be ${HR_QUESTION_MAX} characters or fewer`);
    return ok(answerQuestion(practiceId, text));
  }),

  http.post(policiesPath(), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId, true);
    if (denied) return denied;
    const input = (await request.json().catch(() => ({}))) as HrPolicyInput;
    const problem = inputProblem(practiceId, input);
    if (problem) return fail(400, problem);
    const records = hrPolicyRecords(practiceId);
    const record: HrPolicyRecord = {
      id: mockId(`hr-policy:${practiceId}:new`, Date.now() + records.length),
      practice_id: practiceId,
      ...details(input),
      version: 1,
      // Only the file name is stored in the demo, so there are no clauses to quote.
      sections: [],
      uploaded_by: actorName(),
      updated_at: new Date().toISOString(),
    };
    records.push(record);
    saveDb();
    return created(presentPolicy(record), 'Policy uploaded');
  }),

  http.post(policiesPath(':id/replace/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId, true);
    if (denied) return denied;
    const record = hrPolicyRecords(practiceId).find((item) => item.id === params.id);
    if (!record) return fail(404, 'Policy not found');
    const input = (await request.json().catch(() => ({}))) as HrPolicyInput;
    const problem = inputProblem(practiceId, input);
    if (problem) return fail(400, problem);
    // The demo keeps the clause text: a replaced file is usually a revised version of the same policy.
    Object.assign(record, details(input), {
      version: record.version + 1,
      uploaded_by: actorName(),
      updated_at: dayjs().toISOString(),
    });
    saveDb();
    return ok(presentPolicy(record), 'Policy replaced');
  }),

  http.delete(policiesPath(':id/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId, true);
    if (denied) return denied;
    const records = hrPolicyRecords(practiceId);
    const index = records.findIndex((item) => item.id === params.id);
    if (index < 0) return fail(404, 'Policy not found');
    records.splice(index, 1);
    saveDb();
    return ok({ id: String(params.id) }, 'Policy deleted');
  }),
];
