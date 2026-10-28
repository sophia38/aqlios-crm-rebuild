import { practiceSlug } from '@/lib/api/practiceManagement';
import { buildPractices } from '@/mocks/fixtures/practices';
import { PracticeFrame } from '@/features/shell/PracticeFrame';

// Option A (docs/plans/phase-2-frames-and-components.md §1): every practice is pre-built so URLs
// match the live app. Slugs come from the demo fixtures; live mode would read them at build time.
export function generateStaticParams() {
  return buildPractices().map((practice) => ({ practiceSlug: practiceSlug(practice.practice_name) }));
}

export default async function PracticeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vertical: string; practiceSlug: string }>;
}) {
  const { vertical, practiceSlug: slug } = await params;
  return (
    <PracticeFrame vertical={vertical} slug={slug}>
      {children}
    </PracticeFrame>
  );
}
