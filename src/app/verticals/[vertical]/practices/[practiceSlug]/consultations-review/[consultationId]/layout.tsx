import { consultationStaticParams } from '@/features/tickets/consultationStaticParams';

export const generateStaticParams = consultationStaticParams;

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
