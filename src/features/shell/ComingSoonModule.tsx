'use client';

import { comingSoonModules, PRACTICE_NAV, VERTICAL_NAV } from '@/config/navigation';
import { ComingSoonPage } from './PlaceholderPages';

/** `coming-soon/{module}` at either level: name and icon come from the menu config. */
export function ComingSoonModule({ level, slug }: { level: 'vertical' | 'practice'; slug: string }) {
  const modules = comingSoonModules(level === 'vertical' ? VERTICAL_NAV : PRACTICE_NAV);
  const found = modules.find((item) => item.slug === slug) ?? modules[0];
  return <ComingSoonPage title={found.label} icon={found.icon} />;
}
