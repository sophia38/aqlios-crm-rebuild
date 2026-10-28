'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import type { Paginated } from '@/lib/api/types';

export interface PagedQuery {
  page: number; // 0-based for MUI
  pageSize: number;
  ordering?: string;
  search: string;
  /** Extra filters sent as-is (snake_case keys); empty values are dropped by the HTTP client. */
  filters: Record<string, string>;
}

export interface PagedListOptions {
  pageSize: number;
  ordering?: string;
  /** Inline error row text, e.g. "Could not load roles." */
  errorText: string;
  /** Error toast, e.g. "Failed to load roles". A function can pick the copy from the error. */
  errorToast: string | ((error: unknown) => string);
}

export type PagedFetcher<Row> = (
  params: { page: number; page_size: number; ordering?: string; search?: string } & Record<string, unknown>,
  signal: AbortSignal,
) => Promise<Paginated<Row>>;

/** Server-side paged list with search, ordering and filters (shared by every DataTable page). */
export function usePagedList<Row>(fetcher: PagedFetcher<Row>, options: PagedListOptions) {
  const { enqueueSnackbar } = useSnackbar();
  const { errorText, errorToast } = options;
  const [query, setQuery] = useState<PagedQuery>({
    page: 0,
    pageSize: options.pageSize,
    ordering: options.ordering,
    search: '',
    filters: {},
  });
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetcher(
      {
        page: query.page + 1,
        page_size: query.pageSize,
        ordering: query.ordering,
        search: query.search.trim() || undefined,
        ...query.filters,
      },
      controller.signal,
    )
      .then((result) => {
        setRows(result.results);
        setCount(result.count);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(errorText);
        enqueueSnackbar(typeof errorToast === 'function' ? errorToast(cause) : errorToast, { variant: 'error' });
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [fetcher, query, reloadKey, errorText, errorToast, enqueueSnackbar]);

  /** Every query change shows the loading state and starts again from a fresh request. */
  const update = useCallback((changes: Partial<PagedQuery>) => {
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
    setFilter: (id: string, value: string) => {
      setLoading(true);
      setQuery((current) => ({ ...current, filters: { ...current.filters, [id]: value }, page: 0 }));
    },
    clear: () => update({ search: '', filters: {}, page: 0 }),
  };
}
