'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi, practiceSlug } from '@/lib/api/practiceManagement';
import type { Practice } from '@/lib/api/types';

// The practice comes from the URL slug (REBUILD-PLAN.md §4), never only from client state.

type PracticeState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; practice: Practice };

const PracticeContext = createContext<{ practice: Practice; basePath: string } | null>(null);

/** A breadcrumb after the shell's own "Dashboard" crumb; `href` is relative to the practice. */
export interface PracticeCrumb {
  label: string;
  href?: string;
}

const CrumbsContext = createContext<((crumbs: PracticeCrumb[] | null) => void) | null>(null);

/** Loads every practice the user can see (the API caps pages at 100) and finds the one matching the slug. */
async function findPracticeBySlug(slug: string, signal: AbortSignal): Promise<Practice | null> {
  for (let page = 1; ; page++) {
    const result = await practiceManagementApi.practices(PUBLIC_SUB_APP_ID, { page, page_size: 100 }, signal);
    const match = result.results.find((practice) => practiceSlug(practice.practice_name) === slug);
    if (match) return match;
    if (!result.next) return null;
  }
}

export function usePracticeLoader(slug: string): PracticeState {
  const [state, setState] = useState<PracticeState>({ status: 'loading' });
  const [loadedSlug, setLoadedSlug] = useState(slug);

  // Reset while a different practice loads (switching practices keeps the frame mounted).
  if (loadedSlug !== slug) {
    setLoadedSlug(slug);
    setState({ status: 'loading' });
  }

  useEffect(() => {
    const controller = new AbortController();
    findPracticeBySlug(slug, controller.signal)
      .then((practice) => setState(practice ? { status: 'ready', practice } : { status: 'not-found' }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Failed to load practice' });
      });
    return () => controller.abort();
  }, [slug]);

  return state;
}

export function PracticeProvider({
  practice,
  basePath,
  onCrumbsChange,
  children,
}: {
  practice: Practice;
  /** `/verticals/public/practices/{slug}` */
  basePath: string;
  onCrumbsChange: (crumbs: PracticeCrumb[] | null) => void;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ practice, basePath }), [practice, basePath]);
  return (
    <PracticeContext.Provider value={value}>
      <CrumbsContext.Provider value={onCrumbsChange}>{children}</CrumbsContext.Provider>
    </PracticeContext.Provider>
  );
}

function usePracticeRoute() {
  const route = useContext(PracticeContext);
  if (!route) throw new Error('Practice hooks must be used inside a practice route');
  return route;
}

/** The practice for the current practice-level route. */
export function useCurrentPractice(): Practice {
  return usePracticeRoute().practice;
}

/** Builds a link inside the current practice, e.g. `practiceHref('/patient-management')`. */
export function usePracticeHref() {
  const { basePath } = usePracticeRoute();
  return useCallback((path: string) => `${basePath}${path}`, [basePath]);
}

/**
 * Shows these crumbs in the practice top bar after "Dashboard" (docs/plans/phase-5-practice-modules.md,
 * practice anatomy). Pages without crumbs keep the icon-and-title top bar.
 */
export function usePracticeCrumbs(crumbs: PracticeCrumb[]) {
  const setCrumbs = useContext(CrumbsContext);
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    setCrumbs?.(JSON.parse(key) as PracticeCrumb[]);
    return () => setCrumbs?.(null);
  }, [setCrumbs, key]);
}
