import dayjs from 'dayjs';
import {
  CQC_CHECK_AREAS,
  CQC_SUMMARY_AREA_LABELS,
  type CqcAction,
  type CqcAlert,
  type CqcAreaKey,
  type CqcAreaSummary,
  type CqcCheck,
  type CqcCheckEdit,
  type CqcRisk,
  type CqcSummary,
  type CqcSurveyEdit,
  type CqcSurveyMeasure,
} from '@/lib/api/cqc';
import {
  rateOverall,
  rateSurvey,
  summariseChecks,
  surveyDifference,
  surveyMeasureRating,
  surveyScore,
  round1,
} from '@/features/cqc/rating';
import { CQC_CHECK_SEEDS, CQC_SURVEY_SEEDS } from './fixtures/cqc';
import { getDb, saveDb } from './store';

// CQC Compliance mock state (docs/plans/phase-6-cqc-compliance.md). Every practice gets its own tracker,
// seeded the first time it is read from the BA workbook's checks. Only the editable fields are stored
// (the requirement text comes from the fixture), so a practice costs about 50KB of localStorage.

export type StoredCheck = CqcCheckEdit & { action_id: string | null };

export interface CqcRecord {
  checks: Record<string, StoredCheck>;
  survey: Record<string, CqcSurveyEdit>;
  alerts: CqcAlert[];
  actions: CqcAction[];
}

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

/** A stable number in [0, 1) for a practice and a key. */
const roll = (key: string) => hash(key) / 4294967296;
const today = () => dayjs().format('YYYY-MM-DD');
const inDays = (days: number) => dayjs().add(days, 'day').format('YYYY-MM-DD');

const OWNERS: Record<CqcAreaKey, string[]> = {
  'inspection-checklist': ['Practice Manager', 'Lead GP', 'Nurse Lead'],
  'estates-statutory': ['Practice Manager', 'Health & Safety Lead'],
  'clinical-searches': ['Lead GP', 'Practice Pharmacist'],
  'cas-alerts': ['Lead GP', 'Practice Pharmacist'],
  'surgery-audits': ['Lead GP', 'Nurse Lead', 'Practice Manager'],
  'risk-assessments': ['Practice Manager', 'Health & Safety Lead'],
  policies: ['Practice Manager', 'HR Lead', 'Lead GP'],
};

const GAP_TEXT = {
  GAP: 'Evidence was not available at the last review. Assign an owner and close the gap.',
  IN_PROGRESS: 'Actions are agreed and under way. Verify completion and check the effect.',
} as const;

function seedChecks(practiceId: string, actions: CqcAction[]) {
  // About one practice in five is "tidy": nothing open and most checks complete.
  const tidy = hash(`tidy:${practiceId}`) % 5 === 0;
  const maturity = 0.3 + (hash(`maturity:${practiceId}`) % 65) / 100;
  const lowRisk = tidy || maturity > 0.8;
  const checks: Record<string, StoredCheck> = {};

  for (const seed of CQC_CHECK_SEEDS) {
    const key = `${practiceId}:${seed.id}`;
    const owner = OWNERS[seed.area][hash(`owner:${key}`) % OWNERS[seed.area].length];
    const r = roll(`status:${key}`);
    const blank: StoredCheck = {
      status: 'NOT_CHECKED',
      risk: null,
      evidence: '',
      due_date: null,
      completed_date: null,
      gap_action: '',
      owner: '',
      notes: '',
      action_id: null,
    };

    if (tidy ? r < 0.88 : r < maturity * 0.85) {
      const outstanding = !tidy && maturity > 0.7 && seed.group === 'Outstanding';
      checks[seed.id] = {
        ...blank,
        status: outstanding ? 'OUTSTANDING' : 'COMPLETE',
        risk: 'NONE',
        evidence: `Compliance folder / ${seed.id}`,
        completed_date: inDays(-(10 + Math.floor(roll(`done:${key}`) * 200))),
        owner,
      };
    } else if (tidy ? r < 0.92 : r < maturity * 0.85 + 0.03) {
      checks[seed.id] = {
        ...blank,
        status: 'NOT_APPLICABLE',
        risk: 'NONE',
        owner,
        notes: 'Service not provided at this site. Approved by the Practice Manager.',
      };
    } else {
      const r2 = roll(`open:${key}`);
      if (tidy || r2 >= 0.55) {
        checks[seed.id] = blank;
        continue;
      }
      const status = r2 < 0.3 ? 'GAP' : 'IN_PROGRESS';
      const r3 = roll(`risk:${key}`);
      const risk: CqcRisk = lowRisk
        ? r3 < 0.5
          ? 'MEDIUM'
          : 'LOW'
        : r3 < 0.02
          ? 'IMMEDIATE'
          : r3 < 0.1
            ? 'HIGH'
            : r3 < 0.6
              ? 'MEDIUM'
              : 'LOW';
      const due = inDays(Math.floor(roll(`due:${key}`) * 55) - 12);
      const id = `ACT-${String(actions.length + 1).padStart(3, '0')}`;
      actions.push({
        id,
        source_area: seed.area,
        source_check_id: seed.id,
        priority: risk,
        gap: seed.requirement,
        required_action: GAP_TEXT[status],
        owner,
        opened_date: inDays(-(5 + Math.floor(roll(`opened:${key}`) * 60))),
        due_date: due,
        status: status === 'GAP' ? 'OPEN' : 'IN_PROGRESS',
        completion_evidence: '',
        effectiveness_check: '',
        closed_date: null,
      });
      checks[seed.id] = { ...blank, status, risk, due_date: due, gap_action: GAP_TEXT[status], owner, action_id: id };
    }
  }
  return checks;
}

function seedSurvey(practiceId: string) {
  const survey: Record<string, CqcSurveyEdit> = {};
  const maturity = 0.3 + (hash(`maturity:${practiceId}`) % 65) / 100;
  CQC_SURVEY_SEEDS.forEach((seed, index) => {
    const national = 52 + (hash(`national:${seed.id}`) % 38);
    // Practices with weaker readiness sit further below the national result; a few measures are left empty.
    const skew = Math.round((maturity - 0.55) * 30 + (roll(`practice:${practiceId}:${seed.id}`) - 0.5) * 14);
    const entered = index < 12 || maturity > 0.6;
    const practice = Math.min(99, Math.max(10, national + (seed.direction === 'HIGHER' ? skew : -skew)));
    survey[seed.id] = {
      practice_result: entered ? practice : null,
      national_result: national,
      previous_result: entered
        ? Math.min(99, Math.max(10, practice + Math.round((roll(`prev:${practiceId}:${seed.id}`) - 0.5) * 10)))
        : null,
      action: '',
      owner: entered ? 'Practice Manager' : '',
    };
  });
  return survey;
}

function seedAlerts(): CqcAlert[] {
  const base = { closure_evidence: '', closed_date: null, notes: '' };
  return [
    {
      ...base,
      id: 'alert-1',
      reference: 'ALERT-001',
      title: 'Sample alert: medicines supply disruption',
      received_date: inDays(-40),
      applicable: 'YES',
      clinical_owner: 'Lead GP',
      action_deadline: inDays(-20),
      patients_affected: 14,
      action_status: 'COMPLETE',
      closure_evidence: 'Search run and every patient reviewed. Summary filed.',
      closed_date: inDays(-22),
      sign_off: 'SIGNED_OFF',
    },
    {
      ...base,
      id: 'alert-2',
      reference: 'ALERT-002',
      title: 'Sample alert: device safety notice',
      received_date: inDays(-12),
      applicable: 'UNDER_REVIEW',
      clinical_owner: 'Practice Manager',
      action_deadline: inDays(9),
      patients_affected: null,
      action_status: 'NOT_STARTED',
      sign_off: 'NOT_CHECKED',
    },
  ];
}

function seedPractice(practiceId: string): CqcRecord {
  const actions: CqcAction[] = [];
  const checks = seedChecks(practiceId, actions);
  return { checks, survey: seedSurvey(practiceId), alerts: seedAlerts(), actions };
}

export function cqcRecord(practiceId: string): CqcRecord {
  const db = getDb();
  if (!db.cqc[practiceId]) {
    db.cqc[practiceId] = seedPractice(practiceId);
    saveDb();
  }
  return db.cqc[practiceId];
}

export function presentChecks(practiceId: string, area?: CqcAreaKey): CqcCheck[] {
  const { checks } = cqcRecord(practiceId);
  return CQC_CHECK_SEEDS.filter((seed) => !area || seed.area === area).map((seed) => ({
    ...seed,
    ...checks[seed.id],
  }));
}

export function presentSurvey(practiceId: string): CqcSurveyMeasure[] {
  const { survey } = cqcRecord(practiceId);
  return CQC_SURVEY_SEEDS.map((seed) => {
    const stored = survey[seed.id];
    const difference = surveyDifference(seed.direction, stored.practice_result, stored.national_result);
    const score = surveyScore(difference);
    const change = surveyDifference(seed.direction, stored.practice_result, stored.previous_result);
    return {
      id: seed.id,
      measure: seed.measure,
      direction: seed.direction,
      ...stored,
      difference,
      score,
      rating: surveyMeasureRating(score),
      change,
    };
  });
}

export function surveySummary(practiceId: string) {
  const measures = presentSurvey(practiceId);
  const scores = measures.flatMap((measure) => (measure.score === null ? [] : [measure.score]));
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  return {
    entered: scores.length,
    total: measures.length,
    average_score: round1(average),
    readiness: average / 4,
    rating: rateSurvey(scores),
    scores,
  };
}

export function summaryFor(practiceId: string): CqcSummary {
  const areas: CqcAreaSummary[] = CQC_CHECK_AREAS.map(({ key }) => ({
    area: key,
    label: CQC_SUMMARY_AREA_LABELS[key],
    ...summariseChecks(presentChecks(practiceId, key)),
  }));
  const survey = surveySummary(practiceId);
  // The workbook counts a survey measure as "complete" once it has a result; scoring below 3 is a gap.
  areas.push({
    area: 'national-patient-survey',
    label: CQC_SUMMARY_AREA_LABELS['national-patient-survey'],
    total: survey.total,
    complete: survey.entered,
    gaps: survey.scores.filter((score) => score < 3).length,
    not_checked: survey.total - survey.entered,
    high_risk: 0,
    readiness: survey.readiness,
    rating: survey.rating,
  });
  const sum = (field: 'total' | 'complete' | 'gaps' | 'not_checked' | 'high_risk') =>
    areas.reduce((total, area) => total + area[field], 0);
  const counts = {
    total: sum('total'),
    complete: sum('complete'),
    gaps: sum('gaps'),
    not_checked: sum('not_checked'),
    high_risk: sum('high_risk'),
  };
  const rating = rateOverall(
    counts,
    areas.map((area) => area.rating),
  );
  return { areas, overall: { ...counts, readiness: counts.total ? counts.complete / counts.total : 0, rating } };
}

export const todayIso = today;
