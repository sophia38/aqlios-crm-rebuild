import type { CqcAreaSummary, CqcCheck, CqcRating, CqcStatus, CqcSurveyMeasure } from '@/lib/api/cqc';

// The predicted rating rules, taken from the BA workbook's Dashboard formulas and its "Rating Guidance"
// tab. It is a management warning system, not a CQC scoring engine. Keep every threshold here.

export const GOOD_READINESS = 0.85;
export const OUTSTANDING_READINESS = 0.95;
export const INADEQUATE_READINESS = 0.5;
/** Overall Outstanding-ready needs this many areas that are Outstanding-ready themselves. */
export const OUTSTANDING_AREAS_NEEDED = 4;

/** Counts as done: Complete, Outstanding evidence, or a documented and approved Not applicable. */
const DONE: CqcStatus[] = ['COMPLETE', 'OUTSTANDING', 'NOT_APPLICABLE'];
const OPEN_GAP: CqcStatus[] = ['GAP', 'IN_PROGRESS'];

type Counts = Pick<CqcAreaSummary, 'total' | 'complete' | 'gaps' | 'not_checked' | 'high_risk'>;

/** Where a check's status puts it: an unresolved Immediate or High risk overrides everything else. */
export function isUnresolvedHighRisk(check: Pick<CqcCheck, 'status' | 'risk'>) {
  return !DONE.includes(check.status) && (check.risk === 'HIGH' || check.risk === 'IMMEDIATE');
}

export function countChecks(checks: Pick<CqcCheck, 'status' | 'risk'>[]): Counts {
  return {
    total: checks.length,
    complete: checks.filter((check) => DONE.includes(check.status)).length,
    gaps: checks.filter((check) => OPEN_GAP.includes(check.status)).length,
    not_checked: checks.filter((check) => check.status === 'NOT_CHECKED').length,
    high_risk: checks.filter(isUnresolvedHighRisk).length,
  };
}

const readinessOf = (counts: Pick<Counts, 'total' | 'complete'>) => (counts.total ? counts.complete / counts.total : 0);

/** One checklist area. `outstandingEvidence` is how many of its checks have Outstanding evidence. */
export function rateArea(counts: Counts, outstandingEvidence: number): CqcRating {
  const readiness = readinessOf(counts);
  if (counts.high_risk > 0) return 'Inadequate risk';
  if (readiness < INADEQUATE_READINESS) return 'Inadequate readiness';
  if (counts.gaps > 0 || readiness < GOOD_READINESS) return 'Requires improvement';
  const evidenceNeeded = Math.max(1, Math.round(counts.total * 0.1));
  return readiness >= OUTSTANDING_READINESS && counts.gaps === 0 && outstandingEvidence >= evidenceNeeded
    ? 'Outstanding-ready'
    : 'Good-ready';
}

export function summariseChecks(checks: Pick<CqcCheck, 'status' | 'risk'>[]) {
  const counts = countChecks(checks);
  const outstanding = checks.filter((check) => check.status === 'OUTSTANDING').length;
  return { ...counts, readiness: readinessOf(counts), rating: rateArea(counts, outstanding) };
}

/**
 * Overall rating: the same ladder over all areas together, with Outstanding-ready needing at least
 * four areas that are Outstanding-ready.
 */
export function rateOverall(counts: Counts, areaRatings: CqcRating[]): CqcRating {
  const readiness = readinessOf(counts);
  if (counts.high_risk > 0) return 'Inadequate risk';
  if (readiness < INADEQUATE_READINESS) return 'Inadequate readiness';
  if (counts.gaps > 0 || readiness < GOOD_READINESS) return 'Requires improvement';
  const outstandingAreas = areaRatings.filter((rating) => rating === 'Outstanding-ready').length;
  return readiness >= OUTSTANDING_READINESS && outstandingAreas >= OUTSTANDING_AREAS_NEEDED
    ? 'Outstanding-ready'
    : 'Good-ready';
}

// National GP Patient Survey: difference to the national result becomes a 1 to 4 score.

/** Positive is better, whichever way the measure runs. */
export function surveyDifference(
  direction: CqcSurveyMeasure['direction'],
  practice: number | null,
  national: number | null,
) {
  if (practice === null || national === null) return null;
  return round1(direction === 'HIGHER' ? practice - national : national - practice);
}

/** +5pp or better = 4; within -3pp = 3; -3 to -10pp = 2; below -10pp = 1. */
export function surveyScore(difference: number | null): CqcSurveyMeasure['score'] {
  if (difference === null) return null;
  if (difference >= 5) return 4;
  if (difference >= -3) return 3;
  if (difference >= -10) return 2;
  return 1;
}

export function surveyMeasureRating(score: CqcSurveyMeasure['score']): CqcRating {
  switch (score) {
    case 4:
      return 'Outstanding-ready';
    case 3:
      return 'Good-ready';
    case 2:
      return 'Requires improvement';
    case 1:
      return 'Inadequate readiness';
    default:
      return 'Not rated';
  }
}

/** The survey's overall rating comes from the average score, not from percentage complete. */
export function rateSurvey(scores: number[]): CqcRating {
  if (!scores.length) return 'Not rated';
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  if (average < 1.5) return 'Inadequate readiness';
  if (average < 2.5) return 'Requires improvement';
  if (average < 3.5) return 'Good-ready';
  return 'Outstanding-ready';
}

export const round1 = (value: number) => Math.round(value * 10) / 10;

export const formatPercent = (readiness: number) => `${Math.round(readiness * 100)}%`;
