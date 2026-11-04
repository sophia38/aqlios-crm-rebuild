// Practice-relative paths (use with usePracticeHref). URLs match the live app.
export const STAFF_PATH = '/staff';
export const staffPath = (staffId: string) => `${STAFF_PATH}/${staffId}`;
export const PROFILE_PATH = '/profile';

/** A staff detail URL; used by the not-found fallback (src/app/not-found.tsx). */
export const STAFF_PATH_PATTERN = /^\/verticals\/([^/]+)\/practices\/([^/]+)\/staff\/([^/]+)\/?$/;

/** "Aisha Ahmed", or the email when an invite was sent without a name (as live). */
export const staffName = (person: { first_name: string; last_name: string; email: string }) =>
  `${person.first_name} ${person.last_name}`.trim() || person.email;
