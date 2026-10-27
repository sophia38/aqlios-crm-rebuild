'use client';

import { useEffect, useState } from 'react';
import { API_MODE } from '@/lib/api/config';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

/**
 * Starts the MSW worker before rendering the app in mock mode, so the first API call is already
 * intercepted. In live mode it renders children straight away and the mock code is never loaded.
 */
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(API_MODE === 'live');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (API_MODE === 'live') return;
    let cancelled = false;
    import('./browser')
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => !cancelled && setReady(true))
      .catch((reason: unknown) => !cancelled && setError(reason instanceof Error ? reason.message : String(reason)));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <LoadingSpinner fullScreen message={`Demo data could not start: ${error}`} />;
  if (!ready) return <LoadingSpinner fullScreen message="Loading..." />;
  return children;
}
