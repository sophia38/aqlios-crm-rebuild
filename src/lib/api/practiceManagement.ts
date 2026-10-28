import { API_ORIGIN, CRM_API } from './config';
import { ApiError, crmRequest } from './http';
import type {
  AppointmentConfiguration,
  ListParams,
  Paginated,
  Practice,
  PracticeInput,
  PracticeManager,
  PublicPractice,
  RotaGroup,
  SlaConfiguration,
} from './types';

const base = (subAppId: string) => `/practice-management/v1/sub-apps/${subAppId}`;
const publicBase = (subAppId: string) => `/public/v1/sub-apps/${subAppId}`;

export const practiceManagementApi = {
  practices: (subAppId: string, params: ListParams = {}, signal?: AbortSignal) =>
    crmRequest<Paginated<Practice>>(`${base(subAppId)}/practices`, { query: params, signal }),
  practice: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<Practice>(`${base(subAppId)}/practices/${practiceId}`, { signal }),
  createPractice: (subAppId: string, input: PracticeInput) =>
    crmRequest<Practice>(`${base(subAppId)}/practices`, { method: 'POST', body: input }),
  updatePractice: (subAppId: string, practiceId: string, input: Partial<PracticeInput>) =>
    crmRequest<Practice>(`${base(subAppId)}/practices/${practiceId}`, { method: 'PATCH', body: input }),
  nameAvailability: (subAppId: string, practiceName: string, excludePracticeId?: string, signal?: AbortSignal) =>
    crmRequest<{ is_available: boolean }>(`${base(subAppId)}/practices/name-availability`, {
      query: { practice_name: practiceName, practice_type: 'PUBLIC', exclude_practice_id: excludePracticeId },
      signal,
    }),
  odsSearch: (search: string, signal?: AbortSignal) =>
    crmRequest<PublicPractice[]>('/practice-management/v1/public-practices', { query: { search }, signal }),
  practiceManagers: (subAppId: string, params: ListParams = {}, signal?: AbortSignal) =>
    crmRequest<Paginated<PracticeManager>>(`/users/v1/sub-apps/${subAppId}/practice-managers/`, {
      query: { page_size: 10, ...params },
      signal,
    }),
  /** Multipart upload (inferred endpoint); returns the stored logo URL. */
  uploadLogo: async (subAppId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_ORIGIN}${CRM_API}${base(subAppId)}/practices/logo`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    const envelope = await response.json().catch(() => null);
    if (!response.ok || !envelope?.data) {
      throw new ApiError(
        envelope?.status?.code ?? response.status,
        envelope?.errors?.[0]?.message ?? 'Logo upload failed. Please try again.',
        envelope?.errors,
      );
    }
    return envelope.data as { logo_url: string };
  },
  appointmentConfiguration: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<AppointmentConfiguration>(
      `${publicBase(subAppId)}/practices/${practiceId}/clinical-system/appointment-configuration/`,
      { signal },
    ),
  saveAppointmentConfiguration: (subAppId: string, practiceId: string, config: AppointmentConfiguration) =>
    crmRequest<AppointmentConfiguration>(
      `${publicBase(subAppId)}/practices/${practiceId}/clinical-system/appointment-configuration/`,
      { method: 'PUT', body: config },
    ),
  // Note the singular `practice/` in this live URL.
  slaConfiguration: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<SlaConfiguration>(`${base(subAppId)}/practice/${practiceId}/sla-configuration`, { signal }),
  saveSlaConfiguration: (subAppId: string, practiceId: string, config: SlaConfiguration) =>
    crmRequest<SlaConfiguration>(`${base(subAppId)}/practice/${practiceId}/sla-configuration`, {
      method: 'PUT',
      body: config,
    }),
  rotaGroups: (subAppId: string, signal?: AbortSignal) =>
    crmRequest<RotaGroup[]>(`${publicBase(subAppId)}/rota-groups/`, { query: { status: 'active' }, signal }),
  /** Lookup the live profile fires on load: practices sharing a rota group (shape inferred). */
  sameRotaPractices: (subAppId: string, practiceId: string) =>
    crmRequest<{ id: string; practice_name: string }[]>(
      `${publicBase(subAppId)}/practices/${practiceId}/rota/same-rota-practices/`,
      { method: 'POST' },
    ),
  selectBusiness: (subAppId: string, userId: string, practiceId: string) =>
    crmRequest<object>(`/users/v1/sub-apps/${subAppId}/users/${userId}/user-businesses/${practiceId}/select`, {
      method: 'PATCH',
    }),
};

/** URL slug the live app derives from the practice name: "Main Practice - Surgery" → "main-practice---surgery". */
export function practiceSlug(practiceName: string) {
  return practiceName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s/g, '-');
}

/** Field errors from a 400 response, keyed by field (`{ field, message }[]`, inferred format). */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(
    error.errors
      .filter((item): item is { field: string; message: string } =>
        Boolean(item && typeof item === 'object' && 'field' in item && 'message' in item),
      )
      .map((item) => [item.field, item.message]),
  );
}
