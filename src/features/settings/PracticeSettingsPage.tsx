'use client';

import { ComingSoonPlaceholder } from '@/components/feedback/ComingSoonPlaceholder';
import { SettingsShell } from '@/components/layout/SettingsShell';
import { PRACTICE_SETTINGS_SECTIONS } from '@/config/practiceSettings';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { TemplateLibraryPage } from '@/features/templates/TemplateLibraryPage';
import { CompetencySection } from './CompetencySection';
import { GlobalAppointmentConfigSection } from './GlobalAppointmentConfigSection';
import { PathwaySection } from './PathwaySection';

type SectionSlug = (typeof PRACTICE_SETTINGS_SECTIONS)[number]['slug'];

const SUBTITLES: Record<SectionSlug, string | undefined> = {
  // Live: "Manage Appointment settings here." (capital A).
  'appointment-configuration': 'Manage appointment settings here.',
  competency: 'Manage clinical competency categories and sub-types used for staff assignment and task routing.',
  'pathway-configuration': "Manage this practice's pathway configuration here.",
  'practice-profile': undefined,
  templates: 'Manage the message, email and note templates staff use.',
};

/**
 * Practice Settings (docs/practice/08-hr-policies-and-settings.md §2, plan §8): the vertical sections
 * scoped to the practice, as path routes (`settings/{section}`), under the breadcrumb `Settings / {Section}`.
 */
export function PracticeSettingsPage({ section }: { section: string }) {
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const current = PRACTICE_SETTINGS_SECTIONS.find((item) => item.slug === section) ?? PRACTICE_SETTINGS_SECTIONS[0];
  const hrefFor = (slug: string) => practiceHref(`/settings/${slug}`);
  usePracticeCrumbs([
    { label: 'Settings', href: hrefFor(PRACTICE_SETTINGS_SECTIONS[0].slug) },
    { label: current.label },
  ]);

  return (
    <SettingsShell
      sections={PRACTICE_SETTINGS_SECTIONS.map(({ slug, label }) => ({ key: slug, label }))}
      active={current.slug}
      hrefFor={hrefFor}
      title={current.label}
      subtitle={SUBTITLES[current.slug]}
    >
      {/* Keyed by practice, so switching practice starts the section again. */}
      {current.slug === 'appointment-configuration' && (
        <GlobalAppointmentConfigSection key={practice.id} practiceId={practice.id} />
      )}
      {current.slug === 'competency' && <CompetencySection key={practice.id} practiceId={practice.id} />}
      {current.slug === 'pathway-configuration' && <PathwaySection key={practice.id} practiceId={practice.id} />}
      {current.slug === 'practice-profile' && (
        // A placeholder in the live app as well.
        <ComingSoonPlaceholder
          title="Practice Profile"
          size="practice"
          message="We are currently building the public practice profile management system. Soon you will be able to view and manage your practice profile details here."
        />
      )}
      {current.slug === 'templates' && <TemplateLibraryPage embedded />}
    </SettingsShell>
  );
}
