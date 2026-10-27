'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { fetchSession } from '@/store/sessionSlice';
import { selectSession, useAppDispatch, useAppSelector } from '@/store';

/** Where to return after login, kept across the redirect. */
export const RETURN_TO_KEY = 'aqlios-return-to';

/**
 * Wraps every signed-in route. Loads the session from /api/auth/me once, shows the live app's
 * "Verifying session..." state meanwhile, and sends signed-out visitors to /auth/login.
 * Runs in the browser because the app is a static export (GitHub Pages).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { status, error } = useAppSelector(selectSession);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchSession());
  }, [dispatch, status]);

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    try {
      window.sessionStorage.setItem(RETURN_TO_KEY, pathname);
    } catch {
      // Storage unavailable: the user lands on /verticals after login instead.
    }
    router.replace('/auth/login');
  }, [pathname, router, status]);

  if (status === 'authenticated') return children;
  if (status === 'error') return <LoadingSpinner fullScreen message={error ?? 'Something went wrong'} />;
  return <LoadingSpinner fullScreen message="Verifying session..." />;
}
