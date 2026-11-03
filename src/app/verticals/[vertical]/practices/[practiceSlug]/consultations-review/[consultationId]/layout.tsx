import { practiceSlug } from '@/lib/api/practiceManagement';
import { buildPatients } from '@/mocks/fixtures/patients';
import { buildPractices } from '@/mocks/fixtures/practices';
import { buildTickets } from '@/mocks/fixtures/tickets';
import { buildRoles, buildStaff } from '@/mocks/fixtures/users';

/** Practices without seeded tickets still need one pre-built page (static export rejects empty lists). */
const NO_CONSULTATION_ID = 'none';

let seededTickets: ReturnType<typeof buildTickets>['tickets'] | null = null;

function tickets() {
  if (!seededTickets) {
    const practices = buildPractices();
    const roles = buildRoles();
    const staff = buildStaff(
      roles,
      practices.map((practice) => practice.id),
    );
    seededTickets = buildTickets(practices, buildPatients(practices).patients, staff, roles).tickets;
  }
  return seededTickets;
}

// The seeded tickets of the 3 demo practices are pre-built so their URLs match the live app. Any
// other consultation URL is rendered by the static host's not-found page (src/app/not-found.tsx).
export function generateStaticParams({ params }: { params: { practiceSlug: string } }) {
  const practice = buildPractices().find((item) => practiceSlug(item.practice_name) === params.practiceSlug);
  const ids = practice
    ? tickets()
        .filter((ticket) => ticket.practice_id === practice.id)
        .map((ticket) => ticket.id)
    : [];
  return (ids.length ? ids : [NO_CONSULTATION_ID]).map((consultationId) => ({ consultationId }));
}

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
