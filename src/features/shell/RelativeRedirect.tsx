'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

/** Client redirect to a child segment (static export has no server redirects), e.g. /settings → /settings/competency. */
export function RelativeRedirect({ to }: { to: string }) {
  const router = useRouter();
  const pathname = usePathname().replace(/\/$/, '');
  useEffect(() => router.replace(`${pathname}/${to}`), [pathname, router, to]);
  return <LoadingSpinner />;
}
