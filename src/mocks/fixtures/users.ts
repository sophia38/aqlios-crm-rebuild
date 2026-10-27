import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { Role } from '@/lib/api/types';
import { isoDaysAgo, mockId } from './random';

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
