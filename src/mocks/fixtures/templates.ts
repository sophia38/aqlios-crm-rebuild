import type { CommunicationTemplate, TemplateCategory, TemplateStatus, TemplateType } from '@/lib/api/types';
import { isoDaysAgo, mockId } from './random';

// Fictional Template Library seed (docs/super-admin/10-template-library.md → "Data (dev)").
// Standard: 16, Staff Created: 11, with the captured category spread. Live test entries
// ("kk / jjo", "Test1212") are left out on purpose.

type Seed = [TemplateCategory, TemplateType, TemplateStatus, string, string | null, string];

const p = (...lines: string[]) => lines.map((line) => `<p>${line}</p>`).join('');

const STANDARD: Seed[] = [
  [
    'Appointments',
    'EMAIL',
    'ACTIVE',
    'Appointment Reminder',
    'Your appointment at {{practice_name}}',
    p(
      'Dear {{patient_name}},',
      'This is a reminder of your appointment with {{doctor_name}} on {{appointment_date}} at {{appointment_time}}.',
      'If you can no longer attend, please call {{clinic_phone}}.',
    ),
  ],
  [
    'Appointments',
    'MESSAGE',
    'ACTIVE',
    'Appointment Confirmation',
    null,
    p(
      'Hi {{patient_name}}, your appointment at {{practice_name}} is confirmed for {{appointment_date}} at {{appointment_time}}.',
    ),
  ],
  [
    'Appointments',
    'MESSAGE',
    'ACTIVE',
    'Appointment Cancelled',
    null,
    p(
      'Hi {{patient_name}}, your appointment on {{appointment_date}} has been cancelled. Please call {{clinic_phone}} to rebook.',
    ),
  ],
  [
    'Appointments',
    'MESSAGE',
    'INACTIVE',
    'Appointment Rescheduled',
    null,
    p(
      'Hi {{patient_name}}, your appointment has moved to {{appointment_date}} at {{appointment_time}} with {{doctor_name}}.',
    ),
  ],
  [
    'Appointments',
    'EMAIL',
    'ACTIVE',
    'Follow-up Booking Request',
    'Please book a follow-up appointment',
    p(
      'Dear {{patient_name}},',
      '{{doctor_name}} would like to see you again for a follow-up. Please book a slot using the app or call {{clinic_phone}}.',
    ),
  ],
  [
    'Appointments',
    'NOTE',
    'DRAFT',
    'Did Not Attend Note',
    null,
    p(
      'Patient did not attend the appointment on {{appointment_date}} at {{appointment_time}}. Contact attempted by phone.',
    ),
  ],
  [
    'Prescription',
    'EMAIL',
    'ACTIVE',
    'Prescription Update',
    'Your prescription is ready',
    p(
      'Dear {{patient_name}},',
      'Your prescription for {{prescription_details}} has been issued and is ready to collect from your nominated pharmacy.',
    ),
  ],
  [
    'Prescription',
    'MESSAGE',
    'ACTIVE',
    'Repeat Prescription Due',
    null,
    p(
      'Hi {{patient_name}}, your repeat prescription is due for review. Please request it through the app before it runs out.',
    ),
  ],
  [
    'Medicine',
    'EMAIL',
    'ACTIVE',
    'Medication Reminder',
    'A reminder about your medication',
    p('Dear {{patient_name}},', 'Please remember to take your medication as prescribed: {{prescription_details}}.'),
  ],
  [
    'Payment',
    'EMAIL',
    'ACTIVE',
    'Payment Reminder',
    'Payment due for {{service_name}}',
    p('Dear {{patient_name}},', 'A payment of {{payment_amount}} for {{service_name}} is now due. Thank you.'),
  ],
  [
    'Consultation / Requests',
    'MESSAGE',
    'ACTIVE',
    'Request Received',
    null,
    p(
      'Hi {{patient_name}}, we have received your request. A member of the {{practice_name}} team will reply within 2 working days.',
    ),
  ],
  [
    'Diet & Lifestyle',
    'EMAIL',
    'ACTIVE',
    'Healthy Eating Advice',
    'Healthy eating advice from {{practice_name}}',
    p(
      'Dear {{patient_name}},',
      'Following your appointment, here is some advice on a balanced diet and staying active. Ask us if you have any questions.',
    ),
  ],
  [
    'Documents',
    'MESSAGE',
    'ACTIVE',
    'Document Request',
    null,
    p('Hi {{patient_name}}, please upload the documents we asked for so we can complete your request.'),
  ],
  [
    'Blood Tests',
    'EMAIL',
    'ACTIVE',
    'Blood Test Results',
    'Your {{test_name}} results',
    p(
      'Dear {{patient_name}},',
      'Your {{test_name}} results are back: {{result_summary}}.',
      'No further action is needed unless we contact you.',
    ),
  ],
  [
    'Measurements & Vitals',
    'MESSAGE',
    'ACTIVE',
    'Blood Pressure Reading Request',
    null,
    p('Hi {{patient_name}}, please send us a home blood pressure reading this week using the app.'),
  ],
  [
    'Medical History',
    'NOTE',
    'ACTIVE',
    'History Review Note',
    null,
    p('Medical history reviewed with {{patient_name}} (DOB {{patient_dob}}). No changes recorded.'),
  ],
];

const STAFF: [...Seed, string, number][] = [
  [
    'Appointments',
    'MESSAGE',
    'ACTIVE',
    'Running Late Today',
    null,
    p('Hi {{patient_name}}, {{doctor_name}} is running about 20 minutes late today. Sorry for the wait.'),
    'Rhys Owen',
    0,
  ],
  [
    'Prescription',
    'MESSAGE',
    'ACTIVE',
    'Prescription Sent to Pharmacy',
    null,
    p('Hi {{patient_name}}, your prescription has been sent to your pharmacy.'),
    'Priya Nair',
    1,
  ],
  [
    'Prescription',
    'EMAIL',
    'ACTIVE',
    'Medication Review Needed',
    'Medication review',
    p(
      'Dear {{patient_name}},',
      'Before we can issue {{prescription_details}} again, we need to review your medication. Please book a call.',
    ),
    'Rhys Owen',
    0,
  ],
  [
    'Prescription',
    'NOTE',
    'DRAFT',
    'Controlled Drug Check',
    null,
    p('Identity checked before issuing a controlled drug prescription.'),
    'Priya Nair',
    1,
  ],
  [
    'Medicine',
    'MESSAGE',
    'ACTIVE',
    'Inhaler Technique Reminder',
    null,
    p('Hi {{patient_name}}, here is a short guide to using your inhaler correctly.'),
    'Rhys Owen',
    0,
  ],
  [
    'Payment',
    'EMAIL',
    'ACTIVE',
    'Private Letter Fee',
    'Fee for your letter',
    p(
      'Dear {{patient_name}},',
      'The fee for your letter is {{payment_amount}}. We will start once payment is received.',
    ),
    'Priya Nair',
    1,
  ],
  [
    'Consultation / Requests',
    'MESSAGE',
    'ACTIVE',
    'More Information Needed',
    null,
    p('Hi {{patient_name}}, we need a little more information about your request. Please reply in the app.'),
    'Rhys Owen',
    0,
  ],
  [
    'Consultation / Requests',
    'NOTE',
    'ACTIVE',
    'Triage Outcome Note',
    null,
    p('Request triaged as routine and assigned to {{doctor_name}}.'),
    'Priya Nair',
    1,
  ],
  [
    'Blood Tests',
    'MESSAGE',
    'ACTIVE',
    'Fasting Before Your Test',
    null,
    p('Hi {{patient_name}}, please do not eat for 12 hours before your {{test_name}}. Water is fine.'),
    'Rhys Owen',
    0,
  ],
  [
    'Documents',
    'EMAIL',
    'INACTIVE',
    'Fit Note Ready',
    'Your fit note',
    p('Dear {{patient_name}},', 'Your fit note is ready and attached to your record in the app.'),
    'Priya Nair',
    1,
  ],
  [
    'Diet & Lifestyle',
    'MESSAGE',
    'ACTIVE',
    'Stop Smoking Support',
    null,
    p('Hi {{patient_name}}, our stop smoking service can help. Reply YES and we will call you.'),
    'Rhys Owen',
    0,
  ],
];

export function buildTemplates(practiceNames: string[]): CommunicationTemplate[] {
  const standard = STANDARD.map(([category, type, status, name, subject, body], index) => {
    const created = isoDaysAgo(97 - index, 10);
    return {
      id: mockId('template-standard', index),
      scope: 'STANDARD' as const,
      name,
      category,
      type,
      status,
      subject,
      body,
      created_by_name: 'Aqlios Public Vertical Admin',
      business_name: null,
      created_at: created,
      updated_at: created,
    };
  });
  const staff = STAFF.map(([category, type, status, name, subject, body, author, practice], index) => {
    const created = isoDaysAgo(40 - index * 3, 14);
    return {
      id: mockId('template-staff', index),
      scope: 'STAFF' as const,
      name,
      category,
      type,
      status,
      subject,
      body,
      created_by_name: author,
      business_name: practiceNames[practice] ?? null,
      created_at: created,
      updated_at: created,
    };
  });
  return [...standard, ...staff];
}
