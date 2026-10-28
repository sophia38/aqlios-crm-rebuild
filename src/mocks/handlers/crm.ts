import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import { currentPersona, getDb } from '../store';
import { forbidden, ok, order, paginate, unauthorized } from '../respond';

const crm = (path: string) => `*${CRM_API}${path}`;

/** Every CRM endpoint needs a session; resolvers run only when signed in. */
function signedIn() {
  return getDb().session.signedIn;
}

export const crmHandlers = [
  http.get(crm('/users/v1/profile'), () => {
    if (!signedIn()) return unauthorized();
    const persona = currentPersona();
    return ok({
      profile: {
        id: persona.userId,
        internal_user_id: persona.userId,
        username: persona.email,
        email: persona.email,
        first_name: persona.firstName,
        last_name: persona.lastName,
        full_name: `${persona.firstName} ${persona.lastName}`,
        date_of_birth: persona.dateOfBirth,
        roles: persona.role ? [persona.role] : [],
      },
    });
  }),

  http.get(crm('/users/sub-apps/:subAppId/roles'), ({ request }) => {
    if (!signedIn()) return unauthorized();
    if (!currentPersona().isAdmin) return forbidden();
    const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase();
    const roles = search ? getDb().roles.filter((role) => role.name.toLowerCase().includes(search)) : getDb().roles;
    return ok(paginate(request, order(request, roles)));
  }),
];
