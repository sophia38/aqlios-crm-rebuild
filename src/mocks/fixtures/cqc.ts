// Generated once from the BA's "CQC Predicted Rating" workbook (requirement text is verbatim).
// 342 checks across 7 areas and 18 National GP Patient Survey measures.

import type { CqcAreaKey } from '@/lib/api/cqc';

export interface CqcCheckSeed {
  id: string;
  area: CqcAreaKey;
  /** The workbook's "Area" column: a CQC domain, a topic or a policy group. */
  group: string;
  requirement: string;
  completion: string;
}

export interface CqcSurveySeed {
  id: string;
  measure: string;
  direction: 'HIGHER' | 'LOWER';
}

export const CQC_CHECK_SEEDS: CqcCheckSeed[] = [
  {
    id: 'INS-001',
    area: 'inspection-checklist',
    group: 'Safe',
    requirement: 'Regulated activities, registration and statement of purpose current',
    completion: 'Details match services and sites.',
  },
  {
    id: 'INS-002',
    area: 'inspection-checklist',
    group: 'Safe',
    requirement: 'Safeguarding systems, training, registers and follow-up effective',
    completion: 'Sample referrals, non-attendance and information requests.',
  },
  {
    id: 'INS-003',
    area: 'inspection-checklist',
    group: 'Safe',
    requirement: 'Recruitment and locum files complete',
    completion: 'Identity, right to work, DBS, registration, references, indemnity, competence and induction verified.',
  },
  {
    id: 'INS-004',
    area: 'inspection-checklist',
    group: 'Safe',
    requirement: 'Mandatory training and role competence current',
    completion: 'Matrix reflects role; overdue items have risk controls.',
  },
  {
    id: 'INS-005',
    area: 'inspection-checklist',
    group: 'Safe',
    requirement: 'Incident, significant-event and duty-of-candour actions complete',
    completion: 'Learning is shared and effectiveness checked.',
  },
  {
    id: 'INS-006',
    area: 'inspection-checklist',
    group: 'Safe',
    requirement: 'Medicines monitoring and clinical searches complete',
    completion: 'Every returned patient has proportionate action and closure.',
  },
  {
    id: 'INS-007',
    area: 'inspection-checklist',
    group: 'Safe',
    requirement: 'CAS/MHRA/NPSA alerts assessed and completed',
    completion: 'Applicability, search/action, closure and governance sign-off recorded.',
  },
  {
    id: 'INS-008',
    area: 'inspection-checklist',
    group: 'Safe',
    requirement: 'Emergency readiness, fire, H&S, Legionella and IPC actions complete',
    completion: 'No unowned or overdue safety-critical actions.',
  },
  {
    id: 'INS-009',
    area: 'inspection-checklist',
    group: 'Effective',
    requirement: 'Clinical audits and re-audits completed',
    completion: 'Full cycle demonstrates measurable improvement.',
  },
  {
    id: 'INS-010',
    area: 'inspection-checklist',
    group: 'Effective',
    requirement: 'Consultation and record audits completed',
    completion: 'Reasoning, safety-netting, consent, coding and follow-up sampled.',
  },
  {
    id: 'INS-011',
    area: 'inspection-checklist',
    group: 'Effective',
    requirement: 'Results, referrals, correspondence and tasks closed loop',
    completion: 'High-risk samples demonstrate ownership and failed-contact escalation.',
  },
  {
    id: 'INS-012',
    area: 'inspection-checklist',
    group: 'Effective',
    requirement: 'Consent, capacity, chaperone and remote-care audits complete',
    completion: 'Findings lead to action and recheck.',
  },
  {
    id: 'INS-013',
    area: 'inspection-checklist',
    group: 'Caring',
    requirement: 'Privacy, dignity, equality, communication and adjustments assured',
    completion: 'Observation and feedback corroborate policy.',
  },
  {
    id: 'INS-014',
    area: 'inspection-checklist',
    group: 'Caring',
    requirement: 'National GP Patient Survey results entered, rated and actioned',
    completion:
      'Practice results are compared with the national result and prior year; weaker indicators have actions.',
  },
  {
    id: 'INS-015',
    area: 'inspection-checklist',
    group: 'Caring',
    requirement: 'Friends and Family Test feedback reviewed and actioned',
    completion: 'Monthly themes, response rates and “you said, we did” changes are recorded.',
  },
  {
    id: 'INS-016',
    area: 'inspection-checklist',
    group: 'Caring',
    requirement: 'Patient Participation Group is active and influential',
    completion: 'Membership, representation, attendance, challenge and resulting changes are evidenced.',
  },
  {
    id: 'INS-017',
    area: 'inspection-checklist',
    group: 'Responsive',
    requirement: 'Telephone, online and face-to-face access audited',
    completion: 'Demand, waits, abandonment, continuity and equity are reviewed.',
  },
  {
    id: 'INS-018',
    area: 'inspection-checklist',
    group: 'Responsive',
    requirement: 'Call-handler and care-navigation audits completed',
    completion: 'Red flags, scope, confidentiality, documentation and escalation are safe.',
  },
  {
    id: 'INS-019',
    area: 'inspection-checklist',
    group: 'Responsive',
    requirement: 'Registration, interpretation and accessible-information systems tested',
    completion: 'No unreasonable barriers.',
  },
  {
    id: 'INS-020',
    area: 'inspection-checklist',
    group: 'Well-led',
    requirement: 'Required posters and patient notices are correct and current',
    completion: 'Names, contacts, dates, locations and accessibility are checked during the walk-round.',
  },
  {
    id: 'INS-021',
    area: 'inspection-checklist',
    group: 'Well-led',
    requirement: 'External appearance and entrance are safe and presentable',
    completion: 'Signage, litter, cigarette ends, vegetation, bins, lighting and paths are satisfactory.',
  },
  {
    id: 'INS-022',
    area: 'inspection-checklist',
    group: 'Well-led',
    requirement: 'Risk assessments and risk register are current',
    completion: 'Actions, owners, deadlines and effectiveness reviews are visible.',
  },
  {
    id: 'INS-023',
    area: 'inspection-checklist',
    group: 'Well-led',
    requirement: 'Policies are current, locally approved and implemented',
    completion: 'Staff can find and explain relevant procedures.',
  },
  {
    id: 'INS-024',
    area: 'inspection-checklist',
    group: 'Well-led',
    requirement: 'Governance meetings track every material gap to closure',
    completion: 'Minutes show challenge and overdue escalation.',
  },
  {
    id: 'INS-025',
    area: 'inspection-checklist',
    group: 'Well-led',
    requirement: 'Workforce wellbeing, equality and speaking-up actions complete',
    completion: 'Staff feedback and outcomes demonstrate effect.',
  },
  {
    id: 'INS-026',
    area: 'inspection-checklist',
    group: 'Well-led',
    requirement: 'Business continuity and cyber/data protection controls tested',
    completion: 'Exercises and incidents produce completed improvements.',
  },
  {
    id: 'INS-027',
    area: 'inspection-checklist',
    group: 'Outstanding',
    requirement: 'Improvement produces measurable patient benefit',
    completion: 'Baseline, outcome, equity, sustainability and corroboration are available.',
  },
  {
    id: 'INS-028',
    area: 'inspection-checklist',
    group: 'Outstanding',
    requirement: 'Exceptional work is spread or externally validated',
    completion: 'Partners or other services confirm impact.',
  },
  {
    id: 'EST-001',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Current fire risk assessment completed by a competent person',
    completion:
      'Assessment reflects the building, occupants and activities; all actions have owners, deadlines and closure evidence.',
  },
  {
    id: 'EST-002',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'All fire risk-assessment actions completed',
    completion: 'No overdue high-risk actions; completion is verified rather than marked closed on assertion.',
  },
  {
    id: 'EST-003',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Weekly fire-alarm tests completed',
    completion: 'Call points rotate; gaps and faults are escalated and resolved.',
  },
  {
    id: 'EST-004',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Fire alarm servicing current',
    completion: 'Certificate, defects and remedial invoices/work orders are available.',
  },
  {
    id: 'EST-005',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Emergency-lighting checks and annual discharge test complete',
    completion: 'Logs and certificates show defects closed.',
  },
  {
    id: 'EST-006',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Fire extinguishers serviced and accessible',
    completion: 'Correct type/location, current tags and no obstruction.',
  },
  {
    id: 'EST-007',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Fire drills completed for all shifts/sites',
    completion: 'Scenario, attendance, learning and actions are recorded.',
  },
  {
    id: 'EST-008',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Fire doors inspected and remedial work completed',
    completion: 'Doors close and latch; seals, hinges, glazing and gaps are satisfactory.',
  },
  {
    id: 'EST-009',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'No unapproved wedges or door stops on fire doors',
    completion: 'Only approved automatic hold-open devices are used where risk assessed.',
  },
  {
    id: 'EST-010',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Escape routes, exits and assembly point usable',
    completion: 'Routes are clear, signed, illuminated and final exits open correctly.',
  },
  {
    id: 'EST-011',
    area: 'estates-statutory',
    group: 'Fire',
    requirement: 'Staff know fire action and evacuation roles',
    completion: 'Spot-check clinical, reception, administrative and lone-working staff.',
  },
  {
    id: 'EST-012',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'Current health and safety audit completed',
    completion: 'Audit covers premises, work activities, contractors, incidents and vulnerable users.',
  },
  {
    id: 'EST-013',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'All health and safety audit actions completed',
    completion: 'Actions have evidence of completion and effectiveness review.',
  },
  {
    id: 'EST-014',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'Health and safety policy, responsibilities and competent advice current',
    completion: 'Named leads, escalation and review arrangements are clear.',
  },
  {
    id: 'EST-015',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'Accident, incident and near-miss actions completed',
    completion: 'RIDDOR consideration and recurring themes are documented.',
  },
  {
    id: 'EST-016',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'DSE assessments and actions completed',
    completion: 'New starters, workstation changes and reported symptoms are covered.',
  },
  {
    id: 'EST-017',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'Lone-working and violence/aggression controls tested',
    completion: 'Panic alarms, room exits, escalation and post-incident support work.',
  },
  {
    id: 'EST-018',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'Slips, trips, cables, flooring and thresholds safe',
    completion: 'Walk-round includes patient and staff routes, stairs and external paths.',
  },
  {
    id: 'EST-019',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'Window restrictors and guarding controls inspected',
    completion: 'Above-ground and identified-risk windows are secure and maintained.',
  },
  {
    id: 'EST-020',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'Radiators, hot surfaces and scald risks controlled',
    completion: 'Covers/warnings and thermostatic controls match the risk assessment.',
  },
  {
    id: 'EST-021',
    area: 'estates-statutory',
    group: 'Health & safety',
    requirement: 'Car park, lighting, fencing, paths and grounds safe',
    completion: 'Potholes, vegetation, waste areas and pedestrian routes are managed.',
  },
  {
    id: 'EST-022',
    area: 'estates-statutory',
    group: 'Legionella',
    requirement: 'Current Legionella risk assessment completed by a competent person',
    completion: 'Assessment and schematic match all current outlets, tanks and services.',
  },
  {
    id: 'EST-023',
    area: 'estates-statutory',
    group: 'Legionella',
    requirement: 'All Legionella assessment actions and remedial works completed',
    completion: 'Dead legs, temperatures, flushing and contractor actions have closure evidence.',
  },
  {
    id: 'EST-024',
    area: 'estates-statutory',
    group: 'Legionella',
    requirement: 'Sentinel and representative temperatures recorded',
    completion: 'Frequency and acceptable ranges follow the local written control scheme.',
  },
  {
    id: 'EST-025',
    area: 'estates-statutory',
    group: 'Legionella',
    requirement: 'Little-used outlets flushed and logged',
    completion: 'Outlet list matches rooms; closures/changes trigger review.',
  },
  {
    id: 'EST-026',
    area: 'estates-statutory',
    group: 'Legionella',
    requirement: 'Showerheads, hoses and outlets cleaned/descaled',
    completion: 'Frequency, completion and exceptions are recorded.',
  },
  {
    id: 'EST-027',
    area: 'estates-statutory',
    group: 'Legionella',
    requirement: 'Water-system changes and out-of-range results escalated',
    completion: 'Competent advice, sampling/remediation and reopening decisions are recorded.',
  },
  {
    id: 'EST-028',
    area: 'estates-statutory',
    group: 'IPC',
    requirement: 'Annual IPC audit completed and actions closed',
    completion: 'Repeat observations confirm improvement.',
  },
  {
    id: 'EST-029',
    area: 'estates-statutory',
    group: 'IPC',
    requirement: 'Cleaning schedules and room standards completed',
    completion: 'High/low-level cleaning, couches, blinds, toys and shared equipment are included.',
  },
  {
    id: 'EST-030',
    area: 'estates-statutory',
    group: 'IPC',
    requirement: 'Handwash sinks clear and stocked',
    completion: 'Nothing stored under clinical sinks; soap and hand drying available.',
  },
  {
    id: 'EST-031',
    area: 'estates-statutory',
    group: 'IPC',
    requirement: 'Sharps bins safe and correctly assembled',
    completion: 'Dated, signed, below fill line, temporarily closed and positioned safely.',
  },
  {
    id: 'EST-032',
    area: 'estates-statutory',
    group: 'IPC',
    requirement: 'Waste streams, bins and transfer notes compliant',
    completion: 'Clinical, offensive, domestic and confidential waste are secure and correctly segregated.',
  },
  {
    id: 'EST-033',
    area: 'estates-statutory',
    group: 'Equipment',
    requirement: 'Equipment servicing, calibration and PAT programme current',
    completion: 'Asset register reconciles to items in rooms; overdue items are removed or risk-managed.',
  },
  {
    id: 'EST-034',
    area: 'estates-statutory',
    group: 'Equipment',
    requirement: 'Clinical equipment visibly clean, intact and in date',
    completion: 'Couches, scales, BP monitors, ECG/spirometry and probes are sampled.',
  },
  {
    id: 'EST-035',
    area: 'estates-statutory',
    group: 'Emergency',
    requirement: 'Emergency equipment and emergency medicines checked',
    completion: 'Bag/trolley is tamper-evident, immediately accessible, complete and within expiry.',
  },
  {
    id: 'EST-036',
    area: 'estates-statutory',
    group: 'Emergency',
    requirement: 'Oxygen and AED safe, serviced and ready',
    completion: 'Cylinder secured, sufficient, in date; pads/battery/service status checked.',
  },
  {
    id: 'EST-037',
    area: 'estates-statutory',
    group: 'Security',
    requirement: 'Premises, keys, access cards and alarms secure',
    completion: 'Leavers removed; restricted rooms, medicines and stationery have controlled access.',
  },
  {
    id: 'EST-038',
    area: 'estates-statutory',
    group: 'Accessibility',
    requirement: 'Accessible route, toilet, signage, hearing support and emergency cord usable',
    completion: 'Facilities are not obstructed or used as storage; pull cord reaches the floor.',
  },
  {
    id: 'EST-039',
    area: 'estates-statutory',
    group: 'Building',
    requirement: 'Planned maintenance and defect actions completed',
    completion: 'Leaks, mould, cracks, ceilings, ventilation, lighting and damage are tracked.',
  },
  {
    id: 'EST-040',
    area: 'estates-statutory',
    group: 'Contractors',
    requirement: 'Contractor competencies, permits, asbestos information and work sign-off controlled',
    completion: 'Relevant surveys and post-work checks are available.',
  },
  {
    id: 'EST-041',
    area: 'estates-statutory',
    group: 'Utilities',
    requirement: 'Gas, electrical installation, lifts/hoists and pressure systems certified where applicable',
    completion: 'Certificates and remedial actions are current.',
  },
  {
    id: 'EST-042',
    area: 'estates-statutory',
    group: 'Business continuity',
    requirement: 'Loss of premises, utilities, telephony and IT plans tested',
    completion: 'Fallback sites, contacts, recovery priorities and exercise learning are current.',
  },
  {
    id: 'CS-001',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement:
      'Report Count Last Run AF - Review as CHA2DS2-VASc =>1 + male or =>2 + female but no anticoag or except (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-002',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement:
      'Asthma - Review as 12 or more SABA inhalers in last 12m (+ no COPD) (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-003',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement:
      'Asthma - Review as 2 or more oral prednisolone in last 12m (+ no COPD) (Long Term Conditions / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-004',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement:
      'Asthma - Review as LABA issued in last 6m but no ICS issued (+ no COPD) (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-005',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement: 'Azathioprine in last 6m - Check FBC/U+E/LFT as none in last 12w (DMARDS / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-006',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement:
      'Azathioprine in last 6m - Check FBC/U+E/LFT as none in last 6m (should be 12w) (DMARDS / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-007',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement:
      'Benzodiazepines +/or Z-drugs >=10 in last 1y - Review due to risk of dependence (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-008',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement:
      'CKD 4-5 or CKD + latest eGFR <30 - Check U+E as none in last 6m (Long Term Conditions / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-009',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement:
      'CKD 4-5 or CKD + latest eGFR <30 - Check U+E as none in last 9m (should be 3-6m) (Long Term Conditions / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-010',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement: 'Diabetes - Review as latest HbA1c >=75 (Long Term Conditions / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-011',
    area: 'clinical-searches',
    group: 'DNACPR',
    requirement: 'DNACPR or ReSPECT - Review if recorded appropriately in last 1y: alive (DNACPR / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-012',
    area: 'clinical-searches',
    group: 'DNACPR',
    requirement:
      'DNACPR or ReSPECT - Review if recorded appropriately in last 1y: deceased (DNACPR / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-013',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement:
      'Gabapentin or pregabalin >=3 in last 6m - For medication review as none last 1y (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-014',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement: 'Had azathioprine in last 6m (DMARDS / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-015',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement: 'Had Gabapentin or Pregabalin >=3 in last 6m (Medicines Usage / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-016',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement: 'Had leflunomide in last 6m (DMARDS / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-017',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement: 'Had methotrexate in last 6m (DMARDS / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-018',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement: 'Has AF + CHA2DS2-VASc =1 + male or =>2 (Medicines Usage / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-019',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement: 'Has Asthma + no COPD (Long Term Conditions / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-020',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement: 'Has CHD (Long Term Conditions / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-021',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'Has childbearing potential + aged 8-55 (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-022',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement: 'Has CKD (Long Term Conditions / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-023',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement: 'Has COPD (Long Term Conditions / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-024',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement: 'Has diabetes (Long Term Conditions / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-025',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'Has heart failure (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-026',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement: 'Has Hypothyroidism + thyroxine in last 1y (Long Term Conditions / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-027',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement:
      'Hydrochlorothiazide in last 6m - Review due to risk of skin cancer (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-028',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement: 'Hypothyroidism - Check TSH as none in last 12m (Long Term Conditions / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-029',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement:
      'Hypothyroidism - Check TSH as none in last 12m and last TSH <0.3 or >5.0 (Long Term Conditions / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-030',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement:
      'Hypothyroidism - Check TSH as none in last 18m (should be every 12m) (Long Term Conditions / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-031',
    area: 'clinical-searches',
    group: 'Long Term Conditions',
    requirement:
      'Hypothyroidism - Check TSH as none in last 18m and last TSH <0.3 or >7.0 (Long Term Conditions / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-032',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement:
      'Leflunomide in last 6m - Check FBC/U+E/LFT/BP as none in last 6m (should be 12w) (DMARDS / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-033',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement: 'Leflunomide in last 6m - Check FBC/U+E/LFT/BP/Wt as none in last 12w (DMARDS / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-034',
    area: 'clinical-searches',
    group: 'Medication Review',
    requirement:
      'Medication review in last 3m - Check quality of review - age >75y (Medication Review / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-035',
    area: 'clinical-searches',
    group: 'Medication Review',
    requirement:
      'Medication review in last 3m - Check quality of review - any age (Medication Review / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-036',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement: 'Methotrexate in last 6m - Check FBC/U+E/LFT as none in last 12w (DMARDS / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-037',
    area: 'clinical-searches',
    group: 'DMARDS',
    requirement:
      'Methotrexate in last 6m - Check FBC/U+E/LFT as none in last 6m (should be 12w) (DMARDS / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-038',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On ACEi or ARB (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-039',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On ACEi or ARB - Check U+E as none in last 12m (Medicines Monitoring / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-040',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On ACEi or ARB - Check U+E as none in last 18m (should be every 12m) (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-041',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement:
      'On aldosterone antagonist + ACEi or ARB - Check U+E as none in last 6m (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-042',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On aldosterone antagonist + heart failure (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-043',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On aldosterone antagonist + heart failure - Check U+E as not done in last 6m (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-044',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On amiodarone (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-045',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On amiodarone - Check U+E/LFT/TFT as none in last 6m (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-046',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement: 'On Bisphosphonate - Check as first issued >5 years ago (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-047',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement:
      'On Bisphosphonate - Check as first issued >5 years ago + no DXA in last 5y (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-048',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement:
      'On citalopram 40mg or escitalopram 20mg tablets - Reduce dose as age >65y (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-049',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement: 'On clopidogrel - Review as also on omeprazole or esomeprazole (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-050',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement: 'On COCP or issued in last 12m (Medicines Usage / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-051',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement: 'On COCP or issued in last 12m - Review as VTE or thrombophilia (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-052',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-053',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC + CrCl >30 + frail or age >=75y (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-054',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC - Check CrCl as never done (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-055',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC - Check CrCl as not done in last 1y (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-056',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On DOAC - Check U+E/FBC/LFT as none in last 15m + CrCl >=60 (should be every 1y) (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-057',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On DOAC - Check U+E/FBC/LFT as none in last 1y + CrCl >=60 (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-058',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On DOAC - Check U+E/FBC/LFT as none in last 3m + CrCl 30-39 (Medicines Monitoring / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-059',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC - Check U+E/FBC/LFT as none in last 3m + CrCl <30 (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-060',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On DOAC - Check U+E/FBC/LFT as none in last 4m + CrCl 40-49 (Medicines Monitoring / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-061',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On DOAC - Check U+E/FBC/LFT as none in last 4m + CrCl >30 + frail or age >=75y (Medicines Monitoring / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-062',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On DOAC - Check U+E/FBC/LFT as none in last 5m + CrCl 50-59 (Medicines Monitoring / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-063',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On DOAC - Check U+E/FBC/LFT as none in last 6m + CrCl 30-59 (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-064',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On DOAC - Check U+E/FBC/LFT as none in last 6m + CrCl >30 + frail or age >=75y (should be every 4m) (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-065',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC - Check U+E as none in last 6m + CrCl 30-59 (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-066',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC - Review mechanical cardiac valve; consider warfarin',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-067',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC - Contraindicated as CrCl <30 or <15 (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-068',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC - Review as Hb <9g/dl in last 1y (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-069',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement: 'On febuxostat - Review as has CVD (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-070',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement:
      'On fentanyl patch - Review as started in last 1y + no other opiates 3m before (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-071',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On lithium (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-072',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On lithium - Check lithium levels as none in last 3m (Medicines Monitoring / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-073',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On lithium - Check lithium levels as none in last 6m (should be every 3m) (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-074',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On lithium - Check U+E/TFT/Calcium as none in last 6m (Medicines Monitoring / Enhanced Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-075',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On lithium - Check U+E/TFT/Calcium as none in last 9m (should be every 6m) (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-076',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On metformin (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-077',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On metformin - Review as eGFR <30 (Medicines Monitoring / Standard Search)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-078',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On mirabegron (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-079',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement: 'On mirabegron - Check BP as none in last 1y (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-080',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement: 'On NSAID + >=65y or on antiplatelet + >=75y (Medicines Usage / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-081',
    area: 'clinical-searches',
    group: 'Medicines Usage',
    requirement:
      'On NSAID + >=65y or on antiplatelet + >=75y - Consider PPI + no dec/not tol (Medicines Usage / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-082',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On 2 or more renin-angiotensin system medicines (ACEi/ARB/renin inhibitor) - Review combination',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-083',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement:
      "On SGLT-2 inhibitor - Review as ketoacidosis advice & Fournier's gangrene education not given (Safety Alerts / Standard Searches)",
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-084',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement:
      'On simvastatin 40mg or 80mg - Review as on amlodipine, diltiazem or verapamil (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-085',
    area: 'clinical-searches',
    group: 'Safety Alerts',
    requirement:
      'On teratogenic drugs in childbearing age or issue in last 3m - Review (valproate/carbimazole/modafinil/pregabalin/topiramate) (Safety Alerts / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-086',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On warfarin (Medicines Monitoring / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-087',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On warfarin - Check INR as none in last 3m + not INR self-monitoring in last 1y (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-088',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement:
      'On warfarin - Review as 2x INRs >5 or 1x INR >8 in last 6m (Medicines Monitoring / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-089',
    area: 'clinical-searches',
    group: 'Medication Review',
    requirement:
      'Polypharmacy - Review as on >10 drugs + no medication review in last 18m (Medication Review / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-090',
    area: 'clinical-searches',
    group: 'Medication Review',
    requirement: 'Polypharmacy on >10 drugs (Medication Review / Denominators)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-091',
    area: 'clinical-searches',
    group: 'Missed Diagnosis',
    requirement:
      'Possible CKD 3-5 - 2 or more eGFR <60 in the last 2y (including latest) (Missed Diagnosis / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-092',
    area: 'clinical-searches',
    group: 'Missed Diagnosis',
    requirement:
      'Possible DM - 2 or more HBA1c >=48 (exc. GDM & steroid-DM in last 1y or HbRx) (Missed Diagnosis / Standard Searches)',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-093',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On Renin-Angio9tensin System Drugs ACE ARB RI Review as on 2 or more',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-094',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On DOAC - Check U+E/FBC/LFT as none in last 6m + CrCl 30-59 (Medicines Monitoring /',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CS-095',
    area: 'clinical-searches',
    group: 'Medicines Monitoring',
    requirement: 'On Renin-Angiotenson System Drugs (ACE,ARB,RI) Review as on 2 or more',
    completion:
      'Search applies/does not apply decision documented; run date and result reviewed; every returned patient actioned or clinically justified; failed contact escalated; search rerun and signed off.',
  },
  {
    id: 'CAS-001',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'CAS account and distribution list current',
    completion: 'Alerts reach named deputies as well as the main owner.',
  },
  {
    id: 'CAS-002',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'New alerts screened within agreed timeframe',
    completion: 'Date received, applicability decision and rationale recorded.',
  },
  {
    id: 'CAS-003',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Applicable alerts assigned to a clinical owner',
    completion: 'Deadline and required actions are explicit.',
  },
  {
    id: 'CAS-004',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Patient searches validated and run',
    completion: 'Code set, exclusions and search date are recorded.',
  },
  {
    id: 'CAS-005',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Every affected patient actioned',
    completion: 'Review, contact, prescribing change, monitoring or referral is completed.',
  },
  {
    id: 'CAS-006',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Failed contact and vulnerable patients escalated',
    completion: 'Attempts and risk-based next steps are documented.',
  },
  {
    id: 'CAS-007',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Stock, equipment or process actions completed',
    completion: 'Quarantine, replacement, communication and training are evidenced.',
  },
  {
    id: 'CAS-008',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Alert closed by authorised reviewer',
    completion: 'Closure confirms effectiveness, not only task creation.',
  },
  {
    id: 'CAS-009',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Evidence retained and retrievable',
    completion: 'Original alert, search, patient-level closure summary and sign-off available.',
  },
  {
    id: 'CAS-010',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Outstanding and overdue alerts reviewed in governance',
    completion: 'Leaders know the risk and agree escalation.',
  },
  {
    id: 'CAS-011',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Historic alert register reconciled',
    completion: 'No missing alerts during staff absence, site changes or system migration.',
  },
  {
    id: 'CAS-012',
    area: 'cas-alerts',
    group: 'Alert control',
    requirement: 'Learning shared with relevant staff',
    completion: 'Staff can describe recent applicable alerts and changes.',
  },
  {
    id: 'AUD-001',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: '2ww Audit',
    completion:
      'Audit list: 6 Monthly; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-002',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: 'Cold Chain Audit',
    completion:
      'Audit list: Annually; PIR: PIR. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-003',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: 'Handwashing Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-004',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: 'Infection Prevention and control audit and action log',
    completion:
      'Audit list: Annually; PIR: PIR. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-005',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: 'Sharps Safety Audit',
    completion:
      'Audit list: Annually; PIR: PIR. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-006',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: 'Monthly ops manager cleaning audit',
    completion:
      'Audit list: Monthly; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-007',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: 'Infection Prevention annual inspection',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-008',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: 'DNACPR',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-009',
    area: 'surgery-audits',
    group: 'Mandatory',
    requirement: 'Health and Safety Audit 2026',
    completion:
      'Audit list: Annually; PIR: PIR. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-010',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'Accurate Clinical Coding Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-011',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'Asthma/COPD Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-012',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'Cervical Screening Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-013',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'Childhood Immunisation Rates Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-014',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'DNA Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-015',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'GDPR Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-016',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'GP Surgery Mandatory Staff Training Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-017',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'Safeguarding Registers and Follow-Up Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-018',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'Infection audit - Monthly',
    completion:
      'Audit list: Monthly; PIR: PIR. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-019',
    area: 'surgery-audits',
    group: 'Advisory',
    requirement: 'Health and Safety Audit',
    completion:
      'Audit list: Annually; PIR: PIR. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-020',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'Data security audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-021',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'Hypertension Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-022',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'Learning Disabilities Health Check Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-023',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'GP Mandatory Staff Training Audit',
    completion:
      'Audit list: frequency not stated; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-024',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'CQC Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-025',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'Diabetes Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-026',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'GP Surgery Safeguarding Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-027',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'Significant Events Audit',
    completion:
      'Audit list: Annually; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-028',
    area: 'surgery-audits',
    group: 'Enhanced',
    requirement: 'First Aid check list/First Aid Equipment Audit',
    completion:
      'Audit list: Monthly; PIR: not marked. Complete means audit performed, findings recorded, every action completed, governance discussion recorded and effectiveness/re-audit confirmed where needed.',
  },
  {
    id: 'AUD-029',
    area: 'surgery-audits',
    group: 'Clinical audit',
    requirement: 'Polypharmacy',
    completion:
      'Clinical-audit cycle. First outcome: Amber. Complete only when standards/sample, findings, actions, governance sharing, second audit/re-audit and improvement conclusion are recorded.',
  },
  {
    id: 'AUD-030',
    area: 'surgery-audits',
    group: 'Clinical audit',
    requirement: 'Repeat prescribing',
    completion:
      'Clinical-audit cycle. First outcome: Green. Complete only when standards/sample, findings, actions, governance sharing, second audit/re-audit and improvement conclusion are recorded.',
  },
  {
    id: 'AUD-031',
    area: 'surgery-audits',
    group: 'Clinical audit',
    requirement: 'COPD',
    completion:
      'Clinical-audit cycle. First outcome: Green. Complete only when standards/sample, findings, actions, governance sharing, second audit/re-audit and improvement conclusion are recorded.',
  },
  {
    id: 'AUD-032',
    area: 'surgery-audits',
    group: 'Clinical audit',
    requirement: 'Asthma',
    completion:
      'Clinical-audit cycle. First outcome: Green. Complete only when standards/sample, findings, actions, governance sharing, second audit/re-audit and improvement conclusion are recorded.',
  },
  {
    id: 'AUD-033',
    area: 'surgery-audits',
    group: 'Clinical audit',
    requirement: 'DMARDs',
    completion:
      'Clinical-audit cycle. First outcome: Green. Complete only when standards/sample, findings, actions, governance sharing, second audit/re-audit and improvement conclusion are recorded.',
  },
  {
    id: 'AUD-034',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'SEA register and event selection complete',
    completion: 'All significant events and relevant near misses are logged, graded and assigned.',
  },
  {
    id: 'AUD-035',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'Immediate safety and patient-support actions completed',
    completion: 'Ongoing risk is controlled and affected people receive appropriate support.',
  },
  {
    id: 'AUD-036',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'Proportionate investigation and contributing-factor analysis completed',
    completion: 'Chronology, human/system factors and root causes are evidenced.',
  },
  {
    id: 'AUD-037',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'Duty of candour considered and completed where applicable',
    completion: 'Decision, apology, explanation and communication are documented.',
  },
  {
    id: 'AUD-038',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'Multidisciplinary SEA discussion completed and minuted',
    completion: 'Relevant clinical and non-clinical staff contribute; challenge and learning are recorded.',
  },
  {
    id: 'AUD-039',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'Specific action plan completed',
    completion: 'Actions have owners, deadlines and completion evidence.',
  },
  {
    id: 'AUD-040',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'Learning shared with all relevant teams and sites',
    completion: 'Briefings, training or process changes reach staff who need them.',
  },
  {
    id: 'AUD-041',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'Effectiveness review or re-audit completed',
    completion: 'The practice verifies that actions reduced risk and did not create another problem.',
  },
  {
    id: 'AUD-042',
    area: 'surgery-audits',
    group: 'SEA full cycle',
    requirement: 'SEA formally closed through governance',
    completion: 'Closure is authorised only after all actions and effectiveness checks are complete.',
  },
  {
    id: 'RA-001',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Assistance dogs (risk assessment)',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Low.',
  },
  {
    id: 'RA-002',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Books in waiting room',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Low.',
  },
  {
    id: 'RA-003',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Fixed Couch Risk Assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-004',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Health and Safety Risk Assessment (any reference)',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-005',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Home visits (risk assessments carried out)',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-006',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Lone working (risk assessments carried out)',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: High.',
  },
  {
    id: 'RA-007',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Manual Handling risk assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-008',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Oxygen Canister risk assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-009',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Stairs Risk Assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-010',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'GDPR Risk Assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-011',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Work Place Risk Assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-012',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Display Screen Equipment Risk Assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-013',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Disability Risk Assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-014',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Security Risk Assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-015',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'COSHH Risk Assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-016',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Face Mask Wearing',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Low.',
  },
  {
    id: 'RA-017',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Sexual Safety',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Low.',
  },
  {
    id: 'RA-018',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Cold Chain and Fridge Monitoring',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-019',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Non clinical area risk assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Medium.',
  },
  {
    id: 'RA-020',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Fabric noticeboard risk assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Low.',
  },
  {
    id: 'RA-021',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Portable Cooling Fan risk assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Low.',
  },
  {
    id: 'RA-022',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Cleaning pens',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: Low.',
  },
  {
    id: 'RA-023',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Surgery/building',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: not entered.',
  },
  {
    id: 'RA-024',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Fire risk assessment',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: not entered.',
  },
  {
    id: 'RA-025',
    area: 'risk-assessments',
    group: 'Risk-assessment list',
    requirement: 'Legionella',
    completion:
      'Assessment must be suitable, site-specific, approved and in date; all actions completed and effectiveness reviewed. source risk level: not entered.',
  },
  {
    id: 'POL-001',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Absence - Sickness absence management policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-002',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Bullying and harassment policy (England)',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-003',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'DBS policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-004',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Disability - Staff reasonable adjustments agreement',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-005',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Disciplinary policy and procedure',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-006',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Employee Handbook',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-007',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Equality and diversity policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-008',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Flexible working policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-009',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Grievance policy and procedure',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-010',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Guidance for a new joining clinician',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-011',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Homeworking policy and procedures',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-012',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Locum policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-013',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'New and expectant mothers policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-014',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Performance appraisal policy and procedure',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-015',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Recruitment policy and procedure',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-016',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Staff development policy - mandatory training guidelines',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-017',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Staff immunisation policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-018',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Staff induction policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-019',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Staff occupational health policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-020',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'The Training Handbook',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-021',
    area: 'policies',
    group: 'Human Resources',
    requirement: 'Employee and Immediate Family Patient Record Access Policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-022',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Access to medical records policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-023',
    area: 'policies',
    group: 'Compliance',
    requirement: "Access to deceased patients' records policy",
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-024',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Accessible information standard policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-025',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Anti-bribery and counter fraud policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-026',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Caldicott and confidentiality policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-027',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Communication policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-028',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Confidential waste policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-029',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Confidentiality and Data Protection Handbook',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-030',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Consent guidance',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-031',
    area: 'policies',
    group: 'Compliance',
    requirement: 'CQC Handbook',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-032',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Data protection officer policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-033',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Freedom to speak up policy and procedure',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-034',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Gifts and Hospitality Policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-035',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Information governance breach reporting policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-036',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Intranet and social media acceptable use policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-037',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Privacy notice - Candidates applying for work',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-038',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Privacy notice - Children',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-039',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Privacy notice - Employee',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-040',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Privacy notice - Practice',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-041',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Reasonable Adjustment Digital Red Flag Policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-042',
    area: 'policies',
    group: 'Compliance',
    requirement: 'Smartcard policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-043',
    area: 'policies',
    group: 'Compliance',
    requirement: 'UK GDPR policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-044',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Accident reporting policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-045',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Adverse weather (and major travel disruption) policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-046',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Bomb threats and suspect packages procedure',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-047',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Business continuity policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-048',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Cleaning standards and schedule policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-049',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Environmental and sustainability policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-050',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'First aid policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-051',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Health and wellbeing policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-052',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Health, Safety and Risk Management Handbook',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-053',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Key Holder Policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-054',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Lone working policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-055',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Moving and handling policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-056',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Pandemic management policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-057',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Portable appliance testing (PAT) and calibration testing policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-058',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Practice security and risk assessment policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-059',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Safe water policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-060',
    area: 'policies',
    group: 'Health and Safety',
    requirement: 'Waste Management',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-061',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Central Alerting System',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-062',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Clinical supervision policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-063',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Clinical disengagement policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-064',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Clinical Correspondence',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-065',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Co-prescribing Proton Pump Inhibitors with Anticoagulants Associated with Gastric Irritation',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-066',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Disease-modifying anti-rheumatic drugs (DMARD) monitoring guidance document',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-067',
    area: 'policies',
    group: 'Clinical',
    requirement: 'DNACPR policy (England)',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-068',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Failsafe policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-069',
    area: 'policies',
    group: 'Clinical',
    requirement: 'High Risk Drug Prescribing and Monitoring Protocol',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-070',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Infection Prevention Control (IPC) Handbook',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-071',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Managing incoming pathology results',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-072',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Medical emergencies guidance document',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-073',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Medicine reconciliation policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-074',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Medicines management policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-075',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Palliative care and end of life care guidance document',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-076',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Patient Group Direction (PGD)',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-077',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Patient Specific Direction (PSD)',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-078',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Prescribing Policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-079',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Prescribing Protocol',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-080',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Quality improvement and clinical audit policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-081',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Recording of drug allergies',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-082',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Repeat Prescription Reauthorisation Protocol',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-083',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Sepsis guidance document',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-084',
    area: 'policies',
    group: 'Clinical',
    requirement: 'Safe use and Disposal of Sharps Protocol',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-085',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Chaperone Policy',
    completion:
      'Approved copy recorded. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-086',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Complaints procedure',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-087',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Dealing with unreasonable, violent and abusive patients policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-088',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Did Not Attend (DNA) policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-089',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Home visit policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-090',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Managing access and patient demand policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-091',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Patient Registration and Health Check Policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-092',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Access to medical records and online services policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-093',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Patient Participation Group (PPG) policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-094',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Patient social media and acceptable use policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-095',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Removal of patients policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-096',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Shared decision making policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-097',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'The Safeguarding Handbook',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
  {
    id: 'POL-098',
    area: 'policies',
    group: 'Patient Services',
    requirement: 'Translator and interpreter policy',
    completion:
      'Approved copy not recorded in source. Complete only when the current locally approved version, approval/review dates, owner, staff communication and implementation are verified.',
  },
];

export const CQC_SURVEY_SEEDS: CqcSurveySeed[] = [
  { id: 'NPS-01', measure: 'Overall experience of the GP practice', direction: 'HIGHER' },
  { id: 'NPS-02', measure: 'Ease of contacting the practice by telephone', direction: 'HIGHER' },
  { id: 'NPS-03', measure: 'Ease of using the practice website', direction: 'HIGHER' },
  { id: 'NPS-04', measure: 'Ease of using online services', direction: 'HIGHER' },
  { id: 'NPS-05', measure: 'Overall experience of making an appointment', direction: 'HIGHER' },
  { id: 'NPS-06', measure: 'Offered a choice of appointment time or day', direction: 'HIGHER' },
  { id: 'NPS-07', measure: 'Able to see or speak to preferred healthcare professional', direction: 'HIGHER' },
  { id: 'NPS-08', measure: 'Healthcare professional gave enough time', direction: 'HIGHER' },
  { id: 'NPS-09', measure: 'Healthcare professional listened carefully', direction: 'HIGHER' },
  { id: 'NPS-10', measure: 'Healthcare professional treated patient with care and concern', direction: 'HIGHER' },
  { id: 'NPS-11', measure: 'Patient had confidence and trust in healthcare professional', direction: 'HIGHER' },
  {
    id: 'NPS-12',
    measure: 'Healthcare professional recognised or understood mental health needs',
    direction: 'HIGHER',
  },
  { id: 'NPS-13', measure: 'Patient involved as much as wanted in decisions', direction: 'HIGHER' },
  { id: 'NPS-14', measure: 'Patient’s needs were met at last appointment', direction: 'HIGHER' },
  { id: 'NPS-15', measure: 'Practice was helpful when patient needed care', direction: 'HIGHER' },
  { id: 'NPS-16', measure: 'Support to manage long-term condition', direction: 'HIGHER' },
  { id: 'NPS-17', measure: 'Care and support from local services was joined up', direction: 'HIGHER' },
  { id: 'NPS-18', measure: 'Experience of out-of-hours services', direction: 'HIGHER' },
];
