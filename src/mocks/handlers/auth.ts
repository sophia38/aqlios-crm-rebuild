import { http, HttpResponse } from 'msw/http';
import type { AuthMe } from '@/lib/api/types';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { mockId } from '../fixtures/random';
import { PERSONAS, SUB_APPS, type PersonaId } from '../fixtures/users';
import { currentPersona, getDb, resetDb, saveDb, visiblePractices } from '../store';

const DEMO_PASSWORD = 'demo';

function me(): AuthMe {
  const persona = currentPersona();
  const organizations = visiblePractices().map((practice) => ({ id: practice.id, name: practice.practice_name }));
  return {
    user: {
      id: persona.userId,
      email: persona.email,
      firstName: persona.firstName,
      lastName: persona.lastName,
      isAdmin: persona.isAdmin,
      isPatient: false,
      role: persona.role,
      subAppSlugs: ['public'],
    },
    claims: {
      sub: persona.userId,
      user_id: persona.userId,
      app_id: mockId('app', 0),
      email: persona.email,
      first_name: persona.firstName,
      last_name: persona.lastName,
      is_admin: persona.isAdmin,
      is_patient: false,
      is_verified: true,
      meta_data: null,
      organizations,
      redirect_url: '/verticals',
      roles: persona.role ? [persona.role] : [],
      sub_apps: [
        {
          id: PUBLIC_SUB_APP_ID,
          name: 'Public Primary Care',
          slug: 'public',
          organizations,
          permissions: [],
          roles: persona.role ? [persona.role] : [],
        },
      ],
    },
    isDemo: true,
  };
}

export const authHandlers = [
  http.get('*/api/auth/me', () => {
    if (!getDb().session.signedIn) return HttpResponse.json({ message: 'Not authenticated' }, { status: 401 });
    return HttpResponse.json(me());
  }),

  http.get('*/api/auth/sub-apps', () => HttpResponse.json({ message: 'Sub apps fetched', sub_apps: SUB_APPS })),

  // Mock-only: the live app signs in through the shared 31G auth service.
  http.post('*/api/auth/login', async ({ request }) => {
    const { email, password } = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
    if (!email?.trim() || password !== DEMO_PASSWORD) {
      return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    const db = getDb();
    db.session.signedIn = true;
    saveDb();
    return HttpResponse.json({ message: 'Logged in' });
  }),

  http.post('*/api/auth/logout', () => {
    getDb().session.signedIn = false;
    saveDb();
    return HttpResponse.json({ message: 'Logged out' });
  }),

  // Mock-only dev tools.
  http.post('*/api/mock/persona', async ({ request }) => {
    const { persona } = (await request.json().catch(() => ({}))) as { persona?: PersonaId };
    if (!persona || !(persona in PERSONAS)) return HttpResponse.json({ message: 'Unknown persona' }, { status: 400 });
    getDb().session.persona = persona;
    saveDb();
    return HttpResponse.json({ message: 'Persona changed', persona });
  }),

  http.post('*/api/mock/reset', () => {
    resetDb();
    return HttpResponse.json({ message: 'Demo data reset' });
  }),
];
