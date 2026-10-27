import { HttpResponse } from 'msw/http';
import type { Paginated } from '@/lib/api/types';

// Builders for the live API's response envelope (docs/api-shapes.md).

export function ok<T>(data: T, message = 'Success') {
  return HttpResponse.json({ status: { code: 200, message }, data, errors: [] });
}

export function created<T>(data: T, message = 'Created successfully') {
  return HttpResponse.json({ status: { code: 201, message }, data, errors: [] }, { status: 201 });
}

export function fail(code: number, message: string, errors: unknown[] = []) {
  return HttpResponse.json({ status: { code, message }, data: null, errors }, { status: code });
}

export const unauthorized = () => fail(401, 'Authentication credentials were not provided');
export const forbidden = () => fail(403, 'You do not have permission to perform this action!');

/** Django REST-style page: `?page=` (1-based) and `?page_size=` (capped at 100 like the live backend). */
export function paginate<T>(request: Request, items: T[], defaultPageSize = 10): Paginated<T> {
  const url = new URL(request.url);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('page_size')) || defaultPageSize, 1), 100);
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const start = (page - 1) * pageSize;
  const link = (target: number) => {
    const next = new URL(url);
    next.searchParams.set('page', String(target));
    return next.toString();
  };
  return {
    count: items.length,
    next: start + pageSize < items.length ? link(page + 1) : null,
    previous: page > 1 ? link(page - 1) : null,
    results: items.slice(start, start + pageSize),
  };
}

/** Applies `?ordering=field` / `?ordering=-field` to plain objects. */
export function order<T extends object>(request: Request, items: T[], fallback?: string): T[] {
  const ordering = new URL(request.url).searchParams.get('ordering') ?? fallback;
  if (!ordering) return items;
  const desc = ordering.startsWith('-');
  const key = (desc ? ordering.slice(1) : ordering) as keyof T;
  return [...items].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    const result =
      typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''));
    return desc ? -result : result;
  });
}
