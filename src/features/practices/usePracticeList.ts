'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi } from '@/lib/api/practiceManagement';
import type { Practice } from '@/lib/api/types';

export interface PracticeListQuery {
  page: number; // 0-based for MUI
  pageSize: number;
  ordering?: string;
  search: string;
}

/** Server-side paged practice list shared by the grid and the Practice Management table. */
export function usePracticeList(initial: Omit<PracticeListQuery, 'page' | 'search'>) {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState<PracticeListQuery>({ page: 0, search: '', ...initial });
  const [rows, setRows] = useState<Practice[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    practiceManagementApi
      .practices(
        PUBLIC_SUB_APP_ID,
        {
          page: query.page + 1,
          page_size: query.pageSize,
          ordering: query.ordering,
          search: query.search.trim() || undefined,
        },
        controller.signal,
      )
      .then((result) => {
        setRows(result.results);
        setCount(result.count);
        setError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError('Could not load practices.');
        enqueueSnackbar('Failed to load practices', { variant: 'error' });
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [query, reloadKey, enqueueSnackbar]);

  /** Every query change shows the loading state and starts again from a fresh request. */
  const update = useCallback((changes: Partial<PracticeListQuery>) => {
    setLoading(true);
    setQuery((current) => ({ ...current, ...changes }));
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  return {
    query,
    rows,
    count,
    loading,
    error,
    reload,
    setPage: (page: number) => update({ page }),
    setPageSize: (pageSize: number) => update({ pageSize, page: 0 }),
    setOrdering: (ordering: string) => update({ ordering, page: 0 }),
    setSearch: (search: string) => update({ search, page: 0 }),
  };
}
