import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import type { ComplianceRowApi, ComplianceStatus, ComplianceSummary } from '@/lib/api/types';
import { isoDaysAgo } from '../fixtures/random';
import { currentPersona, getDb } from '../store';
import { forbidden, ok, paginate, unauthorized } from '../respond';

// CQC Compliance mock (docs/plans/phase-4-vertical-modules.md §5). The URL is from the live page's code;
// the response shape is inferred. Rows are worked out from the staff, so nothing is stored.

const STATUSES: [ComplianceStatus, number][] = [
  ['ACTIVE', 45],
  ['PENDING_UPLOAD', 20],
  ['PENDING_VERIFICATION', 15],
  ['REVERIFICATION_DUE', 8],
  ['EXPIRED', 8],
  ['REJECTED', 4],
];

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

function statusFor(staffId: string): ComplianceStatus {
  let roll = hash(`compliance:${staffId}`) % 100;
  for (const [status, share] of STATUSES) {
    if (roll < share) return status;
    roll -= share;
  }
  return 'ACTIVE';
}

function rows(): ComplianceRowApi[] {
  const { staff, roles, practices } = getDb();
  return staff.map((member) => {
    const status = statusFor(member.id);
    const roll = hash(`updated:${member.id}`);
    const practice = practices.find((item) => item.id === member.practice_ids[0]);
    return {
      id: `compliance-${member.id}`,
      user_id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      role_name: roles.find((role) => role.id === member.role_id)?.name ?? '',
      practice_id: practice?.id ?? '',
      practice_name: practice?.practice_name ?? '',
      complaince_status: status,
      waiting_since: status === 'ACTIVE' ? null : isoDaysAgo(3 + (roll % 40)),
      last_updated: isoDaysAgo(roll % 30),
    };
  });
}

export const complianceHandlers = [
  http.get(`*${CRM_API}/public/v1/sub-apps/:subAppId/staff/dashboard/`, ({ request }) => {
    if (!getDb().session.signedIn) return unauthorized();
    if (!currentPersona().isAdmin) return forbidden();
    const query = new URL(request.url).searchParams;
    const search = query.get('search')?.trim().toLowerCase();
    const practiceId = query.get('practice_id');
    const status = query.get('verification_status');
    // Counts follow the practice filter but not the status filter or search.
    const scoped = rows().filter((row) => !practiceId || row.practice_id === practiceId);
    const count = (value: ComplianceStatus) => scoped.filter((row) => row.complaince_status === value).length;
    const summary: ComplianceSummary = {
      total_staff: scoped.length,
      compliant: count('ACTIVE'),
      pending_upload: count('PENDING_UPLOAD'),
      awaiting_verification: count('PENDING_VERIFICATION'),
      reverification_due: count('REVERIFICATION_DUE'),
      expired: count('EXPIRED'),
      rejected: count('REJECTED'),
    };
    const results = scoped
      .filter((row) => !status || row.complaince_status === status)
      .filter(
        (row) =>
          !search || `${row.first_name} ${row.last_name} ${row.email} ${row.role_name}`.toLowerCase().includes(search),
      )
      .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
    return ok({ ...paginate(request, results), summary });
  }),
];
