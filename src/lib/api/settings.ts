import { crmRequest } from './http';
import type {
  Competency,
  CompetencyInput,
  GlobalAppointmentConfiguration,
  GlobalPracticeConfiguration,
  ListParams,
  Paginated,
  Pathway,
  PathwayChannel,
} from './types';

// Vertical Settings (docs/plans/phase-4-vertical-modules.md §3). No Settings call was captured, so
// every path here is inferred from the backend's `public/v1` pattern.
const base = (subAppId: string) => `/public/v1/sub-apps/${subAppId}`;

export const settingsApi = {
  practiceConfiguration: (subAppId: string, signal?: AbortSignal) =>
    crmRequest<GlobalPracticeConfiguration>(`${base(subAppId)}/global-practice-configuration/`, { signal }),
  savePracticeConfiguration: (subAppId: string, input: GlobalPracticeConfiguration) =>
    crmRequest<GlobalPracticeConfiguration>(`${base(subAppId)}/global-practice-configuration/`, {
      method: 'PUT',
      body: input,
    }),
  appointmentConfiguration: (subAppId: string, signal?: AbortSignal) =>
    crmRequest<GlobalAppointmentConfiguration>(`${base(subAppId)}/global-appointment-configuration/`, { signal }),
  saveAppointmentConfiguration: (subAppId: string, input: GlobalAppointmentConfiguration) =>
    crmRequest<GlobalAppointmentConfiguration>(`${base(subAppId)}/global-appointment-configuration/`, {
      method: 'PUT',
      body: input,
    }),
  competencies: (subAppId: string, params: ListParams = {}, signal?: AbortSignal) =>
    crmRequest<Paginated<Competency>>(`${base(subAppId)}/competencies/`, { query: params, signal }),
  createCompetency: (subAppId: string, input: CompetencyInput) =>
    crmRequest<Competency>(`${base(subAppId)}/competencies/`, { method: 'POST', body: input }),
  updateCompetency: (subAppId: string, id: string, input: CompetencyInput) =>
    crmRequest<Competency>(`${base(subAppId)}/competencies/${id}/`, { method: 'PATCH', body: input }),
  deleteCompetency: (subAppId: string, id: string) =>
    crmRequest<{ id: string }>(`${base(subAppId)}/competencies/${id}/`, { method: 'DELETE' }),
  pathways: (
    subAppId: string,
    params: { type?: string; status?: string; channel?: string; routing?: string; search?: string },
    signal?: AbortSignal,
  ) => crmRequest<Pathway[]>(`${base(subAppId)}/pathways/`, { query: params, signal }),
  setPathwayChannel: (subAppId: string, id: string, channel: PathwayChannel, enabled: boolean) =>
    crmRequest<Pathway>(`${base(subAppId)}/pathways/${id}/channels/`, {
      method: 'PATCH',
      body: { [channel]: enabled },
    }),
};
