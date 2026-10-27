import { crmRequest } from './http';
import type { ListParams, Paginated, Profile, Role } from './types';

export const usersApi = {
  profile: (signal?: AbortSignal) => crmRequest<{ profile: Profile }>('/users/v1/profile', { signal }),
  // Note: the roles path has no `/v1/` in the live API.
  roles: (subAppId: string, params: ListParams = {}, signal?: AbortSignal) =>
    crmRequest<Paginated<Role>>(`/users/sub-apps/${subAppId}/roles`, { query: params, signal }),
};
