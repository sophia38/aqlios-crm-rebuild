import { crmRequest } from './http';
import type { CommunicationTemplate, TemplateInput, TemplateListParams, TemplateListResponse } from './types';

// No Template Library call was captured; these paths follow the backend's `public/v1` pattern
// (docs/plans/phase-4-vertical-modules.md §2) and are all inferred.
const base = (subAppId: string) => `/public/v1/sub-apps/${subAppId}/templates/`;

export const templatesApi = {
  list: (subAppId: string, params: TemplateListParams, signal?: AbortSignal) =>
    crmRequest<TemplateListResponse>(base(subAppId), { query: { ...params }, signal }),
  create: (subAppId: string, input: TemplateInput) =>
    crmRequest<CommunicationTemplate>(base(subAppId), { method: 'POST', body: input }),
  update: (subAppId: string, templateId: string, input: Partial<TemplateInput>) =>
    crmRequest<CommunicationTemplate>(`${base(subAppId)}${templateId}/`, { method: 'PATCH', body: input }),
  remove: (subAppId: string, templateId: string) =>
    crmRequest<{ id: string }>(`${base(subAppId)}${templateId}/`, { method: 'DELETE' }),
  moveToStandard: (
    subAppId: string,
    templateId: string,
    input: Pick<TemplateInput, 'name' | 'category' | 'subject' | 'body'>,
  ) =>
    crmRequest<CommunicationTemplate>(`${base(subAppId)}${templateId}/move-to-standard/`, {
      method: 'POST',
      body: input,
    }),
};

/** The 13 captured Insert Placeholder options. */
export const TEMPLATE_PLACEHOLDERS = [
  'patient_name',
  'patient_dob',
  'appointment_date',
  'appointment_time',
  'practice_name',
  'service_name',
  'doctor_name',
  'clinic_name',
  'clinic_phone',
  'payment_amount',
  'prescription_details',
  'test_name',
  'result_summary',
] as const;

/** Plain text of a template body (for the counter, card preview and phone preview). */
export function templateText(html: string) {
  return html
    .replace(/<\/(p|li|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{2,}/g, '\n')
    .trim();
}
