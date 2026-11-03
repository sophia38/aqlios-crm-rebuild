import { practiceSlug } from '@/lib/api/practiceManagement';
import { buildPatients } from '@/mocks/fixtures/patients';
import { buildPractices } from '@/mocks/fixtures/practices';

/** Practices without seeded patients still need one pre-built page (static export rejects empty lists). */
const NO_PATIENT_ID = 'none';

// The seeded patients of the 3 demo practices are pre-built so their URLs match the live app. Any
// other patient URL is rendered by the static host's not-found page (src/app/not-found.tsx).
export function generateStaticParams({ params }: { params: { practiceSlug: string } }) {
  const practices = buildPractices();
  const practice = practices.find((item) => practiceSlug(item.practice_name) === params.practiceSlug);
  const ids = practice
    ? buildPatients(practices)
        .patients.filter((patient) => patient.practice_id === practice.id)
        .map((patient) => patient.id)
    : [];
  return (ids.length ? ids : [NO_PATIENT_ID]).map((patientId) => ({ patientId }));
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return children;
}
