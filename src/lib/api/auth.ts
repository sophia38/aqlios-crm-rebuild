import { authRequest } from './http';
import type { AuthMe, SubAppsResponse } from './types';

export const authApi = {
  me: (signal?: AbortSignal) => authRequest<AuthMe>('/me', { signal }),
  subApps: (signal?: AbortSignal) => authRequest<SubAppsResponse>('/sub-apps', { signal }),
  /** Mock-only: the live app signs in through the shared 31G auth service. */
  login: (email: string, password: string) =>
    authRequest<{ message: string }>('/login', { method: 'POST', body: { email, password } }),
  logout: () => authRequest<{ message: string }>('/logout', { method: 'POST' }),
};
