import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import type { Role, RoleDeleteInput, RoleInput, RoleUser } from '@/lib/api/types';
import type { StaffMember } from '../fixtures/users';
import { mockId } from '../fixtures/random';
import { currentPersona, getDb, rolesWithCounts, saveDb } from '../store';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';

// Roles & Permissions mocks (docs/plans/phase-4-vertical-modules.md §1). The GET URLs were captured
// live; create, update and delete were not and are inferred.

const crm = (path: string) => `*${CRM_API}${path}`;
const roles = (path = '') => crm(`/users/sub-apps/:subAppId/roles${path}`);

function guard() {
  if (!getDb().session.signedIn) return unauthorized();
  if (!currentPersona().isAdmin) return forbidden();
  return null;
}

function findRole(roleId: unknown): Role | undefined {
  return rolesWithCounts().find((role) => role.id === roleId);
}

function validate(input: Partial<RoleInput>, excludeId?: string) {
  const name = String(input.name ?? '').trim();
  if (!name) return [{ field: 'name', message: 'Role name is required.' }];
  const taken = getDb().roles.some(
    (role) => role.id !== excludeId && role.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (taken) return [{ field: 'name', message: 'A role with this name already exists.' }];
  if (String(input.description ?? '').length > 100) {
    return [{ field: 'description', message: 'Role description must be 100 characters or fewer.' }];
  }
  return [];
}

/** Keeps only real permission ids, and adds each one's parents (a child can't be granted on its own). */
function withParents(ids: string[] = []) {
  const byId = new Map(getDb().permissions.map((permission) => [permission.id, permission]));
  const result = new Set<string>();
  for (const id of ids) {
    let permission = byId.get(id);
    while (permission) {
      result.add(permission.id);
      permission = permission.parent ? byId.get(permission.parent) : undefined;
    }
  }
  return [...result];
}

function toRoleUser(member: StaffMember): RoleUser {
  const db = getDb();
  const role = db.roles.find((item) => item.id === member.role_id);
  return {
    id: member.id,
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    practices: member.practice_ids
      .map((id) => db.practices.find((practice) => practice.id === id))
      .filter((practice) => practice !== undefined)
      .map((practice) => ({ id: practice.id, practice_name: practice.practice_name })),
    role: { id: member.role_id, name: role?.name ?? '' },
    status: member.status,
  };
}

export const roleHandlers = [
  // ✔ Permission catalog.
  http.get(crm('/users/v1/permissions'), () => guard() ?? ok(getDb().permissions)),

  // ✔ Roles list (paged), or every role with `is_paginated=false`.
  http.get(roles(), ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const params = new URL(request.url).searchParams;
    const search = params.get('search')?.trim().toLowerCase();
    const list = search
      ? rolesWithCounts().filter((role) => role.name.toLowerCase().includes(search))
      : rolesWithCounts();
    const sorted = order(request, list, '-created_at');
    return ok(params.get('is_paginated') === 'false' ? sorted : paginate(request, sorted));
  }),

  // ✔ Role detail.
  http.get(roles('/:roleId'), ({ params }) => {
    const denied = guard();
    if (denied) return denied;
    const role = findRole(params.roleId);
    return role ? ok(role) : fail(404, 'Role not found.');
  }),

  // ✔ Permissions granted to a role.
  http.get(roles('/:roleId/permissions'), ({ params }) => {
    const denied = guard();
    if (denied) return denied;
    const role = findRole(params.roleId);
    return role ? ok({ permission_ids: getDb().rolePermissions[role.id] ?? [] }) : fail(404, 'Role not found.');
  }),

  // ✔ Users assigned to a role, with name/email search and a practice filter.
  http.get(roles('/:roleId/users'), ({ params, request }) => {
    const denied = guard();
    if (denied) return denied;
    const role = findRole(params.roleId);
    if (!role) return fail(404, 'Role not found.');
    const query = new URL(request.url).searchParams;
    const search = query.get('search')?.trim().toLowerCase();
    const practiceId = query.get('practice_id');
    const users = getDb()
      .staff.filter((member) => member.role_id === role.id)
      .filter((member) => !practiceId || member.practice_ids.includes(practiceId))
      .filter(
        (member) =>
          !search || `${member.first_name} ${member.last_name} ${member.email}`.toLowerCase().includes(search),
      )
      .map(toRoleUser);
    return ok(paginate(request, users));
  }),

  // ~ Create a role.
  http.post(roles(), async ({ request }) => {
    const denied = guard();
    if (denied) return denied;
    const input = (await request.json()) as RoleInput;
    const errors = validate(input);
    if (errors.length) return fail(400, errors[0].message, errors);
    const db = getDb();
    const now = new Date().toISOString();
    const role: Role = {
      id: mockId('role', Date.now()),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      assigned_users_count: 0,
      created_at: now,
      updated_at: now,
    };
    db.roles.push(role);
    db.rolePermissions[role.id] = withParents(input.permission_ids);
    saveDb();
    return created(role, 'Role created successfully');
  }),

  // ~ Update a role's name, description and permissions.
  http.patch(roles('/:roleId'), async ({ params, request }) => {
    const denied = guard();
    if (denied) return denied;
    const db = getDb();
    const role = db.roles.find((item) => item.id === params.roleId);
    if (!role) return fail(404, 'Role not found.');
    const input = (await request.json()) as RoleInput;
    const errors = validate(input, role.id);
    if (errors.length) return fail(400, 'Invalid data. Please check the role details and try again.', errors);
    role.name = input.name.trim();
    role.description = input.description?.trim() ?? '';
    role.updated_at = new Date().toISOString();
    db.rolePermissions[role.id] = withParents(input.permission_ids);
    saveDb();
    return ok(findRole(role.id), 'Role updated successfully');
  }),

  // ~ Delete a role; every assigned user must be moved to another role first.
  http.delete(roles('/:roleId'), async ({ params, request }) => {
    const denied = guard();
    if (denied) return denied;
    const db = getDb();
    const role = db.roles.find((item) => item.id === params.roleId);
    if (!role) return fail(404, 'This role was not found. It may have been deleted.');
    const input = ((await request.json().catch(() => null)) ?? { reassignments: [] }) as RoleDeleteInput;
    const target = new Map(input.reassignments.map((item) => [item.user_id, item.role_id]));
    const assigned = db.staff.filter((member) => member.role_id === role.id);
    const valid = assigned.every((member) => {
      const next = target.get(member.id);
      return next && next !== role.id && db.roles.some((item) => item.id === next);
    });
    if (!valid) return fail(400, 'Validation failed. Please ensure all users have been reassigned.');
    for (const member of assigned) member.role_id = target.get(member.id)!;
    db.roles = db.roles.filter((item) => item.id !== role.id);
    delete db.rolePermissions[role.id];
    saveDb();
    return ok({ id: role.id }, 'Role deleted successfully');
  }),
];
