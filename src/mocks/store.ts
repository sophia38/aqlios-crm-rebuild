import type { Practice, Role } from '@/lib/api/types';
import { buildPractices } from './fixtures/practices';
import { buildRoles, PERSONAS, type PersonaId } from './fixtures/users';

// In-browser mock database. Each visitor has their own copy in localStorage; "Reset demo data" restores the fixtures.
const STORAGE_KEY = 'aqlios-mock-db-v1';

export interface MockDb {
  session: { signedIn: boolean; persona: PersonaId };
  practices: Practice[];
  roles: Role[];
}

function seed(): MockDb {
  return {
    session: { signedIn: false, persona: 'super-admin' },
    practices: buildPractices(),
    roles: buildRoles(),
  };
}

let db: MockDb | null = null;

function load(): MockDb {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    // Storage blocked or corrupt: fall back to fresh fixtures.
  }
  return seed();
}

export function getDb(): MockDb {
  db ??= load();
  return db;
}

export function saveDb() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(getDb()));
  } catch {
    // Storage unavailable (private mode): changes last until the page is reloaded.
  }
}

export function resetDb() {
  const { session } = getDb();
  db = { ...seed(), session };
  saveDb();
}

export function currentPersona() {
  return PERSONAS[getDb().session.persona];
}

/** Practices the signed-in persona may see (super-admin: all; practice user: their own). */
export function visiblePractices(): Practice[] {
  const { practices } = getDb();
  const indexes = currentPersona().practiceIndexes;
  return indexes === null ? practices : indexes.map((index) => practices[index]).filter(Boolean);
}
