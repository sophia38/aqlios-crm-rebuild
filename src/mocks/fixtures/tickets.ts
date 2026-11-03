import {
  TICKET_OPEN_STATUSES,
  type Patient,
  type Practice,
  type Role,
  type SnomedConcept,
  type TicketDetail,
  type TicketLog,
  type TicketOpenStatus,
  type TicketStaff,
  type TicketTranscriptEntry,
  type TicketUrgency,
} from '@/lib/api/types';
import { ageFrom, patientName } from '@/lib/api/patients';
import { DEMO_PRACTICE_INDEXES } from './practices';
import { createRandom, DEMO_NOW, isoDaysAgo, mockId, type Random } from './random';
import type { StaffMember } from './users';

// Fictional tickets for the 3 demo practices (docs/plans/phase-5-practice-modules.md §2). Complaints,
// transcripts, summaries and notes are written for the demo; live test entries aren't copied.

export const OPEN_TICKETS_PER_DEMO_PRACTICE = 60;
export const CLOSED_TICKETS_PER_DEMO_PRACTICE = 8;

/** The names the two demo personas sign as (src/mocks/fixtures/users.ts). */
const STAFF_ACTORS = ['Aqlios Admin', 'Sam Patel'] as const;

interface Complaint {
  type: string;
  presenting: string;
  history: string | null;
  timeframe: string | null;
  symptoms: string | null;
  redFlags: string[];
  actions: string[];
  tests: string[];
  medication: string[];
  urgency: TicketUrgency;
  /** Patient answers, in order, to the agent's questions below. */
  answers: [string, string, string];
  snomed: SnomedConcept;
}

const COMPLAINTS: Complaint[] = [
  {
    type: 'Repeat Prescription Request',
    presenting: 'Repeat prescription: salbutamol inhaler',
    history: 'Uses the inhaler two to three times a week; asthma otherwise well controlled.',
    timeframe: 'Runs out in 5 days',
    symptoms: null,
    redFlags: [],
    actions: ['Review the repeat medication list', 'Issue the prescription if the annual review is in date'],
    tests: [],
    medication: ['Salbutamol 100 micrograms inhaler'],
    urgency: 'ROUTINE_ONE_WEEK',
    answers: [
      'I need a repeat of my blue inhaler, please.',
      "I've got about five days left.",
      'No, my breathing has been fine. Just the usual.',
    ],
    snomed: { code: '195967001', term: 'Asthma' },
  },
  {
    type: 'Diabetes Concerns, Questions Or Problems Assessment',
    presenting: 'Higher blood sugar readings than usual',
    history: 'Type 2 diabetes, on metformin. Readings have been above 12 mmol/L in the mornings.',
    timeframe: 'About 2 weeks',
    symptoms: 'More thirsty than usual, tired in the afternoons',
    redFlags: [],
    actions: ['Book an HbA1c blood test', 'Diabetes nurse review'],
    tests: ['HbA1c blood test'],
    medication: [],
    urgency: 'ROUTINE_ONE_WEEK',
    answers: [
      'My sugar readings have been high in the mornings.',
      'For about two weeks now.',
      "I'm thirsty a lot and quite tired. No vomiting.",
    ],
    snomed: { code: '44054006', term: 'Diabetes mellitus type 2' },
  },
  {
    type: 'Chest Pain Assessment',
    presenting: 'Tight chest when walking uphill',
    history: 'No known heart problems. Ex-smoker.',
    timeframe: '3 days',
    symptoms: 'Chest tightness on exertion that settles with rest',
    redFlags: ['Chest pain on exertion'],
    actions: ['Same-day clinician call back', 'Consider an ECG'],
    tests: ['ECG'],
    medication: [],
    urgency: 'URGENT',
    answers: [
      'My chest feels tight when I walk up the hill to the shops.',
      'It started three days ago.',
      'It goes away when I stop. No pain right now.',
    ],
    snomed: { code: '29857009', term: 'Chest pain' },
  },
  {
    type: 'Cough Assessment',
    presenting: 'Persistent cough',
    history: null,
    timeframe: '10 days',
    symptoms: 'Dry cough, worse at night; no fever',
    redFlags: [],
    actions: ['Self-care advice', 'Pharmacy review if not improving in a week'],
    tests: [],
    medication: [],
    urgency: 'ROUTINE_TWO_WEEK',
    answers: [
      "I've had a cough that won't go away.",
      'About ten days.',
      "It's a dry cough, worse at night. I haven't had a temperature.",
    ],
    snomed: { code: '49727002', term: 'Cough' },
  },
  {
    type: 'Headache Assessment',
    presenting: 'Recurring headaches',
    history: 'Headaches most afternoons; works long hours at a screen.',
    timeframe: '3 weeks',
    symptoms: 'Dull ache across the forehead, eased by paracetamol',
    redFlags: [],
    actions: ['GP telephone review', 'Eye test advice'],
    tests: [],
    medication: [],
    urgency: 'ROUTINE_ONE_WEEK',
    answers: [
      'I keep getting headaches in the afternoon.',
      'For about three weeks.',
      'Across my forehead. Paracetamol helps. No problems with my vision.',
    ],
    snomed: { code: '25064002', term: 'Headache' },
  },
  {
    type: 'Back Pain Assessment',
    presenting: 'Lower back pain after lifting',
    history: 'Lifted a heavy box at home.',
    timeframe: '5 days',
    symptoms: 'Ache in the lower back, stiff in the mornings',
    redFlags: [],
    actions: ['Physiotherapy self-referral', 'Pain relief advice'],
    tests: [],
    medication: [],
    urgency: 'ROUTINE_TWO_WEEK',
    answers: [
      'I hurt my lower back lifting a box.',
      'Five days ago.',
      "It's stiff in the morning. No numbness and I can walk fine.",
    ],
    snomed: { code: '279039007', term: 'Low back pain' },
  },
  {
    type: 'Urinary Symptoms Assessment',
    presenting: 'Stinging when passing urine',
    history: null,
    timeframe: '2 days',
    symptoms: 'Needing to go more often, stinging',
    redFlags: [],
    actions: ['Urine sample drop-off', 'Pharmacy First referral'],
    tests: ['Urine sample'],
    medication: [],
    urgency: 'ROUTINE_ONE_WEEK',
    answers: ['It stings when I go to the toilet.', 'Two days.', "I'm going more often. No fever or back pain."],
    snomed: { code: '68566005', term: 'Urinary tract infectious disease' },
  },
  {
    type: 'Skin Rash Assessment',
    presenting: 'Itchy rash on the arms',
    history: 'Started a new washing powder last week.',
    timeframe: '1 week',
    symptoms: 'Red, itchy patches on both forearms',
    redFlags: [],
    actions: ['Send a photo of the rash', 'Emollient advice'],
    tests: [],
    medication: [],
    urgency: 'ROUTINE_TWO_WEEK',
    answers: [
      'I have an itchy rash on my arms.',
      'About a week.',
      'Red patches on both arms. I changed my washing powder recently.',
    ],
    snomed: { code: '271807003', term: 'Eruption of skin' },
  },
  {
    type: 'Anxiety Or Low Mood Assessment',
    presenting: 'Feeling anxious and not sleeping',
    history: 'Stress at work over the last month.',
    timeframe: '1 month',
    symptoms: 'Trouble falling asleep, worrying, low energy',
    redFlags: [],
    actions: ['GP appointment', 'Talking therapies self-referral information'],
    tests: [],
    medication: [],
    urgency: 'ROUTINE_ONE_WEEK',
    answers: [
      "I've been feeling really anxious and I can't sleep.",
      'About a month.',
      "I worry a lot and I'm tired all day. I'm safe, I just want some help.",
    ],
    snomed: { code: '197480006', term: 'Anxiety disorder' },
  },
  {
    type: 'Blood Pressure Review',
    presenting: 'Home blood pressure readings',
    history: 'On amlodipine. Home readings around 150/95.',
    timeframe: '2 weeks of readings',
    symptoms: null,
    redFlags: [],
    actions: ['Nurse blood pressure check', 'Medication review'],
    tests: ['Blood pressure check'],
    medication: ['Amlodipine 5 mg tablets'],
    urgency: 'ROUTINE_TWO_WEEK',
    answers: [
      "I've been checking my blood pressure at home and it's high.",
      'For the last two weeks.',
      'Around 150 over 95. I feel fine otherwise.',
    ],
    snomed: { code: '38341003', term: 'Hypertensive disorder' },
  },
  {
    type: 'Shortness Of Breath Assessment',
    presenting: 'Short of breath at rest',
    history: 'History of asthma.',
    timeframe: 'Since this morning',
    symptoms: 'Breathless when talking, inhaler not helping',
    redFlags: ['Breathless at rest', 'Reliever inhaler not helping'],
    actions: ['Urgent clinician call back', 'Advise 999 if it gets worse'],
    tests: [],
    medication: [],
    urgency: 'URGENT',
    answers: ["I'm short of breath even sitting down.", 'Since this morning.', "My inhaler isn't helping much."],
    snomed: { code: '267036007', term: 'Dyspnoea' },
  },
  {
    type: 'Fit Note Request',
    presenting: 'Fit note extension',
    history: 'Recovering from a knee operation.',
    timeframe: 'Current note ends this week',
    symptoms: null,
    redFlags: [],
    actions: ['Clinician to review and issue a fit note'],
    tests: [],
    medication: [],
    urgency: 'ROUTINE_ONE_WEEK',
    answers: [
      'I need my fit note extended.',
      'My current one ends on Friday.',
      "I'm still recovering from my knee operation.",
    ],
    snomed: { code: '22253000', term: 'Pain' },
  },
];

const OPEN_STATUS_WEIGHTS: Record<TicketOpenStatus, number> = {
  NEW: 6,
  MORE_INFO_REQUIRED: 2,
  APPOINTMENT_PENDING: 2,
  UNDER_CLINICAL_REVIEW: 4,
  REOPENED: 1,
  FORWARDED: 1,
  FOLLOW_UP_REQUESTED: 1,
  APPOINTMENT_BOOKED: 2,
  DNA: 1,
  APPOINTMENT_CANCELLED: 1,
};

const CLOSURE_REASONS = ['Resolved', 'Resolved', 'Referred elsewhere', 'Duplicate', 'Patient no longer needs help'];

function pickStatus(random: Random): TicketOpenStatus {
  const total = TICKET_OPEN_STATUSES.reduce((sum, status) => sum + OPEN_STATUS_WEIGHTS[status], 0);
  let roll = random.next() * total;
  for (const status of TICKET_OPEN_STATUSES) {
    roll -= OPEN_STATUS_WEIGHTS[status];
    if (roll < 0) return status;
  }
  return 'NEW';
}

function transcript(complaint: Complaint, firstName: string): TicketTranscriptEntry[] {
  const [reason, duration, details] = complaint.answers;
  return [
    { speaker: 'AI', text: `Hello ${firstName}, I'm the practice's virtual assistant. How can I help you today?` },
    { speaker: 'PATIENT', text: reason },
    { speaker: 'AI', text: 'Thank you. How long has this been going on?' },
    { speaker: 'PATIENT', text: duration },
    { speaker: 'AI', text: 'Can you tell me a little more about how you are feeling?' },
    { speaker: 'PATIENT', text: details },
    {
      speaker: 'AI',
      text: "Thank you, I've passed this to the practice team. Someone will be in touch. If things get worse, call 111, or 999 in an emergency.",
    },
  ];
}

const atMinutes = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();

export interface TicketSeed {
  tickets: TicketDetail[];
  logs: Record<string, TicketLog[]>;
}

/** Practice staff who can take a ticket: active members of the practice. */
export function assignableStaff(staff: StaffMember[], roles: Role[], practiceId: string): TicketStaff[] {
  return staff
    .filter((member) => member.status === 'ACTIVE' && member.practice_ids.includes(practiceId))
    .map((member) => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      role: roles.find((role) => role.id === member.role_id)?.name ?? 'Staff',
    }));
}

export function buildTickets(
  practices: Practice[],
  patients: Patient[],
  staff: StaffMember[],
  roles: Role[],
): TicketSeed {
  const random = createRandom(2602);
  const tickets: TicketDetail[] = [];
  const logs: Record<string, TicketLog[]> = {};

  for (const practiceIndex of DEMO_PRACTICE_INDEXES) {
    const practice = practices[practiceIndex];
    if (!practice) continue;
    const practicePatients = patients.filter((patient) => patient.practice_id === practice.id);
    const team = assignableStaff(staff, roles, practice.id);
    const clinicians = team.filter((member) => member.role === 'Clinician');
    const total = OPEN_TICKETS_PER_DEMO_PRACTICE + CLOSED_TICKETS_PER_DEMO_PRACTICE;

    for (let n = 0; n < total; n += 1) {
      const closed = n >= OPEN_TICKETS_PER_DEMO_PRACTICE;
      const index = tickets.length;
      const id = mockId('ticket', index);
      // A few patients get several tickets, so Previous Consultations has something to show.
      const patient = practicePatients[n < 20 ? n % 8 : random.int(0, practicePatients.length - 1)];
      const complaint = COMPLAINTS[(n * 5 + practiceIndex) % COMPLAINTS.length];
      const source = random.bool(0.7) ? 'VOICE_AGENT' : 'WEB_TRIAGE';
      const createdAt = atMinutes(isoDaysAgo(random.int(closed ? 8 : 0, 30), random.int(7, 15)), random.int(0, 59));
      const recommended = team.length && random.bool(0.6) ? random.pick(clinicians.length ? clinicians : team) : null;
      const assigned = closed
        ? (recommended ?? (team[0] || null))
        : recommended && random.bool(0.4)
          ? recommended
          : null;
      const status = closed ? 'CLOSED' : pickStatus(random);
      const durationSeconds = random.int(30, 180);
      const closedAt = closed ? atMinutes(createdAt, random.int(2, 6) * 24 * 60 + random.int(0, 300)) : null;
      const closedBy = closed ? random.pick(STAFF_ACTORS) : null;
      const name = patientName(patient);

      const ticket: TicketDetail = {
        id,
        practice_id: practice.id,
        patient_id: patient.id,
        patient_name: name,
        patient_age: ageFrom(patient.date_of_birth, DEMO_NOW),
        patient_sex: patient.sex_at_birth,
        source,
        urgency: complaint.urgency,
        complaint_type: complaint.type,
        status,
        created_at: createdAt,
        recommended_staff: recommended,
        assigned_staff: assigned,
        closed_at: closedAt,
        closed_by_name: closedBy,
        closure_reason: closed ? random.pick(CLOSURE_REASONS) : null,
        current_viewer_name: null,
        preferred_method: random.bool(0.6) ? 'Aqlios App' : random.bool(0.5) ? 'SMS' : 'Email',
        request_name: complaint.type,
        submitted_by: name,
        urgency_changed_by_clinician: false,
        summary: {
          presenting_complaint: complaint.presenting,
          condition_history: complaint.history,
          timeframe: complaint.timeframe,
          symptoms: complaint.symptoms,
        },
        red_flags: complaint.redFlags,
        recommended_actions: complaint.actions,
        requested_tests: complaint.tests,
        medication: complaint.medication,
        snomed_codes:
          assigned && random.bool(0.4)
            ? [
                {
                  id: mockId(`ticket-snomed:${id}`, 0),
                  ...complaint.snomed,
                  comment: '',
                  created_at: atMinutes(createdAt, 90),
                },
              ]
            : [],
        messages:
          assigned && random.bool(0.5)
            ? [
                {
                  id: mockId(`ticket-message:${id}`, 0),
                  sender: 'STAFF',
                  sender_name: assigned.name,
                  body: `Hello ${patient.first_name}, thank you for contacting the practice. A clinician has reviewed your request and will call you today.`,
                  channels: ['APP'],
                  reply_allowed: true,
                  created_at: atMinutes(createdAt, 60),
                },
                {
                  id: mockId(`ticket-message:${id}`, 1),
                  sender: 'PATIENT',
                  sender_name: name,
                  body: 'Thank you, I will keep my phone with me.',
                  channels: ['APP'],
                  reply_allowed: true,
                  created_at: atMinutes(createdAt, 75),
                },
              ]
            : [],
        notes:
          assigned && random.bool(0.4)
            ? [
                {
                  id: mockId(`ticket-note:${id}`, 0),
                  text: 'Spoke to the patient. Advice given; safety-netting discussed.',
                  shared_with_patient: false,
                  added_by_name: assigned.name,
                  created_at: atMinutes(createdAt, 120),
                },
              ]
            : [],
        transcript: {
          started_at: atMinutes(createdAt, -Math.ceil(durationSeconds / 60)),
          duration_seconds: durationSeconds,
          entries: transcript(complaint, patient.first_name),
        },
      };
      tickets.push(ticket);

      const agent =
        source === 'VOICE_AGENT'
          ? { actor: 'Aqlios Voice Agent', user_name: 'Aqlios Voice Agent', role: 'Voice Agent' }
          : { actor: name, user_name: name, role: 'Patient' };
      const entries: TicketLog[] = [
        {
          id: mockId(`ticket-log:${id}`, 0),
          ...agent,
          event: 'Consultation Started',
          created_at: ticket.transcript.started_at,
        },
        { id: mockId(`ticket-log:${id}`, 1), ...agent, event: 'Patient Symptoms Recorded', created_at: createdAt },
      ];
      if (recommended) {
        entries.push({
          id: mockId(`ticket-log:${id}`, 2),
          actor: 'Aqlios Voice Agent',
          user_name: 'Aqlios Voice Agent',
          role: 'Voice Agent',
          event: `Recommended Staff: ${recommended.name}`,
          created_at: atMinutes(createdAt, 1),
        });
      }
      if (assigned) {
        entries.push({
          id: mockId(`ticket-log:${id}`, 3),
          actor: STAFF_ACTORS[0],
          user_name: STAFF_ACTORS[0],
          role: 'Super Admin',
          event: `Staff Assigned: ${assigned.name}`,
          created_at: atMinutes(createdAt, 30),
        });
      }
      if (closed && closedAt && closedBy) {
        entries.push({
          id: mockId(`ticket-log:${id}`, 4),
          actor: closedBy,
          user_name: closedBy,
          role: closedBy === STAFF_ACTORS[0] ? 'Super Admin' : 'GP',
          event: `Case Closed: ${ticket.closure_reason}`,
          created_at: closedAt,
        });
      }
      logs[id] = entries.reverse();
    }
  }
  return { tickets, logs };
}

/** A short demo list of SNOMED CT concepts for the code search (not a terminology server). */
export const SNOMED_CONCEPTS: SnomedConcept[] = [
  { code: '195967001', term: 'Asthma' },
  { code: '73211009', term: 'Diabetes mellitus' },
  { code: '44054006', term: 'Diabetes mellitus type 2' },
  { code: '38341003', term: 'Hypertensive disorder' },
  { code: '29857009', term: 'Chest pain' },
  { code: '49727002', term: 'Cough' },
  { code: '25064002', term: 'Headache' },
  { code: '386661006', term: 'Fever' },
  { code: '267036007', term: 'Dyspnoea' },
  { code: '422587007', term: 'Nausea' },
  { code: '62315008', term: 'Diarrhoea' },
  { code: '21522001', term: 'Abdominal pain' },
  { code: '279039007', term: 'Low back pain' },
  { code: '22253000', term: 'Pain' },
  { code: '84229001', term: 'Fatigue' },
  { code: '404640003', term: 'Dizziness' },
  { code: '35489007', term: 'Depressive disorder' },
  { code: '197480006', term: 'Anxiety disorder' },
  { code: '68566005', term: 'Urinary tract infectious disease' },
  { code: '54150009', term: 'Upper respiratory infection' },
  { code: '271807003', term: 'Eruption of skin' },
];
