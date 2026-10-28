import { comingSoonModules, PRACTICE_NAV } from '@/config/navigation';
import { ComingSoonModule } from '@/features/shell/ComingSoonModule';

export function generateStaticParams() {
  return comingSoonModules(PRACTICE_NAV).map(({ slug }) => ({ module: slug }));
}

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <ComingSoonModule level="practice" slug={module} />;
}
