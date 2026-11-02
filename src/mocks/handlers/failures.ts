import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import { fail } from '../respond';

/**
 * Mock-only failure switch, so error states can be demoed and tested (REBUILD-PLAN.md §7.3).
 * Set `localStorage['aqlios-mock-fail']` to a URL fragment ("/pathways/"), optionally with a method
 * before it ("PATCH /pathways/") and a status code after it ("GET /staff/dashboard/ 401"); matching CRM
 * calls then answer with that code (500 by default). Remove the key to go back to normal.
 */
export const MOCK_FAIL_KEY = 'aqlios-mock-fail';

export const failureHandlers = [
  http.all(`*${CRM_API}/*`, ({ request }) => {
    let rule: string | null = null;
    try {
      rule = window.localStorage.getItem(MOCK_FAIL_KEY);
    } catch {
      return undefined;
    }
    if (!rule) return undefined;
    const parts = rule.trim().split(/\s+/);
    const code = /^\d{3}$/.test(parts.at(-1) ?? '') ? Number(parts.pop()) : 500;
    const [method, fragment] = parts.length > 1 ? parts : ['*', parts[0]];
    if ((method === '*' || method === request.method) && request.url.includes(fragment)) {
      const message =
        code === 401
          ? 'Authentication credentials were not provided'
          : code === 403
            ? 'You do not have permission to perform this action!'
            : 'Server error. Please try again later.';
      return fail(code, message);
    }
    return undefined;
  }),
];
