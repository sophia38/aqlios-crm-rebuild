import { Suspense } from 'react';
import { PRACTICE_SETTINGS_SECTIONS } from '@/config/practiceSettings';
import { PracticeSettingsPage } from '@/features/settings/PracticeSettingsPage';

export function generateStaticParams() {
  return PRACTICE_SETTINGS_SECTIONS.map(({ slug }) => ({ section: slug }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  // Templates keeps its tab in `?tab=`.
  return (
    <Suspense>
      <PracticeSettingsPage section={section} />
    </Suspense>
  );
}
