import { ConsultationDetailsPage } from '@/features/tickets/ConsultationDetailsPage';

export default async function Page({ params }: { params: Promise<{ consultationId: string }> }) {
  const { consultationId } = await params;
  return <ConsultationDetailsPage ticketId={consultationId} from="appointment" />;
}
