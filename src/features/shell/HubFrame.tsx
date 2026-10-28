'use client';

import { usePathname } from 'next/navigation';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { VerticalShell } from '@/components/layout/VerticalShell';
import { selectSession, useAppSelector } from '@/store';

/**
 * Vertical-level frame plus the access rule: practice users may only use the practice grid here.
 * Other hub routes show "You don't have access" instead of the live app's silent redirect.
 */
export function HubFrame({ vertical, children }: { vertical: string; children: React.ReactNode }) {
  const { user } = useAppSelector(selectSession);
  const pathname = usePathname().replace(/\/$/, '');
  const practicesPath = `/verticals/${vertical}/practices`;
  const allowed = Boolean(user?.isAdmin) || pathname === practicesPath;

  return (
    <VerticalShell vertical={vertical}>
      {allowed ? children : <AccessDenied backHref={practicesPath} backLabel="Go to my practices" />}
    </VerticalShell>
  );
}
