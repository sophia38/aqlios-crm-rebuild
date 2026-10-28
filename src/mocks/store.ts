import type {
  AppointmentConfiguration,
  Permission,
  Practice,
  PracticeManager,
  PublicPractice,
  Role,
  RotaGroup,
  SlaConfiguration,
} from '@/lib/api/types';
import {
  buildAppointmentConfiguration,
  buildOdsDirectory,
  buildPracticeManagers,
  buildRotaGroups,
  buildSlaConfiguration,
  emptyAppointmentConfiguration,
} from './fixtures/lookups';
import { buildPractices, isUnconfiguredFixture } from './fixtures/practices';
import { buildPermissionCatalog, defaultRolePermissions } from './fixtures/permissions';
import { buildRoles, buildStaff, PERSONAS, type PersonaId, type StaffMember } from './fixtures/users';

// In-browser mock database. Each visitor has their own copy in localStorage; "Reset demo data" restores the fixtures.
// Bump the key when the shape changes so old copies are replaced instead of breaking.
const STORAGE_KEY = 'aqlios-mock-db-v3';

export interface MockDb {
  session: { signedIn: boolean; persona: PersonaId };
  practices: Practice[];
  roles: Role[];
  permissions: Permission[];
  /** Role id → granted permission ids. */
  rolePermissions: Record<string, string[]>;
  staff: StaffMember[];
  practiceManagers: PracticeManager[];
  odsDirectory: PublicPractice[];
  rotaGroups: RotaGroup[];
  appointmentConfigs: Record<string, AppointmentConfiguration>;
  slaConfigs: Record<string, SlaConfiguration>;
}

function seed(): MockDb {
  const practices = buildPractices();
  const roles = buildRoles();
  const clinician = roles.find((role) => role.name === 'Clinician') ?? roles[0];
  const permissions = buildPermissionCatalog();
  return {
    session: { signedIn: false, persona: 'super-admin' },
    practices,
    roles,
    permissions,
    rolePermissions: Object.fromEntries(roles.map((role) => [role.id, defaultRolePermissions(role.name, permissions)])),
    staff: buildStaff(
      roles,
      practices.map((practice) => practice.id),
    ),
    practiceManagers: buildPracticeManagers(),
    odsDirectory: buildOdsDirectory(),
    rotaGroups: buildRotaGroups(),
    appointmentConfigs: Object.fromEntries(
      practices.map((practice, index) => [
        practice.id,
        isUnconfiguredFixture(index) ? emptyAppointmentConfiguration() : buildAppointmentConfiguration(clinician.id),
      ]),
    ),
    slaConfigs: Object.fromEntries(practices.map((practice) => [practice.id, buildSlaConfiguration()])),
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

/**
 * "Incomplete" (inferred rule, phase 3 plan): required details missing, or the Additional
 * Configuration not done (no default appointment type, no slot duration, no succession date).
 */
export function practiceStatus(practice: Practice): 'ACTIVE' | 'INCOMPLETE' {
  const config = getDb().appointmentConfigs[practice.id];
  const configured =
    Boolean(config?.appointment_types.some((type) => type.enabled && type.is_default)) &&
    Boolean(config?.slot_durations.length) &&
    Boolean(practice.succession_start_date);
  const detailsComplete = Boolean(practice.pcn_name && practice.phone_number && practice.address_line_1);
  return configured && detailsComplete ? 'ACTIVE' : 'INCOMPLETE';
}

/** Practices the signed-in persona may see (super-admin: all; practice user: their own), with live status. */
export function visiblePractices(): Practice[] {
  const { practices } = getDb();
  const indexes = currentPersona().practiceIndexes;
  const visible = indexes === null ? practices : indexes.map((index) => practices[index]).filter(Boolean);
  return visible.map((practice) => ({ ...practice, status: practiceStatus(practice) }));
}

/** Roles with their user count worked out from the staff, so reassigning and deleting stay consistent. */
export function rolesWithCounts(): Role[] {
  const { roles, staff } = getDb();
  return roles.map((role) => ({
    ...role,
    assigned_users_count: staff.filter((member) => member.role_id === role.id).length,
  }));
}
