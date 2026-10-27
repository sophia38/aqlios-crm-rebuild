import { crmRequest } from './http';
import type { ListParams, Paginated, Practice } from './types';

const base = (subAppId: string) => `/practice-management/v1/sub-apps/${subAppId}`;

export const practiceManagementApi = {
  practices: (subAppId: string, params: ListParams = {}, signal?: AbortSignal) =>
    crmRequest<Paginated<Practice>>(`${base(subAppId)}/practices`, { query: params, signal }),
  practice: (subAppId: string, practiceId: string, signal?: AbortSignal) =>
    crmRequest<Practice>(`${base(subAppId)}/practices/${practiceId}`, { signal }),
};

/** URL slug the live app derives from the practice name: "Main Practice - Surgery" → "main-practice---surgery". */
export function practiceSlug(practiceName: string) {
  return practiceName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s/g, '-');
}
