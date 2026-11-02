import type { TemplateStatus, TemplateType } from '@/lib/api/types';

export const TYPE_LABEL: Record<TemplateType, string> = { MESSAGE: 'Message', EMAIL: 'Email', NOTE: 'Notes' };

/** Message keeps live's blue and Email its purple; Notes gets teal so the two aren't confused (live: same blue). */
export const TYPE_TONE: Record<TemplateType, 'info' | 'secondary' | 'primary'> = {
  MESSAGE: 'info',
  EMAIL: 'secondary',
  NOTE: 'primary',
};

export const STATUS_LABEL: Record<TemplateStatus, string> = { ACTIVE: 'Active', INACTIVE: 'Inactive', DRAFT: 'Draft' };

/** Fictional sample values for the phone preview. */
export const SAMPLE_DATA: Record<string, string> = {
  patient_name: 'Jordan Hale',
  patient_dob: '14/03/1988',
  appointment_date: '05/11/2026',
  appointment_time: '10:30',
  practice_name: 'Ashford Medical Centre',
  service_name: 'Travel vaccination',
  doctor_name: 'Dr Maya Jones',
  clinic_name: 'Ashford Medical Centre',
  clinic_phone: '0113 496 0123',
  payment_amount: '£25.00',
  prescription_details: 'Amoxicillin 500mg, three times a day for 7 days',
  test_name: 'full blood count',
  result_summary: 'all values within the normal range',
};

export const PREVIEW_PRACTICE = SAMPLE_DATA.practice_name;
