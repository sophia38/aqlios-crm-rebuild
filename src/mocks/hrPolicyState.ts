import dayjs from 'dayjs';
import type { HrAnswer, HrAnswerSource, HrPolicy, HrPolicyCategory, HrPolicySection } from '@/lib/api/types';
import { mockId } from './fixtures/random';
import { PERSONAS } from './fixtures/users';
import { leavePeople } from './handlers/staff';
import { getDb, saveDb } from './store';

// HR Policies mock state (docs/plans/phase-5-practice-modules.md §7, question 10). Six fictional
// policies, written for the demo, are seeded the first time a practice's library is read. Ask HR
// answers by matching the question's keywords against their numbered clauses.

type SeedPolicy = [string, HrPolicyCategory, string, string, HrPolicySection[]];

const SEED_POLICIES: SeedPolicy[] = [
  [
    'Staff handbook',
    'STAFF_HANDBOOK',
    'staff-handbook-2026.pdf',
    'Working hours, pay, conduct and the practice’s day-to-day rules.',
    [
      {
        number: '1.1',
        heading: 'Working hours',
        text: 'The practice is open 08:00 to 18:30, Monday to Friday. Your contracted hours and usual sessions are set out in your contract and shown on the ROTA.',
      },
      {
        number: '1.2',
        heading: 'Pay day',
        text: 'Salaries are paid by bank transfer on the last working day of each month. Payslips are emailed to you two working days before.',
      },
      {
        number: '2.1',
        heading: 'Dress code and ID badges',
        text: 'Wear clean, smart clothing suitable for clinical work, and your ID badge at all times when you are on site.',
      },
      {
        number: '3.1',
        heading: 'Confidentiality',
        text: 'Patient information must only be accessed when you need it for your role. Never discuss patients where you can be overheard.',
      },
    ],
  ],
  [
    'Annual leave policy',
    'LEAVE',
    'annual-leave-policy.docx',
    'How much annual leave you get and how to book it.',
    [
      {
        number: '2.1',
        heading: 'Annual leave entitlement',
        text: 'Full-time staff get 27 days of annual leave a year, plus bank holidays. This rises to 29 days after five years’ service. Part-time staff get the same pro rata, worked out in hours.',
      },
      {
        number: '2.2',
        heading: 'Leave year',
        text: 'The leave year runs from 1 January to 31 December. You can carry over up to 5 days into the next year with your manager’s agreement.',
      },
      {
        number: '3.1',
        heading: 'Booking annual leave',
        text: 'Request annual leave in the CRM at least four weeks before the first day. Leave is approved in the order it is requested, keeping enough cover on the ROTA.',
      },
      {
        number: '3.2',
        heading: 'Busy periods',
        text: 'No more than two clinicians can be on annual leave on the same day. Leave in December may be limited to five days.',
      },
    ],
  ],
  [
    'Sickness absence policy',
    'SICKNESS',
    'sickness-absence-policy.pdf',
    'Reporting sickness, fit notes and return-to-work meetings.',
    [
      {
        number: '2.1',
        heading: 'Reporting sickness',
        text: 'If you are too unwell to work, phone your line manager before 08:00 on your first day of absence. Don’t text or email. Say why you are off and when you expect to be back.',
      },
      {
        number: '2.2',
        heading: 'Keeping in touch',
        text: 'Phone your manager again each day you are off, unless you have agreed a different plan with them.',
      },
      {
        number: '3.1',
        heading: 'Fit notes',
        text: 'For absence of up to 7 calendar days you complete a self-certification form when you return. After 7 days you need a fit note from a doctor.',
      },
      {
        number: '4.1',
        heading: 'Return to work meeting',
        text: 'After every sickness absence your manager will hold a short return-to-work meeting with you on your first day back.',
      },
    ],
  ],
  [
    'Family leave policy',
    'FAMILY_LEAVE',
    'family-leave-policy.pdf',
    'Maternity, paternity, adoption and shared parental leave.',
    [
      {
        number: '2.1',
        heading: 'Maternity leave',
        text: 'You can take up to 52 weeks of maternity leave. Tell your manager by the 15th week before the baby is due.',
      },
      {
        number: '3.1',
        heading: 'Paternity leave',
        text: 'You can take one or two weeks of paternity leave, within 52 weeks of the birth or adoption.',
      },
      {
        number: '4.1',
        heading: 'Time off for dependants',
        text: 'You can take reasonable unpaid time off to deal with an emergency involving a dependant, such as a child falling ill.',
      },
    ],
  ],
  [
    'Expenses policy',
    'EXPENSES',
    'expenses-policy.pdf',
    'What you can claim, mileage rates and how to submit a claim.',
    [
      {
        number: '1.1',
        heading: 'What expenses you can claim',
        text: 'You can claim back reasonable expenses you pay while working for the practice, such as travel to home visits, training courses and approved equipment. Keep a receipt for every claim.',
      },
      {
        number: '2.1',
        heading: 'Mileage',
        text: 'Business mileage in your own car is paid at 45p a mile for the first 10,000 miles in the tax year. Travel between home and the practice is not business mileage.',
      },
      {
        number: '3.1',
        heading: 'Submitting an expenses claim',
        text: 'Send your expenses claim form and receipts to the practice manager by the 5th of the month. Approved claims are paid with the next salary.',
      },
    ],
  ],
  [
    'Grievance policy',
    'GRIEVANCE',
    'grievance-policy.docx',
    'How to raise a concern about work, and how it will be handled.',
    [
      {
        number: '2.1',
        heading: 'Talking to your manager first',
        text: 'Most problems can be sorted out informally. Talk to your line manager first, or to the practice manager if the problem involves your line manager.',
      },
      {
        number: '3.1',
        heading: 'Raising a formal grievance',
        text: 'To raise a formal grievance, write to the practice manager setting out your concern and what you would like to happen. You will be invited to a meeting within 5 working days.',
      },
      {
        number: '3.2',
        heading: 'Being accompanied',
        text: 'You can bring a colleague or a trade union representative to any grievance meeting.',
      },
      {
        number: '4.1',
        heading: 'Appeals',
        text: 'If you are unhappy with the outcome, you can appeal in writing within 5 working days. A partner who was not involved will hear the appeal.',
      },
    ],
  ],
];

export type HrPolicyRecord = Omit<HrPolicy, 'owner_name'>;

function seedPractice(practiceId: string): HrPolicyRecord[] {
  // Two or three different owners, not the demo personas.
  const owners = leavePeople(practiceId)
    .filter((person) => !Object.values(PERSONAS).some((persona) => persona.userId === person.id))
    .slice(0, 3);
  const start = dayjs().startOf('year');
  return SEED_POLICIES.map(([title, category, fileName, description, sections], index) => ({
    id: mockId(`hr-policy:${practiceId}`, index),
    practice_id: practiceId,
    title,
    category,
    owner_id: owners.length ? owners[index % owners.length].id : null,
    effective_date: start.add(index * 9, 'day').format('YYYY-MM-DD'),
    description,
    version: index % 3 === 0 ? 2 : 1,
    file_name: fileName,
    file_size: 180_000 + index * 37_000,
    sections,
    uploaded_by: 'Practice Manager',
    updated_at: start
      .add(index * 9, 'day')
      .hour(10)
      .toISOString(),
  }));
}

/** A practice's policies, seeded on first read. */
export function hrPolicyRecords(practiceId: string): HrPolicyRecord[] {
  const db = getDb();
  if (!db.hrPolicies[practiceId]) {
    db.hrPolicies[practiceId] = seedPractice(practiceId);
    saveDb();
  }
  return db.hrPolicies[practiceId];
}

export function presentPolicy(record: HrPolicyRecord): HrPolicy {
  const owner = record.owner_id
    ? leavePeople(record.practice_id).find((person) => person.id === record.owner_id)
    : undefined;
  return { ...record, owner_name: owner?.name ?? null };
}

// Question matching: lower-case words without common filler, with simple plural and -ing endings removed.
const STOPWORDS = new Set(
  (
    'a about an and any are at be can could do does for from get got have how i if in is it many me much my of on or our ' +
    'policy policies should tell that the there this to we what when where which who will with would you your'
  ).split(' '),
);

const stem = (word: string) => {
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
};

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOPWORDS.has(word))
    .map(stem);

function score(terms: string[], title: string, section: HrPolicySection) {
  const titleWords = new Set(words(title));
  const headingWords = new Set(words(section.heading));
  const textWords = words(section.text);
  const unique = new Set(terms);
  let total = 0;
  let inClause = 0;
  let matched = 0;
  for (const term of unique) {
    const inText = textWords.includes(term);
    if (headingWords.has(term) || inText) inClause += 1;
    if (titleWords.has(term) || headingWords.has(term) || inText) matched += 1;
    total += (titleWords.has(term) ? 1 : 0) + (headingWords.has(term) ? 2 : 0) + (inText ? 1 : 0);
  }
  // At least half the question's words must appear, so "Can I bring my dog to work?" doesn't match on "work".
  return inClause && matched * 2 >= unique.size ? total : 0;
}

export const NO_ANSWER =
  'I couldn’t find this in your practice’s policies. Try asking another way, or ask your practice manager.';

/** The best one or two clauses for the question, quoted with their source. */
export function answerQuestion(practiceId: string, question: string): HrAnswer {
  const terms = words(question);
  const ranked = hrPolicyRecords(practiceId)
    .flatMap((policy) =>
      policy.sections.map((section) => ({ policy, section, score: score(terms, policy.title, section) })),
    )
    .filter((match) => match.score >= 3)
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best) return { question, found: false, answer: NO_ANSWER, sources: [] };
  const sources: HrAnswerSource[] = ranked
    .filter((match) => match.score >= best.score * 0.75)
    .slice(0, 2)
    .map(({ policy, section }) => ({
      policy_id: policy.id,
      policy_title: policy.title,
      section: section.number,
      heading: section.heading,
      quote: section.text,
    }));
  const lead = `From your practice's ${best.policy.title.toLowerCase()}:`;
  return {
    question,
    found: true,
    answer: [lead, ...sources.map((source) => `“${source.quote}”`)].join('\n\n'),
    sources,
  };
}
