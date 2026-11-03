// Practice-relative paths (use with usePracticeHref). URLs match the live app.
export const TICKETS_PATH = '/consultations-review';
export const CLOSED_TICKETS_PATH = `${TICKETS_PATH}?cases=closed`;
export const ticketPath = (ticketId: string) => `${TICKETS_PATH}/${ticketId}`;
export const previousConsultationsPath = (ticketId: string) => `${ticketPath(ticketId)}/previous-consultations`;

/** A consultation URL (details or previous consultations); used by the not-found fallback (src/app/not-found.tsx). */
export const TICKET_PATH_PATTERN =
  /^\/verticals\/([^/]+)\/practices\/([^/]+)\/consultations-review\/([^/]+)(\/previous-consultations)?\/?$/;
