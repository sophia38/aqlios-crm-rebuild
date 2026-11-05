import { CqcShell } from '@/features/cqc/CqcShell';

export default function CqcLayout({ children }: { children: React.ReactNode }) {
  return <CqcShell>{children}</CqcShell>;
}
