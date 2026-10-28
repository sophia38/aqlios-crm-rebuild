// Practice Settings sections (docs/practice/08-hr-policies-and-settings.md §2). The rebuild opens
// the first section by default; the live app opens the second (Competency).
export const PRACTICE_SETTINGS_SECTIONS = [
  { slug: 'appointment-configuration', label: 'Appointment Configuration' },
  { slug: 'competency', label: 'Competency' },
  { slug: 'pathway-configuration', label: 'Pathway Configuration' },
  { slug: 'practice-profile', label: 'Practice Profile' },
  { slug: 'templates', label: 'Templates' },
] as const;
