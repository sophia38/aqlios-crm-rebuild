'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi, practiceSlug } from '@/lib/api/practiceManagement';
import type { Practice } from '@/lib/api/types';

// The practice comes from the URL slug (REBUILD-PLAN.md §4), never only from client state.

type PracticeState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; practice: Practice };

const PracticeContext = createContext<Practice | null>(null);

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

export function PracticeProvider({ practice, children }: { practice: Practice; children: React.ReactNode }) {
  return <PracticeContext.Provider value={practice}>{children}</PracticeContext.Provider>;
}

/** The practice for the current practice-level route. */
export function useCurrentPractice(): Practice {
  const practice = useContext(PracticeContext);
  if (!practice) throw new Error('useCurrentPractice must be used inside a practice route');
  return practice;
}
