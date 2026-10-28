'use client';

import { usePathname } from 'next/navigation';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { PracticeShell } from '@/components/layout/PracticeShell';
import { navForUser, PRACTICE_NAV } from '@/config/navigation';
import { PracticeProvider, usePracticeLoader } from '@/features/practice/PracticeContext';
import { selectSession, useAppSelector } from '@/store';

/** Pages hidden from the user's menu are also blocked by URL (e.g. HR Policies for practice users). */
function useBlockedForUser(basePath: string) {
  const { user } = useAppSelector(selectSession);
  const pathname = usePathname().replace(/\/$/, '');
  const relative = pathname.slice(basePath.length);
  const visible = new Set(navForUser(PRACTICE_NAV, user).flatMap((section) => section.items.map((item) => item.id)));
  const rootOf = (path: string) => `/${path.split('/')[1]}`;
  return PRACTICE_NAV.flatMap((section) => section.items).some(
    (item) => !visible.has(item.id) && rootOf(item.path) === rootOf(relative || '/'),
  );
}

/** Resolves the practice from the URL slug and renders the practice frame around the page. */
export function PracticeFrame({
  vertical,
  slug,
  children,
}: {
  vertical: string;
  slug: string;
  children: React.ReactNode;
}) {
  const state = usePracticeLoader(slug);
  const practicesHref = `/verticals/${vertical}/practices`;
  const basePath = `${practicesHref}/${slug}`;
  const blocked = useBlockedForUser(basePath);

  if (state.status === 'loading') return <LoadingSpinner fullScreen message="Loading practice..." />;
  if (state.status !== 'ready') {
    return (
      <AccessDenied
        title={state.status === 'error' ? 'Failed to load practice' : "Practice not found or you don't have access"}
        message={state.status === 'error' ? state.message : 'Check the link, or choose a practice from your list.'}
        backHref={practicesHref}
        backLabel="Go to my practices"
      />
    );
  }

  return (
    <PracticeProvider practice={state.practice}>
      <PracticeShell basePath={basePath} practiceName={state.practice.practice_name} practicesHref={practicesHref}>
        {blocked ? <AccessDenied backHref={`${basePath}/dashboard`} backLabel="Go to dashboard" /> : children}
      </PracticeShell>
    </PracticeProvider>
  );
}
