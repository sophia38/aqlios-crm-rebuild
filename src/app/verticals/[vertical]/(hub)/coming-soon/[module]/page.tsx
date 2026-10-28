import { comingSoonModules, VERTICAL_NAV } from '@/config/navigation';
import { ComingSoonModule } from '@/features/shell/ComingSoonModule';

export function generateStaticParams() {
  return comingSoonModules(VERTICAL_NAV).map(({ slug }) => ({ module: slug }));
}

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <ComingSoonModule level="vertical" slug={module} />;
}
