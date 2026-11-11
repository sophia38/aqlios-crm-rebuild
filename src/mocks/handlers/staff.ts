import dayjs from 'dayjs';
import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import { passwordMeetsRule, SELF_STAFF_ID, STAFF_REASON_MAX } from '@/lib/api/staff';
import {
  PRACTICE_STAFF_TYPES,
  STAFF_INVITE_STATUSES,
  type PayrollDocumentType,
  type PracticeStaff,
  type PracticeStaffStatus,
  type PracticeStaffType,
  type StaffAction,
  type StaffDetail,
  type StaffDetailTab,
  type StaffDocument,
  type StaffInviteInput,
} from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import {
  defaultAccount,
  defaultCompetencies,
  defaultLeave,
  defaultPayroll,
  phoneFor,
  roleForStaffType,
  seedDocuments,
  staffTypeForRole,
  type StaffSeed,
} from '../fixtures/staff';
import { PERSONAS } from '../fixtures/users';
import { people as rotaPeople } from '../rotaState';
import { currentPersona, getDb, saveDb, visiblePractices } from '../store';
import { created, fail, forbidden, ok, order, paginate, unauthorized } from '../respond';

// Staff on-boarding mocks (docs/plans/phase-5-practice-modules.md §4). Only the list and bulk-import
// info URLs were captured.

const staffPath = (path = '') => `*${CRM_API}/public/v1/sub-apps/:subAppId/practices/:practiceId/staff/${path}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function guard(practiceId: string) {
  if (!getDb().session.signedIn) return unauthorized();
  if (!visiblePractices().some((practice) => practice.id === practiceId)) return forbidden();
  return null;
}

/** How the person first appeared (before any change in the demo). */
interface BaseRecord extends StaffSeed {
  /** Hasn't accepted the invite yet, so nothing is uploaded. */
  invitee: boolean;
}

const hashDays = (id: string) => {
  let value = 7;
  for (const char of id) value = (value * 31 + char.charCodeAt(0)) % 997;
  return 3 + (value % 200);
};

/** The practice-user persona is on the staff list of their practices (live: "Ali Emis - 201"). */
function personaRecord(personaId: keyof typeof PERSONAS, practiceId: string): BaseRecord {
  const persona = PERSONAS[personaId];
  const { roles } = getDb();
  const type: PracticeStaffType = persona.isAdmin ? 'Administrative' : 'GP';
  return {
    id: persona.userId,
    practice_id: practiceId,
    first_name: persona.firstName,
    last_name: persona.lastName,
    email: persona.email,
    phone: phoneFor(persona.userId),
    role_id: roleForStaffType(roles, type).id,
    staff_type: type,
    status: 'ACTIVE',
    invited_at: dayjs().subtract(200, 'day').toISOString(),
    invitee: false,
  };
}

function baseRecords(practiceId: string): BaseRecord[] {
  const db = getDb();
  const members: BaseRecord[] = db.staff
    .filter((member) => member.practice_ids.includes(practiceId))
    .map((member) => {
      const roleName = db.roles.find((role) => role.id === member.role_id)?.name ?? '';
      const status: PracticeStaffStatus =
        member.status === 'ACTIVE'
          ? 'ACTIVE'
          : member.status === 'PENDING_INVITE'
            ? 'PENDING_INVITE'
            : 'PENDING_PROFILE';
      return {
        id: member.id,
        practice_id: practiceId,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: phoneFor(member.id),
        role_id: member.role_id,
        staff_type: staffTypeForRole(roleName, member.id),
        status,
        invited_at: dayjs().subtract(hashDays(member.id), 'day').toISOString(),
        invitee: status === 'PENDING_INVITE',
      };
    });
  const seeds = db.staffSeeds
    .filter((seed) => seed.practice_id === practiceId)
    .map((seed) => ({ ...seed, invitee: STAFF_INVITE_STATUSES.includes(seed.status) }));
  const practiceIndex = db.practices.findIndex((practice) => practice.id === practiceId);
  const self = PERSONAS['practice-user'].practiceIndexes?.includes(practiceIndex)
    ? [personaRecord('practice-user', practiceId)]
    : [];
  return [...self, ...members, ...seeds];
}

function present(base: BaseRecord): PracticeStaff {
  const db = getDb();
  const change = db.staffChanges[base.id] ?? {};
  const account = db.staffProfiles[base.id]?.account;
  const groupIds = account?.rota_group_ids ?? defaultRotaGroups(base.id);
  return {
    id: base.id,
    practice_id: base.practice_id,
    practice_name: db.practices.find((practice) => practice.id === base.practice_id)?.practice_name ?? '',
    first_name: account?.first_name ?? base.first_name,
    last_name: account?.last_name ?? base.last_name,
    email: account?.email ?? base.email,
    phone: account?.phone ?? base.phone,
    role_id: base.role_id,
    role_name: db.roles.find((role) => role.id === base.role_id)?.name ?? '',
    staff_type: base.staff_type,
    status: change.status ?? base.status,
    invited_at: change.invited_at ?? base.invited_at,
    archived: change.archived ?? false,
    rota_group_names: db.rotaGroups.filter((group) => groupIds.includes(group.id)).map((group) => group.name),
  };
}

const defaultRotaGroups = (staffId: string) =>
  getDb()
    .rotaGroups.filter((group) => group.staff_ids.includes(staffId))
    .map((group) => group.id);

/** Documents as shown: the seed, saved changes, and anything whose expiry date has passed. */
export function documentsFor(staffId: string, invitee: boolean): StaffDocument[] {
  const saved = getDb().staffDocuments[staffId] ?? {};
  const today = dayjs().format('YYYY-MM-DD');
  return seedDocuments(staffId, invitee).map((seed) => {
    const document = saved[seed.key] ?? seed;
    return document.status === 'VERIFIED' && document.expiry_date && document.expiry_date < today
      ? { ...document, status: 'EXPIRED' as const }
      : document;
  });
}

function findRecord(practiceId: string, staffId: string) {
  const id = staffId === SELF_STAFF_ID ? currentPersona().userId : staffId;
  const found = baseRecords(practiceId).find((record) => record.id === id);
  if (found) return found;
  // Super-admins have a profile too, though they aren't on any practice's list.
  if (staffId === SELF_STAFF_ID) return personaRecord(currentPersona().id, practiceId);
  return null;
}

function detail(base: BaseRecord): StaffDetail {
  const db = getDb();
  const row = present(base);
  const saved = db.staffProfiles[base.id] ?? {};
  const complete = !base.invitee && base.status !== 'PENDING_PROFILE';
  return {
    ...row,
    is_self: base.id === currentPersona().userId,
    account: saved.account ?? {
      ...defaultAccount(base, complete),
      rota_group_ids: defaultRotaGroups(base.id),
    },
    leave: saved.leave ?? defaultLeave(),
    competencies: saved.competencies ?? defaultCompetencies(row.role_name, row.staff_type),
    payroll: saved.payroll ?? defaultPayroll(),
    documents: documentsFor(base.id, base.invitee),
  };
}

const actorName = () => {
  const persona = currentPersona();
  return `${persona.firstName} ${persona.lastName}`;
};

/** Which actions each status allows (Approve/Reject only for Pending Approval, as captured). */
function allowed(row: PracticeStaff, action: StaffAction) {
  switch (action) {
    case 'lock':
      return row.status === 'ACTIVE' && !row.archived;
    case 'unlock':
      return row.status === 'LOCKED' && !row.archived;
    case 'archive':
      return !row.archived;
    case 'unarchive':
      return row.archived;
    case 'approve':
    case 'reject':
      return row.status === 'PENDING_APPROVAL' && !row.archived;
    default:
      return STAFF_INVITE_STATUSES.includes(row.status) && !row.archived;
  }
}

function inviteProblems(input: Partial<StaffInviteInput>, practiceId: string) {
  const db = getDb();
  const email = String(input.email ?? '').trim();
  if (!email) return 'Email is required';
  if (!EMAIL.test(email)) return 'Enter a valid email';
  if (baseRecords(practiceId).some((record) => present(record).email.toLowerCase() === email.toLowerCase())) {
    return 'This email is already on the staff list';
  }
  if (!db.roles.some((role) => role.id === input.role_id)) return 'Role is required';
  if (!PRACTICE_STAFF_TYPES.includes(input.staff_type as PracticeStaffType)) return 'Staff Type is required';
  return null;
}

function addInvite(practiceId: string, input: StaffInviteInput): StaffSeed {
  const db = getDb();
  const seed: StaffSeed = {
    id: mockId(`practice-staff:${practiceId}:new`, Date.now() + db.staffSeeds.length),
    practice_id: practiceId,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    email: input.email.trim(),
    phone: '',
    role_id: input.role_id,
    staff_type: input.staff_type,
    status: 'PENDING_INVITE',
    invited_at: new Date().toISOString(),
  };
  db.staffSeeds.push(seed);
  return seed;
}

/** Someone who can take leave at a practice, with what the leave mocks need. */
export interface LeavePerson {
  id: string;
  name: string;
  role_id: string;
  role_name: string;
  availability: StaffDetail['account']['availability'];
  entitlement: StaffDetail['leave'];
}

/**
 * Who can take leave at a practice: its active staff, the people on its ROTA, and the super-admin
 * (live: "aqlios admin" has leave requests, though super-admins aren't on the staff list).
 */
export function leavePeople(practiceId: string): LeavePerson[] {
  const db = getDb();
  const seen = new Set<string>();
  const fromList = [...baseRecords(practiceId), personaRecord('super-admin', practiceId)]
    .filter((base) => !seen.has(base.id) && Boolean(seen.add(base.id)))
    .map((base) => ({ base, row: present(base) }))
    .filter(({ base, row }) => row.status === 'ACTIVE' && !row.archived && !base.invitee)
    .map(({ base, row }) => ({
      id: base.id,
      name: `${row.first_name} ${row.last_name}`.trim() || row.email,
      role_id: row.role_id,
      role_name: row.role_name,
      account: base,
    }));
  const fromRota = rotaPeople()
    .filter((person) => person.practice.id === practiceId && !seen.has(person.staff.id))
    .map(({ staff }) => ({
      id: staff.id,
      name: `${staff.first_name} ${staff.last_name}`,
      role_id: staff.role_id,
      role_name: db.roles.find((role) => role.id === staff.role_id)?.name ?? '',
      account: { ...staff, phone: phoneFor(staff.id) },
    }));
  return [...fromList, ...fromRota].map(({ account, ...person }) => {
    const saved = db.staffProfiles[person.id] ?? {};
    return {
      ...person,
      availability: saved.account?.availability ?? defaultAccount(account, true).availability,
      entitlement: saved.leave ?? defaultLeave(),
    };
  });
}

/** Staff counts for a practice (Staff summary, and the practice overview cards). */
export function staffSummaryFor(practiceId: string) {
  const rows = baseRecords(practiceId)
    .map(present)
    .filter((row) => !row.archived);
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === 'ACTIVE').length,
    pending_invitations: rows.filter((row) => STAFF_INVITE_STATUSES.includes(row.status)).length,
  };
}

export const staffHandlers = [
  http.get(staffPath(), ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const tab = query.get('tab') ?? 'staff';
    // The captured list call filters by `status`; Sent Invitations sends PENDING_INVITE for all invite statuses.
    const status = query.get('status');
    const type = query.get('staff_type');
    const search = query.get('search')?.trim().toLowerCase();
    const results = baseRecords(practiceId)
      .map(present)
      .filter((row) => (tab === 'archived' ? row.archived : !row.archived))
      .filter((row) => tab !== 'invitations' || STAFF_INVITE_STATUSES.includes(row.status))
      .filter((row) => !status || row.status === status)
      .filter((row) => !type || row.staff_type === type)
      .filter((row) => !search || `${row.first_name} ${row.last_name} ${row.email}`.toLowerCase().includes(search));
    return ok(paginate(request, order(request, results, '-invited_at')));
  }),

  http.get(staffPath('summary/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    return ok(staffSummaryFor(practiceId));
  }),

  http.get(staffPath('bulk-import/'), ({ params }) => {
    const denied = guard(String(params.practiceId));
    if (denied) return denied;
    return ok({
      template_name: 'aqlios_staff_import_template.xlsx',
      roles: getDb().roles.map((role) => role.name),
      staff_types: [...PRACTICE_STAFF_TYPES],
    });
  }),

  // The roles a practice can invite to (practice users can't read the vertical roles list).
  http.get(staffPath('roles/'), ({ params }) => {
    const denied = guard(String(params.practiceId));
    if (denied) return denied;
    return ok(getDb().roles.map((role) => ({ id: role.id, name: role.name })));
  }),

  http.post(staffPath('invite/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const input = (await request.json()) as Partial<StaffInviteInput>;
    const problem = inviteProblems(input, practiceId);
    if (problem) return fail(400, problem);
    const seed = addInvite(practiceId, input as StaffInviteInput);
    saveDb();
    return created(present({ ...seed, invitee: true }), 'Invitation sent successfully');
  }),

  http.post(staffPath('bulk-import/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const { rows } = (await request.json()) as { rows?: Record<string, string>[] };
    if (!Array.isArray(rows) || rows.length === 0) return fail(400, 'The file has no staff rows.');
    const db = getDb();
    const errors: { row: number; message: string }[] = [];
    let createdCount = 0;
    rows.forEach((row, index) => {
      const role = db.roles.find(
        (item) =>
          item.name.toLowerCase() ===
          String(row.role ?? '')
            .trim()
            .toLowerCase(),
      );
      const type = PRACTICE_STAFF_TYPES.find(
        (item) =>
          item.toLowerCase() ===
          String(row.staff_type ?? '')
            .trim()
            .toLowerCase(),
      );
      const input = {
        first_name: String(row.first_name ?? ''),
        last_name: String(row.last_name ?? ''),
        email: String(row.email ?? ''),
        role_id: role?.id ?? '',
        staff_type: type as PracticeStaffType,
      };
      const problem = inviteProblems(input, practiceId);
      // Row 1 is the header, so the first staff row is row 2 (as in the spreadsheet).
      if (problem) errors.push({ row: index + 2, message: problem });
      else {
        addInvite(practiceId, input);
        createdCount += 1;
      }
    });
    saveDb();
    return ok({ created: createdCount, errors });
  }),

  ...(['lock', 'unlock', 'archive', 'unarchive', 'approve', 'reject', 'resend-invite'] as const).map((action) =>
    http.post(staffPath(`:staffId/${action}/`), async ({ request, params }) => {
      const practiceId = String(params.practiceId);
      const denied = guard(practiceId);
      if (denied) return denied;
      const base = findRecord(practiceId, String(params.staffId));
      if (!base) return fail(404, 'Staff member not found');
      const row = present(base);
      if (!allowed(row, action)) return fail(400, 'This action is not available for this staff member.');
      if (base.id === currentPersona().userId && (action === 'lock' || action === 'archive')) {
        return fail(400, 'You cannot lock or archive your own account.');
      }
      const { reason } = (await request.json().catch(() => ({}))) as { reason?: string };
      if (String(reason ?? '').length > STAFF_REASON_MAX) {
        return fail(400, `Reason must be ${STAFF_REASON_MAX} characters or fewer`);
      }
      const db = getDb();
      const change = (db.staffChanges[base.id] ??= {});
      if (action === 'lock') change.status = 'LOCKED';
      if (action === 'unlock') change.status = 'ACTIVE';
      if (action === 'archive') change.archived = true;
      if (action === 'unarchive') change.archived = false;
      if (action === 'approve') change.status = 'ACTIVE';
      if (action === 'reject') change.status = 'REJECTED';
      if (action === 'resend-invite') {
        change.status = 'RESENT_INVITE';
        change.invited_at = new Date().toISOString();
      }
      saveDb();
      return ok(present(base));
    }),
  ),

  http.get(staffPath(':staffId/'), ({ params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const base = findRecord(practiceId, String(params.staffId));
    return base ? ok(detail(base)) : fail(404, 'Staff member not found');
  }),

  http.patch(staffPath(':staffId/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const base = findRecord(practiceId, String(params.staffId));
    if (!base) return fail(404, 'Staff member not found');
    const { tab, data } = (await request.json()) as { tab?: StaffDetailTab; data?: unknown };
    if (!tab || !['account', 'leave', 'competencies', 'payroll'].includes(tab) || !data) {
      return fail(400, 'Nothing to save');
    }
    const self = base.id === currentPersona().userId;
    // Live: leave entitlements and competency dates are read-only on your own profile.
    if (self && tab === 'leave') return fail(403, 'Your leave entitlement is set by your practice.');
    if (tab === 'account') {
      const account = data as StaffDetail['account'];
      if (!account.first_name?.trim() || !account.last_name?.trim())
        return fail(400, 'First and last name are required');
      if (!EMAIL.test(account.email ?? '')) return fail(400, 'Enter a valid email');
    }
    const db = getDb();
    (db.staffProfiles[base.id] ??= {})[tab] = data as never;
    // Completing a profile sends it for approval, as live (Pending Profile → Pending Approval).
    if (tab === 'account' && present(base).status === 'PENDING_PROFILE') {
      (db.staffChanges[base.id] ??= {}).status = 'PENDING_APPROVAL';
    }
    saveDb();
    return ok(detail(base), 'Staff details saved successfully');
  }),

  http.post(staffPath(':staffId/documents/:key/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const base = findRecord(practiceId, String(params.staffId));
    if (!base) return fail(404, 'Staff member not found');
    const current = documentsFor(base.id, base.invitee).find((item) => item.key === params.key);
    if (!current) return fail(404, 'Document not found');
    if (current.status === 'VERIFIED' && base.id === currentPersona().userId) {
      return fail(400, 'Verified documents can only be replaced by your practice.');
    }
    const input = (await request.json()) as { file_name?: string; issue_date?: string; expiry_date?: string };
    if (!input.file_name) return fail(400, 'Choose a file to upload');
    if (current.has_expiry && !input.expiry_date) return fail(400, 'Expiry Date is required');
    const document: StaffDocument = {
      ...current,
      file_name: input.file_name,
      added_at: new Date().toISOString(),
      issue_date: input.issue_date || null,
      expiry_date: current.has_expiry ? (input.expiry_date ?? null) : null,
      reverification_due: current.reverification ? dayjs().add(1, 'year').format('YYYY-MM-DD') : null,
      status: 'PENDING_VERIFICATION',
      rejection_reason: null,
    };
    (getDb().staffDocuments[base.id] ??= {})[document.key] = document;
    saveDb();
    return ok(document, 'Document uploaded successfully');
  }),

  ...(['verify', 'reject'] as const).map((action) =>
    http.post(staffPath(`:staffId/documents/:key/${action}/`), async ({ request, params }) => {
      const practiceId = String(params.practiceId);
      const denied = guard(practiceId);
      if (denied) return denied;
      const base = findRecord(practiceId, String(params.staffId));
      if (!base) return fail(404, 'Staff member not found');
      if (base.id === currentPersona().userId) return fail(403, 'You cannot verify your own documents.');
      const current = documentsFor(base.id, base.invitee).find((item) => item.key === params.key);
      if (!current) return fail(404, 'Document not found');
      if (current.status !== 'PENDING_VERIFICATION')
        return fail(400, 'Only documents awaiting verification can be checked.');
      const { reason } = (await request.json().catch(() => ({}))) as { reason?: string };
      const text = String(reason ?? '').trim();
      if (action === 'reject' && !text) return fail(400, 'Reason is required');
      if (text.length > STAFF_REASON_MAX) return fail(400, `Reason must be ${STAFF_REASON_MAX} characters or fewer`);
      const document: StaffDocument =
        action === 'verify'
          ? { ...current, status: 'VERIFIED' }
          : { ...current, status: 'REJECTED', rejection_reason: text };
      (getDb().staffDocuments[base.id] ??= {})[document.key] = document;
      saveDb();
      return ok(document);
    }),
  ),

  http.post(staffPath(':staffId/payroll-documents/:type/'), async ({ request, params }) => {
    const practiceId = String(params.practiceId);
    const denied = guard(practiceId);
    if (denied) return denied;
    const base = findRecord(practiceId, String(params.staffId));
    if (!base) return fail(404, 'Staff member not found');
    const { file_name: name } = (await request.json()) as { file_name?: string };
    if (!name) return fail(400, 'Choose a file to upload');
    const current = detail(base);
    const type = params.type as PayrollDocumentType;
    if (!current.payroll.documents.some((item) => item.type === type)) return fail(404, 'Document not found');
    const payroll = {
      ...current.payroll,
      documents: current.payroll.documents.map((item) =>
        item.type === type
          ? {
              ...item,
              file_name: name,
              added_at: new Date().toISOString(),
              added_by: actorName(),
              status: 'PENDING_VERIFICATION' as const,
            }
          : item,
      ),
    };
    (getDb().staffProfiles[base.id] ??= {}).payroll = payroll;
    saveDb();
    return ok(detail(base), 'Document uploaded successfully');
  }),

  http.post(`*${CRM_API}/users/v1/me/password/`, async ({ request }) => {
    if (!getDb().session.signedIn) return unauthorized();
    const { current_password: current, new_password: next } = (await request.json()) as {
      current_password?: string;
      new_password?: string;
    };
    // Demo only: the sign-in password stays "demo", so nothing is stored.
    if (current !== 'demo') {
      return fail(400, 'Current password is incorrect', [
        { field: 'current_password', message: 'Current password is incorrect' },
      ]);
    }
    if (!next || !passwordMeetsRule(next)) return fail(400, 'The new password does not meet the rules.');
    if (next === current) return fail(400, 'Choose a password you have not used before.');
    return ok({ updated: true }, 'Password updated successfully');
  }),
];
