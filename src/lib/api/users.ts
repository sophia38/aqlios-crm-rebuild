import { crmRequest } from './http';
import type { ListParams, Paginated, Permission, Profile, Role, RoleDeleteInput, RoleInput, RoleUser } from './types';

// Note: the roles paths have no `/v1/` in the live API; the permission catalog does.
const roles = (subAppId: string) => `/users/sub-apps/${subAppId}/roles`;

export const usersApi = {
  profile: (signal?: AbortSignal) => crmRequest<{ profile: Profile }>('/users/v1/profile', { signal }),
  roles: (subAppId: string, params: ListParams = {}, signal?: AbortSignal) =>
    crmRequest<Paginated<Role>>(roles(subAppId), { query: params, signal }),
  /** `?is_paginated=false` returns every role as a plain list (ROTA filters, reassign options). */
  allRoles: (subAppId: string, signal?: AbortSignal) =>
    crmRequest<Role[]>(roles(subAppId), { query: { is_paginated: false }, signal }),
  role: (subAppId: string, roleId: string, signal?: AbortSignal) =>
    crmRequest<Role>(`${roles(subAppId)}/${roleId}`, { signal }),
  rolePermissions: (subAppId: string, roleId: string, signal?: AbortSignal) =>
    crmRequest<{ permission_ids: string[] }>(`${roles(subAppId)}/${roleId}/permissions`, { signal }),
  roleUsers: (
    subAppId: string,
    roleId: string,
    params: ListParams & { practice_id?: string } = {},
    signal?: AbortSignal,
  ) => crmRequest<Paginated<RoleUser>>(`${roles(subAppId)}/${roleId}/users`, { query: params, signal }),
  permissionCatalog: (subAppId: string, signal?: AbortSignal) =>
    crmRequest<Permission[]>('/users/v1/permissions', { query: { sub_app_id: subAppId }, signal }),
  createRole: (subAppId: string, input: RoleInput) =>
    crmRequest<Role>(roles(subAppId), { method: 'POST', body: input }),
  updateRole: (subAppId: string, roleId: string, input: RoleInput) =>
    crmRequest<Role>(`${roles(subAppId)}/${roleId}`, { method: 'PATCH', body: input }),
  deleteRole: (subAppId: string, roleId: string, input: RoleDeleteInput) =>
    crmRequest<{ id: string }>(`${roles(subAppId)}/${roleId}`, { method: 'DELETE', body: input }),
};

export const ROLE_ERROR_MESSAGES: Record<number, string> = {
  400: 'Validation failed. Please ensure all users have been reassigned.',
  401: 'You are not authenticated. Please log in.',
  403: 'You do not have permission to delete this role.',
  404: 'This role was not found. It may have been deleted.',
  500: 'Server error. Please try again later.',
};
