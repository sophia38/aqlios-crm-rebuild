'use client';

import { useCallback } from 'react';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi } from '@/lib/api/practiceManagement';
import type { Practice } from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';

/** Server-side paged practice list shared by the grid and the Practice Management table. */
export function usePracticeList(initial: { pageSize: number; ordering?: string }) {
  const fetcher = useCallback<PagedFetcher<Practice>>(
    (params, signal) => practiceManagementApi.practices(PUBLIC_SUB_APP_ID, params, signal),
    [],
  );
  return usePagedList(fetcher, {
    ...initial,
    errorText: 'Could not load practices.',
    errorToast: 'Failed to load practices',
  });
}
