import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import { templateText } from '@/lib/api/templates';
import {
  TEMPLATE_CATEGORIES,
  type CommunicationTemplate,
  type TemplateInput,
  type TemplateListResponse,
} from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import { currentPersona, getDb, saveDb } from '../store';
import { created, fail, ok, unauthorized } from '../respond';

// Template Library mocks (docs/plans/phase-4-vertical-modules.md §2). No template call was captured,
// so every path and shape here is inferred.

const templates = (path = '') => `*${CRM_API}/public/v1/sub-apps/:subAppId/templates/${path}`;

const MESSAGE_MAX = 300;
const MOVE_BODY_MAX = 1000;

// Practice users manage the same library from practice Settings → Templates, as live (REBUILD-PLAN.md
// §8); the vertical Templates page itself is blocked for them by the frame.
function guard() {
  if (!getDb().session.signedIn) return unauthorized();
  return null;
}

function validate(input: Partial<TemplateInput>, bodyMax = MESSAGE_MAX) {
  const errors: { field: string; message: string }[] = [];
  if (!String(input.name ?? '').trim()) errors.push({ field: 'name', message: 'Template name is required' });
  if (!TEMPLATE_CATEGORIES.includes(input.category as never)) {
    errors.push({ field: 'category', message: 'Category is required' });
  }
  if (input.type === 'EMAIL' && !String(input.subject ?? '').trim()) {
    errors.push({ field: 'subject', message: 'Subject is required' });
  }
  const text = templateText(String(input.body ?? ''));
  if (!text) errors.push({ field: 'body', message: 'Template message is required' });
  if (text.length > bodyMax) {
    errors.push({ field: 'body', message: `Template message must be ${bodyMax} characters or fewer` });
  }
  return errors;
}

export const templateHandlers = [
  http.get(templates(), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const params = new URL(request.url).searchParams;
    const scope = params.get('scope') === 'staff' ? 'STAFF' : 'STANDARD';
    const search = params.get('search')?.trim().toLowerCase();
    const { templates: all } = getDb();
    const results = all
      .filter((template) => template.scope === scope)
      .filter((template) => !search || template.name.toLowerCase().includes(search))
      .filter((template) => !params.get('type') || template.type === params.get('type'))
      .filter((template) => !params.get('status') || template.status === params.get('status'))
      .filter((template) => !params.get('category') || template.category === params.get('category'))
      .filter((template) => !params.get('created_by') || template.created_by_name === params.get('created_by'))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const response: TemplateListResponse = {
      results,
      totals: {
        standard: all.filter((template) => template.scope === 'STANDARD').length,
        staff: all.filter((template) => template.scope === 'STAFF').length,
      },
      authors: [...new Set(all.filter((t) => t.scope === 'STAFF').map((t) => t.created_by_name))].sort(),
    };
    return ok(response);
  }),

  http.post(templates(), async ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const input = (await request.json()) as TemplateInput;
    const errors = validate(input);
    if (errors.length) return fail(400, errors[0].message, errors);
    const persona = currentPersona();
    const now = new Date().toISOString();
    const template: CommunicationTemplate = {
      id: mockId('template-new', Date.now()),
      scope: 'STANDARD',
      name: input.name.trim(),
      category: input.category,
      type: input.type,
      status: input.status,
      subject: input.type === 'EMAIL' ? (input.subject ?? '').trim() : null,
      body: input.body,
      created_by_name: `${persona.firstName} ${persona.lastName}`,
      business_name: null,
      created_at: now,
      updated_at: now,
    };
    getDb().templates.push(template);
    saveDb();
    return created(template, 'Template created successfully');
  }),

  http.patch(templates(':templateId/'), async ({ params, request }) => {
    const denied = guard();
    if (denied) return denied;
    const template = getDb().templates.find((item) => item.id === params.templateId);
    if (!template) return fail(404, 'Template not found.');
    const input = (await request.json()) as Partial<TemplateInput>;
    const next = { ...template, ...input };
    // A status-only change (Mark as Inactive / Activate) skips the content checks.
    const statusOnly = Object.keys(input).every((key) => key === 'status');
    const errors = statusOnly ? [] : validate(next);
    if (errors.length) return fail(400, errors[0].message, errors);
    Object.assign(template, next, {
      subject: next.type === 'EMAIL' ? (next.subject ?? '').trim() : null,
      updated_at: new Date().toISOString(),
    });
    saveDb();
    return ok(template, 'Template updated successfully');
  }),

  http.delete(templates(':templateId/'), ({ params }) => {
    const denied = guard();
    if (denied) return denied;
    const db = getDb();
    if (!db.templates.some((item) => item.id === params.templateId)) return fail(404, 'Template not found.');
    db.templates = db.templates.filter((item) => item.id !== params.templateId);
    saveDb();
    return ok({ id: String(params.templateId) }, 'Template deleted successfully');
  }),

  http.post(templates(':templateId/move-to-standard/'), async ({ params, request }) => {
    const denied = guard();
    if (denied) return denied;
    const template = getDb().templates.find((item) => item.id === params.templateId && item.scope === 'STAFF');
    if (!template) return fail(404, 'Template not found.');
    const input = (await request.json()) as Pick<TemplateInput, 'name' | 'category' | 'subject' | 'body'>;
    const errors = validate({ ...input, type: template.type }, MOVE_BODY_MAX);
    if (errors.length) return fail(400, errors[0].message, errors);
    Object.assign(template, {
      scope: 'STANDARD',
      name: input.name.trim(),
      category: input.category,
      subject: template.type === 'EMAIL' ? (input.subject ?? '').trim() : null,
      body: input.body,
      business_name: null,
      updated_at: new Date().toISOString(),
    });
    saveDb();
    return ok(template, 'Template moved to Standard Templates successfully.');
  }),
];
