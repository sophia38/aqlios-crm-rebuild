'use client';

import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { appointmentsApi } from '@/lib/api/appointments';
import { complianceApi } from '@/lib/api/compliance';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { leaveApi } from '@/lib/api/leave';
import { patientsApi } from '@/lib/api/patients';
import { rotaApi } from '@/lib/api/rota';
import { staffApi } from '@/lib/api/staff';
import type { PanelState } from '@/components/data/DashboardPanel';

// Practice dashboard data (Figma 9107:72525). Every panel reads an API the practice modules already
// use, each on its own so one failure (or a role without access) doesn't blank the dashboard.

export interface Section<T> {
  state: PanelState;
  data: T | null;
  /** The API refused this user (403): the panel says so rather than offering Try again. */
  forbidden: boolean;
  reload: () => void;
}

function useSection<T>(load: (signal: AbortSignal) => Promise<T>, toast: string): Section<T> {
  const { enqueueSnackbar } = useSnackbar();
  const [state, setState] = useState<PanelState>('loading');
  const [data, setData] = useState<T | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((result) => {
        setData(result);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const refused = error instanceof ApiError && error.isForbidden;
        setForbidden(refused);
        setState('error');
        if (!refused) enqueueSnackbar(toast, { variant: 'error' });
      });
    return () => controller.abort();
  }, [load, toast, attempt, enqueueSnackbar]);

  const reload = useCallback(() => {
    setState('loading');
    setAttempt((value) => value + 1);
  }, []);

  return { state, data, forbidden, reload };
}

export const todayIso = () => dayjs().format('YYYY-MM-DD');
export const weekStartIso = () => {
  const today = dayjs();
  return today.subtract((today.day() + 6) % 7, 'day').format('YYYY-MM-DD');
};

export function usePracticeDashboard(practiceId: string) {
  const sub = PUBLIC_SUB_APP_ID;
  const weekStart = weekStartIso();

  const staff = useSection(
    useCallback(
      (signal: AbortSignal) =>
        Promise.all([
          staffApi.summary(sub, practiceId, signal),
          staffApi.list(sub, practiceId, { page: 1, page_size: 100, tab: 'staff' }, signal),
        ]).then(([summary, list]) => ({ summary, members: list.results })),
      [sub, practiceId],
    ),
    'Failed to load staff',
  );

  const rota = useSection(
    useCallback(
      (signal: AbortSignal) => rotaApi.week(sub, { week_start: weekStart, practice_id: practiceId }, signal),
      [sub, practiceId, weekStart],
    ),
    'Failed to load the rota',
  );

  const appointments = useSection(
    useCallback(
      (signal: AbortSignal) => appointmentsApi.list(sub, practiceId, { week_start: weekStart, page_size: 100 }, signal),
      [sub, practiceId, weekStart],
    ),
    'Failed to load appointments',
  );

  const leave = useSection(
    useCallback(
      (signal: AbortSignal) =>
        Promise.all([
          leaveApi.requests(
            sub,
            practiceId,
            { tab: 'requests', page: 1, page_size: 5, ordering: 'start_date' },
            signal,
          ),
          leaveApi.requests(
            sub,
            practiceId,
            { tab: 'history', page: 1, page_size: 3, ordering: '-updated_at' },
            signal,
          ),
        ]).then(([pending, history]) => ({ pending, history })),
      [sub, practiceId],
    ),
    'Failed to load leave',
  );

  const compliance = useSection(
    useCallback(
      (signal: AbortSignal) => complianceApi.dashboard(sub, { practice_id: practiceId, page_size: 100 }, signal),
      [sub, practiceId],
    ),
    'Failed to load compliance',
  );

  const patients = useSection(
    useCallback(
      (signal: AbortSignal) =>
        patientsApi.list(sub, practiceId, { page: 1, page_size: 1 }, signal).then((page) => page.count),
      [sub, practiceId],
    ),
    'Failed to load patients',
  );

  return { staff, rota, appointments, leave, compliance, patients };
}
