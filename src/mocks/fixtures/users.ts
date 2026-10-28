import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { Role, StaffStatus } from '@/lib/api/types';
import { createRandom, isoDaysAgo, mockId } from './random';

export type PersonaId = 'super-admin' | 'practice-user';

export interface Persona {
  id: PersonaId;
  label: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  /** `role` exactly as /api/auth/me returns it: "super-admin" for admins, empty for practice users. */
  role: string;
  /** Indexes into the practices fixture; `null` means every practice. */
  practiceIndexes: number[] | null;
  dateOfBirth: string;
}

// Fictional people. "Aqlios Admin" is the product's own admin account label, not a person.
export const PERSONAS: Record<PersonaId, Persona> = {
  'super-admin': {
    id: 'super-admin',
    label: 'Super-admin (Vertical Admin)',
    userId: mockId('user', 0),
    email: 'admin@aqlios.demo',
    firstName: 'Aqlios',
    lastName: 'Admin',
    isAdmin: true,
    role: 'super-admin',
    practiceIndexes: null,
    dateOfBirth: '1988-03-14',
  },
  'practice-user': {
    id: 'practice-user',
    label: 'Practice user (GP)',
    userId: mockId('user', 1),
    email: 'sam.patel@aqlios.demo',
    firstName: 'Sam',
    lastName: 'Patel',
    isAdmin: false,
    role: '',
    practiceIndexes: [0, 1],
    dateOfBirth: '1991-07-02',
  },
};

export const SUB_APPS = [
  {
    id: PUBLIC_SUB_APP_ID,
    name: 'Public Primary Care',
    slug: 'public',
    description: 'NHS GP practices',
    is_active: true,
    logo_url: null,
    redirect_url: null,
  },
  {
    id: mockId('sub-app', 1),
    name: 'Private Business',
    slug: 'private',
    description: 'Private clinics',
    is_active: true,
    logo_url: null,
    redirect_url: null,
  },
];

export function buildRoles(): Role[] {
  const rows: [string, string, number, number, number][] = [
    ['HR', 'Human resources staff', 1, 39, 0],
    ['Care navigator', 'Front desk and patient routing', 1, 43, 0],
    ['Nurse', 'Practice nurses', 2, 61, 0],
    ['Practice Manager', 'Runs day-to-day operations of a practice', 49, 61, 0],
    ['Clinician', 'GPs and other clinicians', 45, 162, 61],
  ];
  return rows.map(([name, description, users, createdDaysAgo, updatedDaysAgo], index) => ({
    id: mockId('role', index),
    name,
    description,
    assigned_users_count: users,
    created_at: isoDaysAgo(createdDaysAgo),
    updated_at: isoDaysAgo(updatedDaysAgo),
  }));
}

/** A staff member in the mock database (the users behind `roles/{roleId}/users`). */
export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  practice_ids: string[];
  status: StaffStatus;
}

const STAFF_FIRST = [
  'Aisha',
  'Callum',
  'Dev',
  'Erin',
  'Femi',
  'Georgia',
  'Harvey',
  'Imogen',
  'Jamal',
  'Keira',
  'Lewis',
  'Megan',
  'Nadia',
  'Owen',
  'Poppy',
  'Rohan',
  'Sian',
  'Theo',
  'Usha',
  'Wes',
  'Yasmin',
  'Zac',
] as const;
const STAFF_LAST = [
  'Ahmed',
  'Brook',
  'Chowdhury',
  'Dixon',
  'Edwards',
  'Fraser',
  'Grant',
  'Hussain',
  'Ingram',
  'Kerr',
  'Lloyd',
  'Mensah',
  'Nolan',
  'Parry',
  'Rahman',
  'Stone',
  'Turner',
  'Vaughan',
  'Webb',
  'Young',
] as const;

/** Assigned-user counts as captured: HR 1, Care navigator 1, Nurse 2, Practice Manager 49, Clinician 45. */
export function buildStaff(roles: Role[], practiceIds: string[]): StaffMember[] {
  const random = createRandom(4242);
  const staff: StaffMember[] = [];
  for (const role of roles) {
    for (let n = 0; n < role.assigned_users_count; n += 1) {
      const index = staff.length;
      const first = STAFF_FIRST[index % STAFF_FIRST.length];
      const last = STAFF_LAST[(index * 7) % STAFF_LAST.length];
      const practiceCount = random.int(1, 3);
      const practices = new Set<string>();
      while (practices.size < practiceCount) practices.add(practiceIds[random.int(0, 39)]);
      const roll = random.next();
      staff.push({
        id: mockId('staff', index),
        first_name: first,
        last_name: last,
        email: `${first}.${last}${index}`.toLowerCase() + '@nhs.demo',
        role_id: role.id,
        practice_ids: [...practices],
        status: roll < 0.7 ? 'ACTIVE' : roll < 0.9 ? 'PENDING_INVITE' : null,
      });
    }
  }
  return staff;
}
