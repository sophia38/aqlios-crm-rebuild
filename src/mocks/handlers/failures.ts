import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import { fail } from '../respond';

/**
 * Mock-only failure switch, so error states can be demoed and tested (REBUILD-PLAN.md §7.3).
 * Set `localStorage['aqlios-mock-fail']` to a URL fragment ("/pathways/"), optionally with a method
 * ("PATCH /pathways/"); matching CRM calls then answer 500. Remove the key to go back to normal.
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
    const [method, fragment] = rule.includes(' ') ? rule.split(' ', 2) : ['*', rule];
    if ((method === '*' || method === request.method) && request.url.includes(fragment)) {
      return fail(500, 'Server error. Please try again later.');
    }
    return undefined;
  }),
];
