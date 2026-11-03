'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { ticketsApi } from '@/lib/api/tickets';
import type { TicketDetail } from '@/lib/api/types';

export type TicketLoadState =
  { status: 'loading' } | { status: 'not-found' } | { status: 'error' } | { status: 'ready'; ticket: TicketDetail };

/**
 * Loads one consultation (and records the viewer, as live). `refresh` reloads it in the background
 * without the full-page spinner; `reload` starts again from the spinner (Try again).
 */
export function useTicketDetail(practiceId: string, ticketId: string) {
  const { enqueueSnackbar } = useSnackbar();
  const [state, setState] = useState<TicketLoadState>({ status: 'loading' });
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = `${practiceId}:${ticketId}:${reloadKey}`;
  if (loadedKey !== requestKey && state.status !== 'loading') {
    setLoadedKey(requestKey);
    setState({ status: 'loading' });
  }

  useEffect(() => {
    const controller = new AbortController();
    const key = `${practiceId}:${ticketId}:${reloadKey}`;
    const settle = (next: TicketLoadState) => {
      setLoadedKey(key);
      setState(next);
    };
    ticketsApi
      .get(PUBLIC_SUB_APP_ID, practiceId, ticketId, controller.signal)
      .then((ticket) => settle({ status: 'ready', ticket }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.code === 404) {
          settle({ status: 'not-found' });
          return;
        }
        settle({ status: 'error' });
        enqueueSnackbar('Failed to load the consultation', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, ticketId, reloadKey, enqueueSnackbar]);

  const refresh = useCallback(async () => {
    try {
      const ticket = await ticketsApi.get(PUBLIC_SUB_APP_ID, practiceId, ticketId);
      setState({ status: 'ready', ticket });
    } catch {
      enqueueSnackbar('Failed to refresh the consultation', { variant: 'error' });
    }
  }, [practiceId, ticketId, enqueueSnackbar]);

  const update = useCallback((ticket: TicketDetail) => setState({ status: 'ready', ticket }), []);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { state, update, refresh, reload };
}
