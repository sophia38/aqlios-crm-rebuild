// Practice-relative paths (use with usePracticeHref). URLs match the live app.
export const PATIENTS_PATH = '/patient-management';
export const patientPath = (patientId: string) => `${PATIENTS_PATH}/${patientId}`;

/** A patient details URL; used by the static host's not-found fallback (src/app/not-found.tsx). */
export const PATIENT_PATH_PATTERN = /^\/verticals\/([^/]+)\/practices\/([^/]+)\/patient-management\/([^/]+)\/?$/;
