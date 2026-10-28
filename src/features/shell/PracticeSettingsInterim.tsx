'use client';

import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { ComingSoonPlaceholder } from '@/components/feedback/ComingSoonPlaceholder';
import { PRACTICE_SETTINGS_SECTIONS } from '@/config/practiceSettings';
import { InterimModulePage } from './PlaceholderPages';

export function PracticeSettingsInterim({ section }: { section: string }) {
  const current = PRACTICE_SETTINGS_SECTIONS.find((item) => item.slug === section) ?? PRACTICE_SETTINGS_SECTIONS[0];
  if (current.slug === 'practice-profile') {
    // A placeholder in the live app as well.
    return (
      <ComingSoonPlaceholder
        title="Practice Profile"
        size="practice"
        message="We are currently building the public practice profile management system. Soon you will be able to view and manage your practice profile details here."
      />
    );
  }
  return (
    <InterimModulePage
      title={`Settings · ${current.label}`}
      icon={SettingsOutlined}
      phase={5}
      spec="docs/practice/08-hr-policies-and-settings.md"
    />
  );
}
