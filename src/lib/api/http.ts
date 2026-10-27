import { API_ORIGIN, CRM_API } from './config';
import type { ApiEnvelope } from './types';

export class ApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly errors: unknown[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.code === 401;
  }

  get isForbidden() {
    return this.code === 403;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export function buildUrl(path: string, query?: Query) {
  const url = new URL(
    `${API_ORIGIN}${path}`,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  );
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return API_ORIGIN ? url.toString() : `${url.pathname}${url.search}`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

async function send(path: string, { method = 'GET', query, body, signal }: RequestOptions) {
  return fetch(buildUrl(path, query), {
    method,
    signal,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/**
 * Calls a CRM endpoint (`/api/crm/api/...`) and unwraps the `{ status, data, errors }` envelope.
 * Throws ApiError with the envelope's code and message on failure. A 401 here does NOT log the
 * user out: only the session check (`/api/auth/me`) decides that (REBUILD-PLAN.md §8).
 */
export async function crmRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(`${CRM_API}${path}`, options);
  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Non-JSON body (network proxy, HTML error page): fall through to a generic error.
  }
  if (!response.ok || !envelope || envelope.data === null) {
    throw new ApiError(
      envelope?.status.code ?? response.status,
      envelope?.status.message ?? `Request failed (${response.status})`,
      envelope?.errors,
    );
  }
  return envelope.data;
}

/** Calls an auth endpoint (`/api/auth/...`). These responses have no envelope. */
export async function authRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(`/api/auth${path}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as { message?: string } | null)?.message ?? `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return body as T;
}
