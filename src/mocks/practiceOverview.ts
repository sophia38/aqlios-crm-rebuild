import dayjs from 'dayjs';
import type { Practice, PracticeOverview, PracticeStage, RotaGap, Shift } from '@/lib/api/types';
import { staffSummaryFor } from './handlers/staff';
import { mondayOf, weekWithChanges } from './rotaState';
import { getDb } from './store';

// Practice overview (practices grid cards): not seen live, so worked out from the demo's own data.
// Coverage = this week's shifts out of shifts plus open slots (leave and published gaps; bank holidays
// don't count). Onboarding = profile or configuration unfinished, or no rota yet this week;
// Review = rota under half covered; Live = everything else.

const REVIEW_BELOW = 50;

/** One week of rota for every practice, shared by all overviews built in the same request. */
export function weekByPractice(weekStart = mondayOf(dayjs().format('YYYY-MM-DD'))) {
  const { shifts, gaps } = weekWithChanges(weekStart);
  const byPractice = new Map<string, { shifts: Shift[]; gaps: RotaGap[] }>();
  const entry = (id: string) => {
    if (!byPractice.has(id)) byPractice.set(id, { shifts: [], gaps: [] });
    return byPractice.get(id)!;
  };
  shifts.forEach((shift) => entry(shift.practice_id).shifts.push(shift));
  gaps
    .filter((gap) => gap.kind !== 'holiday' && gap.practice_id)
    .forEach((gap) => entry(gap.practice_id!).gaps.push(gap));
  return byPractice;
}

export function coverageOf(week: { shifts: Shift[]; gaps: RotaGap[] } | undefined) {
  const covered = week?.shifts.length ?? 0;
  const total = covered + (week?.gaps.length ?? 0);
  return { covered, total, percent: total ? Math.round((covered / total) * 100) : null };
}

export function practiceOverviews(practices: Practice[]): PracticeOverview[] {
  const week = weekByPractice();
  const { rotaGroups } = getDb();
  return practices.map((practice) => {
    const coverage = coverageOf(week.get(practice.id)).percent;
    const stage: PracticeStage =
      practice.status === 'INCOMPLETE' || coverage === null
        ? 'ONBOARDING'
        : coverage < REVIEW_BELOW
          ? 'REVIEW'
          : 'LIVE';
    return {
      ...practice,
      stage,
      staff_count: staffSummaryFor(practice.id).total,
      rota_count: rotaGroups.filter((group) => group.practice_ids.includes(practice.id)).length,
      rota_coverage: coverage,
    };
  });
}
