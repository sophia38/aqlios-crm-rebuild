import { PatientDetailsPage } from '@/features/patients/PatientDetailsPage';

export default async function Page({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  return <PatientDetailsPage patientId={patientId} />;
}
