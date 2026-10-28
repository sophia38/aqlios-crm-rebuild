// Live URLs for the Roles & Permissions module (docs/super-admin/05-roles-and-permissions.md).
export const ROLES_HREF = '/verticals/public/roles';
export const CREATE_ROLE_HREF = `${ROLES_HREF}/create`;
export const roleHref = (roleId: string) => `${ROLES_HREF}/${roleId}`;
export const roleUsersHref = (roleId: string) => `${ROLES_HREF}/${roleId}/users`;

/** Matches a role page URL (with or without basePath), for the static-hosting fallback. */
export const ROLE_PATH_PATTERN = /\/verticals\/[^/]+\/roles\/([^/]+?)(\/users)?\/?$/;
