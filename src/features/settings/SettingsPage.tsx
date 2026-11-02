'use client';

import { useSearchParams } from 'next/navigation';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { SettingsShell } from '@/components/layout/SettingsShell';
import { CompetencySection } from './CompetencySection';
import { GlobalAppointmentConfigSection } from './GlobalAppointmentConfigSection';
import { GlobalPracticeConfigSection } from './GlobalPracticeConfigSection';
import { PathwaySection } from './PathwaySection';

const SETTINGS_HREF = '/verticals/public/settings';

// Live `?section=` values, in the live order (docs/super-admin/09-settings.md).
const SECTIONS = [
  {
    key: 'practice-configuration',
    label: 'Global Practice Configuration',
    subtitle: 'Manage global practice configurations here.',
    Body: GlobalPracticeConfigSection,
  },
  {
    key: 'appointment-configuration',
    label: 'Global Appointment Configuration',
    subtitle: 'Manage global appointment configurations here.',
    Body: GlobalAppointmentConfigSection,
  },
  {
    key: 'competency',
    label: 'Competency',
    subtitle: 'Manage clinical competency categories and sub-types used for staff assignment and task routing.',
    Body: CompetencySection,
  },
  {
    key: 'pathway-configuration',
    label: 'Pathway Configuration',
    subtitle: 'Manage practices-wide pathway configuration settings here.',
    Body: PathwaySection,
  },
];

/** Vertical Settings: `?section=` picks the section; unknown values fall back to the first. */
export function SettingsPage() {
  const requested = useSearchParams().get('section');
  const section = SECTIONS.find((item) => item.key === requested) ?? SECTIONS[0];
  const { Body } = section;
  const hrefFor = (key: string) => `${SETTINGS_HREF}?section=${key}`;

  return (
    <HubManagementLayout
      hubManagementBreadcrumbs={[{ label: 'Settings', href: hrefFor(SECTIONS[0].key) }, { label: section.label }]}
    >
      <ModulePageHeader icon={<SettingsOutlined />} title="Settings" />
      <SettingsShell
        sections={SECTIONS}
        active={section.key}
        hrefFor={hrefFor}
        title={section.label}
        subtitle={section.subtitle}
      >
        {/* Keyed so switching sections starts each one fresh. */}
        <Body key={section.key} />
      </SettingsShell>
    </HubManagementLayout>
  );
}
