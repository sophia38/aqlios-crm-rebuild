import { PreviousConsultationsPage } from '@/features/tickets/PreviousConsultationsPage';

export default async function Page({ params }: { params: Promise<{ consultationId: string }> }) {
  const { consultationId } = await params;
  return <PreviousConsultationsPage ticketId={consultationId} />;
}
