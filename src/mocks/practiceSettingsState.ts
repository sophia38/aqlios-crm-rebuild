import type { Competency, GlobalAppointmentConfiguration, PathwayChannel } from '@/lib/api/types';
import { isoDaysAgo, mockId } from './fixtures/random';
import { getDb, saveDb } from './store';

// Practice Settings mock state (docs/plans/phase-5-practice-modules.md §8), created the first time a
// practice's settings are read. The appointment configuration starts from the vertical one with the
// captured practice values; two fictional practice-level competencies sit beside the vertical rows;
// pathway channels the practice changes are kept as overrides ("Custom").

export interface PracticeSettingsRecord {
  appointment: GlobalAppointmentConfiguration;
  competencies: Competency[];
  /** Pathway id → the practice's channels, once it changes one. */
  pathwayChannels: Record<string, Record<PathwayChannel, boolean>>;
}

function seedPractice(practiceId: string): PracticeSettingsRecord {
  const db = getDb();
  const roleId = (name: string) => db.roles.find((role) => role.name === name)?.id ?? db.roles[0]?.id ?? '';
  const competency = (
    index: number,
    name: string,
    description: string,
    roles: string[],
    minutes: number,
    subTypes: string[],
    daysAgo: number,
  ): Competency => ({
    id: mockId(`practice-competency:${practiceId}`, index),
    name,
    description,
    role_ids: roles.map(roleId),
    role_names: [],
    slot_duration_minutes: minutes,
    sub_types: subTypes,
    staff_assigned: index + 1,
    created_at: isoDaysAgo(daysAgo),
    practice_id: practiceId,
  });
  return {
    // Captured practice values: open slots within 2 hours, no SMS reminder, email 2 hours before,
    // same-day booking allowed.
    appointment: {
      ...structuredClone(db.globalAppointmentConfig),
      offered_slot_hours: 2,
      sms_reminder: 'NONE',
      email_reminder: 'BEFORE_2H',
      same_day_booking: true,
      urgent_booking: 'ADMIN_STAFF',
      routine_booking: 'ADMIN_STAFF',
    },
    competencies: [
      competency(
        0,
        'Respiratory',
        'Asthma and COPD reviews run by the practice.',
        ['Nurse'],
        20,
        ['Asthma', 'COPD', 'Inhaler technique'],
        12,
      ),
      competency(
        1,
        'Childhood Immunisations',
        'Routine vaccinations for babies and children.',
        ['Nurse', 'Clinician'],
        15,
        ['8-week vaccines', 'Pre-school booster'],
        5,
      ),
    ],
    pathwayChannels: {},
  };
}

export function practiceSettingsFor(practiceId: string): PracticeSettingsRecord {
  const db = getDb();
  if (!db.practiceSettings[practiceId]) {
    db.practiceSettings[practiceId] = seedPractice(practiceId);
    saveDb();
  }
  return db.practiceSettings[practiceId];
}
