'use client';

import { useSyncExternalStore } from 'react';
import Box from '@mui/material/Box';
import { AuthGate } from '@/components/auth/AuthGate';
import { APPOINTMENT_CONSULTATION_PATH_PATTERN } from '@/features/appointments/appointmentRoutes';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { PatientDetailsPage } from '@/features/patients/PatientDetailsPage';
import { PATIENT_PATH_PATTERN } from '@/features/patients/patientsRoutes';
import { PracticeDashboard } from '@/features/practice/PracticeDashboard';
import { AssociatedUsersPage } from '@/features/roles/AssociatedUsersPage';
import { RoleFormPage } from '@/features/roles/RoleFormPage';
import { ROLE_PATH_PATTERN } from '@/features/roles/rolesRoutes';
import { HubFrame } from '@/features/shell/HubFrame';
import { PracticeFrame } from '@/features/shell/PracticeFrame';
import { ConsultationDetailsPage } from '@/features/tickets/ConsultationDetailsPage';
import { PreviousConsultationsPage } from '@/features/tickets/PreviousConsultationsPage';
import { TICKET_PATH_PATTERN } from '@/features/tickets/ticketsRoutes';
import { BASE_PATH } from '@/lib/basePath';

const PRACTICE_DASHBOARD_PATTERN = /^\/verticals\/([^/]+)\/practices\/([^/]+)\/dashboard\/?$/;

/**
 * Static hosting serves this page for any URL that wasn't pre-built. Records created in the demo
 * (a new role, a newly onboarded practice) have no pre-built page, so their URLs are rendered here.
 * Anything else gets the "Page not found" state.
 */
function fallbackFor(pathname: string): React.ReactNode | null {
  const role = pathname.match(ROLE_PATH_PATTERN);
  if (role) {
    const [, roleId, users] = role;
    return (
      <AuthGate>
        <HubFrame vertical="public">
          {users ? <AssociatedUsersPage roleId={roleId} /> : <RoleFormPage roleId={roleId} />}
        </HubFrame>
      </AuthGate>
    );
  }
  const patient = pathname.match(PATIENT_PATH_PATTERN);
  if (patient) {
    const [, vertical, slug, patientId] = patient;
    return (
      <AuthGate>
        <PracticeFrame vertical={vertical} slug={slug}>
          <PatientDetailsPage patientId={patientId} />
        </PracticeFrame>
      </AuthGate>
    );
  }
  const ticket = pathname.match(TICKET_PATH_PATTERN);
  if (ticket) {
    const [, vertical, slug, ticketId, previous] = ticket;
    return (
      <AuthGate>
        <PracticeFrame vertical={vertical} slug={slug}>
          {previous ? (
            <PreviousConsultationsPage ticketId={ticketId} />
          ) : (
            <ConsultationDetailsPage ticketId={ticketId} />
          )}
        </PracticeFrame>
      </AuthGate>
    );
  }
  const appointmentTicket = pathname.match(APPOINTMENT_CONSULTATION_PATH_PATTERN);
  if (appointmentTicket) {
    const [, vertical, slug, ticketId] = appointmentTicket;
    return (
      <AuthGate>
        <PracticeFrame vertical={vertical} slug={slug}>
          <ConsultationDetailsPage ticketId={ticketId} from="appointment" />
        </PracticeFrame>
      </AuthGate>
    );
  }
  const practice = pathname.match(PRACTICE_DASHBOARD_PATTERN);
  if (practice) {
    const [, vertical, slug] = practice;
    return (
      <AuthGate>
        <PracticeFrame vertical={vertical} slug={slug}>
          <PracticeDashboard />
        </PracticeFrame>
      </AuthGate>
    );
  }
  return null;
}

const subscribeNever = () => () => undefined;

function currentPath() {
  const path = window.location.pathname;
  return BASE_PATH && path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) : path;
}

export default function NotFound() {
  // The real URL is only known in the browser (the static 404 page is built without one).
  const pathname = useSyncExternalStore(subscribeNever, currentPath, () => null);

  if (pathname === null) return <LoadingSpinner fullScreen />;
  const fallback = fallbackFor(pathname);
  if (fallback) return fallback;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
      <AccessDenied
        title="Page not found"
        message="The link may be wrong, or the practice no longer exists."
        backHref="/verticals"
        backLabel="Go to Verticals"
      />
    </Box>
  );
}
