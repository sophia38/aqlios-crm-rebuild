import { getResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { appointmentHandlers } from './handlers/appointments';
import { authHandlers } from './handlers/auth';
import { complianceHandlers } from './handlers/compliance';
import { crmHandlers } from './handlers/crm';
import { failureHandlers } from './handlers/failures';
import { hrPolicyHandlers } from './handlers/hrPolicies';
import { leaveHandlers } from './handlers/leave';
import { patientHandlers } from './handlers/patients';
import { practiceHandlers } from './handlers/practices';
import { roleHandlers } from './handlers/roles';
import { rotaHandlers } from './handlers/rota';
import { rotaPracticeHandlers } from './handlers/rotaPractice';
import { settingsHandlers } from './handlers/settings';
import { staffHandlers } from './handlers/staff';
import { templateHandlers } from './handlers/templates';
import { ticketHandlers } from './handlers/tickets';

const handlers = [
  ...failureHandlers,
  ...authHandlers,
  ...practiceHandlers,
  ...roleHandlers,
  ...templateHandlers,
  ...settingsHandlers,
  ...rotaHandlers,
  ...rotaPracticeHandlers,
  ...complianceHandlers,
  ...patientHandlers,
  ...ticketHandlers,
  ...appointmentHandlers,
  ...leaveHandlers,
  ...hrPolicyHandlers,
  ...staffHandlers,
  ...crmHandlers,
];

export const worker = setupWorker(...handlers);

let started: Promise<'service-worker' | 'in-page'> | null = null;

/**
 * Starts the mock API once per page load (React's dev mode runs effects twice).
 * Uses the MSW service worker where the browser allows it; embedded browsers that block service
 * workers (such as the Claude app's browser pane) fall back to answering `/api/` calls in the page.
 */
export function startMockWorker() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  started ??= worker
    .start({
      serviceWorker: { url: `${basePath}/mockServiceWorker.js`, options: { scope: `${basePath}/` } },
      // Static assets and Next.js internals pass through untouched (MSW 3 renamed onUnhandledRequest).
      onUnhandledFrame: 'bypass',
      quiet: true,
    })
    .then(() => 'service-worker' as const)
    .catch(() => {
      installInPageFetch();
      return 'in-page' as const;
    });
  return started;
}

function installInPageFetch() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const request = new Request(input, init);
    if (new URL(request.url).pathname.includes('/api/')) {
      const mocked = await getResponse(handlers, request);
      if (mocked) return mocked;
    }
    return originalFetch(input, init);
  };
}
