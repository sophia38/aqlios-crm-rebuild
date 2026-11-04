import { staffStaticParams } from '@/features/staff/staffStaticParams';

export const generateStaticParams = staffStaticParams;

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
