import { PRACTICE_SETTINGS_SECTIONS } from '@/config/practiceSettings';
import { PracticeSettingsInterim } from '@/features/shell/PracticeSettingsInterim';

export function generateStaticParams() {
  return PRACTICE_SETTINGS_SECTIONS.map(({ slug }) => ({ section: slug }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <PracticeSettingsInterim section={section} />;
}
