// Practice-relative paths (use with usePracticeHref). URLs match the live app.
export const APPOINTMENT_PATH = '/appointment';
export const APPOINTMENT_REQUESTS_PATH = `${APPOINTMENT_PATH}?tab=requests`;
/** Captured: View Request Details opens Consultation Details under the appointment route. */
export const appointmentConsultationPath = (consultationId: string) =>
  `${APPOINTMENT_PATH}/consultation-review/${consultationId}`;

/** An appointment consultation URL; used by the not-found fallback (src/app/not-found.tsx). */
export const APPOINTMENT_CONSULTATION_PATH_PATTERN =
  /^\/verticals\/([^/]+)\/practices\/([^/]+)\/appointment\/consultation-review\/([^/]+)\/?$/;
