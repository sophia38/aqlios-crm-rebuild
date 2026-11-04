import { practiceSlug } from '@/lib/api/practiceManagement';
import { PRACTICE_STAFF_TYPES } from '@/lib/api/types';
import { buildPractices } from '@/mocks/fixtures/practices';
import { buildStaffSeeds } from '@/mocks/fixtures/staff';
import { buildRoles, buildStaff, PERSONAS } from '@/mocks/fixtures/users';

/** Practices without seeded staff still need one pre-built page (static export rejects empty lists). */
const NO_STAFF_ID = 'none';

/**
 * The seeded staff of the 3 demo practices are pre-built so their URLs match the live app. Anyone
 * else (other practices, new invites) is rendered by the static host's not-found page.
 */
export function staffStaticParams({ params }: { params: { practiceSlug: string } }) {
  const practices = buildPractices();
  const index = practices.findIndex((item) => practiceSlug(item.practice_name) === params.practiceSlug);
  const practice = practices[index];
  if (!practice || index > 2) return [{ staffId: NO_STAFF_ID }];
  const roles = buildRoles();
  const members = buildStaff(
    roles,
    practices.map((item) => item.id),
  ).filter((member) => member.practice_ids.includes(practice.id));
  const seeds = buildStaffSeeds(practices, roles, PRACTICE_STAFF_TYPES).filter(
    (seed) => seed.practice_id === practice.id,
  );
  const self = PERSONAS['practice-user'].practiceIndexes?.includes(index) ? [PERSONAS['practice-user'].userId] : [];
  return [...self, ...members.map((member) => member.id), ...seeds.map((seed) => seed.id)].map((staffId) => ({
    staffId,
  }));
}
